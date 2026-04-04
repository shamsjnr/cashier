<?php

namespace App\Services;

use App\Models\PosSetting;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class LicenseService
{
    /**
     * Generate a unique fingerprint for this installation.
     */
    public function fingerprint(): string
    {
        return hash('sha256', config('app.key') . '|' . gethostname() . '|' . config('app.url'));
    }

    /**
     * Activate a license key with the remote server.
     */
    public function activate(string $licenseKey): array
    {
        $serverUrl = config('cashier.license.server_url');

        try {
            $response = Http::timeout(15)->post("{$serverUrl}/license/activate", [
                'license_key' => $licenseKey,
                'fingerprint' => $this->fingerprint(),
                'app_version' => config('cashier.version'),
            ]);

            $data = $response->json() ?? [];

            if ($response->successful() && ($data['valid'] ?? false)) {
                $this->storeLicense($licenseKey, $data);
                return ['success' => true, 'data' => $data];
            }

            info("License activation failed: " . print_r($data, true));

            return ['success' => false, 'error' => $data['error'] ?? 'Activation failed'];
        } catch (\Throwable $e) {
            Log::error('License activation failed: ' . $e->getMessage());
            return ['success' => false, 'error' => 'Could not reach license server. Please check your internet connection.'];
        }
    }

    /**
     * Store license data encrypted in pos_settings.
     */
    private function storeLicense(string $key, array $data): void
    {
        $payload = [
            'license_key' => $key,
            'licensee_name' => $data['licensee_name'] ?? null,
            'license_type' => $data['license_type'] ?? 'standard',
            'expires_at' => $data['expires_at'] ?? null,
            'features' => $data['features'] ?? [],
            'plan' => $data['plan'] ?? null,
            'devices' => $data['devices'] ?? [],
            'max_devices' => $data['max_devices'] ?? 1,
            'activated_at' => now()->toISOString(),
            'last_verified_at' => now()->toISOString(),
        ];

        PosSetting::set('license_data', Crypt::encryptString(json_encode($payload)));
        PosSetting::set('license_key', $key);
        Cache::forget('license.status');
        Cache::forget('license.state');
    }

    /**
     * Get the stored license data (decrypted).
     */
    public function getLicenseData(): ?array
    {
        $encrypted = PosSetting::get('license_data');
        if (! $encrypted) {
            return null;
        }

        try {
            return json_decode(Crypt::decryptString($encrypted), true);
        } catch (\Throwable $e) {
            return null;
        }
    }

    /**
     * Periodically re-validate with the license server.
     */
    public function verify(): array
    {
        $license = $this->getLicenseData();
        if (! $license) {
            return ['valid' => false, 'reason' => 'no_license'];
        }

        $serverUrl = config('cashier.license.server_url');

        try {
            $response = Http::timeout(15)->post("{$serverUrl}/license/verify", [
                'license_key' => $license['license_key'],
                'fingerprint' => $this->fingerprint(),
                'app_version' => config('cashier.version'),
            ]);

            $data = $response->json();

            if ($response->successful() && ($data['valid'] ?? false)) {
                $license['last_verified_at'] = now()->toISOString();
                $license['expires_at'] = $data['expires_at'] ?? $license['expires_at'];
                $license['features'] = $data['features'] ?? $license['features'];
                $license['plan'] = $data['plan'] ?? $license['plan'] ?? null;
                $license['devices'] = $data['devices'] ?? $license['devices'] ?? [];
                $license['max_devices'] = $data['max_devices'] ?? $license['max_devices'] ?? 1;
                PosSetting::set('license_data', Crypt::encryptString(json_encode($license)));
                Cache::forget('license.status');
        Cache::forget('license.state');

                return ['valid' => true, 'data' => $license];
            }

            // Server said invalid or revoked
            if ($data['revoked'] ?? false) {
                $license['revoked'] = true;
                PosSetting::set('license_data', Crypt::encryptString(json_encode($license)));
                Cache::forget('license.status');
        Cache::forget('license.state');
            }

            return ['valid' => false, 'reason' => $data['error'] ?? 'Verification failed'];
        } catch (\Throwable $e) {
            // Server unreachable — allow if within grace period
            Log::warning('License verification unreachable: ' . $e->getMessage());

            return ['valid' => true, 'offline' => true, 'data' => $license];
        }
    }

    /**
     * Determine the license state: active, degraded, or unlicensed.
     *
     * - 'active': fully licensed, all features enabled
     * - 'degraded': expired beyond grace or unreachable beyond grace — core POS only
     * - 'unlicensed': no license data or revoked
     */
    public function getLicenseState(): string
    {
        return Cache::remember('license.state', now()->addMinutes(5), function () {
            $license = $this->getLicenseData();
            if (! $license) {
                return 'unlicensed';
            }

            if ($license['revoked'] ?? false) {
                return 'unlicensed';
            }

            $expired = isset($license['expires_at']) && now()->isAfter($license['expires_at']);
            $lastVerified = $license['last_verified_at'] ?? null;
            $graceDays = config('cashier.license.grace_period_days');
            $beyondGrace = $lastVerified && now()->diffInDays($lastVerified) > $graceDays;

            if ($expired && $beyondGrace) {
                return 'degraded';
            }

            if ($expired) {
                // Within grace — still active, but try to verify
                if ($beyondGrace) {
                    $result = $this->verify();
                    return ($result['valid'] ?? false) ? 'active' : 'degraded';
                }
                return 'degraded';
            }

            if ($beyondGrace) {
                $result = $this->verify();
                return ($result['valid'] ?? false) ? 'active' : 'degraded';
            }

            return 'active';
        });
    }

    /**
     * Check if the app is currently licensed (active or degraded — not unlicensed).
     * Uses cache to avoid DB/decryption on every request.
     */
    public function isLicensed(): bool
    {
        return $this->getLicenseState() !== 'unlicensed';
    }

    /**
     * Check if a specific feature is available under the current license.
     */
    public function hasFeature(string $feature): bool
    {
        if ($this->getLicenseState() === 'unlicensed') {
            return false;
        }

        // Degraded mode: only core_pos
        if ($this->getLicenseState() === 'degraded') {
            return $feature === 'core_pos';
        }

        $license = $this->getLicenseData();
        $features = $license['features'] ?? [];

        return in_array($feature, $features);
    }

    /**
     * Get non-sensitive license status for sharing via Inertia.
     */
    public function getStatus(): array
    {
        $license = $this->getLicenseData();
        $state = $this->getLicenseState();

        return [
            'is_licensed' => $state !== 'unlicensed',
            'state' => $state,
            'licensee_name' => $license['licensee_name'] ?? null,
            'license_type' => $license['license_type'] ?? null,
            'expires_at' => $license['expires_at'] ?? null,
            'features' => $state === 'degraded' ? ['core_pos'] : ($license['features'] ?? []),
            'plan' => $license['plan'] ?? null,
            'devices' => $license['devices'] ?? [],
            'max_devices' => $license['max_devices'] ?? 1,
            'last_verified_at' => $license['last_verified_at'] ?? null,
        ];
    }

    /**
     * Deactivate and remove the stored license.
     */
    public function deactivate(): bool
    {
        $license = $this->getLicenseData();
        if (! $license) {
            return false;
        }

        $serverUrl = config('cashier.license.server_url');

        try {
            Http::timeout(15)->post("{$serverUrl}/license/deactivate", [
                'license_key' => $license['license_key'],
                'fingerprint' => $this->fingerprint(),
            ]);
        } catch (\Throwable $e) {
            Log::warning('License deactivation call failed: ' . $e->getMessage());
        }

        PosSetting::set('license_data', null);
        PosSetting::set('license_key', null);
        Cache::forget('license.status');
        Cache::forget('license.state');

        return true;
    }
}
