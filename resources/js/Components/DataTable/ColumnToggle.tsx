import { Columns3 } from 'lucide-react';
import useT from '@/hooks/useT';
import Checkbox from './Checkbox';
import Dropdown from './Dropdown';
import type { Column } from './types';

interface Props<T> {
    columns: Column<T>[];
    visible: Set<string>;
    onToggle: (key: string) => void;
    onShowAll?: () => void;
    onReset?: () => void;
}

export default function ColumnToggle<T>({ columns, visible, onToggle, onShowAll, onReset }: Props<T>) {
    const { t } = useT();
    const toggleable = columns.filter((c) => c.toggleable !== false);

    if (toggleable.length === 0) return null;

    const shownCount = toggleable.filter((c) => visible.has(c.key)).length;
    const lastVisible = visible.size <= 1; // never hide the final column
    const hiddenCount = toggleable.length - shownCount;

    return (
        <Dropdown
            width="w-64"
            trigger={(toggle) => (
                <button
                    type="button"
                    onClick={toggle}
                    aria-label={t('Toggle columns')}
                    className={`relative flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 ${
                        hiddenCount > 0
                            ? 'border-primary-500 bg-primary-50 text-primary-700 hover:bg-primary-100 dark:bg-primary-500/10 dark:text-primary-400'
                            : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-200 dark:hover:bg-white/5'
                    }`}
                >
                    <Columns3 className="size-4" />
                    <span className="text-xs tabular-nums">
                        {shownCount}/{toggleable.length}
                    </span>
                </button>
            )}
        >
            <div className="-m-1">
                <div className="flex items-center justify-between border-b border-gray-200 px-3 pb-2 pt-1 dark:border-white/10">
                    <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{t('Columns')}</p>

                    <div className="flex items-center gap-3 text-xs font-medium">
                        {onShowAll && hiddenCount > 0 && (
                            <button
                                type="button"
                                onClick={onShowAll}
                                className="text-primary-600 hover:underline dark:text-primary-400"
                            >
                                {t('Show all')}
                            </button>
                        )}
                        {onReset && (
                            <button
                                type="button"
                                onClick={onReset}
                                className="text-gray-500 hover:underline dark:text-gray-400"
                            >
                                {t('Reset')}
                            </button>
                        )}
                    </div>
                </div>

                <ul className="max-h-72 overflow-y-auto py-1">
                    {toggleable.map((c) => {
                        const checked = visible.has(c.key);
                        const disabled = checked && lastVisible;

                        return (
                            <li key={c.key}>
                                <label
                                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition ${
                                        disabled
                                            ? 'cursor-not-allowed opacity-60'
                                            : 'cursor-pointer hover:bg-gray-100 dark:hover:bg-white/5'
                                    } ${checked ? 'text-gray-900 dark:text-gray-100' : 'text-gray-500 dark:text-gray-400'}`}
                                >
                                    <Checkbox
                                        label={c.label}
                                        checked={checked}
                                        disabled={disabled}
                                        onChange={() => onToggle(c.key)}
                                    />
                                    <span className="truncate">{c.label}</span>
                                </label>
                            </li>
                        );
                    })}
                </ul>
            </div>
        </Dropdown>
    );
}