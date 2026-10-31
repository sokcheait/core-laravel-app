import { useEffect, useId, useRef, useState, type InputHTMLAttributes, type ReactNode } from 'react';
import { AlertCircle, Loader2, X, type LucideIcon } from 'lucide-react';
import useT from '@/hooks/useT';
import FormField from './FormField';
import { describedBy, shellClass } from './styles';

type Size = 'sm' | 'md' | 'lg';

const SIZES: Record<Size, { input: string; icon: string; addon: string }> = {
    sm: { input: 'py-1.5 text-xs', icon: 'size-3.5', addon: 'px-2.5 text-xs' },
    md: { input: 'py-2 text-sm', icon: 'size-4', addon: 'px-3 text-sm' },
    lg: { input: 'py-2.5 text-base', icon: 'size-5', addon: 'px-3.5 text-base' },
};

export interface TextInputProps
    extends Omit<
        InputHTMLAttributes<HTMLInputElement>,
        'onChange' | 'value' | 'className' | 'size' | 'prefix'
    > {
    label?: string;
    value: string;
    onChange: (value: string) => void;
    /** Grey text shown while the field is empty, e.g. "name@example.com". */
    placeholder?: string;
    error?: string;
    hint?: string;
    /** Wrapper classes (layout), e.g. "sm:col-span-2". */
    className?: string;
    /** Extra classes for the <input> itself. */
    inputClassName?: string;

    /** Field height / text size. */
    size?: Size;
    /** Leading icon, e.g. `icon={Mail}`. */
    icon?: LucideIcon;
    /** Text addon before the field, e.g. "https://". */
    prefix?: ReactNode;
    /** Text addon after the field, e.g. "kg" or "@company.com". */
    suffix?: ReactNode;
    /** Show an X button to empty the field. */
    clearable?: boolean;
    /** Show a spinner (e.g. while checking if an email is taken). */
    loading?: boolean;
    /** Show "12/100" counter. Needs `maxLength`. */
    showCount?: boolean;
    /** Custom element inside the field, on the right (used by PasswordInput). */
    trailing?: ReactNode;
    /**
     * Hide the error as soon as the user edits the field. It comes back when the
     * form is submitted again and the server still reports an error. Default: true.
     */
    autoClearError?: boolean;
}

export default function TextInput({
    id,
    label,
    value,
    onChange,
    placeholder,
    error,
    hint,
    className,
    inputClassName,
    type = 'text',
    required,
    disabled,
    size = 'md',
    icon: Icon,
    prefix,
    suffix,
    clearable,
    loading,
    showCount,
    trailing,
    maxLength,
    autoClearError = true,
    ...rest
}: TextInputProps) {
    const { t } = useT();
    const autoId = useId();
    const inputId = id ?? autoId;
    const inputRef = useRef<HTMLInputElement>(null);
    const s = SIZES[size];

    // True once the user has edited the field since the current error arrived.
    const [dismissed, setDismissed] = useState(false);
    const visibleError = autoClearError && dismissed ? undefined : error;

    // A new / different error from the server shows again.
    useEffect(() => {
        setDismissed(false);
    }, [error]);

    // Submitting the form again re-shows the error (covers the case where the
    // server returns the exact same message, so `error` itself never changes).
    useEffect(() => {
        const form = inputRef.current?.form;

        if (!form) return;

        const reset = () => setDismissed(false);

        form.addEventListener('submit', reset);

        return () => form.removeEventListener('submit', reset);
    }, []);

    const handleChange = (next: string) => {
        if (autoClearError && error) setDismissed(true);

        onChange(next);
    };

    const addon =
        `flex items-center border-gray-300 bg-gray-50 text-gray-500 dark:border-gray-700 dark:bg-white/5 dark:text-gray-400 ${s.addon}`;

    const showClear = clearable && value !== '' && !disabled;
    const showCounter = showCount && maxLength !== undefined;

    return (
        <FormField id={inputId} label={label} error={visibleError} hint={hint} required={required} className={className}>
            <div
                className={shellClass(!!visibleError, disabled)}
                onMouseDown={(e) => {
                    // Clicking padding / icons focuses the input, but not buttons or the input itself
                    if (e.target === inputRef.current || (e.target as HTMLElement).closest('button')) return;
                    e.preventDefault();
                    inputRef.current?.focus();
                }}
            >
                {prefix != null && <span className={`${addon} border-r`}>{prefix}</span>}

                {Icon && (
                    <span className="flex items-center pl-3 text-gray-400 dark:text-gray-500" aria-hidden="true">
                        <Icon className={s.icon} />
                    </span>
                )}

                <input
                    {...rest}
                    ref={inputRef}
                    id={inputId}
                    type={type}
                    value={value}
                    placeholder={placeholder}
                    disabled={disabled}
                    required={required}
                    maxLength={maxLength}
                    onChange={(e) => handleChange(e.target.value)}
                    aria-invalid={!!visibleError}
                    aria-describedby={describedBy(inputId, visibleError, hint)}
                    className={`min-w-0 flex-1 bg-transparent text-gray-900 outline-none placeholder:text-gray-400 disabled:cursor-not-allowed dark:text-gray-100 dark:placeholder:text-gray-500 ${
                        Icon ? 'pl-2.5 pr-3' : 'px-3'
                    } ${s.input} ${inputClassName ?? ''}`}
                />

                {(loading || showClear || showCounter || visibleError || trailing) && (
                    <span className="flex items-center gap-1.5 pr-2.5">
                        {loading && (
                            <Loader2
                                aria-hidden="true"
                                className={`${s.icon} animate-spin text-gray-400`}
                            />
                        )}

                        {showCounter && (
                            <span
                                className={`text-xs tabular-nums ${
                                    value.length >= Number(maxLength)
                                        ? 'text-amber-600 dark:text-amber-400'
                                        : 'text-gray-400 dark:text-gray-500'
                                }`}
                            >
                                {value.length}/{maxLength}
                            </span>
                        )}

                        {showClear && (
                            <button
                                type="button"
                                aria-label={t('Clear')}
                                onClick={() => {
                                    handleChange('');
                                    inputRef.current?.focus();
                                }}
                                className="grid size-6 place-items-center rounded-md text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 dark:hover:bg-white/10 dark:hover:text-gray-200"
                            >
                                <X className="size-3.5" />
                            </button>
                        )}

                        {visibleError && (
                            <AlertCircle
                                aria-hidden="true"
                                className={`${s.icon} text-red-500`}
                            />
                        )}

                        {trailing}
                    </span>
                )}

                {suffix != null && <span className={`${addon} border-l`}>{suffix}</span>}
            </div>
        </FormField>
    );
}