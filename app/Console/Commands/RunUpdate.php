<?php

namespace App\Console\Commands;

use App\Models\PosSetting;
use App\Services\UpdateService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use Symfony\Component\Process\Process;

class RunUpdate extends Command
{
    protected $signature = 'cashier:update';

    protected $description = 'Pull the latest version from GitHub and run build/migration steps';

    public function handle(): int
    {
        $this->setProgress('starting', 'Preparing update...', 0);
        $basePath = base_path();
        $secret = str()->uuid()->toString();

        // Step 1: Maintenance mode
        $this->setProgress('maintenance', 'Entering maintenance mode...', 5);
        $this->call('down', ['--secret' => $secret]);

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
            $this->call('migrate', ['--force' => true]);

            // Step 7: Clear caches
            $this->setProgress('cache', 'Clearing caches...', 92);
            $this->call('config:clear');
            $this->call('cache:clear');

            // Step 8: Bring app back up
            $this->call('up');
            $this->setProgress('complete', 'Update completed successfully!', 100);

            // Clear the update check cache
            app(UpdateService::class)->clearCache();

            return self::SUCCESS;
        } catch (\Throwable $e) {
            Log::error('Update failed: ' . $e->getMessage());
            $this->setProgress('failed', 'Update failed: ' . $e->getMessage(), -1);

            // Always bring app back up on failure
            $this->call('up');

            return self::FAILURE;
        }
    }

    private function runProcess(array $command, string $cwd, int $timeout = 120): string
    {
        $process = new Process($command, $cwd);
        $process->setTimeout($timeout);
        $process->mustRun();

        $output = $process->getOutput();
        $this->line($output);

        return $output;
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
        $data = json_encode([
            'step' => $step,
            'message' => $message,
            'percent' => $percent,
            'updated_at' => now()->toISOString(),
        ]);

        PosSetting::set('update_progress', $data);
        $this->info("[{$percent}%] {$message}");
    }
}
