<?php

namespace App\Http\Controllers;

use App\Models\PosSetting;
use App\Services\UpdateService;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class UpdateController extends Controller
{
    /**
     * Show the system update page.
     */
    public function index(UpdateService $updateService)
    {
        $updateStatus = $updateService->getUpdateStatus();
        $progress = PosSetting::get('update_progress');

        return Inertia::render('settings/update', [
            'updateStatus' => $updateStatus,
            'updateProgress' => $progress ? json_decode($progress, true) : null,
        ]);
    }

    /**
     * Force a fresh check for updates, then redirect back.
     */
    public function check(UpdateService $updateService)
    {
        $updateService->clearCache();

        return back();
    }

    /**
     * Start the update process as a background artisan command.
     */
    public function run(UpdateService $updateService): mixed
    {
        $updateStatus = $updateService->getUpdateStatus();

        // If the cached status is stale (missing tag_name), force a fresh check
        if (($updateStatus['available'] ?? false) && ! isset($updateStatus['tag_name'])) {
            $updateService->clearCache();
            $updateStatus = $updateService->getUpdateStatus();
        }

        if (! ($updateStatus['available'] ?? false) || empty($updateStatus['tag_name'])) {
            return back()->with(['status' => 'error', 'message' => 'No update available.']);
        }

        $tag = $updateStatus['tag_name'];

        PosSetting::set('update_progress', json_encode([
            'step' => 'starting',
            'message' => "Starting update to {$tag}...",
            'percent' => 0,
            'updated_at' => now()->toISOString(),
        ]));

        PosSetting::set('update_started_at', now()->toISOString());

        $this->spawnUpdateProcess($tag);

        return back();
    }

    /**
     * Poll for update progress (lightweight JSON GET — no CSRF needed).
     * Includes auto-recovery: if the update has been running for more than
     * 15 minutes without completing, bring the app back up automatically.
     */
    public function progress(): JsonResponse
    {
        $this->autoRecoverIfStale();

        $progress = PosSetting::get('update_progress');

        return response()->json(
            $progress ? json_decode($progress, true) : ['step' => 'idle', 'percent' => 0]
        );
    }

    /**
     * Manual recovery: bring the app out of maintenance mode.
     */
    public function recover()
    {
        Artisan::call('up');

        PosSetting::set('update_progress', json_encode([
            'step' => 'failed',
            'message' => 'Update was manually recovered. The app has been restored.',
            'percent' => -1,
            'updated_at' => now()->toISOString(),
        ]));

        PosSetting::set('update_started_at', null);

        return redirect('/');
    }

    /**
     * Stop a stuck update: clear progress state and bring app up if in maintenance.
     */
    public function stop()
    {
        Artisan::call('up');

        PosSetting::set('update_progress', json_encode([
            'step' => 'idle',
            'message' => '',
            'percent' => 0,
            'updated_at' => now()->toISOString(),
        ]));

        PosSetting::set('update_started_at', null);

        return back()->with(['status' => 'success', 'message' => 'Update process stopped.']);
    }

    /**
     * Spawn `php artisan cashier:update {tag}` as a detached background process.
     */
    private function spawnUpdateProcess(string $tag): void
    {
        $phpBinary = $this->resolvePhpBinary();
        $artisan = base_path('artisan');
        $logFile = storage_path('logs/update-process.log');
        $escapedTag = escapeshellarg($tag);

        if (DIRECTORY_SEPARATOR === '\\') {
            $command = sprintf(
                'cmd /c start /B "" "%s" "%s" cashier:update %s > "%s" 2>&1',
                $phpBinary,
                $artisan,
                $escapedTag,
                $logFile,
            );
        } else {
            $command = sprintf('"%s" "%s" cashier:update %s > "%s" 2>&1 &', $phpBinary, $artisan, $escapedTag, $logFile);
        }

        Log::info('Spawning update process', ['command' => $command, 'tag' => $tag]);

        pclose(popen($command, 'r'));
    }

    /**
     * Resolve the PHP binary path reliably across Herd and other environments.
     */
    private function resolvePhpBinary(): string
    {
        // Prefer explicit env config
        if ($bin = env('CASHIER_PHP_BIN')) {
            return $bin;
        }

        // PHP_BINARY may point to php-cgi under Herd — find the CLI binary instead
        $binary = PHP_BINARY;

        if (str_contains(strtolower($binary), 'php-cgi')) {
            $cliBinary = dirname($binary) . DIRECTORY_SEPARATOR . 'php.exe';
            if (file_exists($cliBinary)) {
                return $cliBinary;
            }
        }

        return $binary;
    }

    /**
     * If the update has been running for more than 15 minutes, force recovery.
     */
    private function autoRecoverIfStale(): void
    {
        $startedAt = PosSetting::get('update_started_at');
        if (! $startedAt) {
            return;
        }

        $progress = PosSetting::get('update_progress');
        $decoded = $progress ? json_decode($progress, true) : null;

        // Don't interfere if already complete or failed
        if ($decoded && in_array($decoded['step'] ?? '', ['complete', 'failed', 'idle'])) {
            return;
        }

        $elapsed = now()->diffInMinutes(new \DateTimeImmutable($startedAt));

        if ($elapsed >= 15) {
            Artisan::call('up');

            PosSetting::set('update_progress', json_encode([
                'step' => 'failed',
                'message' => 'Update timed out after 15 minutes and was automatically recovered.',
                'percent' => -1,
                'updated_at' => now()->toISOString(),
            ]));
        }
    }
}
