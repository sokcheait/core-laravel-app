import { useId, type InputHTMLAttributes } from 'react';
import { describedBy } from './styles';

export interface CheckboxInputProps
    extends Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange' | 'checked' | 'type' | 'className'> {
    label: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
    error?: string;
    hint?: string;
    className?: string;
}

export default function CheckboxInput({
    id,
    label,
    checked,
    onChange,
    error,
    hint,
    className,
    ...rest
}: CheckboxInputProps) {
    const autoId = useId();
    const inputId = id ?? autoId;

    return (
        <div className={className}>
            <label
                htmlFor={inputId}
                className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300"
            >
                <input
                    {...rest}
                    id={inputId}
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => onChange(e.target.checked)}
                    aria-invalid={!!error}
                    aria-describedby={describedBy(inputId, error, hint)}
                    className="size-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 disabled:opacity-60 dark:border-gray-700 dark:bg-gray-900"
                />
                {label}
            </label>
            {hint && !error && (
                <p id={`${inputId}-hint`} className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    {hint}
                </p>
            )}
            {error && (
                <p id={`${inputId}-error`} role="alert" className="mt-1 text-xs text-red-600 dark:text-red-400">
                    {error}
                </p>
            )}
        </div>
    );
}