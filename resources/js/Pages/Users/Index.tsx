import { router, usePage, Link } from '@inertiajs/react';
import { Pencil, Trash2, Plus, Download } from 'lucide-react';
import AppLayout from '@/Layouts/AppLayout';
import DataTable, {
    type BulkAction,
    type Column,
    type RowMenuItem,
    type SearchField,
    type TableState,
} from '@/Components/DataTable/Index';
import type { BulkContext } from '@/Components/DataTable/types';
import useT from '@/hooks/useT';
import type { PageProps, Paginated, UserRow } from '@/types';
import { useConfirm } from '@/Components/Confirm/ConfirmProvider';

interface IndexProps extends Record<string, unknown> {
    users: Paginated<UserRow>;
    state: TableState;
}

export default function UsersIndex() {
    const { auth, users, state } = usePage<PageProps<IndexProps>>().props;
    const { t } = useT();
    const confirm = useConfirm();

    const columns: Column<UserRow>[] = [
        { key: 'name', label: t('Name'), sortable: true, toggleable: false },
        { key: 'email', label: t('Email'), sortable: true },
        { key: 'created_at', label: t('Joined'), sortable: true },
        { key: 'updated_at', label: t('Updated at'), sortable: true },
    ];

    const searchFields: SearchField[] = [
        { key: 'from', label: t('From'), type: 'date' },
        { key: 'to', label: t('To'), type: 'date' },
        {
            key: 'is_active',
            label: t('Status'),
            type: 'select',
            placeholder: t('Select an option'),
            options: [
                { value: '1', label: t('Verified') },
                { value: '0', label: t('Unverified') },
            ],
        },
        { key: 'email', label: t('Email'), span: 2 },
        { key: 'name', label: t('Name') },
    ];

    /* Shared delete flow: spinner while running, error shown inside the dialog */
    const deleteRequest = (
        title: string,
        run: (cb: {
            onSuccess: () => void;
            onError: (e: Record<string, string>) => void;
            onFinish: () => void;
        }) => void,
        requireText?: string,
    ) =>
        confirm({
            type: 'danger',
            title,
            text: t('This action cannot be undone.'),
            confirmText: t('Delete'),
            cancelText: t('Cancel'),
            requireText,
            onConfirm: () =>
                new Promise<void>((resolve, reject) =>
                    run({
                        onSuccess: () => resolve(),
                        onError: (errors) =>
                            reject(new Error(Object.values(errors)[0] ?? t('Delete failed'))),
                        // Covers 500s and network errors; no effect after resolve()
                        onFinish: () => reject(new Error(t('Delete failed'))),
                    }),
                ),
        });

    const deleteOne = (u: UserRow | number) => {
        const id = typeof u === 'object' ? u.id : u;
        return deleteRequest(t('Delete user?'), (cb) =>
            router.delete(`/users/${id}`, { preserveScroll: true, ...cb }),
        );
    };

    const bulkDelete = (ids: number[], ctx: BulkContext) =>
        deleteRequest(
            ctx.allMatching
                ? t('Delete ALL matching records?')
                : t('Delete :count users?').replace(':count', String(ids.length)),
            (cb) =>
                router.post(
                    '/users/bulk-delete',
                    { ids, all: ctx.allMatching, search: ctx.search, filters: ctx.filters },
                    { preserveScroll: true, ...cb },
                ),
            ctx.allMatching ? 'DELETE' : undefined,
        );

    const exportSelected = (ids: number[], ctx: BulkContext) => {
        router.get(
            '/users/export',
            { ids, all: ctx.allMatching, search: ctx.search, filters: ctx.filters },
            { preserveScroll: true, preserveState: true },
        );
    };

    const rowMenu: RowMenuItem<UserRow>[] = [
        {
            label: t('Edit'),
            icon: Pencil,
            onClick: (u) => router.visit(`/users/${u.id}/edit`),
        },
        {
            label: t('Delete'),
            icon: Trash2,
            danger: true,
            hidden: (u) => u.id === auth.user?.id,
            onClick: (u) => {
                deleteOne(u);
            },
        },
    ];

    // Keeps the checkboxes and the "N selected" bar visible
    const bulkActions: BulkAction[] = [
        {
            label: t('Delete selected'),
            icon: Trash2,
            danger: true,
            onClick: (ids, _clear, ctx) => bulkDelete(ids, ctx),
        },
    ];

    return (
        <AppLayout
            title="Users"
            breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Users' }]}
        >
            <div className="mb-4 flex justify-end">
                <Link
                    href="/users/create"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-3 py-2 text-xs font-medium text-white shadow-sm transition hover:bg-primary-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-950"
                >
                    <Plus className="size-4" />
                    {t('Create user')}
                </Link>
            </div>

            <DataTable<UserRow>
                url="/users"
                data={users}
                state={state}
                columns={columns}
                searchFields={searchFields}
                searchLabels={{
                    title: t('Search'),
                    reset: t('Reset'),
                    search: t('Search'),
                }}
                maxVisibleActions={2}
                toolbarActions={[
                    {
                        label: t('Download Excel'),
                        icon: Download,
                        color: 'green',
                        selectedOnly: true,
                        onSelected: exportSelected,
                    },
                    {
                        label: t('Delete'),
                        icon: Trash2,
                        color: 'red',
                        selectedOnly: true,
                        onSelected: bulkDelete,
                    },
                ]}
                rowMenu={rowMenu}
                bulkActions={bulkActions}
                isSelectable={(u) => u.id !== auth.user?.id}
                emptyHeading={t('No users found')}
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
        </AppLayout>
    );
}