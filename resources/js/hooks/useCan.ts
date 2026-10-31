import { usePage } from '@inertiajs/react';

interface AuthProps {
    auth: {
        roles: string[];
        permissions: string[];
        is_super_admin: boolean;
    };
}

/**
 * const { can, hasRole } = useCan();
 * {can('users.create') && <Link href="/users/create">...</Link>}
 */
export default function useCan() {
    const { auth } = usePage<AuthProps & Record<string, unknown>>().props;

    const permissions = auth?.permissions ?? [];
    const roles = auth?.roles ?? [];
    const isSuper = auth?.is_super_admin ?? false;

    const can = (permission: string) => isSuper || permissions.includes(permission);
    const canAny = (list: string[]) => isSuper || list.some((p) => permissions.includes(p));
    const hasRole = (role: string) => isSuper || roles.includes(role);

    return { can, canAny, hasRole };
}