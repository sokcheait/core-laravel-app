import type { ReactNode } from 'react';

export interface FormFieldProps {
    id: string;
    label?: string;
    error?: string;
    hint?: string;
    required?: boolean;
    /** Wrapper classes, e.g. "sm:col-span-2" for grid layouts. */
    className?: string;
    children: ReactNode;
}

export default function FormField({
    id,
    label,
    error,
    hint,
    required,
    className,
    children,
}: FormFieldProps) {
    return (
        <div className={className}>
            {label && (
                <label
                    htmlFor={id}
                    className="mb-1.5 block text-xs font-medium text-gray-700 dark:text-gray-300"
                >
                    {label}
                    {required && (
                        <span className="ml-0.5 text-red-600 dark:text-red-400" aria-hidden="true">
                            *
                        </span>
                    )}
                </label>
            )}
            {children}
            {hint && !error && (
                <p id={`${id}-hint`} className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
                    {hint}
                </p>
            )}
            {error && (
                <p id={`${id}-error`} role="alert" className="mt-1.5 text-xs text-red-600 dark:text-red-400">
                    {error}
                </p>
            )}
        </div>
    );
}