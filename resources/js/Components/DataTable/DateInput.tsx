import { useEffect, useMemo, useRef, useState } from 'react';
import { CalendarRange, ChevronLeft, ChevronRight, X } from 'lucide-react';
import useT from '@/hooks/useT';

interface Props {
    id: string;
    value: string; // ISO yyyy-mm-dd or ''
    onChange: (iso: string) => void;
    placeholder?: string;
    min?: string; // ISO, days before this are disabled
    max?: string; // ISO, days after this are disabled
}

/* ---------- date helpers (all local time, no timezone surprises) ---------- */

const pad = (n: number) => String(n).padStart(2, '0');

/** month is 0-based */
const makeIso = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;

const parseIso = (iso: string) => {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
    return m ? { y: Number(m[1]), m: Number(m[2]) - 1, d: Number(m[3]) } : null;
};

const dateToIso = (date: Date) => makeIso(date.getFullYear(), date.getMonth(), date.getDate());

const toDisplay = (iso: string) => {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
    return m ? `${m[3]}-${m[2]}-${m[1]}` : '';
};

const toIso = (display: string) => {
    const m = /^(\d{2})-(\d{2})-(\d{4})$/.exec(display);
    if (!m) return '';
    const [, d, mo, y] = m;
    const date = new Date(`${y}-${mo}-${d}T00:00:00`);
    const valid =
        date.getFullYear() === Number(y) &&
        date.getMonth() + 1 === Number(mo) &&
        date.getDate() === Number(d);
    return valid ? `${y}-${mo}-${d}` : '';
};

const mask = (raw: string) => {
    const digits = raw.replace(/\D/g, '').slice(0, 8);
    if (digits.length > 4) return `${digits.slice(0, 2)}-${digits.slice(2, 4)}-${digits.slice(4)}`;
    if (digits.length > 2) return `${digits.slice(0, 2)}-${digits.slice(2)}`;
    return digits;
};

/* ---------- styles ---------- */

const ghostSelect =
    'cursor-pointer appearance-none rounded-lg bg-transparent bg-none px-2 py-1 pr-2 text-sm font-semibold ' +
    'text-gray-900 outline-none transition hover:bg-gray-100 focus-visible:ring-2 focus-visible:ring-primary-500 ' +
    'dark:text-gray-100 dark:hover:bg-white/5 [&>option]:bg-white [&>option]:text-gray-900 ' +
    'dark:[&>option]:bg-gray-900 dark:[&>option]:text-gray-100';

const navButton =
    'grid size-8 shrink-0 place-items-center rounded-full text-gray-500 transition hover:bg-gray-100 ' +
    'hover:text-gray-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ' +
    'dark:hover:bg-white/5 dark:hover:text-gray-200';

// Khmer month names, January first
const KM_MONTHS = [
    'មករា',
    'កុម្ភៈ',
    'មីនា',
    'មេសា',
    'ឧសភា',
    'មិថុនា',
    'កក្កដា',
    'សីហា',
    'កញ្ញា',
    'តុលា',
    'វិច្ឆិកា',
    'ធ្នូ',
];

// Khmer weekday labels, Monday first
const KM_WEEKDAYS = ['ច', 'អ', 'ព', 'ព្រ', 'សុ', 'ស', 'អា'];

const PANEL_HEIGHT = 400; // approx., used to decide whether to open upwards

/* ---------- component ---------- */

