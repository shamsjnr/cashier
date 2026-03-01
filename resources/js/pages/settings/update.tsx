import { Head } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import {
    CheckCircle2,
    AlertTriangle,
    Download,
    RefreshCw,
    Loader2,
    Info,
} from 'lucide-react';

import HeadingSmall from '@/components/heading-small';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { type BreadcrumbItem, type UpdateInfo } from '@/types';

import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'System Update', href: '/system-update' },
];

interface UpdateProgress {
    step: string;
    message: string;
    percent: number;
    updated_at: string;
}

interface Props {
    updateStatus: UpdateInfo;
    updateProgress: UpdateProgress | null;
}

export default function SystemUpdate({ updateStatus, updateProgress: initialProgress }: Props) {
    const [checking, setChecking] = useState(false);
    const [status, setStatus] = useState<UpdateInfo>(updateStatus);
    const [progress, setProgress] = useState<UpdateProgress | null>(initialProgress);
    const [updating, setUpdating] = useState(
        initialProgress != null &&
        initialProgress.step !== 'complete' &&
        initialProgress.step !== 'failed' &&
        initialProgress.step !== 'idle',
    );
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

    const csrfToken = () =>
        document.querySelector<HTMLMetaElement>('meta[name="csrf-token"]')?.content ?? '';

    // Poll for progress when updating
    useEffect(() => {
        if (!updating) return;

        pollRef.current = setInterval(async () => {
            try {
                const res = await fetch(route('system-update.progress'));
                const data: UpdateProgress = await res.json();
                setProgress(data);

                if (data.step === 'complete' || data.step === 'failed') {
                    setUpdating(false);
                    if (pollRef.current) clearInterval(pollRef.current);
                    if (data.step === 'complete') {
                        setTimeout(() => window.location.reload(), 2000);
                    }
                }
            } catch {
                // App might be in maintenance mode
            }
        }, 2000);

        return () => {
            if (pollRef.current) clearInterval(pollRef.current);
        };
    }, [updating]);

    const handleCheck = async () => {
        setChecking(true);
        try {
            const res = await fetch(route('system-update.check'), {
                method: 'POST',
                headers: { 'X-CSRF-TOKEN': csrfToken() },
            });
            const data = await res.json();
            setStatus(data);
        } catch {
            // ignore
        }
        setChecking(false);
    };

    const handleUpdate = async () => {
        if (!confirm('This will put the app in maintenance mode and update to the latest version. Continue?')) {
            return;
        }
        setUpdating(true);
        setProgress({ step: 'queued', message: 'Update queued...', percent: 0, updated_at: '' });
        try {
            await fetch(route('system-update.run'), {
                method: 'POST',
                headers: {
                    'X-CSRF-TOKEN': csrfToken(),
                    'Content-Type': 'application/json',
                },
            });
        } catch {
            // ignore
        }
    };

    const progressPercent = Math.max(0, progress?.percent ?? 0);

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="System Update" />

            <SettingsLayout>
                <div className="space-y-6">
                    <HeadingSmall title="System Update" description="Check for and install application updates" />

                    {/* Current version */}
                    <div className="flex items-center gap-3 rounded-lg border p-4">
                        <Info className="h-5 w-5 text-muted-foreground" />
                        <div>
                            <p className="text-sm font-medium">Current Version</p>
                            <p className="text-muted-foreground text-sm">
                                v{status.current_version}
                            </p>
                        </div>
                    </div>

                    {/* Update status */}
                    {status.available ? (
                        <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950/30">
                            <div className="flex items-start gap-3">
                                <Download className="mt-0.5 h-5 w-5 text-green-600" />
                                <div className="flex-1 space-y-2">
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm font-medium">Update Available</p>
                                        <Badge variant="secondary">v{status.latest_version}</Badge>
                                    </div>
                                    {status.published_at && (
                                        <p className="text-muted-foreground text-xs">
                                            Released {new Date(status.published_at).toLocaleDateString()}
                                        </p>
                                    )}
                                    {status.release_notes && (
                                        <div className="mt-3 rounded border bg-white p-3 text-sm dark:bg-gray-950">
                                            <p className="mb-1 text-xs font-medium text-muted-foreground">Release Notes</p>
                                            <div className="whitespace-pre-wrap text-sm">{status.release_notes}</div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex items-center gap-3 rounded-lg border p-4">
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                            <p className="text-sm">You're running the latest version.</p>
                        </div>
                    )}

                    {/* Update progress */}
                    {(updating || (progress && progress.step !== 'idle')) && (
                        <div className="space-y-3 rounded-lg border p-4">
                            <div className="flex items-center gap-2">
                                {progress?.step === 'complete' ? (
                                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                                ) : progress?.step === 'failed' ? (
                                    <AlertTriangle className="h-5 w-5 text-red-600" />
                                ) : (
                                    <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                                )}
                                <p className="text-sm font-medium">{progress?.message}</p>
                            </div>

                            {/* Progress bar */}
                            {progress?.step !== 'failed' && (
                                <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800">
                                    <div
                                        className="h-full rounded-full bg-green-600 transition-all duration-500"
                                        style={{ width: `${progressPercent}%` }}
                                    />
                                </div>
                            )}

                            {progress?.step === 'complete' && (
                                <p className="text-muted-foreground text-xs">
                                    Page will reload automatically...
                                </p>
                            )}

                            {progress?.step === 'failed' && (
                                <p className="text-sm text-red-600">{progress.message}</p>
                            )}
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3">
                        <Button
                            variant="outline"
                            onClick={handleCheck}
                            disabled={checking || updating}
                        >
                            {checking ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <RefreshCw className="mr-2 h-4 w-4" />
                            )}
                            Check for Updates
                        </Button>

                        {status.available && !updating && (
                            <Button onClick={handleUpdate}>
                                <Download className="mr-2 h-4 w-4" />
                                Update to v{status.latest_version}
                            </Button>
                        )}
                    </div>
                </div>
            </SettingsLayout>
        </AppLayout>
    );
}
