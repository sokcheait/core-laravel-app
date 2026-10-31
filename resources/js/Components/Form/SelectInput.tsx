import { useEffect, useId, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { AlertCircle, Check, ChevronDown, Search, X } from 'lucide-react';
import useT from '@/hooks/useT';
import FormField from './FormField';
import { describedBy } from './styles';

export interface SelectOption {
    value: string;
    label: string;
    disabled?: boolean;
}

export interface SelectInputProps {
    id?: string;
    /** Adds a hidden input so the value is also submitted by plain HTML forms. */
    name?: string;
    label?: string;
    value: string;
    onChange: (value: string) => void;
    options: SelectOption[];
    /** Text shown when nothing is selected. Defaults to t('Select an option'). */
    placeholder?: string;
    /**
     * Show a search box in the dropdown.
     * `'auto'` (default) shows it when there are 8 or more options.
     */
    searchable?: boolean | 'auto';
    /** Placeholder of the search box. Defaults to t('Search'). */
    searchPlaceholder?: string;
    /** Text when the search finds nothing. Defaults to t('No results'). */
    noResultsText?: string;
    /** Show an X button to reset the value to ''. */
    clearable?: boolean;
    /** Run every option label through t(), for options defined in English. */
    translate?: boolean;
    error?: string;
    hint?: string;
    required?: boolean;
    disabled?: boolean;
    autoFocus?: boolean;
    /** Wrapper classes (layout), e.g. "sm:col-span-2". */
    className?: string;
    /** Extra classes for the closed field (trigger button). */
    inputClassName?: string;
}

const PANEL_HEIGHT = 320; // approx., used to decide whether to open upwards
const AUTO_SEARCH_FROM = 8;

/** Lower-case and strip Latin accents. Only U+0300–U+036F is removed, so Khmer marks stay intact. */
const normalize = (s: string) =>
    s.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

export default function SelectInput({
    id,
    name,
    label,
    value,
    onChange,
    options,
    placeholder,
    searchable = 'auto',
    searchPlaceholder,
    noResultsText,
    clearable,
    translate,
    error,
    hint,
    required,
    disabled,
    autoFocus,
    className,
    inputClassName,
}: SelectInputProps) {
    const { t } = useT();
    const autoId = useId();
    const selectId = id ?? autoId;
    const listId = `${selectId}-list`;

    const rootRef = useRef<HTMLDivElement>(null);
    const triggerRef = useRef<HTMLButtonElement>(null);
    const searchRef = useRef<HTMLInputElement>(null);
    const listRef = useRef<HTMLUListElement>(null);

    const [open, setOpen] = useState(false);
    const [openUp, setOpenUp] = useState(false);
    const [query, setQuery] = useState('');
    const [active, setActive] = useState(-1);

    const items = useMemo(
        () => options.map((o) => ({ ...o, text: translate ? t(o.label) : o.label })),
        [options, translate, t],
    );

    const showSearch = searchable === true || (searchable === 'auto' && options.length >= AUTO_SEARCH_FROM);

    const filtered = useMemo(() => {
        const q = normalize(query.trim());
        return q ? items.filter((o) => normalize(o.text).includes(q)) : items;
    }, [items, query]);

    const selected = items.find((o) => o.value === value);
    const activeId = active >= 0 ? `${selectId}-opt-${active}` : undefined;

    /* ---------- open / close ---------- */

    const openPanel = () => {
        if (open || disabled) return;

        const rect = rootRef.current?.getBoundingClientRect();
        setOpenUp(!!rect && rect.bottom + PANEL_HEIGHT > window.innerHeight && rect.top > PANEL_HEIGHT);
        setQuery('');
        setOpen(true);
    };

    const closePanel = (returnFocus = true) => {
        setOpen(false);
        if (returnFocus) triggerRef.current?.focus();
    };

    // On open or when the search text changes: highlight the selected option (or the first enabled one)
    useEffect(() => {
        if (!open) return;
        const i = filtered.findIndex((o) => o.value === value && !o.disabled);
        setActive(i >= 0 ? i : filtered.findIndex((o) => !o.disabled));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, query]);

    // Move focus into the panel when it opens
    useEffect(() => {
        if (!open) return;
        (showSearch ? searchRef.current : listRef.current)?.focus();
    }, [open, showSearch]);

    // Keep the highlighted option visible while using the arrow keys
    useEffect(() => {
        if (!open || !activeId) return;
        document.getElementById(activeId)?.scrollIntoView({ block: 'nearest' });
    }, [open, activeId]);

    // Close on outside click
    useEffect(() => {
        if (!open) return;
        const onDown = (e: MouseEvent) => {
            if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', onDown);
        return () => document.removeEventListener('mousedown', onDown);
    }, [open]);

    // Close if the field becomes disabled (e.g. while the form is submitting)
    useEffect(() => {
        if (disabled) setOpen(false);
    }, [disabled]);

    /* ---------- selecting ---------- */

    const choose = (i: number) => {
        const item = filtered[i];
        if (!item || item.disabled) return;
        onChange(item.value);
        closePanel();
    };

    const move = (dir: 1 | -1) => {
        if (!filtered.length) return;
        let i = active < 0 ? (dir === 1 ? -1 : 0) : active;
        for (let n = 0; n < filtered.length; n++) {
            i = (i + dir + filtered.length) % filtered.length;
            if (!filtered[i].disabled) {
                setActive(i);
                return;
            }
        }
    };

    /* ---------- keyboard ---------- */

    const onTriggerKey = (e: KeyboardEvent<HTMLButtonElement>) => {
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            e.preventDefault();
            openPanel();
        }
    };

    const onPanelKey = (e: KeyboardEvent<HTMLDivElement>) => {
        switch (e.key) {
            case 'ArrowDown':
                e.preventDefault();
                move(1);
                break;
            case 'ArrowUp':
                e.preventDefault();
                move(-1);
                break;
            case 'Home':
            case 'End':
                // In the search box these keys move the text cursor instead
                if (showSearch) break;
                e.preventDefault();
                setActive(
                    e.key === 'Home'
                        ? filtered.findIndex((o) => !o.disabled)
                        : filtered.map((o) => !o.disabled).lastIndexOf(true),
                );
                break;
            case 'Enter':
                e.preventDefault();
                choose(active);
                break;
            case 'Escape':
                e.preventDefault();
                e.stopPropagation();
                closePanel();
                break;
            case 'Tab':
                closePanel(false);
                break;
        }
    };

    /* ---------- styles ---------- */

    const triggerBorder = error
        ? 'border-red-500 focus-visible:ring-2 focus-visible:ring-red-500/30'
        : open
          ? 'border-primary-500 ring-2 ring-primary-500/30'
          : 'border-gray-300 focus-visible:border-primary-500 focus-visible:ring-2 focus-visible:ring-primary-500/30 dark:border-gray-700';

    const showClear = clearable && value !== '' && !disabled;

    return (
        <FormField id={selectId} label={label} error={error} hint={hint} required={required} className={className}>
            <div className="relative" ref={rootRef}>
                {name && <input type="hidden" name={name} value={value} />}

                <button
                    ref={triggerRef}
                    id={selectId}
                    type="button"
                    role="combobox"
                    aria-haspopup="listbox"
                    aria-expanded={open}
                    aria-controls={open ? listId : undefined}
                    aria-invalid={!!error}
                    aria-describedby={describedBy(selectId, error, hint)}
                    aria-required={required}
                    autoFocus={autoFocus}
                    disabled={disabled}
                    onClick={() => (open ? closePanel() : openPanel())}
                    onKeyDown={onTriggerKey}
                    className={`flex w-full cursor-pointer items-center gap-2 rounded-lg border bg-white py-2 pl-3 text-left text-sm shadow-sm transition focus:outline-none disabled:cursor-not-allowed disabled:opacity-60 dark:bg-gray-900 ${
                        showClear ? 'pr-16' : 'pr-9'
                    } ${triggerBorder} ${inputClassName ?? ''}`}
                >
                    <span
                        className={`min-w-0 flex-1 truncate ${
                            selected
                                ? 'text-gray-900 dark:text-gray-100'
                                : 'text-gray-400 dark:text-gray-500'
                        }`}
                    >
                        {selected ? selected.text : (placeholder ?? t('Select an option'))}
                    </span>
                </button>

                {/* Right-side adornments sit outside the button (buttons cannot be nested) */}
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center gap-1 pr-2.5">
                    {error && <AlertCircle aria-hidden="true" className="size-4 text-red-500" />}
                    {showClear && (
                        <button
                            type="button"
                            aria-label={t('Clear')}
                            onClick={() => {
                                onChange('');
                                triggerRef.current?.focus();
                            }}
                            className="pointer-events-auto grid size-6 place-items-center rounded-md text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 dark:hover:bg-white/10 dark:hover:text-gray-200"
                        >
                            <X className="size-3.5" />
                        </button>
                    )}
                    <ChevronDown
                        aria-hidden="true"
                        className={`size-4 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
                    />
                </div>

                {open && (
                    <div
                        onKeyDown={onPanelKey}
                        className={`absolute left-0 z-30 w-full min-w-48 overflow-hidden rounded-xl bg-white shadow-xl ring-1 ring-gray-950/5 dark:bg-gray-900 dark:ring-white/10 ${
                            openUp ? 'bottom-full mb-2' : 'top-full mt-2'
                        }`}
                    >
                        {showSearch && (
                            <div className="relative border-b border-gray-200 p-2 dark:border-gray-800">
                                <Search
                                    aria-hidden="true"
                                    className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-gray-400"
                                />
                                <input
                                    ref={searchRef}
                                    type="text"
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder={searchPlaceholder ?? t('Search')}
                                    aria-label={searchPlaceholder ?? t('Search')}
                                    aria-controls={listId}
                                    aria-activedescendant={activeId}
                                    autoComplete="off"
                                    className="w-full rounded-lg bg-gray-50 py-1.5 pl-8 pr-3 text-sm text-gray-900 outline-none placeholder:text-gray-400 focus:ring-2 focus:ring-primary-500/40 dark:bg-white/5 dark:text-gray-100 dark:placeholder:text-gray-500"
                                />
                            </div>
                        )}

                        <ul
                            ref={listRef}
                            id={listId}
                            role="listbox"
                            aria-label={label}
                            aria-activedescendant={showSearch ? undefined : activeId}
                            tabIndex={showSearch ? -1 : 0}
                            className="max-h-60 overflow-y-auto p-1 outline-none"
                        >
                            {filtered.length === 0 && (
                                <li
                                    role="presentation"
                                    className="px-3 py-6 text-center text-sm text-gray-500 dark:text-gray-400"
                                >
                                    {noResultsText ?? t('No results')}
                                </li>
                            )}

                            {filtered.map((o, i) => {
                                const isSelected = o.value === value;
                                const isActive = i === active;

                                return (
                                    <li
                                        key={o.value}
                                        id={`${selectId}-opt-${i}`}
                                        role="option"
                                        aria-selected={isSelected}
                                        aria-disabled={o.disabled}
                                        onMouseEnter={() => !o.disabled && setActive(i)}
                                        onMouseDown={(e) => e.preventDefault()}
                                        onClick={() => choose(i)}
                                        className={`flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm ${
                                            o.disabled
                                                ? 'cursor-not-allowed text-gray-300 dark:text-gray-600'
                                                : 'cursor-pointer text-gray-900 dark:text-gray-100'
                                        } ${isActive && !o.disabled ? 'bg-gray-100 dark:bg-white/10' : ''} ${
                                            isSelected ? 'font-medium' : ''
                                        }`}
                                    >
                                        <span className="truncate">{o.text}</span>
                                        {isSelected && (
                                            <Check
                                                aria-hidden="true"
                                                className="size-4 shrink-0 text-primary-600 dark:text-primary-400"
                                            />
                                        )}
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                )}
            </div>
        </FormField>
    );
}