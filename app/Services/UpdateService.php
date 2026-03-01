<?php

namespace App\Services;

use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class UpdateService
{
    /**
     * Get cached update status, or check if cache is stale.
     */
    public function getUpdateStatus(): array
    {
        $cacheKey = config('cashier.update.cache_key');
        $ttl = now()->addMinutes(config('cashier.update.check_interval'));

        return Cache::remember($cacheKey, $ttl, fn () => $this->checkForUpdate());
    }

    /**
     * Check GitHub for the latest release and compare versions.
     */
    public function checkForUpdate(): array
    {
        $currentVersion = config('cashier.version');
        $repo = config('cashier.github.repo');

        $default = [
            'available' => false,
            'current_version' => $currentVersion,
            'latest_version' => null,
            'release_notes' => null,
            'release_url' => null,
            'published_at' => null,
        ];

        try {
            $response = Http::withHeaders([
                'Accept' => 'application/vnd.github.v3+json',
            ])->timeout(10)->get(
                config('cashier.github.api_url') . "/repos/{$repo}/releases/latest"
            );

            if (! $response->successful()) {
                return $default;
            }

            $release = $response->json();
            $latestVersion = ltrim($release['tag_name'] ?? '', 'v');

            return [
                'available' => version_compare($latestVersion, $currentVersion, '>'),
                'current_version' => $currentVersion,
                'latest_version' => $latestVersion,
                'release_notes' => $release['body'] ?? null,
                'release_url' => $release['html_url'] ?? null,
                'published_at' => $release['published_at'] ?? null,
            ];
        } catch (\Throwable $e) {
            Log::warning('Update check failed: ' . $e->getMessage());

            return $default;
        }
    }

    /**
     * Clear the cached update status.
     */
    public function clearCache(): void
    {
        Cache::forget(config('cashier.update.cache_key'));
    }
}
