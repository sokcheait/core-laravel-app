import { useId } from 'react';
import { describedBy } from './styles';

export interface ToggleInputProps {
    id?: string;
    label: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
    hint?: string;
    error?: string;
    disabled?: boolean;
    /** Wrapper classes (layout), e.g. "sm:col-span-2". */
    className?: string;
}

/** On/off switch. Same data shape as a checkbox: `checked` boolean in, boolean out. */
export default function ToggleInput({
    id,
    label,
    checked,
    onChange,
    hint,
    error,
    disabled,
    className,
}: ToggleInputProps) {
    const autoId = useId();
    const switchId = id ?? autoId;

    return (
        <div className={className}>
            <div className="flex items-start gap-3">
                <button
                    id={switchId}
                    type="button"
                    role="switch"
                    aria-checked={checked}
                    aria-describedby={describedBy(switchId, error, hint)}
                    disabled={disabled}
                    onClick={() => onChange(!checked)}
                    className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 dark:focus-visible:ring-offset-gray-950 ${
                        checked ? 'bg-primary-600' : 'bg-gray-300 dark:bg-gray-700'
                    } ${disabled ? '' : 'cursor-pointer'}`}
                >
                    <span
                        aria-hidden="true"
                        className={`inline-block size-5 rounded-full bg-white shadow transition-transform ${
                            checked ? 'translate-x-5.5' : 'translate-x-0.5'
                        }`}
                    />
                </button>

                <div className="min-w-0">
                    <label
                        htmlFor={switchId}
                        className={`block text-sm font-medium leading-6 text-gray-900 dark:text-gray-100 ${
                            disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'
                        }`}
                    >
                        {label}
                    </label>
                    {hint && !error && (
                        <p id={`${switchId}-hint`} className="text-xs text-gray-500 dark:text-gray-400">
                            {hint}
                        </p>
                    )}
                    {error && (
                        <p id={`${switchId}-error`} role="alert" className="text-xs text-red-600 dark:text-red-400">
                            {error}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
}