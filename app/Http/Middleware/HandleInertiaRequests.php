<?php

namespace App\Http\Middleware;

use App\Services\LicenseService;
use App\Services\UpdateService;
use Illuminate\Foundation\Inspiring;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that's loaded on the first page visit.
     *
     * @see https://inertiajs.com/server-side-setup#root-template
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determines the current asset version.
     *
     * @see https://inertiajs.com/asset-versioning
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @see https://inertiajs.com/shared-data
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        [$message, $author] = str(Inspiring::quotes()->random())->explode('-');

        return [
            ...parent::share($request),
            'name' => config('app.name'),
            'quote' => ['message' => trim($message), 'author' => trim($author)],
            'auth' => [
                'user' => $request->user(),
                'roles' => $request->user()?->getRoleNames() ?? [],
                'permissions' => $request->user()?->getAllPermissions()->pluck('name') ?? [],
            ],
            'flash' => [
                'status' => fn () => $request->session()->get('status'),
                'message' => fn () => $request->session()->get('message')
            ],
            'update' => function () use ($request) {
                if (! $request->user()?->can('settings.manage')) {
                    return null;
                }

                return app(UpdateService::class)->getUpdateStatus();
            },
            'license' => fn () => app(LicenseService::class)->getStatus(),
        ];
    }
}
