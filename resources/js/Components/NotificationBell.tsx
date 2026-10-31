import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { router, usePage } from '@inertiajs/react';
import {
    AlertTriangle,
    Bell,
    BellOff,
    Check,
    CheckCheck,
    CheckCircle2,
    Download,
    Info,
    Trash2,
    X,
    XCircle,
    type LucideIcon,
} from 'lucide-react';
import useT from '@/hooks/useT';
import type { NotificationItem, NotificationsProp } from '@/types';

const styles: Record<NotificationItem['type'], { icon: LucideIcon; box: string }> = {
    info: {
        icon: Info,
        box: 'bg-sky-50 text-sky-600 ring-sky-600/20 dark:bg-sky-500/10 dark:text-sky-400 dark:ring-sky-400/20',
    },
    success: {
        icon: CheckCircle2,
        box: 'bg-green-50 text-green-600 ring-green-600/20 dark:bg-green-500/10 dark:text-green-400 dark:ring-green-400/20',
    },
    warning: {
        icon: AlertTriangle,
        box: 'bg-amber-50 text-amber-600 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-400 dark:ring-amber-400/20',
    },
    danger: {
        icon: XCircle,
        box: 'bg-red-50 text-red-600 ring-red-600/20 dark:bg-red-500/10 dark:text-red-400 dark:ring-red-400/20',
    },
};

const POLL_MS = 10_000;

const isExternal = (url: string) => /^https?:\/\//i.test(url);

