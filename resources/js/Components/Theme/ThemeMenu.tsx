import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { Palette, Settings, X } from 'lucide-react';
import useT from '@/hooks/useT';
import ThemeSettings from './ThemeSettings';

interface Props {
    dark: boolean;
    onDarkChange: (dark: boolean) => void;
    /** Fixed tab on the right edge of the screen instead of an inline icon button */
    floating?: boolean;
}

export default function ThemeMenu({ dark, onDarkChange, floating = false }: Props) {
    const { t } = useT();
    const [open, setOpen] = useState(false);
    // Bumped on every open so the entrance animations replay each time
    const [session, setSession] = useState(0);

    const show = () => {
        setSession((s) => s + 1);
        setOpen(true);
    };

    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setOpen(false);
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [open]);

    // Portal to <body>: the sticky header uses backdrop-blur, which would
    // otherwise trap `position: fixed` children inside the header.
    const drawer = (
        <>
            {/* Overlay */}
            <div
                onClick={() => setOpen(false)}
                aria-hidden="true"
                className={`fixed inset-0 z-50 bg-gray-950/40 transition-[opacity,backdrop-filter] duration-500 motion-reduce:transition-none ${
                    open ? 'opacity-100 backdrop-blur-sm' : 'pointer-events-none opacity-0 backdrop-blur-0'
                }`}
            />

            {/* Slide-over panel */}
            <aside
                role="dialog"
                aria-modal="true"
                aria-label={t('Theme')}
                aria-hidden={!open}
                className={`fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col bg-white shadow-2xl ring-1 ring-gray-950/5 transition-[transform,visibility] duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none dark:bg-gray-900 dark:ring-white/10 ${
                    open ? 'visible translate-x-0' : 'invisible translate-x-full'
                }`}
            >
                <div className="flex h-16 shrink-0 items-center justify-between px-6 ring-1 ring-gray-950/5 dark:ring-white/10">
                    <h2 className="text-base font-semibold">{t('Theme')}</h2>
                    <button
                        type="button"
                        onClick={() => setOpen(false)}
                        aria-label={t('Close')}
                        className="rounded-lg p-1.5 text-gray-500 transition duration-300 hover:rotate-90 hover:bg-gray-100 motion-reduce:transition-none dark:hover:bg-white/5"
                    >
                        <X className="size-5" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto [&>div]:border-b-0 [&>div]:px-6 [&>div]:py-6">
                    {session > 0 && <ThemeSettings key={session} dark={dark} onDarkChange={onDarkChange} />}
                </div>
            </aside>
        </>
    );

    return (
        <>
            {floating ? (
                // Wider invisible hover zone; the tab peeks out and slides in on hover/focus
                <div
                    className={`group fixed right-0 top-1/2 z-30 -translate-y-1/2 py-8 pl-8 ${
                        open ? 'pointer-events-none' : ''
                    }`}
                >
                    <button
                        type="button"
                        onClick={show}
                        aria-haspopup="dialog"
                        aria-expanded={open}
                        aria-label={t('Theme')}
                        className={`block cursor-pointer rounded-l-xl bg-primary-500 p-3 text-white shadow-lg transition duration-300 ease-[cubic-bezier(0.16,1,0.3,1)] hover:bg-primary-600 motion-reduce:transition-none ${
                            open
                                ? 'translate-x-full'
                                : 'translate-x-[calc(100%-10px)] group-hover:translate-x-0 group-focus-within:translate-x-0 focus-visible:translate-x-0'
                        }`}
                    >
                        <Settings className="size-5 animate-[spin_6s_linear_infinite] motion-reduce:animate-none" />
                    </button>
                </div>
            ) : (
                <button
                    type="button"
                    onClick={show}
                    aria-haspopup="dialog"
                    aria-expanded={open}
                    aria-label={t('Theme')}
                    className="rounded-lg p-2 text-gray-500 transition duration-300 hover:rotate-12 hover:bg-gray-100 motion-reduce:transition-none dark:hover:bg-white/5"
                >
                    <Palette className="size-5" />
                </button>
            )}

            {typeof document !== 'undefined' && createPortal(drawer, document.body)}
        </>
    );
}