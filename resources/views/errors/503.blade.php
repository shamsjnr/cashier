<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>{{ config('app.name') }} — Updating</title>
    <style>
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

        body {
            font-family: 'Segoe UI', system-ui, -apple-system, sans-serif;
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #f9fafb;
            color: #111;
            padding: 1rem;
        }

        .card {
            background: #fff;
            border: 1px solid #e5e7eb;
            border-radius: 12px;
            padding: 2.5rem 2rem;
            max-width: 440px;
            width: 100%;
            text-align: center;
            box-shadow: 0 1px 3px rgba(0,0,0,.06);
        }

        .spinner {
            width: 48px; height: 48px;
            border: 4px solid #e5e7eb;
            border-top-color: #111;
            border-radius: 50%;
            animation: spin .8s linear infinite;
            margin: 0 auto 1.5rem;
        }

        @keyframes spin { to { transform: rotate(360deg); } }

        h1 { font-size: 1.25rem; font-weight: 600; margin-bottom: .5rem; }
        .subtitle { font-size: .875rem; color: #6b7280; margin-bottom: 1.5rem; }

        .progress-wrap {
            background: #e5e7eb;
            border-radius: 999px;
            height: 8px;
            overflow: hidden;
            margin-bottom: .75rem;
        }

        .progress-bar {
            height: 100%;
            background: #16a34a;
            border-radius: 999px;
            width: 0%;
            transition: width .5s ease;
        }

        .step-text {
            font-size: .8125rem;
            color: #6b7280;
            min-height: 1.25rem;
        }

        .status-icon { font-size: 2.5rem; margin-bottom: 1rem; }

        .error-msg {
            font-size: .8125rem;
            color: #dc2626;
            margin-top: .75rem;
            word-break: break-word;
        }

        .complete-msg {
            font-size: .875rem;
            color: #16a34a;
            font-weight: 500;
            margin-top: .5rem;
        }

        .recovery-btn {
            margin-top: 1.25rem;
            padding: .625rem 1.25rem;
            background: #111;
            color: #fff;
            border: none;
            border-radius: 8px;
            font-size: .875rem;
            font-weight: 500;
            cursor: pointer;
        }

        .recovery-btn:hover { background: #333; }
        .recovery-btn:disabled { opacity: .5; cursor: not-allowed; }

        .hidden { display: none; }

        @media (prefers-color-scheme: dark) {
            body { background: #0a0a0a; color: #fafafa; }
            .card { background: #111; border-color: #262626; box-shadow: none; }
            .spinner { border-color: #333; border-top-color: #fafafa; }
            .subtitle, .step-text { color: #a3a3a3; }
            .progress-wrap { background: #262626; }
            .recovery-btn { background: #fafafa; color: #111; }
            .recovery-btn:hover { background: #d4d4d4; }
        }
    </style>
</head>
<body>
    <div class="card">
        {{-- Updating state (default) --}}
        <div id="state-updating">
            <div class="spinner" id="spinner"></div>
            <h1>Updating {{ config('app.name') }}</h1>
            <p class="subtitle">This may take a few minutes. Please do not close this page.</p>
            <div class="progress-wrap">
                <div class="progress-bar" id="progress-bar"></div>
            </div>
            <p class="step-text" id="step-text">Preparing update&hellip;</p>
        </div>

        {{-- Complete state --}}
        <div id="state-complete" class="hidden">
            <div class="status-icon">&#10003;</div>
            <h1>Update Complete</h1>
            <p class="complete-msg">Redirecting&hellip;</p>
        </div>

        {{-- Failed state --}}
        <div id="state-failed" class="hidden">
            <div class="status-icon">&#9888;</div>
            <h1>Update Failed</h1>
            <p class="error-msg" id="error-msg"></p>
        </div>

        {{-- Recovery button (shown when stale) --}}
        <form id="recovery-form" class="hidden" method="POST" action="/system-update/recover">
            <input type="hidden" name="_token" value="{{ csrf_token() }}">
            <p class="subtitle" style="margin-bottom:.75rem">The update appears to have stalled.</p>
            <button type="submit" class="recovery-btn" id="recovery-btn">Restore Application</button>
        </form>
    </div>

    <script>
        (function () {
            var progressBar = document.getElementById('progress-bar');
            var stepText    = document.getElementById('step-text');
            var stateUpdating = document.getElementById('state-updating');
            var stateComplete = document.getElementById('state-complete');
            var stateFailed   = document.getElementById('state-failed');
            var recoveryForm  = document.getElementById('recovery-form');
            var errorMsg      = document.getElementById('error-msg');

            var STALE_THRESHOLD_MS = 5 * 60 * 1000; // 5 minutes
            var done = false;

            function show(el) { el.classList.remove('hidden'); }
            function hide(el) { el.classList.add('hidden'); }

            function poll() {
                if (done) return;

                fetch('/system-update/progress', { headers: { 'Accept': 'application/json' } })
                    .then(function (r) { return r.json(); })
                    .then(function (data) {
                        if (!data || !data.step) return;

                        // Complete
                        if (data.step === 'complete') {
                            done = true;
                            hide(stateUpdating);
                            show(stateComplete);
                            hide(recoveryForm);
                            setTimeout(function () { window.location.href = '/'; }, 2000);
                            return;
                        }

                        // Failed
                        if (data.step === 'failed') {
                            done = true;
                            hide(stateUpdating);
                            show(stateFailed);
                            show(recoveryForm);
                            errorMsg.textContent = data.message || 'An unexpected error occurred.';
                            return;
                        }

                        // In progress
                        var pct = Math.max(0, Math.min(100, data.percent || 0));
                        progressBar.style.width = pct + '%';
                        stepText.textContent = data.message || 'Updating\u2026';

                        // Check for stale progress
                        if (data.updated_at) {
                            var elapsed = Date.now() - new Date(data.updated_at).getTime();
                            if (elapsed > STALE_THRESHOLD_MS) {
                                show(recoveryForm);
                            }
                        }
                    })
                    .catch(function () {
                        // Network error — app may be restarting, keep polling
                    });
            }

            setInterval(poll, 2000);
            poll();
        })();
    </script>
</body>
</html>
