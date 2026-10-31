import { InputHTMLAttributes } from 'react';

interface Props extends InputHTMLAttributes<HTMLInputElement> {
    label: string;
    error?: string;
}

export default function TextInput({ label, error, id, className = '', ...props }: Props) {
    const inputId = id ?? props.name;

    return (
        <div className="mb-4">
            <label
                htmlFor={inputId}
                className="mb-1 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
                {label}
            </label>
            <input
                id={inputId}
                aria-invalid={!!error}
                aria-describedby={error ? `${inputId}-error` : undefined}
                className={`block w-full rounded-lg border bg-white px-3 py-2 text-gray-900 shadow-sm outline-none
                    focus:ring-2 focus:ring-indigo-500
                    dark:bg-gray-950 dark:text-gray-100
                    ${error
                        ? 'border-red-500 focus:ring-red-500'
                        : 'border-gray-300 dark:border-gray-700'} ${className}`}
                {...props}
            />
            {error && (
                <p id={`${inputId}-error`} role="alert" className="mt-1 text-sm text-red-600 dark:text-red-400">
                    {error}
                </p>
            )}
        </div>
    );
}