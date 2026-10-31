import { PropsWithChildren, ReactNode, useEffect, useRef, useState } from 'react';
import { Head, Link, router, usePage } from '@inertiajs/react';
import {
    ChevronDown,
    ChevronsLeft,
    ChevronsRight,
    LogOut,
    Menu,
    Moon,
    Sun,
    X,
} from 'lucide-react';
import { navigation } from '@/config/navigation';
import { themes, applyTheme, getSavedTheme, type ThemeName } from '@/config/themes';
import useT, { type Locale } from '@/hooks/useT';
import type { PageProps } from '@/types';
import LanguageSwitch from '@/Components/LanguageSwitch';
import NotificationBell from '@/Components/NotificationBell';
import ThemeMenu from '@/Components/Theme/ThemeMenu';

export interface Breadcrumb {
    label: string;
    href?: string;
}

interface Props {
    title?: string;
    heading?: string;
    breadcrumbs?: Breadcrumb[];
    actions?: ReactNode;
}

const path = (url: string) => url.split('?')[0];
const isActive = (url: string, href: string) =>
    path(url) === href || path(url).startsWith(href + '/');

function readStorage(key: string): string | null {
    try {
        return localStorage.getItem(key);
    } catch {
        return null;
    }
}

function writeStorage(key: string, value: string) {
    try {
        localStorage.setItem(key, value);
    } catch {
        /* storage unavailable */
    }
}