export default function NotificationBell() {
    const { notifications } = usePage().props as unknown as {
        notifications: NotificationsProp | null;
    };
    const { t } = useT();
    const [open, setOpen] = useState(false);
    const [tab, setTab] = useState<'all' | 'unread'>('all');

    // Close on Escape
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setOpen(false);
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, []);

    // Lock page scroll while the panel is open
    useEffect(() => {
        if (!open) return;
        const previous = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = previous;
        };
    }, [open]);

    // Poll for new notifications
    useEffect(() => {
        const id = setInterval(() => {
            if (document.visibilityState === 'visible') {
                router.reload({ only: ['notifications'] });
            }
        }, POLL_MS);
        return () => clearInterval(id);
    }, []);

    if (!notifications) return null;

    const { unread, items } = notifications;
    const visible = tab === 'unread' ? items.filter((n) => !n.read) : items;
    const opts = { preserveScroll: true, preserveState: true, only: ['notifications'] };

    const markRead = (n: NotificationItem) => {
        if (!n.read) router.post(`/notifications/${n.id}/read`, {}, opts);
    };

    const removeItem = (n: NotificationItem) => {
        router.delete(`/notifications/${n.id}`, opts);
    };

    // Only the Download button calls this
    const downloadItem = (n: NotificationItem) => {
        markRead(n);
        if (n.url) window.location.href = n.url; // plain browser download
    };

    const openItem = (n: NotificationItem) => {
        markRead(n);

        if (!n.url) return;

        // Download links: clicking the row does NOT download.
        // Only the Download button does.
        if (isExternal(n.url)) return;

        setOpen(false);
        router.visit(n.url);
    };

    const tabClass = (active: boolean) =>
        `flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-1.5 text-xs font-medium transition ${
            active
                ? 'bg-white text-gray-950 shadow-sm ring-1 ring-gray-950/5 dark:bg-gray-700 dark:text-white dark:ring-white/10'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
        }`;

    const chip = (active: boolean) =>
        `rounded-full px-1.5 text-[10px] font-semibold leading-4 ${
            active
                ? 'bg-primary-50 text-primary-600 dark:bg-primary-500/20 dark:text-primary-300'
                : 'bg-gray-200/70 text-gray-500 dark:bg-white/10 dark:text-gray-400'
        }`;

    const slideOver = (
        <div
            className={`fixed inset-0 z-50 transition-[visibility] duration-300 ${
                open ? 'visible' : 'invisible'
            }`}
            aria-hidden={!open}
        >
            {/* Backdrop */}
            <div
                onClick={() => setOpen(false)}
                className={`absolute inset-0 bg-gray-950/50 backdrop-blur-sm transition-opacity duration-300 ${
                    open ? 'opacity-100' : 'opacity-0'
                }`}
            />

            {/* Panel */}
            <aside
                role="dialog"
                aria-modal="true"
                aria-label={t('Notifications')}
                className={`absolute inset-y-0 right-0 flex w-full max-w-md flex-col bg-white shadow-2xl ring-1 ring-gray-950/5 transition-transform duration-300 ease-out dark:bg-gray-900 dark:ring-white/10 ${
                    open ? 'translate-x-0' : 'translate-x-full'
                }`}
            >
                {/* Header */}
                <div className="relative shrink-0 overflow-hidden border-b border-gray-100 dark:border-white/10">
                    <div className="pointer-events-none absolute inset-0 bg-linear-to-br from-primary-50 via-white to-white dark:from-primary-500/10 dark:via-gray-900 dark:to-gray-900" />

                    <div className="relative flex items-center justify-between gap-3 px-5 py-4">
                        <div className="flex min-w-0 items-center gap-3">
                            <span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-primary-500 text-white shadow-lg shadow-primary-500/30">
                                <Bell className="size-5" />
                            </span>
                            <div className="min-w-0">
                                <h2 className="truncate text-base font-semibold leading-tight">
                                    {t('Notifications')}
                                </h2>
                                <p className="mt-0.5 truncate text-xs text-gray-500 dark:text-gray-400">
                                    {unread > 0
                                        ? `${unread} ${t('unread')} · ${items.length} ${t('total')}`
                                        : t("You're all caught up")}
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-1">
                            {items.length > 0 && (
                                <button
                                    type="button"
                                    onClick={() => router.delete('/notifications', opts)}
                                    title={t('Clear all')}
                                    className="rounded-lg p-2 text-gray-400 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400"
                                >
                                    <Trash2 className="size-5" />
                                </button>
                            )}
                            <button
                                type="button"
                                onClick={() => setOpen(false)}
                                aria-label={t('Close')}
                                className="rounded-lg p-2 text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-white/5 dark:hover:text-gray-200"
                            >
                                <X className="size-5" />
                            </button>
                        </div>
                    </div>
                </div>

                {/* Tabs (segmented) */}
                <div className="shrink-0 px-4 pt-3">
                    <div className="flex gap-1 rounded-xl bg-gray-100 p-1 dark:bg-white/5">
                        <button type="button" onClick={() => setTab('all')} className={tabClass(tab === 'all')}>
                            {t('All')}
                            <span className={chip(tab === 'all')}>{items.length}</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setTab('unread')}
                            className={tabClass(tab === 'unread')}
                        >
                            {t('Unread')}
                            <span className={chip(tab === 'unread')}>{unread}</span>
                        </button>
                    </div>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto overscroll-contain px-3 py-3">
                    {visible.length === 0 ? (
                        <div className="flex h-full flex-col items-center justify-center px-4 text-center">
                            <span className="relative mb-4 grid size-16 place-items-center rounded-full bg-gray-100 text-gray-400 dark:bg-white/5 dark:text-gray-500">
                                <span className="absolute inset-0 rounded-full ring-8 ring-gray-50 dark:ring-white/2" />
                                <BellOff className="relative size-7" />
                            </span>
                            <p className="text-sm font-semibold">
                                {tab === 'unread' ? t('No unread notifications') : t('No notifications')}
                            </p>
                            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                                {t("You're all caught up")}
                            </p>
                        </div>
                    ) : (
                        <ul className="space-y-2">
                            {visible.map((n, i) => {
                                const s = styles[n.type];
                                const download = !!n.url && isExternal(n.url);
                                const Icon = download ? Download : s.icon;

                                return (
                                    <li
                                        key={n.id}
                                        className={open ? 'animate-[notif-in_300ms_ease-out_both]' : ''}
                                        style={{ animationDelay: `${Math.min(i, 8) * 40}ms` }}
                                    >
                                        <div
                                            className={`group relative flex items-start gap-3 rounded-2xl p-3.5 ring-1 transition ${
                                                n.read
                                                    ? 'bg-white ring-gray-950/5 hover:bg-gray-50 dark:bg-white/2 dark:ring-white/10 dark:hover:bg-white/5'
                                                    : 'bg-primary-50/50 ring-primary-500/20 hover:bg-primary-50 dark:bg-primary-500/5 dark:ring-primary-400/20 dark:hover:bg-primary-500/10'
                                            }`}
                                        >
                                            <button
                                                type="button"
                                                onClick={() => openItem(n)}
                                                className="absolute inset-0 rounded-2xl focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500"
                                                aria-label={n.title}
                                            />

                                            <span
                                                className={`pointer-events-none relative grid size-10 shrink-0 place-items-center rounded-xl ring-1 ring-inset ${s.box}`}
                                            >
                                                <Icon className="size-5" />
                                                {!n.read && (
                                                    <span className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full bg-primary-500 ring-2 ring-white dark:ring-gray-900" />
                                                )}
                                            </span>

                                            <span className="pointer-events-none min-w-0 flex-1">
                                                <span
                                                    className={`block text-sm leading-5 ${
                                                        n.read ? 'font-medium' : 'font-semibold'
                                                    }`}
                                                >
                                                    {n.title}
                                                </span>
                                                {n.body && (
                                                    <span className="mt-0.5 block text-xs leading-5 text-gray-500 dark:text-gray-400">
                                                        {n.body}
                                                    </span>
                                                )}
                                                <span className="mt-2 flex items-center gap-2">
                                                    <span className="text-[11px] text-gray-400 dark:text-gray-500">
                                                        {n.created_at}
                                                    </span>
                                                    {download && (
                                                        <button
                                                            type="button"
                                                            onClick={() => downloadItem(n)}
                                                            className="pointer-events-auto relative z-10 inline-flex items-center gap-1 rounded-full bg-primary-500 px-2.5 py-1 text-[11px] font-medium text-white transition hover:bg-primary-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900"
                                                        >
                                                            <Download className="size-3" />
                                                            {t('Download')}
                                                        </button>
                                                    )}
                                                </span>
                                            </span>

                                            {/* Row actions: mark as read + remove */}
                                            <div className="relative z-10 flex shrink-0 items-center gap-0.5 opacity-100 transition focus-within:opacity-100 sm:opacity-0 sm:group-hover:opacity-100">
                                                {!n.read && (
                                                    <button
                                                        type="button"
                                                        onClick={() => markRead(n)}
                                                        title={t('Mark as read')}
                                                        aria-label={t('Mark as read')}
                                                        className="rounded-lg p-1.5 text-gray-400 transition hover:bg-white hover:text-primary-600 dark:hover:bg-white/10 dark:hover:text-primary-400"
                                                    >
                                                        <Check className="size-4" />
                                                    </button>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={() => removeItem(n)}
                                                    title={t('Remove')}
                                                    aria-label={t('Remove')}
                                                    className="rounded-lg p-1.5 text-gray-400 transition hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10 dark:hover:text-red-400"
                                                >
                                                    <Trash2 className="size-4" />
                                                </button>
                                            </div>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </div>
            </aside>
        </div>
    );

    return (
        <>
            {/* Bell button */}
            <button
                type="button"
                onClick={() => setOpen(true)}
                aria-label={t('Notifications')}
                aria-haspopup="dialog"
                aria-expanded={open}
                className="relative rounded-lg p-2 text-gray-500 transition hover:bg-gray-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 dark:hover:bg-white/5"
            >
                <Bell className="size-5" />
                {unread > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 flex min-w-4.5">
                        <span className="absolute inline-flex size-full animate-ping rounded-full bg-primary-400 opacity-60" />
                        <span className="relative grid min-w-4.5 place-items-center rounded-full bg-primary-500 px-1 text-[10px] font-semibold leading-4.5 text-white ring-2 ring-white dark:ring-gray-900">
                            {unread > 99 ? '99+' : unread}
                        </span>
                    </span>
                )}
            </button>

            {/* Rendered on <body> so the blurred header can't trap the fixed panel */}
            {createPortal(slideOver, document.body)}
        </>
    );
}