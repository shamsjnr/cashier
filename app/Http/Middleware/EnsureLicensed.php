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

        // Check license
        if (! $this->licenseService->isLicensed()) {
            if ($request->header('X-Inertia')) {
                return inertia()->location(route('license.activate'));
            }

            return redirect()->route('license.activate');
        }

        return $next($request);
    }
}
