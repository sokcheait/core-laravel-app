import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Check, ChevronDown, Search } from 'lucide-react';
import 'flag-icons/css/flag-icons.min.css';

export interface Country {
    /** ISO 3166-1 alpha-2 code, e.g. "KH" */
    iso: string;
    name: string;
    /** Dial code digits without "+", e.g. "855" */
    dial: string;
    /** Max digits of the national number (after dropping the leading 0) */
    maxDigits: number;
}

export const COUNTRIES: Country[] = [
    { iso: 'KH', name: 'Cambodia', dial: '855', maxDigits: 9 },
    { iso: 'VN', name: 'Vietnam', dial: '84', maxDigits: 10 },
    { iso: 'LA', name: 'Laos', dial: '856', maxDigits: 10 },
    { iso: 'MY', name: 'Malaysia', dial: '60', maxDigits: 10 },
    { iso: 'SG', name: 'Singapore', dial: '65', maxDigits: 8 },
    { iso: 'ID', name: 'Indonesia', dial: '62', maxDigits: 12 },
    { iso: 'PH', name: 'Philippines', dial: '63', maxDigits: 10 },
    { iso: 'CN', name: 'China', dial: '86', maxDigits: 11 },
    { iso: 'JP', name: 'Japan', dial: '81', maxDigits: 10 },
    { iso: 'KR', name: 'South Korea', dial: '82', maxDigits: 10 },
    { iso: 'IN', name: 'India', dial: '91', maxDigits: 10 },
    { iso: 'AU', name: 'Australia', dial: '61', maxDigits: 9 },
    { iso: 'GB', name: 'United Kingdom', dial: '44', maxDigits: 10 },
    { iso: 'FR', name: 'France', dial: '33', maxDigits: 9 },
    { iso: 'DE', name: 'Germany', dial: '49', maxDigits: 11 },
    { iso: 'US', name: 'United States', dial: '1', maxDigits: 10 },
];

interface PhoneInputProps {
    label?: string;
    /** Full international number, e.g. "+85512345678". Empty string when no number is entered. */
    value: string;
    onChange: (value: string) => void;
    error?: string;
    disabled?: boolean;
    required?: boolean;
    placeholder?: string;
    defaultCountry?: string;
    countries?: Country[];
    searchPlaceholder?: string;
    className?: string;
}

/** Flags come from the `flag-icons` package (CSS classes like `fi fi-kh`). */
function Flag({ iso }: { iso: string }) {
    return (
        <span
            aria-hidden="true"
            className={`fi fi-${iso.toLowerCase()} shrink-0 rounded-xs text-sm shadow-sm ring-1 ring-black/10`}
        />
    );
}

function formatNational(iso: string, digits: string): string {
    if (iso === 'KH') {
        return [digits.slice(0, 2), digits.slice(2, 5), digits.slice(5)].filter(Boolean).join(' ');
    }

    return (digits.match(/.{1,3}/g) ?? []).join(' ');
}

function cleanNational(raw: string, maxDigits: number): string {
    return raw.replace(/\D/g, '').replace(/^0+/, '').slice(0, maxDigits);
}

/** Find the country whose dial code prefixes "+<digits>" (longest match wins). */
function matchCountry(digits: string, countries: Country[]): Country | undefined {
    return [...countries]
        .sort((a, b) => b.dial.length - a.dial.length)
        .find((c) => digits.startsWith(c.dial));
}

