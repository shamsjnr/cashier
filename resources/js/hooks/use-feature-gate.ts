import { SharedData } from '@/types';
import { usePage } from '@inertiajs/react';

export function useFeatureGate() {
    const { license } = usePage<SharedData>().props;

    const hasFeature = (feature: string): boolean => {
        if (!license?.is_licensed) return false;
        if (license.state === 'degraded') return feature === 'core_pos';
        return license.features?.includes(feature) ?? false;
    };

    const isActive = license?.state === 'active';
    const isDegraded = license?.state === 'degraded';

    return { hasFeature, isActive, isDegraded, license };
}