export default function DateInput({
    id,
    value,
    onChange,
    placeholder = 'DD-MM-YYYY',
    min,
    max,
}: Props) {
    const { t, locale } = useT();
    const intlLocale = locale === 'km' ? 'km-KH' : 'en-US';

    const [text, setText] = useState(toDisplay(value));
    const [open, setOpen] = useState(false);
    const [openUp, setOpenUp] = useState(false);

    // The calendar panel contains locale- and clock-dependent output (month names,
    // weekdays, "today", year list). Rendering it during SSR causes hydration
    // mismatches, so it is only mounted once the user has opened it for the first time.
    // After that it stays mounted so the close animation still works.
    const [everOpened, setEverOpened] = useState(false);

    const [view, setView] = useState(() => {
        const p = parseIso(value) ?? parseIso(dateToIso(new Date()))!;
        return { y: p.y, m: p.m };
    });
    const rootRef = useRef<HTMLDivElement>(null);

    const todayIso = dateToIso(new Date());

    // Follow external changes (e.g. URL navigation, reset)
    useEffect(() => {
        if (value !== toIso(text)) setText(toDisplay(value));

        // Keep the calendar on the month of the typed / chosen date
        const p = parseIso(value);
        if (p) setView({ y: p.y, m: p.m });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [value]);

    // Close on outside click / Escape
    useEffect(() => {
        if (!open) return;

        const onDown = (e: MouseEvent) => {
            if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
        };
        const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);

        document.addEventListener('mousedown', onDown);
        document.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('mousedown', onDown);
            document.removeEventListener('keydown', onKey);
        };
    }, [open]);

    const monthNames = useMemo(
        () =>
            locale === 'km'
                ? KM_MONTHS
                : Array.from({ length: 12 }, (_, i) =>
                      new Intl.DateTimeFormat(intlLocale, { month: 'long' }).format(
                          new Date(2024, i, 1),
                      ),
                  ),
        [locale, intlLocale],
    );

    // Monday first (2024-01-01 is a Monday)
    const weekdays = useMemo(
        () =>
            locale === 'km'
                ? KM_WEEKDAYS
                : Array.from({ length: 7 }, (_, i) =>
                      new Intl.DateTimeFormat(intlLocale, { weekday: 'short' }).format(
                          new Date(2024, 0, 1 + i),
                      ),
                  ),
        [locale, intlLocale],
    );

    const years = useMemo(() => {
        const current = new Date().getFullYear();
        const from = Math.min(current - 100, view.y);
        const to = Math.max(current + 20, view.y);
        return Array.from({ length: to - from + 1 }, (_, i) => from + i);
    }, [view.y]);

    const cells = useMemo(() => {
        const offset = (new Date(view.y, view.m, 1).getDay() + 6) % 7;
        return Array.from({ length: 42 }, (_, i) => new Date(view.y, view.m, 1 - offset + i));
    }, [view.y, view.m]);

    const isDisabled = (iso: string) => (!!min && iso < min) || (!!max && iso > max);

    const openPanel = () => {
        if (open) return;

        const p = parseIso(value) ?? parseIso(todayIso)!;
        setView({ y: p.y, m: p.m });

        // Open upwards when there is no room below but there is above
        const rect = rootRef.current?.getBoundingClientRect();
        setOpenUp(
            !!rect &&
                rect.bottom + PANEL_HEIGHT > window.innerHeight &&
                rect.top > PANEL_HEIGHT,
        );
        setEverOpened(true);
        setOpen(true);
    };

    const togglePanel = () => (open ? setOpen(false) : openPanel());

    const shiftMonth = (delta: number) =>
        setView((v) => {
            const d = new Date(v.y, v.m + delta, 1);
            return { y: d.getFullYear(), m: d.getMonth() };
        });

    const choose = (iso: string) => {
        if (isDisabled(iso)) return;
        setText(toDisplay(iso));
        onChange(iso);
        setOpen(false);
    };

    const clear = () => {
        setText('');
        onChange('');
        setOpen(false);
    };

    const handleText = (raw: string) => {
        const masked = mask(raw);
        setText(masked);
        onChange(toIso(masked));
    };

    return (
        <div className="relative" ref={rootRef}>
            {/* Field */}
            <div
                className={`flex overflow-hidden rounded-lg border bg-white shadow-sm transition focus-within:border-primary-500 focus-within:ring-2 focus-within:ring-primary-500/30 dark:bg-gray-950 ${
                    open
                        ? 'border-primary-500 ring-2 ring-primary-500/30'
                        : 'border-gray-300 dark:border-gray-700'
                }`}
            >
                <input
                    id={id}
                    type="text"
                    inputMode="numeric"
                    autoComplete="off"
                    value={text}
                    placeholder={placeholder}
                    onFocus={openPanel}
                    onClick={openPanel}
                    onChange={(e) => handleText(e.target.value)}
                    className="min-w-0 flex-1 bg-transparent px-3 py-1.5 text-sm outline-none placeholder:text-gray-400"
                />

                {text !== '' && (
                    <button
                        type="button"
                        aria-label={t('Clear')}
                        onClick={clear}
                        className="px-2 text-gray-400 transition hover:text-gray-600 dark:hover:text-gray-200"
                    >
                        <X className="size-4" />
                    </button>
                )}

                <button
                    type="button"
                    aria-label={t('Open calendar')}
                    aria-haspopup="dialog"
                    aria-expanded={open}
                    onClick={togglePanel}
                    className={`border-l px-3 transition ${
                        open
                            ? 'border-primary-500/40 bg-primary-50 text-primary-600 dark:bg-primary-500/10 dark:text-primary-400'
                            : 'border-gray-300 text-gray-500 hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-white/5'
                    }`}
                >
                    <CalendarRange className="size-4" />
                </button>
            </div>

            {/* Panel: not rendered on the server / before first open (avoids hydration mismatch),
                then kept mounted so it can animate closed. */}
            {everOpened && (
                <div
                    role="dialog"
                    aria-label={t('Calendar')}
                    aria-hidden={!open}
                    className={`absolute left-0 z-30 w-80 max-w-[calc(100vw-2rem)] rounded-2xl bg-white p-4 shadow-xl ring-1 ring-gray-950/5 transition duration-150 dark:bg-gray-900 dark:ring-white/10 ${
                        openUp
                            ? 'bottom-full mb-2 origin-bottom-left'
                            : 'top-full mt-2 origin-top-left'
                    } ${
                        open
                            ? 'visible translate-y-0 scale-100 opacity-100'
                            : `invisible scale-95 opacity-0 ${openUp ? 'translate-y-1' : '-translate-y-1'}`
                    }`}
                >
                    {/* Header */}
                    <div className="mb-3 flex items-center justify-between gap-1">
                        <button
                            type="button"
                            aria-label={t('Previous month')}
                            onClick={() => shiftMonth(-1)}
                            className={navButton}
                        >
                            <ChevronLeft className="size-5" />
                        </button>

                        <div className="flex items-center">
                            <select
                                aria-label={t('Month')}
                                value={view.m}
                                onChange={(e) =>
                                    setView((v) => ({ ...v, m: Number(e.target.value) }))
                                }
                                className={ghostSelect}
                            >
                                {monthNames.map((name, i) => (
                                    <option key={i} value={i}>
                                        {name}
                                    </option>
                                ))}
                            </select>

                            <select
                                aria-label={t('Year')}
                                value={view.y}
                                onChange={(e) =>
                                    setView((v) => ({ ...v, y: Number(e.target.value) }))
                                }
                                className={ghostSelect}
                            >
                                {years.map((y) => (
                                    <option key={y} value={y}>
                                        {y}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <button
                            type="button"
                            aria-label={t('Next month')}
                            onClick={() => shiftMonth(1)}
                            className={navButton}
                        >
                            <ChevronRight className="size-5" />
                        </button>
                    </div>

                    {/* Weekday labels */}
                    <div className="mb-1 grid grid-cols-7 text-center text-[11px] font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500">
                        {weekdays.map((w, i) => (
                            <span key={i} className="py-1.5">
                                {w}
                            </span>
                        ))}
                    </div>

                    {/* Days */}
                    <div className="grid grid-cols-7 gap-y-1">
                        {cells.map((date) => {
                            const iso = dateToIso(date);
                            const inMonth = date.getMonth() === view.m;
                            const selected = iso === value;
                            const today = iso === todayIso;

                            return (
                                <button
                                    key={iso}
                                    type="button"
                                    tabIndex={open ? 0 : -1}
                                    disabled={isDisabled(iso)}
                                    aria-pressed={selected}
                                    aria-current={today ? 'date' : undefined}
                                    aria-label={new Intl.DateTimeFormat(intlLocale, {
                                        dateStyle: 'full',
                                    }).format(date)}
                                    onClick={() => choose(iso)}
                                    className={`relative mx-auto grid size-9 place-items-center rounded-full text-sm transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:cursor-not-allowed disabled:opacity-30 disabled:hover:bg-transparent ${
                                        selected
                                            ? 'bg-primary-600 font-semibold text-white shadow-sm shadow-primary-600/30 hover:bg-primary-500'
                                            : inMonth
                                              ? 'text-gray-900 hover:bg-gray-100 dark:text-gray-100 dark:hover:bg-white/10'
                                              : 'text-gray-300 hover:bg-gray-50 dark:text-gray-600 dark:hover:bg-white/5'
                                    }`}
                                >
                                    {date.getDate()}
                                    {today && !selected && (
                                        <span
                                            aria-hidden="true"
                                            className="absolute bottom-1 size-1 rounded-full bg-primary-500"
                                        />
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}
        </div>
    );
}