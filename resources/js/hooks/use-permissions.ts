import { SharedData } from '@/types';
import { usePage } from '@inertiajs/react';

export function usePermissions() {
    const { auth } = usePage<SharedData>().props;

    const can = (permission: string): boolean => {
        return auth.permissions?.includes(permission) ?? false;
    };

    const hasRole = (role: string): boolean => {
        return auth.roles?.includes(role) ?? false;
    };

    const hasAnyRole = (...roles: string[]): boolean => {
        return roles.some((role) => hasRole(role));
    };

    return { can, hasRole, hasAnyRole };
}
