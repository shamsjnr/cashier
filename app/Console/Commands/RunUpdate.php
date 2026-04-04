<?php

namespace App\Console\Commands;

use App\Models\PosSetting;
use App\Services\UpdateService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;
use Symfony\Component\Process\Process;

class RunUpdate extends Command
{
    protected $signature = 'cashier:update {tag? : The release tag to update to (e.g. v1.0.0)}';

    protected $description = 'Update to a specific release tag from GitHub';

    public function handle(): int
    {
        $tag = $this->argument('tag');

        if (! $tag) {
            $this->error('No release tag provided. Usage: cashier:update v1.0.0');

            return self::FAILURE;
        }

        $this->setProgress('starting', "Preparing update to {$tag}...", 0);
        $basePath = base_path();
        $secret = str()->uuid()->toString();

        // Step 1: Maintenance mode
        $this->setProgress('maintenance', 'Entering maintenance mode...', 5);
        $this->call('down', ['--secret' => $secret]);

        try {
            // Step 2: Fetch tags and checkout the release
            $this->setProgress('git', "Checking out release {$tag}...", 15);
            $this->runProcess(['git', 'fetch', 'origin', '--tags'], $basePath);
            $this->runProcess(['git', 'checkout', $tag], $basePath);

            // Write the new version to .env
            $version = ltrim($tag, 'v');
            $this->updateEnvVersion($basePath, $version);

            // Step 3: Composer install
            $this->setProgress('composer', 'Installing PHP dependencies...', 35);
            $this->runProcess([
                $this->findBin('composer'), 'install',
                '--no-dev', '--optimize-autoloader', '--no-interaction',
            ], $basePath, 300);

            // Step 4: NPM install (move node_modules aside to avoid EPERM from VS Code / antivirus locks)
            $this->setProgress('npm', 'Installing JS dependencies...', 55);
            $this->killNodeProcesses();
            // $staleDir = $this->moveNodeModulesAside($basePath);
            $this->runProcess([$this->findBin('npm'), 'install'], $basePath, 300);
            // $this->cleanupStaleNodeModules($staleDir);

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

            // Clear the update check cache so the new version is detected
            app(UpdateService::class)->clearCache();

            // Wait briefly so the 503 page / frontend can see the "complete" state,
            // then reset progress to idle so it doesn't persist on the next page load
            sleep(5);
            PosSetting::set('update_progress', json_encode([
                'step' => 'idle',
                'message' => '',
                'percent' => 0,
                'updated_at' => now()->toISOString(),
            ]));
            PosSetting::set('update_started_at', null);

            return self::SUCCESS;
        } catch (\Throwable $e) {
            Log::error('Update failed: ' . $e->getMessage());
            $this->setProgress('failed', 'Update failed: ' . $e->getMessage(), -1);

            // Always bring app back up on failure
            $this->call('up');

            return self::FAILURE;
        }
    }

    /**
     * Write the new version to .env so config('cashier.version') reflects it.
     */
    private function updateEnvVersion(string $basePath, string $version): void
    {
        $envFile = $basePath . DIRECTORY_SEPARATOR . '.env';

        if (! file_exists($envFile)) {
            return;
        }

        $envContents = file_get_contents($envFile);

        if (str_contains($envContents, 'CASHIER_VERSION=')) {
            $envContents = preg_replace('/^CASHIER_VERSION=.*/m', "CASHIER_VERSION={$version}", $envContents);
        } else {
            $envContents .= "\nCASHIER_VERSION={$version}\n";
        }

        file_put_contents($envFile, $envContents);
        $this->info("Updated .env version to {$version}");
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

    /**
     * Rename node_modules out of the way so npm ci can install fresh.
     * Windows allows renaming directories even when files inside are locked.
     */
    private function moveNodeModulesAside(string $basePath): ?string
    {
        $nodeModules = $basePath . DIRECTORY_SEPARATOR . 'node_modules';

        if (! is_dir($nodeModules)) {
            return null;
        }

        $staleDir = $basePath . DIRECTORY_SEPARATOR . 'node_modules_old_' . time();

        try {
            rename($nodeModules, $staleDir);
            $this->info("Moved node_modules to {$staleDir}");

            return $staleDir;
        } catch (\Throwable $e) {
            Log::warning('Could not move node_modules aside: ' . $e->getMessage());

            return null;
        }
    }

    /**
     * Try to delete the stale node_modules directory. If it fails (files still locked),
     * schedule it for cleanup on next boot or just leave it — it's harmless.
     */
    private function cleanupStaleNodeModules(?string $staleDir): void
    {
        if (! $staleDir || ! is_dir($staleDir)) {
            return;
        }

        try {
            if (DIRECTORY_SEPARATOR === '\\') {
                $process = new Process(['cmd', '/c', 'rd', '/s', '/q', $staleDir], null, null, null, 60);
                $process->run();
            } else {
                $process = new Process(['rm', '-rf', $staleDir], null, null, null, 60);
                $process->run();
            }

            $this->info('Cleaned up old node_modules.');
        } catch (\Throwable $e) {
            Log::info('Could not cleanup old node_modules (will be cleaned up later): ' . $e->getMessage());
        }
    }

    private function killNodeProcesses(): void
    {
        try {
            if (DIRECTORY_SEPARATOR === '\\') {
                // Windows: kill node.exe processes that may lock files in node_modules
                $process = new Process(['taskkill', '/F', '/IM', 'node.exe'], null, null, null, 10);
                $process->run();
            } else {
                $process = new Process(['killall', '-9', 'node'], null, null, null, 10);
                $process->run();
            }
        } catch (\Throwable $e) {
            // Ignore — there may be no node processes running
            Log::info('No node processes to kill: ' . $e->getMessage());
        }
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
