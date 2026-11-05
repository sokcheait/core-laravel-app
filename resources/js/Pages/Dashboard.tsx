import { useEffect, useState } from 'react';
import { usePage } from '@inertiajs/react';
import AppLayout from '@/Layouts/AppLayout';
import type { PageProps } from '@/types';

/* ---------- Types (data comes from DashboardController) ---------- */
type Stat = { label: string; value: string | number; animate?: boolean };
type RoleRow = { id: number | string; name: string; users: number; perms: number };
type RecentUser = { id: number | string; name: string; email: string; time: string };
type Props = {
    stats: Stat[];
    roles: RoleRow[];
    userCount: number;
    permissionCount: number;
    recentUsers: RecentUser[];
};

/* ---------- Shared class names (primary-* comes from your @theme) ---------- */
const card =
    'rounded-xl bg-white shadow-sm ring-1 ring-gray-950/5 dark:bg-gray-900 dark:ring-white/10';
const muted = 'text-sm text-gray-500 dark:text-gray-400';

/* ---------- Small components ---------- */
const ICON_PATHS = {
    users: 'M16 19v-1a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v1M9 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm13 8v-1a4 4 0 0 0-3-3.9M16 4.1a3.5 3.5 0 0 1 0 6.8',
    shield: 'M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3Zm-3 9 2 2 4-4',
    key: 'M15 7a4 4 0 1 1-3.9 4.9L4 19v-3h3v-3h3l1.1-1.1A4 4 0 0 1 15 7Zm1 1h.01',
    calendar: 'M7 3v3m10-3v3M4 9h16M5 5h14a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Z',
    idcard: 'M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1Zm5 7a2 2 0 1 0 0-4 2 2 0 0 0 0 4Zm-3 4c.4-1.5 1.5-2.2 3-2.2s2.6.7 3 2.2M14 10h4m-4 4h3',
    chart: 'M4 20V10m6 10V4m6 16v-7m4 7H2',
    lock: 'M7 11V8a5 5 0 0 1 10 0v3M6 11h12a1 1 0 0 1 1 1v8a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-8a1 1 0 0 1 1-1Z',
    userPlus: 'M16 20v-1a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v1M9.5 11a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7ZM19 8v6m3-3h-6',
    inbox: 'M3 13l3-8h12l3 8v5a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1v-5Zm0 0h5l1 2h6l1-2h5',
} as const;
type IconName = keyof typeof ICON_PATHS;

function Icon({ name, className = 'size-5' }: { name: IconName; className?: string }) {
    return (
        <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <path d={ICON_PATHS[name]} />
        </svg>
    );
}

/* Pick an icon from the stat label; falls back by position */
const FALLBACK: IconName[] = ['users', 'shield', 'key', 'calendar', 'idcard'];
function iconFor(label: string, i: number): IconName {
    const l = label.toLowerCase();
    if (l.includes('permission')) return 'key';
    if (l.includes('role')) return 'shield';
    if (l.includes('member') || l.includes('since') || l.includes('date')) return 'calendar';
    if (l.includes('id')) return 'idcard';
    if (l.includes('user')) return 'users';
    return FALLBACK[i % FALLBACK.length];
}

function IconChip({ name }: { name: IconName }) {
    return (
        <span className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary-50 text-primary-600 ring-1 ring-primary-100 transition-all duration-300 group-hover:scale-105 group-hover:bg-primary-600 group-hover:text-white group-hover:ring-primary-600 dark:bg-primary-500/10 dark:text-primary-400 dark:ring-primary-500/20 dark:group-hover:bg-primary-500 dark:group-hover:text-white">
            <Icon name={name} />
        </span>
    );
}

function Empty({ icon, children }: { icon: IconName; children: React.ReactNode }) {
    return (
        <div className="flex flex-col items-center gap-2 py-6 text-center">
            <span className="grid size-12 place-items-center rounded-full bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500">
                <Icon name={icon} className="size-6" />
            </span>
            <p className={muted}>{children}</p>
        </div>
    );
}

