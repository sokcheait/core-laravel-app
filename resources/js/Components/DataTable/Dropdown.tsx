import { ReactNode, useEffect, useRef, useState } from 'react';

interface Props {
    trigger: (toggle: () => void, open: boolean) => ReactNode;
    children: ReactNode;
    width?: string;
}

export default function Dropdown({ trigger, children, width = 'w-64' }: Props) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;

        const onDown = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);

        document.addEventListener('mousedown', onDown);
        document.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('mousedown', onDown);
            document.removeEventListener('keydown', onKey);
        };
    }, [open]);

    return (
        <div className="relative" ref={ref}>
            {trigger(() => setOpen((o) => !o), open)}
            {open && (
                <div
                    className={`absolute right-0 z-20 mt-2 ${width} rounded-xl bg-white p-4 shadow-lg ring-1 ring-gray-950/5 dark:bg-gray-900 dark:ring-white/10`}
                >
                    {children}
                </div>
            )}
        </div>
    );
}