export default function AppLayout({
    title,
    heading,
    breadcrumbs = [],
    actions,
    children,
}: PropsWithChildren<Props>) {
    const { auth } = usePage<PageProps>().props;
    const { url } = usePage();
    const { t, locale } = useT();
    const user = auth.user;

    const [mobileOpen, setMobileOpen] = useState(false);
    const [collapsed, setCollapsed] = useState(() => readStorage('sidebar-collapsed') === '1');
    const [userMenu, setUserMenu] = useState(false);
    const [dark, setDark] = useState(() =>
        typeof document !== 'undefined' ? document.documentElement.classList.contains('dark') : false,
    );
    const [color, setColor] = useState<ThemeName>(getSavedTheme);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setMobileOpen(false);
        setUserMenu(false);
    }, [url]);

    // Keep <html lang> in sync so the browser picks the right font
    useEffect(() => {
        document.documentElement.lang = locale;
    }, [locale]);

    useEffect(() => {
        const onClick = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) setUserMenu(false);
        };
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                setUserMenu(false);
                setMobileOpen(false);
            }
        };
        document.addEventListener('mousedown', onClick);
        document.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('mousedown', onClick);
            document.removeEventListener('keydown', onKey);
        };
    }, []);

    const toggleCollapsed = () => {
        setCollapsed((c) => {
            writeStorage('sidebar-collapsed', c ? '0' : '1');
            return !c;
        });
    };

    const toggleDark = () => {
        const next = !dark;
        document.documentElement.classList.toggle('dark', next);
        writeStorage('theme', next ? 'dark' : 'light');
        setDark(next);
    };

    const changeColor = (name: ThemeName) => {
        applyTheme(name);
        writeStorage('primary-color', name);
        setColor(name);
    };

    const pageHeading = heading ?? title;

    return (
        <div className="min-h-screen bg-gray-50 text-gray-950 dark:bg-gray-950 dark:text-white">
            {title && <Head title={t(title)} />}

            {/* Mobile overlay */}
            {mobileOpen && (
                <div
                    className="fixed inset-0 z-30 bg-gray-950/50 lg:hidden"
                    onClick={() => setMobileOpen(false)}
                    aria-hidden="true"
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col bg-white ring-1 ring-gray-950/5 transition-all duration-200 dark:bg-gray-900 dark:ring-white/10
                    ${mobileOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0
                    ${collapsed ? 'lg:w-20' : 'lg:w-72'}`}
            >
                {/* Brand */}
                <div className="flex h-16 shrink-0 items-center justify-between px-6 ring-1 ring-gray-950/5 dark:ring-white/10">
                    <Link href="/dashboard" className="flex items-center gap-2 overflow-hidden">
                        <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-primary-500 font-bold text-white">
                            M
                        </span>
                        <span className={`text-lg font-bold tracking-tight ${collapsed ? 'lg:hidden' : ''}`}>
                            MyApp
                        </span>
                    </Link>
                    <button
                        type="button"
                        onClick={() => setMobileOpen(false)}
                        aria-label={t('Close sidebar')}
                        className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 lg:hidden dark:hover:bg-white/5"
                    >
                        <X className="size-5" />
                    </button>
                </div>

                {/* Nav */}
                <nav className="flex-1 space-y-6 overflow-y-auto px-4 py-6">
                    {navigation.map((group, i) => (
                        <div key={group.label ?? i}>
                            {group.label && (
                                <p
                                    className={`mb-2 px-2 text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500 ${
                                        collapsed ? 'lg:hidden' : ''
                                    }`}
                                >
                                    {t(group.label)}
                                </p>
                            )}
                            <ul className="space-y-1">
                                {group.items.map((item) => {
                                    const active = isActive(url, item.href);
                                    const Icon = item.icon;
                                    return (
                                        <li key={item.href}>
                                            <Link
                                                href={item.href}
                                                title={collapsed ? t(item.label) : undefined}
                                                className={`group flex items-center gap-3 rounded-lg px-2 py-2 text-sm font-medium transition
                                                    ${collapsed ? 'lg:justify-center' : ''}
                                                    ${
                                                        active
                                                            ? 'bg-gray-100 text-primary-600 dark:bg-white/5 dark:text-primary-400'
                                                            : 'text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-white/5'
                                                    }`}
                                            >
                                                <Icon
                                                    className={`size-5 shrink-0 ${
                                                        active
                                                            ? 'text-primary-600 dark:text-primary-400'
                                                            : 'text-gray-400 group-hover:text-gray-500'
                                                    }`}
                                                />
                                                <span className={`flex-1 ${collapsed ? 'lg:hidden' : ''}`}>
                                                    {t(item.label)}
                                                </span>
                                                {item.badge !== undefined && (
                                                    <span
                                                        className={`rounded-full bg-primary-50 px-2 py-0.5 text-xs font-medium text-primary-600 dark:bg-primary-500/10 dark:text-primary-400 ${
                                                            collapsed ? 'lg:hidden' : ''
                                                        }`}
                                                    >
                                                        {item.badge}
                                                    </span>
                                                )}
                                            </Link>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    ))}
                </nav>
            </aside>

            {/* Main column */}
            <div className={`transition-all duration-200 ${collapsed ? 'lg:pl-20' : 'lg:pl-72'}`}>
                {/* Topbar */}
                <header className="sticky top-0 z-20 flex h-16 items-center gap-3 bg-white/80 px-4 ring-1 ring-gray-950/5 backdrop-blur sm:px-6 dark:bg-gray-900/80 dark:ring-white/10">
                    <button
                        type="button"
                        onClick={() => setMobileOpen(true)}
                        aria-label={t('Open sidebar')}
                        className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 lg:hidden dark:hover:bg-white/5"
                    >
                        <Menu className="size-5" />
                    </button>

                    <button
                        type="button"
                        onClick={toggleCollapsed}
                        aria-label={collapsed ? t('Expand sidebar') : t('Collapse sidebar')}
                        className="hidden rounded-lg p-2 text-gray-500 hover:bg-gray-100 lg:block dark:hover:bg-white/5"
                    >
                        {collapsed ? <ChevronsRight className="size-5" /> : <ChevronsLeft className="size-5" />}
                    </button>

                    <div className="ml-auto flex items-center gap-2">
                        <LanguageSwitch />
                        <NotificationBell />
                        {/* Theme color */}
                        {/* <ThemeMenu dark={dark} onDarkChange={toggleDark} /> */}

                        <button
                            type="button"
                            onClick={toggleDark}
                            aria-label={t('Toggle dark mode')}
                            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5"
                        >
                            {dark ? <Sun className="size-5" /> : <Moon className="size-5" />}
                        </button>

                        {/* User menu */}
                        <div className="relative" ref={menuRef}>
                            <button
                                type="button"
                                onClick={() => setUserMenu((o) => !o)}
                                aria-haspopup="menu"
                                aria-expanded={userMenu}
                                className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-gray-100 dark:hover:bg-white/5"
                            >
                                <span className="grid size-8 place-items-center rounded-full bg-primary-500 text-sm font-semibold text-white">
                                    {user?.name?.charAt(0).toUpperCase()}
                                </span>
                                <ChevronDown className="hidden size-4 text-gray-400 sm:block" />
                            </button>

                            {userMenu && (
                                <div
                                    role="menu"
                                    className="absolute right-0 mt-2 w-60 rounded-xl bg-white py-1 shadow-lg ring-1 ring-gray-950/5 dark:bg-gray-900 dark:ring-white/10"
                                >
                                    <div className="border-b border-gray-100 px-4 py-3 dark:border-white/10">
                                        <p className="truncate text-sm font-medium">{user?.name}</p>
                                        <p className="truncate text-xs text-gray-500">{user?.email}</p>
                                    </div>

                                    <button
                                        role="menuitem"
                                        onClick={() => router.post('/logout')}
                                        className="flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-white/5"
                                    >
                                        <LogOut className="size-4 text-gray-400" />
                                        {t('Sign out')}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </header>

                {/* Page */}
                <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                    {(pageHeading || breadcrumbs.length > 0 || actions) && (
                        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
                            <div>
                                {breadcrumbs.length > 0 && (
                                    <nav aria-label={t('Breadcrumb')} className="mb-1">
                                        <ol className="flex items-center gap-2 text-sm text-gray-500">
                                            {breadcrumbs.map((crumb, i) => (
                                                <li key={i} className="flex items-center gap-2">
                                                    {i > 0 && <span aria-hidden="true">/</span>}
                                                    {crumb.href ? (
                                                        <Link href={crumb.href} className="hover:text-gray-700 dark:hover:text-gray-300">
                                                            {t(crumb.label)}
                                                        </Link>
                                                    ) : (
                                                        <span>{t(crumb.label)}</span>
                                                    )}
                                                </li>
                                            ))}
                                        </ol>
                                    </nav>
                                )}
                                {pageHeading && (
                                    <h1 className="text-2xl font-bold tracking-tight">{t(pageHeading)}</h1>
                                )}
                            </div>
                            {actions && <div className="flex items-center gap-2">{actions}</div>}
                        </div>
                    )}

                    {children}
                </main>
            </div>
            <ThemeMenu floating dark={dark} onDarkChange={toggleDark} />
        </div>
    );
}