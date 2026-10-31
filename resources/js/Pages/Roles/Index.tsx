import { useState } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import { Pencil, Plus, Trash2 } from 'lucide-react';
import AppLayout from '@/Layouts/AppLayout';
import ConfirmModal from '@/Components/ConfirmModal';
import DataTable, {
    type BulkAction,
    type Column,
    type RowMenuItem,
    type SearchField,
    type TableState,
} from '@/Components/DataTable';
import useT from '@/hooks/useT';
import useCan from '@/hooks/useCan';
import type { PageProps, Paginated } from '@/types';

interface RoleRow {
    id: number;
    name: string;
    permissions_count: number;
    users_count: number;
    created_at: string;
    updated_at: string;
}

interface IndexProps extends Record<string, unknown> {
    roles: Paginated<RoleRow>;
    state: TableState;
}

interface PendingDelete {
    ids: number[];
    clear?: () => void;
}

// This role cannot be edited or deleted (also enforced in RoleController)
const PROTECTED_ROLE = 'super-admin';

export default function RolesIndex() {
    const { roles, state } = usePage<PageProps<IndexProps>>().props;
    const { t } = useT();
    const { can } = useCan();

    const [pending, setPending] = useState<PendingDelete | null>(null);
    const [processing, setProcessing] = useState(false);

    // Built inside the component so the labels follow the selected language
    const columns: Column<RoleRow>[] = [
        { key: 'name', label: t('Name'), sortable: true, toggleable: false },
        { key: 'permissions_count', label: t('Permissions'), sortable: true },
        { key: 'users_count', label: t('Users'), sortable: true },
        { key: 'created_at', label: t('Created at'), sortable: true },
        { key: 'updated_at', label: t('Updated at'), sortable: true },
    ];

    // Each key becomes ?filter[key]=value in the URL
    const searchFields: SearchField[] = [
        { key: 'from', label: t('From'), type: 'date' },
        { key: 'to', label: t('To'), type: 'date' },
        { key: 'name', label: t('Name') },
    ];

    const rowMenu: RowMenuItem<RoleRow>[] = [
        {
            label: t('Edit'),
            icon: Pencil,
            // hidden: (r) => !can('roles.edit'),
            onClick: (r) => router.visit(`/roles/${r.id}/edit`),
        },
        {
            label: t('Delete'),
            icon: Trash2,
            danger: true,
            // hidden: (r) => !can('roles.delete'),
            onClick: (r) => setPending({ ids: [r.id] }),
        },
    ];

    const bulkActions: BulkAction[] = can('roles.delete')
        ? [
              {
                  label: t('Delete selected'),
                  icon: Trash2,
                  danger: true,
                  onClick: (ids, clear) => setPending({ ids, clear }),
              },
          ]
        : [];

    const runDelete = () => {
        if (!pending) return;

        router.delete('/roles', {
            data: { ids: pending.ids },
            preserveScroll: true,
            onStart: () => setProcessing(true),
            onFinish: () => {
                setProcessing(false);
                pending.clear?.();
                setPending(null);
            },
        });
    };

    const count = pending?.ids.length ?? 0;

    return (
        <AppLayout
            title="Roles"
            breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Roles' }]}
        >
            {/* {can('roles.create') && ( */}
                <div className="mb-4 flex justify-end">
                    <Link
                        href="/roles/create"
                        className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-3 py-2 text-xs font-medium text-white shadow-sm transition hover:bg-primary-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-950"
                    >
                        <Plus className="size-4" />
                        {t('Create role')}
                    </Link>
                </div>
            {/* )} */}

            <DataTable<RoleRow>
                url="/roles"
                data={roles}
                state={state}
                columns={columns}
                searchFields={searchFields}
                searchLabels={{
                    title: t('Search'),
                    reset: t('Reset'),
                    search: t('Search'),
                }}
                rowMenu={rowMenu}
                bulkActions={bulkActions}
                isSelectable={(r) => r.name !== PROTECTED_ROLE}
                emptyHeading={t('No roles found')}
                labels={{
                    actions: t('Actions'),
                    perPage: t('Per page'),
                    noResults: t('No results'),
                    summary: (from, to, total) =>
                        t('Showing :from to :to of :total results')
                            .replace(':from', String(from))
                            .replace(':to', String(to))
                            .replace(':total', String(total)),
                }}
            />

            <ConfirmModal
                open={pending !== null}
                danger
                processing={processing}
                title={
                    count > 1
                        ? t('Delete :count roles?').replace(':count', String(count))
                        : t('Delete role?')
                }
                description={t("This action can't be undone.")}
                confirmLabel={t('Delete')}
                onConfirm={runDelete}
                onCancel={() => setPending(null)}
            />
        </AppLayout>
    );
}