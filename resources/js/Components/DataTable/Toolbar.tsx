import { ReactNode, useEffect, useRef, useState } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';
import type { ActionColor, FilterDef, ToolbarAction } from './types';

interface Props {
    search: string;
    onSearch: (value: string) => void;
    placeholder: string;
    filters: FilterDef[];
    filterValues: Record<string, string>;
    onFilterChange: (key: string, value: string) => void;
    onResetFilters: () => void;
    actions?: ToolbarAction[];
    maxVisibleActions?: number;
    moreLabel?: string;
    children?: ReactNode; // right-side controls (e.g. ColumnToggle)
}

const baseBtn =
    'flex items-center cursor-pointer gap-2 rounded-lg px-4 py-2 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500';

const outlineBtn =
    'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-200 dark:hover:bg-white/5';

/* Full class names must be written out so Tailwind can find them */
const solidColors: Record<ActionColor, string> = {
    primary: 'bg-primary-600 text-white hover:bg-primary-700',
    green: 'bg-green-600 text-white hover:bg-green-700',
    red: 'bg-red-600 text-white hover:bg-red-700',
    blue: 'bg-blue-600 text-white hover:bg-blue-700',
    amber: 'bg-amber-500 text-white hover:bg-amber-600',
    gray: 'bg-gray-700 text-white hover:bg-gray-800',
};

const outlineColors: Record<ActionColor, string> = {
    primary:
        'border border-primary-500 bg-white text-primary-600 hover:bg-primary-50 dark:bg-gray-950 dark:text-primary-400 dark:hover:bg-primary-500/10',
    green:
        'border border-green-500 bg-white text-green-700 hover:bg-green-50 dark:bg-gray-950 dark:text-green-400 dark:hover:bg-green-500/10',
    red: 'border border-red-500 bg-white text-red-600 hover:bg-red-50 dark:bg-gray-950 dark:text-red-400 dark:hover:bg-red-500/10',
    blue: 'border border-blue-500 bg-white text-blue-600 hover:bg-blue-50 dark:bg-gray-950 dark:text-blue-400 dark:hover:bg-blue-500/10',
    amber:
        'border border-amber-500 bg-white text-amber-600 hover:bg-amber-50 dark:bg-gray-950 dark:text-amber-400 dark:hover:bg-amber-500/10',
    gray: 'border border-gray-400 bg-white text-gray-700 hover:bg-gray-50 dark:bg-gray-950 dark:text-gray-200 dark:hover:bg-white/5',
};

const menuText: Record<ActionColor, string> = {
    primary: '!text-primary-600 dark:!text-primary-400',
    green: '!text-green-700 dark:!text-green-400',
    red: '!text-red-600 dark:!text-red-400',
    blue: '!text-blue-600 dark:!text-blue-400',
    amber: '!text-amber-600 dark:!text-amber-400',
    gray: '!text-gray-700 dark:!text-gray-200',
};

function resolveColor(a: ToolbarAction): ActionColor | undefined {
    return a.color ?? (a.danger ? 'red' : a.primary ? 'green' : undefined);
}

function ActionButton({ action }: { action: ToolbarAction }) {
    const Icon = action.icon;
    const color = resolveColor(action);
    const style = color
        ? (action.variant === 'outline' ? outlineColors : solidColors)[color]
        : outlineBtn;
    const content = (
        <>
            {Icon && <Icon className="size-4" />}
            {action.label}
        </>
    );

    return action.href ? (
        <a href={action.href} className={`${baseBtn} ${style}`}>
            {content}
        </a>
    ) : (
        <button type="button" onClick={action.onClick} className={`${baseBtn} ${style}`}>
            {content}
        </button>
    );
}

