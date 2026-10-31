import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { AlertCircle, Check, ChevronDown, Search, X } from 'lucide-react';
import useT from '@/hooks/useT';
import FormField from './FormField';
import { describedBy, shellClass } from './styles';

export interface MultiSelectOption {
    value: string;
    label: string;
}

export interface MultiSelectInputProps {
    id?: string;
    label?: string;
    /** Selected option values. */
    value: string[];
    onChange: (value: string[]) => void;
    options: MultiSelectOption[];
    /** Shown while nothing is selected. */
    placeholder?: string;
    error?: string;
    hint?: string;
    required?: boolean;
    disabled?: boolean;
    /** Wrapper classes (layout), e.g. "sm:col-span-2". */
    className?: string;
    /** Show a search box in the dropdown. Default: only when there are more than 6 options. */
    searchable?: boolean;
    /** Hide the error as soon as the selection changes. Default: true. */
    autoClearError?: boolean;
}

export default function MultiSelectInput({
    id,
    label,
    value,
    onChange,
    options,
    placeholder,
    error,
    hint,
    required,
    disabled,
    className,
    searchable,
    autoClearError = true,
}: MultiSelectInputProps) {
    const { t } = useT();
    const autoId = useId();
    const inputId = id ?? autoId;
    const rootRef = useRef<HTMLDivElement>(null);
    const searchRef = useRef<HTMLInputElement>(null);

    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');
    const [dismissed, setDismissed] = useState(false);

    const visibleError = autoClearError && dismissed ? undefined : error;
    const showSearch = searchable ?? options.length > 6;

    useEffect(() => {
        setDismissed(false);
    }, [error]);

    const selected = useMemo(
        () =>
            value
                .map((v) => options.find((o) => o.value === v))
                .filter((o): o is MultiSelectOption => Boolean(o)),
        [value, options],
    );

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase();

        return q ? options.filter((o) => o.label.toLowerCase().includes(q)) : options;
    }, [query, options]);

    const change = (next: string[]) => {
        if (autoClearError && error) setDismissed(true);

        onChange(next);
    };

    const toggle = (v: string) => change(value.includes(v) ? value.filter((x) => x !== v) : [...value, v]);

    // Close on outside click / Escape; focus the search box when opened
    useEffect(() => {
        if (!open) {
            setQuery('');
            return;
        }

        const onPointerDown = (e: MouseEvent) => {
            if (!rootRef.current?.contains(e.target as Node)) setOpen(false);
        };
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') setOpen(false);
        };

        document.addEventListener('mousedown', onPointerDown);
        document.addEventListener('keydown', onKeyDown);
        searchRef.current?.focus();

        return () => {
            document.removeEventListener('mousedown', onPointerDown);
            document.removeEventListener('keydown', onKeyDown);
        };
    }, [open]);

    return (
        <FormField id={inputId} label={label} error={visibleError} hint={hint} required={required} className={className}>
            <div ref={rootRef} className="relative">
                <div
                    className={`${shellClass(!!visibleError, disabled)} ${disabled ? '' : 'cursor-pointer'}`}
                    onClick={() => !disabled && setOpen((o) => !o)}
                >
                    <div className="flex min-h-9.5 min-w-0 flex-1 flex-wrap items-center gap-1.5 px-3 py-1.5">
                        {selected.length === 0 && (
                            <span className="text-sm text-gray-400 dark:text-gray-500">
                                {placeholder ?? t('Select an option')}
                            </span>
                        )}

                        {selected.map((o) => (
                            <span
                                key={o.value}
                                className="inline-flex items-center gap-1 rounded-md bg-gray-100 py-0.5 pl-2 pr-1 text-xs font-medium text-gray-700 dark:bg-white/10 dark:text-gray-200"
                            >
                                {o.label}
                                {!disabled && (
                                    <button
                                        type="button"
                                        aria-label={`${t('Remove')} ${o.label}`}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            toggle(o.value);
                                        }}
                                        className="grid size-4 place-items-center rounded text-gray-400 transition hover:bg-gray-200 hover:text-gray-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 dark:hover:bg-white/10 dark:hover:text-gray-200"
                                    >
                                        <X className="size-3" />
                                    </button>
                                )}
                            </span>
                        ))}
                    </div>

                    <span className="flex items-center gap-1.5 pr-2.5">
                        {visibleError && <AlertCircle aria-hidden="true" className="size-4 text-red-500" />}

                        <button
                            type="button"
                            id={inputId}
                            disabled={disabled}
                            aria-haspopup="listbox"
                            aria-expanded={open}
                            aria-invalid={!!visibleError}
                            aria-describedby={describedBy(inputId, visibleError, hint)}
                            className="grid size-6 place-items-center rounded-md text-gray-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:cursor-not-allowed"
                        >
                            <ChevronDown className={`size-4 transition ${open ? 'rotate-180' : ''}`} />
                        </button>
                    </span>
                </div>

                {open && (
                    <div className="absolute left-0 right-0 z-20 mt-1 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900">
                        {showSearch && (
                            <div className="flex items-center gap-2 border-b border-gray-200 px-3 dark:border-gray-800">
                                <Search className="size-4 text-gray-400" />
                                <input
                                    ref={searchRef}
                                    value={query}
                                    onChange={(e) => setQuery(e.target.value)}
                                    placeholder={t('Search')}
                                    className="w-full bg-transparent py-2 text-sm text-gray-900 outline-none placeholder:text-gray-400 dark:text-gray-100"
                                />
                            </div>
                        )}

                        <ul role="listbox" aria-multiselectable="true" className="max-h-60 overflow-auto py-1">
                            {filtered.length === 0 && (
                                <li className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">{t('No results')}</li>
                            )}

                            {filtered.map((o) => {
                                const active = value.includes(o.value);

                                return (
                                    <li key={o.value} role="option" aria-selected={active}>
                                        <button
                                            type="button"
                                            onClick={() => toggle(o.value)}
                                            className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm text-gray-700 transition hover:bg-gray-50 focus:bg-gray-50 focus:outline-none dark:text-gray-200 dark:hover:bg-gray-800 dark:focus:bg-gray-800"
                                        >
                                            <span
                                                className={`grid size-4 shrink-0 place-items-center rounded border ${
                                                    active
                                                        ? 'border-primary-600 bg-primary-600 text-white'
                                                        : 'border-gray-300 dark:border-gray-600'
                                                }`}
                                            >
                                                {active && <Check className="size-3" />}
                                            </span>
                                            <span className="flex-1 truncate">{o.label}</span>
                                        </button>
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