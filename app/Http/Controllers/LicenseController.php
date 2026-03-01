<?php

namespace App\Http\Controllers;

use App\Services\LicenseService;
use Illuminate\Http\Request;
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
