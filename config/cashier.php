<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Application Version
    |--------------------------------------------------------------------------
    |
    | The current version of the application. This is compared against
    | GitHub releases to determine if an update is available.
    |
    */

    'version' => '0.9.0',

    /*
    |--------------------------------------------------------------------------
    | GitHub Repository
    |--------------------------------------------------------------------------
    */

    'github' => [
        'repo' => env('CASHIER_GITHUB_REPO', 'shamsjnr/cashier'),
        'api_url' => 'https://api.github.com',
    ],

    /*
    |--------------------------------------------------------------------------
    | Update Settings
    |--------------------------------------------------------------------------
    */

    'update' => [
        'check_interval' => (int) env('CASHIER_UPDATE_CHECK_INTERVAL', 60),
        'cache_key' => 'cashier.latest_release',
    ],

    /*
    |--------------------------------------------------------------------------
    | License Settings
    |--------------------------------------------------------------------------
    */

    'license' => [
        'server_url' => env('CASHIER_LICENSE_SERVER_URL', 'https://license.example.com/api'),
        'grace_period_days' => (int) env('CASHIER_LICENSE_GRACE_DAYS', 7),
        'revalidation_interval' => (int) env('CASHIER_LICENSE_REVALIDATION_HOURS', 24),
    ],

];
