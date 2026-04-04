<?php

namespace App\Http\Controllers;

use App\Services\LicenseService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class LicenseController extends Controller
{
    public function __construct(private LicenseService $licenseService) {}

    /**
     * Show the license activation page.
     */
    public function showActivation()
    {
        if ($this->licenseService->isLicensed()) {
            return redirect('/dashboard');
        }

        return Inertia::render('license/activate', [
            'appName' => config('app.name'),
        ]);
    }

    /**
     * Activate a license key.
     */
    public function activate(Request $request)
    {
        $request->validate([
            'license_key' => 'required|string|min:10|max:255',
        ]);

        $result = $this->licenseService->activate($request->input('license_key'));

        if ($result['success']) {
            return redirect('/dashboard')->with([
                'status' => 'success',
                'message' => 'License activated successfully!',
            ]);
        }

        return back()->withErrors([
            'license_key' => $result['error'],
        ]);
    }

    /**
     * Show the license management settings page.
     */
    public function show()
    {
        $status = $this->licenseService->getStatus();
        $license = $this->licenseService->getLicenseData();

        return Inertia::render('settings/license', [
            'licenseStatus' => $status,
            'currentFingerprint' => $this->licenseService->fingerprint(),
            'appVersion' => config('cashier.version'),
        ]);
    }

    /**
     * Request device deactivation from the sync server.
     */
    public function deactivateDevice(Request $request)
    {
        $request->validate([
            'fingerprint' => 'required|string',
        ]);

        $license = $this->licenseService->getLicenseData();
        if (! $license) {
            return back()->with(['status' => 'error', 'message' => 'No active license.']);
        }

        $serverUrl = config('cashier.license.server_url');

        try {
            $response = Http::timeout(15)->post("{$serverUrl}/license/device/deactivate", [
                'license_key' => $license['license_key'],
                'fingerprint' => $request->input('fingerprint'),
            ]);

            if ($response->successful()) {
                // Re-verify to refresh device list
                $this->licenseService->verify();

                return back()->with([
                    'status' => 'success',
                    'message' => 'Device deactivated successfully.',
                ]);
            }

            $data = $response->json();

            return back()->with([
                'status' => 'error',
                'message' => $data['error'] ?? 'Failed to deactivate device.',
            ]);
        } catch (\Throwable $e) {
            Log::warning('Device deactivation failed: ' . $e->getMessage());

            return back()->with([
                'status' => 'error',
                'message' => 'Could not reach the server. Try again later.',
            ]);
        }
    }

    /**
     * Deactivate the current license.
     */
    public function deactivate()
    {
        $this->licenseService->deactivate();

        return redirect()->route('license.activate')->with([
            'status' => 'info',
            'message' => 'License deactivated.',
        ]);
    }
}
