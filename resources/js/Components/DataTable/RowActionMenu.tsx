import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { EllipsisVertical } from 'lucide-react';
import type { RowMenuItem } from './types';

interface Props<T> {
    row: T;
    items: RowMenuItem<T>[];
    label: string;
}

export default function RowActionMenu<T>({ row, items, label }: Props<T>) {
    const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
    const buttonRef = useRef<HTMLButtonElement>(null);
    const menuRef = useRef<HTMLDivElement>(null);

    const visible = items.filter((i) => !i.hidden?.(row));
    const close = () => setPos(null);

    const open = () => {
        if (pos) return close();
        const rect = buttonRef.current?.getBoundingClientRect();
        if (!rect) return;

        const menuHeight = visible.length * 40 + 8;
        const flip = rect.bottom + menuHeight + 8 > window.innerHeight;

        setPos({
            top: flip ? rect.top - menuHeight - 4 : rect.bottom + 4,
            left: rect.left,
        });
    };

    useEffect(() => {
        if (!pos) return;

        const onDown = (e: MouseEvent) => {
            const target = e.target as Node;
            if (!menuRef.current?.contains(target) && !buttonRef.current?.contains(target)) close();
        };
        const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close();

        window.addEventListener('mousedown', onDown);
        window.addEventListener('keydown', onKey);
        window.addEventListener('scroll', close, true);
        window.addEventListener('resize', close);
        return () => {
            window.removeEventListener('mousedown', onDown);
            window.removeEventListener('keydown', onKey);
            window.removeEventListener('scroll', close, true);
            window.removeEventListener('resize', close);
        };
    }, [pos]);

    if (visible.length === 0) return null;

    return (
        <>
            <button
                ref={buttonRef}
                type="button"
                onClick={open}
                aria-haspopup="menu"
                aria-expanded={pos !== null}
                className="flex cursor-pointer items-center gap-1 whitespace-nowrap rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-transparent dark:text-gray-200 dark:hover:bg-white/5"
            >
                <EllipsisVertical className="size-4" />
                {label}
            </button>

            {pos &&
                createPortal(
                    <div
                        ref={menuRef}
                        role="menu"
                        style={{ top: pos.top, left: pos.left }}
                        className="fixed z-50 min-w-44 rounded-xl bg-white py-1 shadow-lg ring-1 ring-gray-950/5 dark:bg-gray-900 dark:ring-white/10"
                    >
                        {visible.map((item) => {
                            const Icon = item.icon;
                            return (
                                <button
                                    key={item.label}
                                    role="menuitem"
                                    type="button"
                                    onClick={() => {
                                        close();
                                        item.onClick(row);
                                    }}
                                    className={`flex w-full cursor-pointer items-center gap-2 px-4 py-2 text-left text-sm hover:bg-gray-50 dark:hover:bg-white/5 ${
                                        item.danger ? 'text-red-600 dark:text-red-400' : ''
                                    }`}
                                >
                                    {Icon && <Icon className="size-4" />}
                                    {item.label}
                                </button>
                            );
                        })}
                    </div>,
                    document.body,
                )}
        </>
    );
}