import { usePage } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import type { PageProps } from '@/types';

export default function Dashboard() {
    const { auth } = usePage<PageProps>().props;

    return (
        <AppLayout
            title="Dashboard"
            breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Dashboard' }]}
            actions={
                <button className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-semibold text-white hover:bg-primary-500">
                    New record
                </button>
            }
        >
            <div className="rounded-xl bg-white p-6 shadow-sm ring-1 ring-gray-950/5 dark:bg-gray-900 dark:ring-white/10">
                <h2 className="text-lg font-semibold">Welcome back, {auth.user?.name}</h2>
                <p className="mt-1 text-sm text-gray-500">{auth.user?.email}</p>
            </div>
        </AppLayout>
    );
}