import { useEffect, useRef, useState } from 'react';
import { router } from '@inertiajs/react';
import { Check, ChevronDown } from 'lucide-react';
import useT, { type Locale } from '@/hooks/useT';

type Language = {
    code: Locale;
    short: string;
    label: string;
    nativeLabel: string;
    flag: string; // ISO country code used by flag-icons (gb, kh, ...)
};

const languages: Language[] = [
    { code: 'en', short: 'EN', label: 'English', nativeLabel: 'English', flag: 'us' },
    { code: 'km', short: 'ខ្មែរ', label: 'Khmer', nativeLabel: 'ភាសាខ្មែរ', flag: 'kh' },
];

// `fi` + `fis` = flag-icons' square (1:1) flag. Its size follows the font size,
// so use text-* utilities instead of size-*.
function FlagBadge({ code, size = 'text-2xl' }: { code: string; size?: string }) {
    return (
        <span
            aria-hidden="true"
            className={`fi fis fi-${code} ${size} shrink-0 rounded-full ring-1 ring-gray-950/10 dark:ring-white/20`}
        />
    );
}

/* ---------- component ---------- */

export default function LanguageSwitch({ className = '' }: { className?: string }) {
    const { t, locale } = useT();

    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const rootRef = useRef<HTMLDivElement>(null);
    const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);

    const current = languages.find((l) => l.code === locale) ?? languages[0];

    // Close on outside click / Escape. A fixed backdrop doesn't work inside the
    // topbar (backdrop-blur makes it the containing block), so listen on document.
    useEffect(() => {
        if (!open) return;

        const onDown = (e: MouseEvent) => {
            if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
        };
        const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);

        document.addEventListener('mousedown', onDown);
        document.addEventListener('keydown', onKey);

        // Focus the selected option when the menu opens
        const index = Math.max(0, languages.findIndex((l) => l.code === current.code));
        optionRefs.current[index]?.focus();

        return () => {
            document.removeEventListener('mousedown', onDown);
            document.removeEventListener('keydown', onKey);
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open]);

    const change = (language: Language) => {
        setOpen(false);
        if (language.code === current.code || loading) return;

        router.post(
            '/locale',
            { locale: language.code },
            {
                preserveScroll: true,
                preserveState: true,
                onStart: () => setLoading(true),
                onFinish: () => setLoading(false),
            },
        );
    };

    const onListKey = (e: React.KeyboardEvent, index: number) => {
        if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
        e.preventDefault();
        const next = (index + (e.key === 'ArrowDown' ? 1 : -1) + languages.length) % languages.length;
        optionRefs.current[next]?.focus();
    };

    return (
        <div ref={rootRef} className={`relative inline-block text-left ${className}`}>
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                disabled={loading}
                aria-label={t('Change language')}
                aria-haspopup="listbox"
                aria-expanded={open}
                className={`group inline-flex items-center gap-2 rounded-full border bg-white py-1 pl-1 pr-2.5 text-sm font-medium shadow-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:cursor-wait disabled:opacity-60 dark:bg-gray-900 ${
                    open
                        ? 'border-primary-500 text-primary-700 ring-2 ring-primary-500/20 dark:text-primary-300'
                        : 'border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-white/5'
                }`}
            >
                <FlagBadge code={current.flag} />
                <span lang={current.code} className="hidden sm:inline">
                    {current.short}
                </span>
                <ChevronDown
                    className={`size-4 text-gray-400 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
                />
            </button>

            {/* Always rendered so it can animate in and out */}
            <div
                role="listbox"
                aria-label={t('Select language')}
                aria-hidden={!open}
                className={`absolute right-0 z-50 mt-2 w-60 origin-top-right rounded-2xl bg-white p-1.5 shadow-xl ring-1 ring-gray-950/5 transition duration-150 dark:bg-gray-900 dark:ring-white/10 ${
                    open
                        ? 'visible translate-y-0 scale-100 opacity-100'
                        : 'invisible -translate-y-1 scale-95 opacity-0'
                }`}
            >
                <p className="px-3 pb-1 pt-2 text-xs font-semibold uppercase tracking-wider text-gray-400">
                    {t('Select language')}
                </p>

                {languages.map((language, index) => {
                    const selected = language.code === current.code;

                    return (
                        <button
                            key={language.code}
                            ref={(el) => {
                                optionRefs.current[index] = el;
                            }}
                            type="button"
                            role="option"
                            lang={language.code}
                            tabIndex={open ? 0 : -1}
                            aria-selected={selected}
                            onClick={() => change(language)}
                            onKeyDown={(e) => onListKey(e, index)}
                            className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
                                selected
                                    ? 'bg-primary-50 text-primary-700 dark:bg-primary-500/10 dark:text-primary-300'
                                    : 'text-gray-700 hover:bg-gray-50 dark:text-gray-200 dark:hover:bg-white/5'
                            }`}
                        >
                            <FlagBadge code={language.flag} size="text-[2rem]" />

                            <span className="flex-1 leading-tight">
                                <span className="block text-sm font-medium">{language.nativeLabel}</span>
                                <span className="block text-xs text-gray-400">{language.label}</span>
                            </span>

                            <span
                                className={`grid size-5 place-items-center rounded-full transition ${
                                    selected ? 'bg-primary-600 text-white' : 'opacity-0'
                                }`}
                            >
                                <Check className="size-3.5" strokeWidth={3} />
                            </span>
                        </button>
                    );
                })}
            </div>
        </div>
    );
}