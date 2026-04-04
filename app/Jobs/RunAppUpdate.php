<?php

namespace App\Jobs;

use App\Models\PosSetting;
use App\Services\UpdateService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Log;
use Symfony\Component\Process\Process;

class RunAppUpdate implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    public int $tries = 1;

    public int $timeout = 600;

    public function handle(): void
    {
        $this->setProgress('starting', 'Preparing update...', 0);
        $basePath = base_path();
        $secret = str()->uuid()->toString();

        // Step 1: Maintenance mode
        $this->setProgress('maintenance', 'Entering maintenance mode...', 5);
        Artisan::call('down', ['--secret' => $secret]);

        try {
            // Step 2: Git pull
            $this->setProgress('git', 'Pulling latest changes...', 15);
            $this->runProcess(['git', 'fetch', 'origin'], $basePath);
            $this->runProcess(['git', 'pull', 'origin', 'main'], $basePath);

            // Step 3: Composer install
            $this->setProgress('composer', 'Installing PHP dependencies...', 35);
            $this->runProcess([
                $this->findBin('composer'), 'install',
                '--no-dev', '--optimize-autoloader', '--no-interaction',
            ], $basePath, 300);

            // Step 4: NPM install
            $this->setProgress('npm', 'Installing JS dependencies...', 55);
            $this->runProcess([$this->findBin('npm'), 'ci'], $basePath, 300);

            // Step 5: Build frontend
            $this->setProgress('build', 'Building frontend assets...', 70);
            $this->runProcess([$this->findBin('npm'), 'run', 'build'], $basePath, 300);

            // Step 6: Migrations
            $this->setProgress('migrate', 'Running database migrations...', 85);
            Artisan::call('migrate', ['--force' => true]);

            // Step 7: Clear caches
            $this->setProgress('cache', 'Clearing caches...', 92);
            Artisan::call('config:clear');
            Artisan::call('cache:clear');

            // Step 8: Bring app back up
            Artisan::call('up');
            $this->setProgress('complete', 'Update completed successfully!', 100);

            app(UpdateService::class)->clearCache();
        } catch (\Throwable $e) {
            Log::error('Update failed: ' . $e->getMessage());
            $this->setProgress('failed', 'Update failed: ' . $e->getMessage(), -1);

            Artisan::call('up');
        }
    }

    private function runProcess(array $command, string $cwd, int $timeout = 120): string
    {
        $process = new Process($command, $cwd);
        $process->setTimeout($timeout);
        $process->mustRun();

        return $process->getOutput();
    }

    private function findBin(string $name): string
    {
        $envKey = 'CASHIER_' . strtoupper($name) . '_BIN';
        if ($bin = env($envKey)) {
            return $bin;
        }

        return $name;
    }

    private function setProgress(string $step, string $message, int $percent): void
    {
        PosSetting::set('update_progress', json_encode([
            'step' => $step,
            'message' => $message,
            'percent' => $percent,
            'updated_at' => now()->toISOString(),
        ]));
    }
}
