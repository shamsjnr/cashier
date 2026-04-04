<?php

namespace App\Http\Middleware;

use App\Services\LicenseService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureLicensed
{
    public function __construct(private LicenseService $licenseService) {}

    public function handle(Request $request, Closure $next): Response
    {
        // Always allow license activation routes
        if ($request->routeIs('license.*')) {
            return $next($request);
        }

        $state = $this->licenseService->getLicenseState();

        // Unlicensed (no key or revoked) — redirect to activation
        if ($state === 'unlicensed') {
            if ($request->header('X-Inertia')) {
                return inertia()->location(route('license.activate'));
            }

            return redirect()->route('license.activate');
        }

        // Degraded — allow core POS routes, block premium features
        if ($state === 'degraded') {
            $blockedRoutes = [
                'reports.*',
                'reports.export.*',
                'shift.*',
                'expense.*',
                'customer.*',
            ];

            foreach ($blockedRoutes as $pattern) {
                if ($request->routeIs($pattern)) {
                    if ($request->header('X-Inertia')) {
                        return inertia()->location(route('dashboard'));
                    }

                    return redirect()->route('dashboard')->with([
                        'status' => 'error',
                        'message' => 'This feature is unavailable. Please renew your license to restore full access.',
                    ]);
                }
            }
        }

        return $next($request);
    }
}
