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
            'activated_at' => now()->toISOString(),
            'last_verified_at' => now()->toISOString(),
        ];

        PosSetting::set('license_data', Crypt::encryptString(json_encode($payload)));
        PosSetting::set('license_key', $key);
        Cache::forget('license.status');
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
            ]);

            $data = $response->json();

            if ($response->successful() && ($data['valid'] ?? false)) {
                // Update verification timestamp
                $license['last_verified_at'] = now()->toISOString();
                $license['expires_at'] = $data['expires_at'] ?? $license['expires_at'];
                $license['features'] = $data['features'] ?? $license['features'];
                PosSetting::set('license_data', Crypt::encryptString(json_encode($license)));
                Cache::forget('license.status');

                return ['valid' => true, 'data' => $license];
            }

            // Server said invalid or revoked
            if ($data['revoked'] ?? false) {
                $license['revoked'] = true;
                PosSetting::set('license_data', Crypt::encryptString(json_encode($license)));
                Cache::forget('license.status');
            }

            return ['valid' => false, 'reason' => $data['error'] ?? 'Verification failed'];
        } catch (\Throwable $e) {
            // Server unreachable — allow if within grace period
            Log::warning('License verification unreachable: ' . $e->getMessage());

            return ['valid' => true, 'offline' => true, 'data' => $license];
        }
    }

    /**
     * Check if the app is currently licensed.
     * Uses cache to avoid DB/decryption on every request.
     */
    public function isLicensed(): bool
    {
        return Cache::remember('license.status', now()->addMinutes(5), function () {
            $license = $this->getLicenseData();
            if (! $license) {
                return false;
            }

            if ($license['revoked'] ?? false) {
                return false;
            }

            // Check expiry
            if (isset($license['expires_at']) && now()->isAfter($license['expires_at'])) {
                return false;
            }

            // Check grace period for re-validation
            $lastVerified = $license['last_verified_at'] ?? null;
            $graceDays = config('cashier.license.grace_period_days');

            if ($lastVerified && now()->diffInDays($lastVerified) > $graceDays) {
                // Beyond grace period, force online check
                $result = $this->verify();

                return $result['valid'] ?? false;
            }

            return true;
        });
    }

    /**
     * Get non-sensitive license status for sharing via Inertia.
     */
    public function getStatus(): array
    {
        $license = $this->getLicenseData();

        return [
            'is_licensed' => $this->isLicensed(),
            'licensee_name' => $license['licensee_name'] ?? null,
            'license_type' => $license['license_type'] ?? null,
            'expires_at' => $license['expires_at'] ?? null,
            'features' => $license['features'] ?? [],
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

        return true;
    }
}