export default function PhoneInput({
    label,
    value,
    onChange,
    error,
    disabled = false,
    required = false,
    placeholder = '12 345 678',
    defaultCountry = 'KH',
    countries = COUNTRIES,
    searchPlaceholder = 'Search country or code',
    className = '',
}: PhoneInputProps) {
    const id = useId();
    const rootRef = useRef<HTMLDivElement>(null);
    const searchRef = useRef<HTMLInputElement>(null);

    const fallback = countries.find((c) => c.iso === defaultCountry) ?? countries[0];
    const [selected, setSelected] = useState<Country>(fallback);
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState('');

    // Derive country + national number from the stored value when there is one.
    const { country, national } = useMemo(() => {
        const trimmed = (value ?? '').trim();

        if (trimmed.startsWith('+')) {
            const digits = trimmed.replace(/\D/g, '');
            const match = matchCountry(digits, countries);

            if (match) {
                return { country: match, national: digits.slice(match.dial.length) };
            }
        }

        // Legacy value without "+": treat as a national number of the selected country.
        return { country: selected, national: cleanNational(trimmed, selected.maxDigits) };
    }, [value, selected, countries]);

    const emit = (c: Country, digits: string) => {
        onChange(digits ? `+${c.dial}${digits}` : '');
    };

    const handleNumberChange = (raw: string) => {
        // Pasted international number: switch country automatically.
        if (raw.trim().startsWith('+')) {
            const digits = raw.replace(/\D/g, '');
            const match = matchCountry(digits, countries);

            if (match) {
                setSelected(match);
                emit(match, cleanNational(digits.slice(match.dial.length), match.maxDigits));
                return;
            }
        }

        emit(country, cleanNational(raw, country.maxDigits));
    };

    const pickCountry = (c: Country) => {
        setSelected(c);
        setOpen(false);
        setQuery('');
        // Re-emit the existing digits under the new dial code.
        emit(c, national.slice(0, c.maxDigits));
    };

    const filtered = useMemo(() => {
        const q = query.trim().toLowerCase().replace(/^\+/, '');

        if (!q) return countries;

        return countries.filter(
            (c) => c.name.toLowerCase().includes(q) || c.dial.startsWith(q) || c.iso.toLowerCase() === q,
        );
    }, [query, countries]);

    // Close on outside click / Escape; focus search when opened.
    useEffect(() => {
        if (!open) return;

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

    const ring = error
        ? 'border-red-500 focus-within:ring-red-500 dark:border-red-500'
        : 'border-gray-300 focus-within:ring-primary-500 dark:border-gray-700';

    return (
        <div ref={rootRef} className={`relative ${className}`}>
            {label && (
                <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-200">
                    {label}
                    {required && <span className="ml-0.5 text-red-500">*</span>}
                </label>
            )}

            <div
                className={`flex items-stretch rounded-lg border bg-white shadow-sm transition focus-within:ring-2 dark:bg-gray-900 ${ring} ${
                    disabled ? 'cursor-not-allowed opacity-60' : ''
                }`}
            >
                <button
                    type="button"
                    disabled={disabled}
                    onClick={() => setOpen((o) => !o)}
                    aria-haspopup="listbox"
                    aria-expanded={open}
                    aria-label={`Country: ${country.name} +${country.dial}`}
                    className="inline-flex items-center gap-2 rounded-l-lg border-r border-gray-200 px-3 text-sm text-gray-700 transition hover:bg-gray-50 focus:outline-none disabled:cursor-not-allowed dark:border-gray-800 dark:text-gray-200 dark:hover:bg-gray-800"
                >
                    <Flag iso={country.iso} />
                    <span className="tabular-nums">+{country.dial}</span>
                    <ChevronDown className={`size-4 text-gray-400 transition ${open ? 'rotate-180' : ''}`} />
                </button>

                <input
                    id={id}
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel-national"
                    value={formatNational(country.iso, national)}
                    onChange={(e) => handleNumberChange(e.target.value)}
                    placeholder={placeholder}
                    disabled={disabled}
                    required={required}
                    aria-invalid={!!error}
                    className="min-w-0 flex-1 rounded-r-lg bg-transparent px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none disabled:cursor-not-allowed dark:text-gray-100"
                />
            </div>

            {open && (
                <div className="absolute left-0 z-20 mt-1 w-72 max-w-full overflow-hidden rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900">
                    <div className="flex items-center gap-2 border-b border-gray-200 px-3 dark:border-gray-800">
                        <Search className="size-4 text-gray-400" />
                        <input
                            ref={searchRef}
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            placeholder={searchPlaceholder}
                            className="w-full bg-transparent py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none dark:text-gray-100"
                        />
                    </div>

                    <ul role="listbox" className="max-h-60 overflow-auto py-1">
                        {filtered.length === 0 && (
                            <li className="px-3 py-2 text-sm text-gray-500 dark:text-gray-400">No results</li>
                        )}

                        {filtered.map((c) => {
                            const active = c.iso === country.iso;

                            return (
                                <li key={c.iso} role="option" aria-selected={active}>
                                    <button
                                        type="button"
                                        onClick={() => pickCountry(c)}
                                        className="flex w-full items-center gap-3 px-3 py-2 text-left text-sm text-gray-700 transition hover:bg-gray-50 focus:bg-gray-50 focus:outline-none dark:text-gray-200 dark:hover:bg-gray-800 dark:focus:bg-gray-800"
                                    >
                                        <Flag iso={c.iso} />
                                        <span className="flex-1 truncate">{c.name}</span>
                                        <span className="tabular-nums text-gray-500 dark:text-gray-400">+{c.dial}</span>
                                        {active && <Check className="size-4 text-primary-600" />}
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                </div>
            )}

            {error && <p className="mt-1.5 text-xs text-red-600 dark:text-red-400">{error}</p>}
        </div>
    );
}