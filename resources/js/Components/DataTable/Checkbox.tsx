import { useEffect, useRef } from 'react';
import { Check, Minus } from 'lucide-react';

interface Props {
    checked: boolean;
    onChange: () => void;
    /** Accessible name. Required because the box has no visible text by itself. */
    label: string;
    indeterminate?: boolean;
    disabled?: boolean;
    size?: 'sm' | 'md';
    className?: string;
}

const sizes = {
    sm: { box: 'size-4 rounded', icon: 'size-3' },
    md: { box: 'size-5 rounded-md', icon: 'size-3.5' },
};

export default function Checkbox({
    checked,
    onChange,
    label,
    indeterminate = false,
    disabled = false,
    size = 'md',
    className = '',
}: Props) {
    const ref = useRef<HTMLInputElement>(null);
    const mixed = indeterminate && !checked;
    const filled = checked || mixed;
    const s = sizes[size];

    useEffect(() => {
        if (ref.current) ref.current.indeterminate = mixed;
    }, [mixed]);

    return (
        <span className={`relative inline-grid shrink-0 place-items-center ${className}`}>
            <input
                ref={ref}
                type="checkbox"
                checked={checked}
                disabled={disabled}
                aria-label={label}
                aria-checked={mixed ? 'mixed' : checked}
                onChange={onChange}
                className={`peer ${s.box} cursor-pointer appearance-none border transition
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-1
                    dark:focus-visible:ring-offset-gray-900
                    disabled:cursor-not-allowed disabled:opacity-40
                    ${
                        filled
                            ? 'border-primary-500 bg-primary-500'
                            : 'border-gray-300 bg-white hover:border-primary-500 dark:border-gray-600 dark:bg-gray-950'
                    }`}
            />

            {checked && (
                <Check
                    strokeWidth={3}
                    className={`pointer-events-none absolute text-white ${s.icon} ${disabled ? 'opacity-40' : ''}`}
                />
            )}
            {mixed && (
                <Minus
                    strokeWidth={3}
                    className={`pointer-events-none absolute text-white ${s.icon} ${disabled ? 'opacity-40' : ''}`}
                />
            )}
        </span>
    );
}