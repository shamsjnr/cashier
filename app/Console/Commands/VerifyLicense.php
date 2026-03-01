<?php

namespace App\Console\Commands;

use App\Services\LicenseService;
use Illuminate\Console\Command;

class VerifyLicense extends Command
{
    protected $signature = 'cashier:verify-license';

    protected $description = 'Re-validate the license with the license server';

    public function handle(LicenseService $licenseService): int
    {
        $result = $licenseService->verify();

        if ($result['valid'] ?? false) {
            $this->info('License is valid.');
            if ($result['offline'] ?? false) {
                $this->warn('License server was unreachable. Validated using grace period.');
            }

            return self::SUCCESS;
        }

        $this->error('License validation failed: ' . ($result['reason'] ?? 'Unknown'));

        return self::FAILURE;
    }
}