function MoreMenu({ items, label }: { items: ToolbarAction[]; label: string }) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!open) return;
        const close = (e: MouseEvent) => {
            if (!ref.current?.contains(e.target as Node)) setOpen(false);
        };
        const esc = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
        document.addEventListener('mousedown', close);
        document.addEventListener('keydown', esc);
        return () => {
            document.removeEventListener('mousedown', close);
            document.removeEventListener('keydown', esc);
        };
    }, [open]);

    const itemCls =
        'flex w-full items-center gap-2 px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 dark:text-gray-200 dark:hover:bg-white/5';

    return (
        <div ref={ref} className="relative">
            <button
                type="button"
                aria-haspopup="menu"
                aria-expanded={open}
                onClick={() => setOpen((o) => !o)}
                className={`${baseBtn} ${outlineBtn}`}
            >
                {label}
                <ChevronDown className={`size-4 transition ${open ? 'rotate-180' : ''}`} />
            </button>

            {open && (
                <div
                    role="menu"
                    className="absolute left-0 z-50 mt-2 w-56 overflow-hidden rounded-xl bg-white py-1 shadow-lg ring-1 ring-gray-950/10 dark:bg-gray-900 dark:ring-white/10"
                >
                    {items.map((item) => {
                        const Icon = item.icon;
                        const c = resolveColor(item);
                        const cls = `${itemCls} ${c ? menuText[c] : ''}`;
                        const content = (
                            <>
                                {Icon && <Icon className={`size-4 ${c ? '' : 'text-gray-400'}`} />}
                                {item.label}
                            </>
                        );
                        return item.href ? (
                            <a
                                key={item.label}
                                role="menuitem"
                                href={item.href}
                                className={cls}
                                onClick={() => setOpen(false)}
                            >
                                {content}
                            </a>
                        ) : (
                            <button
                                key={item.label}
                                type="button"
                                role="menuitem"
                                className={cls}
                                onClick={() => {
                                    setOpen(false);
                                    item.onClick?.();
                                }}
                            >
                                {content}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default function Toolbar({
    search,
    onSearch,
    placeholder,
    filters,
    filterValues,
    onFilterChange,
    onResetFilters,
    actions = [],
    maxVisibleActions = 2,
    moreLabel = 'More',
    children,
}: Props) {
    const activeCount = Object.values(filterValues).filter(Boolean).length;
    const visibleActions = actions.slice(0, maxVisibleActions);
    const overflowActions = actions.slice(maxVisibleActions);

    return (
        <div className="flex flex-wrap items-center justify-between gap-3 border border-gray-50 p-4">
            <div className="flex flex-1 flex-wrap items-center gap-2">
                {visibleActions.map((a) => (
                    <ActionButton key={a.label} action={a} />
                ))}
                {overflowActions.length > 0 && <MoreMenu items={overflowActions} label={moreLabel} />}
            </div>

            <div className="flex flex-wrap items-center gap-2">
                <div className="relative w-full sm:w-64">
                    <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400" />
                    <input
                        type="search"
                        value={search}
                        onChange={(e) => onSearch(e.target.value)}
                        placeholder={placeholder}
                        aria-label={placeholder}
                        className="block w-full rounded-lg border border-gray-300 bg-white py-1 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-950"
                    />
                </div>

                {filters.map((f) => {
                    const value = filterValues[f.key] ?? '';
                    return (
                        <select
                            key={f.key}
                            value={value}
                            aria-label={f.label}
                            onChange={(e) => onFilterChange(f.key, e.target.value)}
                            className={`rounded-lg border bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-950 ${
                                value
                                    ? 'border-primary-500 text-primary-700 dark:text-primary-400'
                                    : 'border-gray-300 text-gray-700 dark:border-gray-700 dark:text-gray-200'
                            }`}
                        >
                            <option value="">{f.label}: All</option>
                            {f.options.map((o) => (
                                <option key={o.value} value={o.value}>
                                    {o.label}
                                </option>
                            ))}
                        </select>
                    );
                })}

                {activeCount > 0 && (
                    <button
                        type="button"
                        onClick={onResetFilters}
                        className="flex items-center gap-1 rounded-lg px-2 py-2 text-sm font-medium text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-500/10"
                    >
                        <X className="size-4" />
                        Reset
                    </button>
                )}

                {children}
            </div>
        </div>
    );
}