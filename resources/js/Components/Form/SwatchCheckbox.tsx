import { useId } from 'react';
import { Check } from 'lucide-react';
import FormField from './FormField';
import { describedBy } from './styles';

export interface SwatchOption {
    value: string;
    /** Used as tooltip and screen-reader name, and shown under the swatch with `showLabels`. */
    label: string;
    /** Any CSS color: "#ef4444", "rgb(0 0 0)", "hsl(200 80% 50%)", "transparent"... */
    color: string;
    disabled?: boolean;
}

export interface SwatchCheckboxProps {
    id?: string;
    /** Adds `name` to every checkbox so plain HTML forms submit the chosen values. */
    name?: string;
    label?: string;
    /** Selected option values. */
    value: string[];
    onChange: (value: string[]) => void;
    options: SwatchOption[];
    size?: 'sm' | 'md' | 'lg';
    shape?: 'circle' | 'square';
    /** Show each option's label under its swatch. */
    showLabels?: boolean;
    /** Maximum number of swatches that can be selected at once. */
    max?: number;
    error?: string;
    hint?: string;
    required?: boolean;
    disabled?: boolean;
    /** Wrapper classes (layout), e.g. "sm:col-span-2". */
    className?: string;
}

const SIZES = {
    sm: { box: 'size-6', icon: 'size-3.5', text: 'text-[11px]' },
    md: { box: 'size-8', icon: 'size-4', text: 'text-xs' },
    lg: { box: 'size-10', icon: 'size-5', text: 'text-xs' },
} as const;

/** Picks a readable check-mark color for the swatch background (hex colors only; others get white). */
function checkTone(color: string): string {
    const m = /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(color.trim());
    if (!m) return 'text-white';

    const hex = m[1].length === 3 ? m[1].replace(/./g, (c) => c + c) : m[1];
    const [r, g, b] = [0, 2, 4].map((i) => parseInt(hex.slice(i, i + 2), 16));
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

    return luminance > 0.65 ? 'text-gray-900' : 'text-white';
}

export default function SwatchCheckbox({
    id,
    name,
    label,
    value,
    onChange,
    options,
    size = 'md',
    shape = 'circle',
    showLabels,
    max,
    error,
    hint,
    required,
    disabled,
    className,
}: SwatchCheckboxProps) {
    const autoId = useId();
    const groupId = id ?? autoId;
    const s = SIZES[size];

    const selected = new Set(value);
    const limitReached = max !== undefined && selected.size >= max;

    const toggle = (optionValue: string, checked: boolean) => {
        const next = new Set(selected);
        if (checked) next.add(optionValue);
        else next.delete(optionValue);

        // Keep the same order as `options`
        onChange(options.filter((o) => next.has(o.value)).map((o) => o.value));
    };

    return (
        <FormField id={groupId} label={label} error={error} hint={hint} required={required} className={className}>
            <div
                id={groupId}
                role="group"
                aria-label={label}
                aria-describedby={describedBy(groupId, error, hint)}
                className="flex flex-wrap gap-3"
            >
                {options.map((o) => {
                    const checked = selected.has(o.value);
                    const isDisabled = disabled || o.disabled || (limitReached && !checked);

                    return (
                        <label
                            key={o.value}
                            title={o.label}
                            className={`group flex flex-col items-center gap-1.5 ${
                                isDisabled ? 'cursor-not-allowed opacity-40' : 'cursor-pointer'
                            }`}
                        >
                            <input
                                type="checkbox"
                                name={name}
                                value={o.value}
                                checked={checked}
                                disabled={isDisabled}
                                aria-label={o.label}
                                onChange={(e) => toggle(o.value, e.target.checked)}
                                className="peer sr-only"
                            />

                            <span
                                style={{ backgroundColor: o.color }}
                                className={`grid place-items-center border border-black/10 shadow-sm transition peer-focus-visible:ring-2 peer-focus-visible:ring-primary-500 peer-focus-visible:ring-offset-2 dark:border-white/20 dark:ring-offset-gray-900 ${s.box} ${
                                    shape === 'circle' ? 'rounded-full' : 'rounded-lg'
                                } ${
                                    checked
                                        ? 'ring-2 ring-primary-600 ring-offset-2 dark:ring-primary-400'
                                        : isDisabled
                                          ? ''
                                          : 'group-hover:scale-110'
                                }`}
                            >
                                {checked && (
                                    <Check
                                        aria-hidden="true"
                                        strokeWidth={3}
                                        className={`${s.icon} ${checkTone(o.color)}`}
                                    />
                                )}
                            </span>

                            {showLabels && (
                                <span
                                    className={`max-w-16 truncate text-gray-600 dark:text-gray-400 ${s.text} ${
                                        checked ? 'font-medium text-gray-900 dark:text-gray-100' : ''
                                    }`}
                                >
                                    {o.label}
                                </span>
                            )}
                        </label>
                    );
                })}
            </div>
        </FormField>
    );
}