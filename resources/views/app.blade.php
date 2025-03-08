<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
    <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">

        <title inertia>{{ config('app.name', 'Cashier') }}</title>

        <link rel="preconnect" href="https://fonts.bunny.net">
        <link href="https://fonts.bunny.net/css?family=instrument-sans:400,500,600" rel="stylesheet" />

        @routes
        @viteReactRefresh
        @vite(['resources/js/app.tsx', "resources/js/pages/{$page['component']}.tsx"])
        @inertiaHead
        @laravelPWA
    </head>
    <body class="font-sans antialiased">
        @inertia
        <script src="{{ asset('serviceworker.js') }}"></script>
        <script>
            if ('serviceWorker' in navigator) {
                window.addEventListener('load', () => {
                    navigator.serviceWorker.register('/serviceworker.js')
                        .then(registration => {
                            console.log('ServiceWorker registration successful');
                        })
                        .catch(registrationError => {
                            console.error('ServiceWorker registration failed:', registrationError);
                        });
                });
            }
        </script>
    </body>
</html>
