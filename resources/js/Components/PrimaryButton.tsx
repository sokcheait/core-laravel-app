import { ButtonHTMLAttributes } from 'react';

export default function PrimaryButton({
    className = '',
    children,
    ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
    return (
        <button
            {...props}
            className={`w-full rounded-lg bg-indigo-600 px-4 py-2.5 font-semibold text-white transition
                hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2
                disabled:cursor-not-allowed disabled:opacity-60 dark:focus:ring-offset-gray-900 ${className}`}
        >
            {children}
        </button>
    );
}