function Avatar({ name, large = false }: { name: string; large?: boolean }) {
    const initials = name.split(' ').map((s) => s[0]).join('').slice(0, 2);
    return (
        <span
            className={`theme-pop grid place-items-center rounded-full font-semibold uppercase ${
                large
                    ? 'size-14 bg-white/20 text-lg text-white ring-2 ring-white/40'
                    : 'size-10 bg-primary-100 text-primary-700 dark:bg-primary-900 dark:text-primary-100'
            }`}
        >
            {initials}
        </span>
    );
}

function Bar({ pct }: { pct: number }) {
    return (
        <span className="h-2 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
            <i
                className="block h-full rounded-full bg-gradient-to-r from-primary-400 to-primary-600 transition-[width] duration-700 ease-out"
                style={{ width: `${pct}%` }}
            />
        </span>
    );
}

function CountUp({ value }: { value: number }) {
    const [n, setN] = useState(0);
    useEffect(() => {
        let raf = 0;
        const start = performance.now();
        const tick = (t: number) => {
            const k = Math.min((t - start) / 800, 1);
            setN(Math.round(value * (1 - Math.pow(1 - k, 3))));
            if (k < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, [value]);
    return <>{n}</>;
}

function SectionTitle({ icon, children }: { icon: IconName; children: React.ReactNode }) {
    return (
        <h3 className="mb-4 flex items-center gap-3 font-semibold">
            <span className="grid size-8 place-items-center rounded-lg bg-primary-50 text-primary-600 dark:bg-primary-500/10 dark:text-primary-400">
                <Icon name={icon} className="size-4" />
            </span>
            {children}
        </h3>
    );
}

/* ---------- Dashboard ---------- */
export default function Dashboard({ stats, roles, userCount, permissionCount, recentUsers }: Props) {
    const { auth } = usePage<PageProps>().props;

    const now = new Date();
    const hour = now.getHours();
    const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
    const today = now.toLocaleDateString(undefined, { weekday: 'long', day: 'numeric', month: 'long' });
    const pills: { icon: IconName; value: number; label: string }[] = [
        { icon: 'users', value: userCount, label: 'users' },
        { icon: 'shield', value: roles.length, label: 'roles' },
        { icon: 'key', value: permissionCount, label: 'permissions' },
    ];

    return (
        <AppLayout
            title="Dashboard"
            breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'Dashboard' }]}
        >
            <div className="space-y-6">
                {/* Welcome banner */}
                <div className="theme-rise relative overflow-hidden rounded-xl bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 p-6 text-white shadow-sm sm:p-8">
                    <span aria-hidden className="pointer-events-none absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.14)_1px,transparent_1px)] bg-[length:18px_18px] [mask-image:linear-gradient(to_left,black,transparent_70%)]" />
                    <span aria-hidden className="banner-float pointer-events-none absolute -right-10 -top-16 size-56 rounded-full bg-white/10" />
                    <span aria-hidden className="banner-float banner-float-slow pointer-events-none absolute -bottom-20 right-24 size-40 rounded-full bg-white/5" />
                    <span aria-hidden className="banner-shimmer pointer-events-none absolute inset-y-0 left-0 w-1/3 bg-gradient-to-r from-transparent via-white/25 to-transparent" />

                    <div className="relative flex flex-wrap items-center justify-between gap-6">
                        <div className="flex items-center gap-4">
                            <span className="relative">
                                <span aria-hidden className="absolute inset-0 rounded-full bg-white/30 [animation-iteration-count:3] motion-safe:animate-ping" />
                                <Avatar name={auth.user?.name ?? 'User'} large />
                            </span>
                            <div>
                                <p className="text-sm text-primary-100">{today}</p>
                                <h2 className="text-xl font-semibold sm:text-2xl">
                                    {greeting}, {auth.user?.name} <span className="banner-wave"></span>
                                </h2>
                                <p className="mt-0.5 text-sm text-primary-100">{auth.user?.email}</p>
                            </div>
                        </div>

                        <div className="flex flex-wrap gap-2 text-sm">
                            {pills.map((p, i) => (
                                <span
                                    key={p.label}
                                    className="theme-pop inline-flex items-center gap-2 rounded-full bg-white/15 px-3.5 py-1.5 ring-1 ring-white/20 backdrop-blur-sm transition duration-300 hover:-translate-y-0.5 hover:bg-white/25"
                                    style={{ animationDelay: `${300 + i * 90}ms` }}
                                >
                                    <Icon name={p.icon} className="size-4" />
                                    <b className="font-semibold tabular-nums"><CountUp value={p.value} /></b>
                                    {p.label}
                                </span>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-4">
                    {stats.map((s, i) => (
                        <div
                            key={s.label}
                            className={`theme-rise group relative flex items-center gap-4 overflow-hidden p-5 transition duration-300 hover:-translate-y-0.5 hover:shadow-md ${card}`}
                            style={{ animationDelay: `${i * 90}ms` }}
                        >
                            <Icon
                                name={iconFor(s.label, i)}
                                className="pointer-events-none absolute -bottom-4 -right-3 size-24 text-primary-500/[0.07] transition-transform duration-500 group-hover:-rotate-6 group-hover:scale-110"
                            />
                            <IconChip name={iconFor(s.label, i)} />
                            <div className="relative min-w-0">
                                <p className={muted}>{s.label}</p>
                                <p className="mt-0.5 truncate text-2xl font-bold tabular-nums tracking-tight">
                                    {typeof s.value === 'number' && s.animate !== false ? <CountUp value={s.value} /> : s.value}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <section className={`theme-rise p-6 ${card}`} style={{ animationDelay: '200ms' }}>
                        <SectionTitle icon="chart">Users by role</SectionTitle>
                        {roles.length === 0 && <Empty icon="shield">No roles yet. Create a role to see how users are spread across it.</Empty>}
                        {roles.map((r) => (
                            <div key={r.id} className="grid grid-cols-[90px_1fr_32px] items-center gap-3 py-2">
                                <span className="truncate">{r.name}</span>
                                <Bar pct={userCount ? (r.users / userCount) * 100 : 0} />
                                <span className={`text-right ${muted}`}>{r.users}</span>
                            </div>
                        ))}
                    </section>

                    <section className={`theme-rise p-6 ${card}`} style={{ animationDelay: '280ms' }}>
                        <SectionTitle icon="lock">Permissions per role</SectionTitle>
                        {roles.length === 0 && <Empty icon="lock">No roles yet. Permissions appear here once a role has them.</Empty>}
                        {roles.map((r) => (
                            <div key={r.id} className="grid grid-cols-[90px_1fr_48px] items-center gap-3 py-2">
                                <span className="truncate">{r.name}</span>
                                <Bar pct={permissionCount ? (r.perms / permissionCount) * 100 : 0} />
                                <span className={`text-right ${muted}`}>{r.perms}/{permissionCount}</span>
                            </div>
                        ))}
                    </section>

                    <section className={`theme-rise p-6 md:col-span-2 ${card}`} style={{ animationDelay: '360ms' }}>
                        <SectionTitle icon="userPlus">Recently joined</SectionTitle>
                        {recentUsers.length === 0 && <Empty icon="inbox">No users have joined yet.</Empty>}
                        <ul className="relative ml-1.5 border-l border-gray-200 dark:border-gray-800">
                            {recentUsers.map((u, i) => (
                                <li key={u.id} className="relative flex items-center justify-between gap-3 py-2.5 pl-5">
                                    <span className="absolute -left-[5px] top-1/2 flex size-2.5 -translate-y-1/2">
                                        {i === 0 && (
                                            <span className="absolute inline-flex size-full rounded-full bg-primary-400 opacity-60 motion-safe:animate-ping" />
                                        )}
                                        <span className={`relative inline-flex size-2.5 rounded-full ${i === 0 ? 'bg-primary-500' : 'bg-gray-300 dark:bg-gray-700'}`} />
                                    </span>
                                    <span className="flex min-w-0 items-center gap-3">
                                        <Avatar name={u.name} />
                                        <span className="min-w-0">
                                            <span className="block truncate font-medium">{u.name}</span>
                                            <span className={`block truncate ${muted}`}>{u.email}</span>
                                        </span>
                                    </span>
                                    <span className={`shrink-0 ${muted}`}>{u.time}</span>
                                </li>
                            ))}
                        </ul>
                    </section>
                </div>
            </div>
        </AppLayout>
    );
}