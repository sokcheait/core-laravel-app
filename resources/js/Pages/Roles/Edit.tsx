import { FormEvent } from 'react';
import { Link, useForm } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import Checkbox from '@/Components/Checkbox';
import useT from '@/hooks/useT';

interface Permission {
    id: number;
    name: string;
}

interface Props {
    role: { id: number; name: string; permissions: number[] };
    groups: Record<string, Permission[]>;
}

export default function RolesEdit({ role, groups }: Props) {
    const { t } = useT();

    const { data, setData, put, processing, errors } = useForm<{
        name: string;
        permissions: number[];
    }>({
        name: role.name,
        permissions: role.permissions,
    });

    const toggle = (id: number) =>
        setData(
            'permissions',
            data.permissions.includes(id)
                ? data.permissions.filter((p) => p !== id)
                : [...data.permissions, id],
        );

    const toggleGroup = (items: Permission[]) => {
        const ids = items.map((p) => p.id);
        const allChecked = ids.every((id) => data.permissions.includes(id));

        setData(
            'permissions',
            allChecked
                ? data.permissions.filter((id) => !ids.includes(id))
                : Array.from(new Set([...data.permissions, ...ids])),
        );
    };

    const submit = (e: FormEvent) => {
        e.preventDefault();
        put(`/roles/${role.id}`);
    };

    // "users" -> "Users", "view" -> "View" (keys exist in the translation files)
    const label = (text: string) => t(text.charAt(0).toUpperCase() + text.slice(1));

    const total = Object.values(groups).reduce((sum, items) => sum + items.length, 0);

    return (
        <AppLayout
            title="Edit role"
            breadcrumbs={[
                { label: 'Home', href: '/dashboard' },
                { label: 'Roles', href: '/roles' },
                { label: 'Edit role' },
            ]}
        >
            <form
                onSubmit={submit}
                className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-950/5 dark:bg-gray-900 dark:ring-white/10"
            >
                {/* Name */}
                <div className="mb-8 max-w-sm">
                    <label
                        htmlFor="role-name"
                        className="mb-1.5 block text-base font-medium text-gray-800 dark:text-gray-200"
                    >
                        {t('Name')}
                    </label>
                    <input
                        id="role-name"
                        type="text"
                        autoComplete="off"
                        value={data.name}
                        onChange={(e) => setData('name', e.target.value)}
                        className={`w-full rounded-lg border bg-white px-3 py-2 text-base shadow-sm outline-none transition focus:ring-2 dark:bg-gray-950 ${
                            errors.name
                                ? 'border-red-400 focus:border-red-500 focus:ring-red-500/30'
                                : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500/30 dark:border-gray-700'
                        }`}
                    />
                    {errors.name && <p className="mt-1.5 text-sm text-red-500">{errors.name}</p>}
                </div>

                {/* Permissions */}
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                        {t('Permissions')}
                    </h2>
                    <span className="rounded-full bg-gray-100 px-3 py-1 text-sm font-medium text-gray-600 dark:bg-white/5 dark:text-gray-300">
                        {data.permissions.length} / {total}
                    </span>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {Object.entries(groups).map(([group, items]) => {
                        const checkedCount = items.filter((p) =>
                            data.permissions.includes(p.id),
                        ).length;
                        const allChecked = checkedCount === items.length;
                        const someChecked = checkedCount > 0 && !allChecked;

                        return (
                            <div
                                key={group}
                                role="group"
                                aria-label={label(group)}
                                className={`rounded-xl border p-3 transition-colors duration-200 ${
                                    allChecked
                                        ? 'border-primary-500/40 bg-primary-50/50 dark:border-primary-500/30 dark:bg-primary-500/5'
                                        : 'border-gray-200 dark:border-white/10'
                                }`}
                            >
                                {/* Group header: tick the whole group */}
                                <div className="mb-1 flex items-center justify-between rounded-lg px-2 py-2">
                                    <Checkbox
                                        checked={allChecked}
                                        indeterminate={someChecked}
                                        onChange={() => toggleGroup(items)}
                                        className="flex-1"
                                    >
                                        <span className="text-base font-semibold text-gray-900 dark:text-gray-100">
                                            {label(group)}
                                        </span>
                                    </Checkbox>

                                    <span
                                        className={`rounded-full px-2 py-0.5 text-xs font-semibold transition-colors ${
                                            checkedCount > 0
                                                ? 'bg-primary-600 text-white'
                                                : 'bg-gray-100 text-gray-500 dark:bg-white/5 dark:text-gray-400'
                                        }`}
                                    >
                                        {checkedCount}/{items.length}
                                    </span>
                                </div>

                                <div className="space-y-0.5 border-t border-gray-100 pt-2 dark:border-white/10">
                                    {items.map((p) => {
                                        const checked = data.permissions.includes(p.id);

                                        return (
                                            <Checkbox
                                                key={p.id}
                                                checked={checked}
                                                onChange={() => toggle(p.id)}
                                                className="rounded-lg px-2 py-2 text-base transition-colors hover:bg-gray-50 dark:hover:bg-white/5"
                                            >
                                                <span
                                                    className={`transition-colors duration-200 ${
                                                        checked
                                                            ? 'text-gray-900 dark:text-gray-100'
                                                            : 'text-gray-500 dark:text-gray-400'
                                                    }`}
                                                >
                                                    {label(p.name.split('.').slice(1).join('.'))}
                                                </span>
                                            </Checkbox>
                                        );
                                    })}
                                </div>
                            </div>
                        );
                    })}
                </div>

                {errors.permissions && (
                    <p className="mt-3 text-sm text-red-500">{errors.permissions}</p>
                )}

                {/* Actions */}
                <div className="mt-8 flex justify-end gap-2 border-t border-gray-100 pt-5 dark:border-white/10">
                    <Link
                        href="/roles"
                        className="rounded-lg px-5 py-2 text-base font-medium text-gray-600 transition hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/10"
                    >
                        {t('Cancel')}
                    </Link>
                    <button
                        type="submit"
                        disabled={processing}
                        className="rounded-lg bg-primary-600 px-6 py-2 text-base font-medium text-white shadow-sm transition hover:bg-primary-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:opacity-50 dark:focus-visible:ring-offset-gray-900"
                    >
                        {t('Save')}
                    </button>
                </div>
            </form>
        </AppLayout>
    );
}