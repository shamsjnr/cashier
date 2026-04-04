<?php

namespace App\Http\Controllers;

use App\Jobs\RunAppUpdate;
use App\Models\PosSetting;
use App\Services\UpdateService;
use Illuminate\Http\JsonResponse;
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
     * Start the update process in the background, then redirect back.
     */
    public function run()
    {
        PosSetting::set('update_progress', json_encode([
            'step' => 'queued',
            'message' => 'Update queued...',
            'percent' => 0,
            'updated_at' => now()->toISOString(),
        ]));

        RunAppUpdate::dispatch();

        return back();
    }

    /**
     * Poll for update progress (lightweight JSON GET — no CSRF needed).
     */
    public function progress(): JsonResponse
    {
        $progress = PosSetting::get('update_progress');

        return response()->json(
            $progress ? json_decode($progress, true) : ['step' => 'idle', 'percent' => 0]
        );
    }
}
