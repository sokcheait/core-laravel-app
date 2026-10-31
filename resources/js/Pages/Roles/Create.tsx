import { FormEvent, useMemo, useRef, useState } from 'react';
import { Link, useForm } from '@inertiajs/react';
import { AlertCircle, CheckCheck, Loader2, Search, ShieldCheck, X } from 'lucide-react';
import AppLayout from '@/Layouts/AppLayout';
import Checkbox from '@/Components/Checkbox';
import { useToast } from '@/Components/Toast/ToastProvider';
import useT from '@/hooks/useT';

interface Permission {
    id: number;
    name: string;
}

interface Props {
    groups: Record<string, Permission[]>;
}

export default function RolesCreate({ groups }: Props) {
    const { t } = useT();
    const toast = useToast();
    const nameRef = useRef<HTMLInputElement>(null);
    const [query, setQuery] = useState('');

    // Single place to adapt if your toast API is named differently
    const notify = (type: 'success' | 'error', message: string) => toast[type](message);

    const { data, setData, post, processing, errors } = useForm<{
        name: string;
        permissions: number[];
    }>({
        name: '',
        permissions: [],
    });

    // "users" -> "Users", "view" -> "View" (keys exist in the translation files)
    const label = (text: string) => t(text.charAt(0).toUpperCase() + text.slice(1));
    const permLabel = (p: Permission) => label(p.name.split('.').slice(1).join('.'));

    const allIds = useMemo(
        () => Object.values(groups).flatMap((items) => items.map((p) => p.id)),
        [groups],
    );
    const total = allIds.length;
    const selected = data.permissions.length;
    const percent = total ? Math.round((selected / total) * 100) : 0;

    // Search filter: match group name or permission name
    const visibleGroups = useMemo(() => {
        const q = query.trim().toLowerCase();
        const entries = Object.entries(groups);
        if (!q) return entries;

        return entries
            .map(([group, items]) => {
                if (label(group).toLowerCase().includes(q)) return [group, items] as const;
                return [group, items.filter((p) => permLabel(p).toLowerCase().includes(q))] as const;
            })
            .filter(([, items]) => items.length > 0);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [groups, query]);

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

        if (!data.name.trim()) {
            notify('error', t('Please enter a role name'));
            nameRef.current?.focus();
            return;
        }

        post('/roles', {
            preserveScroll: true,
            onSuccess: () => notify('success', t('Role created successfully')),
            onError: () => notify('error', t('Please fix the errors and try again')),
        });
    };

    const errorMessages = Object.values(errors);

    return (
        <AppLayout
            title="Create role"
            breadcrumbs={[
                { label: 'Home', href: '/dashboard' },
                { label: 'Roles', href: '/roles' },
                { label: 'Create role' },
            ]}
        >
            <form onSubmit={submit} noValidate className="space-y-6">
                {/* Error alert */}
                {errorMessages.length > 0 && (
                    <div
                        role="alert"
                        className="swal-fade flex gap-3 rounded-xl bg-red-50 p-4 ring-1 ring-red-500/20 dark:bg-red-500/10 dark:ring-red-500/30"
                    >
                        <AlertCircle className="mt-0.5 size-5 shrink-0 text-red-500" />
                        <div>
                            <p className="text-sm font-semibold text-red-700 dark:text-red-300">
                                {t('Please fix the errors and try again')}
                            </p>
                            <ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm text-red-600 dark:text-red-400">
                                {errorMessages.map((message, i) => (
                                    <li key={i}>{message}</li>
                                ))}
                            </ul>
                        </div>
                    </div>
                )}

                {/* Name card */}
                <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-950/5 dark:bg-gray-900 dark:ring-white/10">
                    <div className="flex items-start gap-4">
                        <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-500/10 dark:text-primary-400">
                            <ShieldCheck className="size-6" />
                        </span>
                        <div className="w-full max-w-md">
                            <label
                                htmlFor="role-name"
                                className="block text-base font-semibold text-gray-900 dark:text-gray-100"
                            >
                                {t('Name')}
                            </label>
                            <p className="mb-3 text-sm text-gray-500 dark:text-gray-400">
                                {t('Give this role a short, clear name')}
                            </p>
                            <input
                                ref={nameRef}
                                id="role-name"
                                type="text"
                                autoFocus
                                autoComplete="off"
                                value={data.name}
                                onChange={(e) => setData('name', e.target.value)}
                                aria-invalid={!!errors.name}
                                className={`w-full rounded-lg border bg-white px-3 py-2 text-base shadow-sm outline-none transition focus:ring-2 dark:bg-gray-950 ${
                                    errors.name
                                        ? 'border-red-400 focus:border-red-500 focus:ring-red-500/30'
                                        : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500/30 dark:border-gray-700'
                                }`}
                            />
                            {errors.name && <p className="mt-1.5 text-sm text-red-500">{errors.name}</p>}
                        </div>
                    </div>
                </section>

                {/* Permissions card */}
                <section className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-950/5 dark:bg-gray-900 dark:ring-white/10">
                    <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                                {t('Permissions')}
                            </h2>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {selected} / {total} {t('selected')}
                            </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            <div className="relative">
                                <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
                                <input
                                    type="search"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder={t('Search permissions')}
                                    aria-label={t('Search permissions')}
                                    className="w-56 rounded-lg border border-gray-300 bg-white py-2 pl-9 pr-8 text-sm shadow-sm outline-none transition focus:border-primary-500 focus:ring-2 focus:ring-primary-500/30 dark:border-gray-700 dark:bg-gray-950"
                                />
                                {query && (
                                    <button
                                        type="button"
                                        onClick={() => setQuery('')}
                                        aria-label={t('Clear')}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                                    >
                                        <X className="size-4" />
                                    </button>
                                )}
                            </div>

                            <button
                                type="button"
                                onClick={() => setData('permissions', allIds)}
                                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-primary-600 transition hover:bg-primary-50 dark:text-primary-400 dark:hover:bg-primary-500/10"
                            >
                                <CheckCheck className="size-4" />
                                {t('Select all')}
                            </button>
                            <button
                                type="button"
                                onClick={() => setData('permissions', [])}
                                disabled={selected === 0}
                                className="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100 disabled:opacity-40 dark:text-gray-300 dark:hover:bg-white/10"
                            >
                                {t('Clear')}
                            </button>
                        </div>
                    </div>

                    {/* Overall progress */}
                    <div
                        role="progressbar"
                        aria-valuenow={percent}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        className="mb-6 h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-white/10"
                    >
                        <div
                            className="h-full rounded-full bg-primary-500 transition-all duration-500 ease-out"
                            style={{ width: `${percent}%` }}
                        />
                    </div>

                    {visibleGroups.length === 0 ? (
                        <div className="swal-fade rounded-xl border border-dashed border-gray-300 py-12 text-center text-sm text-gray-500 dark:border-white/15 dark:text-gray-400">
                            {t('No permissions found')}
                        </div>
                    ) : (
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                            {visibleGroups.map(([group, shown], index) => {
                                const items = groups[group];
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
                                        style={{ animationDelay: `${Math.min(index, 8) * 40}ms` }}
                                        className={`swal-fade rounded-xl border p-3 transition-all duration-300 hover:shadow-md ${
                                            allChecked
                                                ? 'border-primary-500/40 bg-primary-50/50 dark:border-primary-500/30 dark:bg-primary-500/5'
                                                : 'border-gray-200 dark:border-white/10'
                                        }`}
                                    >
                                        {/* Group header: tick the whole group */}
                                        <div className="mb-2 flex items-center justify-between rounded-lg px-2 pt-2">
                                            <Checkbox
                                                checked={allChecked}
                                                indeterminate={someChecked}
                                                onChange={() => toggleGroup(items)}
                                                size="lg"
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

                                        {/* Group progress */}
                                        <div className="mx-2 mb-2 h-1 overflow-hidden rounded-full bg-gray-100 dark:bg-white/10">
                                            <div
                                                className="h-full rounded-full bg-primary-500 transition-all duration-500 ease-out"
                                                style={{ width: `${(checkedCount / items.length) * 100}%` }}
                                            />
                                        </div>

                                        <div className="space-y-0.5 border-t border-gray-100 pt-2 dark:border-white/10">
                                            {shown.map((p) => {
                                                const checked = data.permissions.includes(p.id);

                                                return (
                                                    <Checkbox
                                                        key={p.id}
                                                        checked={checked}
                                                        onChange={() => toggle(p.id)}
                                                        className={`rounded-lg px-2 py-2 text-base transition-colors duration-200 ${
                                                            checked
                                                                ? 'bg-primary-50 dark:bg-primary-500/10'
                                                                : 'hover:bg-gray-50 dark:hover:bg-white/5'
                                                        }`}
                                                    >
                                                        <span
                                                            className={`transition-colors duration-200 ${
                                                                checked
                                                                    ? 'text-gray-900 dark:text-gray-100'
                                                                    : 'text-gray-500 dark:text-gray-400'
                                                            }`}
                                                        >
                                                            {permLabel(p)}
                                                        </span>
                                                    </Checkbox>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {errors.permissions && (
                        <p className="mt-4 text-sm text-red-500">{errors.permissions}</p>
                    )}
                </section>

                {/* Sticky action bar */}
                <div className="sticky bottom-4 z-10 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-white/90 p-4 shadow-lg ring-1 ring-gray-950/5 backdrop-blur dark:bg-gray-900/90 dark:ring-white/10">
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                        <span className="font-semibold text-primary-600 dark:text-primary-400">{selected}</span>{' '}
                        {t('permissions selected')}
                    </p>
                    <div className="flex items-center gap-2">
                        <Link
                            href="/roles"
                            className="rounded-lg px-5 py-2 text-base font-medium text-gray-600 transition hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-white/10"
                        >
                            {t('Cancel')}
                        </Link>
                        <button
                            type="submit"
                            disabled={processing}
                            className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-6 py-2 text-base font-medium text-white shadow-sm transition hover:bg-primary-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 active:scale-95 disabled:opacity-60 dark:focus-visible:ring-offset-gray-900"
                        >
                            {processing && <Loader2 className="size-4 animate-spin" />}
                            {t('Save')}
                        </button>
                    </div>
                </div>
            </form>
        </AppLayout>
    );
}