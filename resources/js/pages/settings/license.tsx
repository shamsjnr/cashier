import { Head, router } from '@inertiajs/react';
import {
    KeyRound,
    Shield,
    Monitor,
    Calendar,
    CheckCircle2,
    AlertTriangle,
    XCircle,
    Trash2,
    RefreshCw,
    Loader2,
} from 'lucide-react';
import { useState } from 'react';

import { ConfirmDialog } from '@/components/confirm-dialog';
import HeadingSmall from '@/components/heading-small';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { type BreadcrumbItem, type LicenseInfo, type DeviceInfo } from '@/types';

import AppLayout from '@/layouts/app-layout';
import SettingsLayout from '@/layouts/settings/layout';

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'License & Devices', href: '/license/manage' },
];

interface Props {
    licenseStatus: LicenseInfo;
    currentFingerprint: string;
    appVersion: string;
}

function StateBadge({ state }: { state: LicenseInfo['state'] }) {
    switch (state) {
        case 'active':
            return (
                <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                    <CheckCircle2 className="mr-1 h-3 w-3" />
                    Active
                </Badge>
            );
        case 'degraded':
            return (
                <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                    <AlertTriangle className="mr-1 h-3 w-3" />
                    Limited
                </Badge>
            );
        default:
            return (
                <Badge variant="destructive">
                    <XCircle className="mr-1 h-3 w-3" />
                    Unlicensed
                </Badge>
            );
    }
}

function PlanLabel({ plan }: { plan: string | null }) {
    const labels: Record<string, string> = {
        starter: 'Starter',
        standard: 'Standard',
        business: 'Business',
        enterprise: 'Enterprise',
    };
    return <span>{labels[plan ?? ''] ?? plan ?? 'Unknown'}</span>;
}

function DeviceRow({
    device,
    isCurrent,
    onDeactivate,
    deactivating,
}: {
    device: DeviceInfo;
    isCurrent: boolean;
    onDeactivate: (fingerprint: string) => void;
    deactivating: string | null;
}) {
    return (
        <div className="flex items-center justify-between rounded-lg border p-4">
            <div className="flex items-start gap-3">
                <Monitor className="mt-0.5 h-5 w-5 text-muted-foreground" />
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <p className="text-sm font-medium">
                            {device.hostname || 'Unknown device'}
                        </p>
                        {isCurrent && (
                            <Badge variant="secondary" className="text-xs">
                                This device
                            </Badge>
                        )}
                    </div>
                    {device.app_url && (
                        <p className="text-xs text-muted-foreground">{device.app_url}</p>
                    )}
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        {device.app_version && <span>v{device.app_version}</span>}
                        {device.last_verified_at && (
                            <span>
                                Last seen {new Date(device.last_verified_at).toLocaleDateString()}
                            </span>
                        )}
                    </div>
                </div>
            </div>
            {!isCurrent && (
                <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                    onClick={() => onDeactivate(device.fingerprint)}
                    disabled={deactivating === device.fingerprint}
                >
                    {deactivating === device.fingerprint ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                        <Trash2 className="h-4 w-4" />
                    )}
                </Button>
            )}
        </div>
    );
}

