import { InputHTMLAttributes, ReactNode, useEffect, useRef } from 'react';

interface Props extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'className' | 'children' | 'size'> {
    /** Partially selected (e.g. some items of a group) */
    indeterminate?: boolean;
    size?: 'md' | 'lg';
    className?: string;
    children?: ReactNode;
}

export default function Checkbox({
    checked = false,
    indeterminate = false,
    size = 'md',
    disabled,
    className = '',
    children,
    ...rest
}: Props) {
    const ref = useRef<HTMLInputElement>(null);

    // Keep the native indeterminate state in sync (screen readers)
    useEffect(() => {
        if (ref.current) ref.current.indeterminate = indeterminate;
    }, [indeterminate]);

    const filled = checked || indeterminate;
    const box = size === 'lg' ? 'size-6 rounded-lg' : 'size-5 rounded-md';

    const draw = (visible: boolean) => ({
        strokeDasharray: 1,
        strokeDashoffset: visible ? 0 : 1,
    });

    return (
        <label
            className={`group flex select-none items-center gap-3 ${
                disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
            } ${className}`}
        >
            <input
                ref={ref}
                type="checkbox"
                checked={checked}
                disabled={disabled}
                className="peer sr-only"
                {...rest}
            />

            <span
                aria-hidden="true"
                className={`relative grid shrink-0 place-items-center border-2 transition-all duration-200 ease-out motion-reduce:transition-none
                    ${box}
                    ${
                        filled
                            ? 'border-primary-600 bg-primary-600 shadow-sm shadow-primary-500/40'
                            : 'border-gray-300 bg-white group-hover:border-primary-400 dark:border-gray-600 dark:bg-gray-950'
                    }
                    ${disabled ? '' : 'group-active:scale-90'}
                    peer-focus-visible:ring-2 peer-focus-visible:ring-primary-500 peer-focus-visible:ring-offset-2 dark:peer-focus-visible:ring-offset-gray-900`}
            >
                <svg
                    viewBox="0 0 16 16"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2.5}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className={`text-white ${size === 'lg' ? 'size-4' : 'size-3.5'}`}
                >
                    {/* Check mark draws itself */}
                    <path
                        d="M3.5 8.5l3 3 6-7"
                        pathLength={1}
                        style={draw(checked && !indeterminate)}
                        className="transition-[stroke-dashoffset] duration-300 ease-out motion-reduce:transition-none"
                    />
                    {/* Dash for the indeterminate state */}
                    <path
                        d="M4 8h8"
                        pathLength={1}
                        style={draw(indeterminate)}
                        className="transition-[stroke-dashoffset] duration-300 ease-out motion-reduce:transition-none"
                    />
                </svg>
            </span>

            {children !== undefined && <span className="min-w-0 flex-1">{children}</span>}
        </label>
    );
}