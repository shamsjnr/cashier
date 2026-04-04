import { Link } from '@inertiajs/react';
import { AlertTriangle, Calendar } from 'lucide-react';

import { useFeatureGate } from '@/hooks/use-feature-gate';
import { usePermissions } from '@/hooks/use-permissions';

export function LicenseBanner() {
    const { license, isDegraded } = useFeatureGate();
    const { can } = usePermissions();

    if (!license || !can('settings.manage')) return null;

    // Show expiry warning when within 14 days
    const expiresAt = license.expires_at ? new Date(license.expires_at) : null;
    const daysLeft = expiresAt
        ? Math.ceil((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
        : null;
    const expiringSoon = daysLeft !== null && daysLeft > 0 && daysLeft <= 14;

    if (isDegraded) {
        return (
            <div className="flex items-center gap-2 border-b border-amber-200 bg-amber-50 px-4 py-2 text-sm text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-400">
                <AlertTriangle className="h-4 w-4 shrink-0" />
                <p>
                    Your license has expired. The system is running in limited mode — only core POS features are available.{' '}
                    <Link href="/license/manage" className="font-medium underline">
                        View license details
                    </Link>
                </p>
            </div>
        );
    }

    if (expiringSoon) {
        return (
            <div className="flex items-center gap-2 border-b border-blue-200 bg-blue-50 px-4 py-2 text-sm text-blue-800 dark:border-blue-800 dark:bg-blue-950/30 dark:text-blue-400">
                <Calendar className="h-4 w-4 shrink-0" />
                <p>
                    Your license expires in {daysLeft} day{daysLeft !== 1 ? 's' : ''}. Contact your vendor to renew.{' '}
                    <Link href="/license/manage" className="font-medium underline">
                        View details
                    </Link>
                </p>
            </div>
        );
    }

    return null;
}