export default function LicenseSettings({ licenseStatus, currentFingerprint, appVersion }: Props) {
    const [deactivating, setDeactivating] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);
    const [deviceToRemove, setDeviceToRemove] = useState<string | null>(null);
    const [confirmDeactivate, setConfirmDeactivate] = useState(false);

    const handleDeactivateDevice = (fingerprint: string) => {
        setDeviceToRemove(fingerprint);
    };

    const handleConfirmDeviceRemove = () => {
        if (!deviceToRemove) return;
        setDeactivating(deviceToRemove);
        setDeviceToRemove(null);
        router.post(
            route('license.device.deactivate'),
            { fingerprint: deviceToRemove },
            {
                preserveScroll: true,
                onFinish: () => setDeactivating(null),
            },
        );
    };

    const handleDeactivateLicense = () => {
        setConfirmDeactivate(true);
    };

    const handleConfirmDeactivateLicense = () => {
        setConfirmDeactivate(false);
        router.post(route('license.deactivate'));
    };

    const handleRefresh = () => {
        setRefreshing(true);
        router.visit(route('license.manage'), {
            preserveScroll: true,
            onFinish: () => setRefreshing(false),
        });
    };

    const expiresAt = licenseStatus.expires_at ? new Date(licenseStatus.expires_at) : null;
    const daysUntilExpiry = expiresAt
        ? Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        : null;

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="License & Devices" />

            <SettingsLayout>
                <div className="space-y-6">
                    <HeadingSmall
                        title="License & Devices"
                        description="View your license status, plan details, and manage activated devices"
                    />

                    {/* License Status */}
                    <div className="space-y-4 rounded-lg border p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <Shield className="h-5 w-5 text-muted-foreground" />
                                <div>
                                    <p className="text-sm font-medium">License Status</p>
                                    <p className="text-xs text-muted-foreground">
                                        {licenseStatus.licensee_name ?? 'Unlicensed installation'}
                                    </p>
                                </div>
                            </div>
                            <StateBadge state={licenseStatus.state} />
                        </div>

                        <Separator />

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-1">
                                <p className="text-xs font-medium text-muted-foreground">Plan</p>
                                <p className="text-sm font-medium">
                                    <PlanLabel plan={licenseStatus.plan ?? licenseStatus.license_type} />
                                </p>
                            </div>

                            <div className="space-y-1">
                                <p className="text-xs font-medium text-muted-foreground">App Version</p>
                                <p className="text-sm font-medium">v{appVersion}</p>
                            </div>

                            {expiresAt && (
                                <div className="space-y-1">
                                    <p className="text-xs font-medium text-muted-foreground">Expires</p>
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                                        <p className="text-sm font-medium">
                                            {expiresAt.toLocaleDateString()}
                                        </p>
                                        {daysUntilExpiry !== null && daysUntilExpiry > 0 && daysUntilExpiry <= 30 && (
                                            <Badge variant="secondary" className="text-xs">
                                                {daysUntilExpiry} days left
                                            </Badge>
                                        )}
                                        {daysUntilExpiry !== null && daysUntilExpiry <= 0 && (
                                            <Badge variant="destructive" className="text-xs">
                                                Expired
                                            </Badge>
                                        )}
                                    </div>
                                </div>
                            )}

                            {licenseStatus.last_verified_at && (
                                <div className="space-y-1">
                                    <p className="text-xs font-medium text-muted-foreground">Last Verified</p>
                                    <p className="text-sm font-medium">
                                        {new Date(licenseStatus.last_verified_at).toLocaleString()}
                                    </p>
                                </div>
                            )}
                        </div>

                        {licenseStatus.state === 'degraded' && (
                            <>
                                <Separator />
                                <div className="flex items-start gap-2 rounded-md bg-amber-50 p-3 dark:bg-amber-950/20">
                                    <AlertTriangle className="mt-0.5 h-4 w-4 text-amber-600" />
                                    <div className="text-sm text-amber-800 dark:text-amber-400">
                                        <p className="font-medium">Limited mode</p>
                                        <p className="text-xs">
                                            Your license has expired or could not be verified.
                                            Core POS features remain available. Contact your vendor to
                                            renew and restore full access.
                                        </p>
                                    </div>
                                </div>
                            </>
                        )}
                    </div>

                    {/* Features */}
                    {licenseStatus.features.length > 0 && (
                        <div className="space-y-3">
                            <p className="text-sm font-medium">Enabled Features</p>
                            <div className="flex flex-wrap gap-2">
                                {licenseStatus.features.map((feature) => (
                                    <Badge key={feature} variant="secondary" className="text-xs">
                                        {feature.replace(/_/g, ' ')}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    )}

                    <Separator />

                    {/* Devices */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium">Activated Devices</p>
                                <p className="text-xs text-muted-foreground">
                                    {licenseStatus.devices.length} of {licenseStatus.max_devices} device
                                    {licenseStatus.max_devices !== 1 ? 's' : ''} used
                                </p>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleRefresh}
                                disabled={refreshing}
                            >
                                {refreshing ? (
                                    <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                                ) : (
                                    <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
                                )}
                                Refresh
                            </Button>
                        </div>

                        {/* Device capacity bar */}
                        <div className="h-2 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-800">
                            <div
                                className="h-full rounded-full bg-primary transition-all"
                                style={{
                                    width: `${Math.min(100, (licenseStatus.devices.length / licenseStatus.max_devices) * 100)}%`,
                                }}
                            />
                        </div>

                        <div className="space-y-2">
                            {licenseStatus.devices.length > 0 ? (
                                licenseStatus.devices.map((device) => (
                                    <DeviceRow
                                        key={device.fingerprint}
                                        device={device}
                                        isCurrent={device.fingerprint === currentFingerprint}
                                        onDeactivate={handleDeactivateDevice}
                                        deactivating={deactivating}
                                    />
                                ))
                            ) : (
                                <div className="rounded-lg border border-dashed p-6 text-center">
                                    <Monitor className="mx-auto h-8 w-8 text-muted-foreground" />
                                    <p className="mt-2 text-sm text-muted-foreground">
                                        No device information available yet.
                                        Device data will appear after the next sync.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    <Separator />

                    {/* Actions */}
                    <div className="space-y-3">
                        <p className="text-sm font-medium">License Actions</p>
                        <div className="flex items-center justify-between rounded-lg border border-destructive/20 p-4">
                            <div className="space-y-0.5">
                                <p className="text-sm font-medium">Deactivate License</p>
                                <p className="text-xs text-muted-foreground">
                                    Remove the license from this installation. This will free the
                                    device slot and return to the activation screen.
                                </p>
                            </div>
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={handleDeactivateLicense}
                            >
                                <KeyRound className="mr-1.5 h-3.5 w-3.5" />
                                Deactivate
                            </Button>
                        </div>
                    </div>
                </div>

                <ConfirmDialog
                    open={deviceToRemove !== null}
                    onOpenChange={(open) => { if (!open) setDeviceToRemove(null); }}
                    title="Remove Device"
                    description="This device will be deactivated and will need to be re-activated with the license key to use the app again."
                    confirmLabel="Remove Device"
                    variant="destructive"
                    onConfirm={handleConfirmDeviceRemove}
                />

                <ConfirmDialog
                    open={confirmDeactivate}
                    onOpenChange={setConfirmDeactivate}
                    title="Deactivate License"
                    description="This will remove the license from this installation, free the device slot, and return to the activation screen. All your data will be preserved."
                    confirmLabel="Deactivate"
                    variant="destructive"
                    onConfirm={handleConfirmDeactivateLicense}
                />
            </SettingsLayout>
        </AppLayout>
    );
}
