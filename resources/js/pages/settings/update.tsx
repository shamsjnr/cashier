import { Head, router } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import Markdown from 'react-markdown';
import {
    CheckCircle2,
    AlertTriangle,
    Download,
    RefreshCw,
    Loader2,
    Info,
    StopCircle,
} from 'lucide-react';

import { ConfirmDialog } from '@/components/confirm-dialog';
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

export default function SystemUpdate({ updateStatus, updateProgress }: Props) {
    const [checking, setChecking] = useState(false);
    const [stopping, setStopping] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [stopConfirmOpen, setStopConfirmOpen] = useState(false);
    const [progress, setProgress] = useState<UpdateProgress | null>(updateProgress);
    const [updating, setUpdating] = useState(
        updateProgress != null &&
        updateProgress.step !== 'complete' &&
        updateProgress.step !== 'failed' &&
        updateProgress.step !== 'idle',
    );
    const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

    // Sync progress from props when they change (after router.post redirects back)
    useEffect(() => {
        setProgress(updateProgress);
        if (updateProgress && updateProgress.step !== 'complete' && updateProgress.step !== 'failed' && updateProgress.step !== 'idle') {
            setUpdating(true);
        }
    }, [updateProgress]);

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

    const handleCheck = () => {
        router.post(route('system-update.check'), {}, {
            preserveScroll: true,
            onStart: () => setChecking(true),
            onFinish: () => setChecking(false),
        });
    };

    const handleUpdate = () => {
        setConfirmOpen(true);
    };

    const handleConfirmUpdate = () => {
        setConfirmOpen(false);
        setUpdating(true);
        setProgress({ step: 'starting', message: 'Starting update...', percent: 0, updated_at: '' });
        router.post(route('system-update.run'), {}, {
            preserveScroll: true,
        });
    };

    const handleStop = () => {
        setStopConfirmOpen(true);
    };

    const handleConfirmStop = () => {
        setStopConfirmOpen(false);
        setStopping(true);
        router.post(route('system-update.stop'), {}, {
            preserveScroll: true,
            onFinish: () => {
                setStopping(false);
                setUpdating(false);
                setProgress(null);
            },
        });
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
                                v{updateStatus.current_version}
                            </p>
                        </div>
                    </div>

                    {/* Update status */}
                    {updateStatus.available ? (
                        <div className="rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-800 dark:bg-green-950/30">
                            <div className="flex items-start gap-3">
                                <Download className="mt-0.5 h-5 w-5 text-green-600" />
                                <div className="flex-1 space-y-2">
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm font-medium">Update Available</p>
                                        <Badge variant="secondary">v{updateStatus.latest_version}</Badge>
                                    </div>
                                    {updateStatus.published_at && (
                                        <p className="text-muted-foreground text-xs">
                                            Released {new Date(updateStatus.published_at).toLocaleDateString()}
                                        </p>
                                    )}
                                    {updateStatus.release_notes && (
                                        <div className="mt-3 rounded border bg-white p-3 text-sm dark:bg-gray-950">
                                            <p className="mb-1 text-xs font-medium text-muted-foreground">Release Notes</p>
                                            <div className="prose prose-sm dark:prose-invert max-w-none">
                                                <Markdown>{updateStatus.release_notes}</Markdown>
                                            </div>
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
                            <div className="flex items-center justify-between">
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
                                {updating && progress?.step !== 'complete' && (
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={handleStop}
                                        disabled={stopping}
                                        className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/30"
                                    >
                                        {stopping ? (
                                            <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                                        ) : (
                                            <StopCircle className="mr-1.5 h-4 w-4" />
                                        )}
                                        Stop
                                    </Button>
                                )}
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
                                <div className="flex items-center justify-between">
                                    <p className="text-sm text-red-600">{progress.message}</p>
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleConfirmStop}
                                    >
                                        Dismiss
                                    </Button>
                                </div>
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

                        {updateStatus.available && !updating && (
                            <Button onClick={handleUpdate}>
                                <Download className="mr-2 h-4 w-4" />
                                Update to v{updateStatus.latest_version}
                            </Button>
                        )}
                    </div>
                </div>

                <ConfirmDialog
                    open={confirmOpen}
                    onOpenChange={setConfirmOpen}
                    title="Install Update"
                    description="This will put the app in maintenance mode and update to the latest version. The app will be briefly unavailable during the process."
                    confirmLabel="Update Now"
                    onConfirm={handleConfirmUpdate}
                />

                <ConfirmDialog
                    open={stopConfirmOpen}
                    onOpenChange={setStopConfirmOpen}
                    title="Stop Update"
                    description="This will stop the update process and restore the application. If the update was mid-way, some changes may be incomplete — you can retry the update later."
                    confirmLabel="Stop Update"
                    onConfirm={handleConfirmStop}
                />
            </SettingsLayout>
        </AppLayout>
    );
}
