import type { BulkAction } from './types';
import useT from '@/hooks/useT';

interface Props {
    selectedCount: number;
    total: number;
    allMatching: boolean;
    pageFullySelected: boolean;
    actions: BulkAction[];
    onClear: () => void;
    onSelectPage: () => void;
    onSelectAllMatching: () => void;
}

export default function BulkActionBar({
    selectedCount,
    total,
    allMatching,
    pageFullySelected,
    actions,
    onClear,
    onSelectPage,
    onSelectAllMatching,
}: Props) {
    const { t } = useT(); // must run before any early return

    if (selectedCount === 0 || actions.length === 0) return null;

    const fill = (key: string, count: number) => t(key).replace(':count', String(count));

    return (
        <div
            role="region"
            aria-label="Bulk actions"
            className="flex flex-wrap items-center gap-3 border-y border-gray-200 bg-primary-50 px-4 py-2 text-sm dark:border-white/10 dark:bg-primary-500/10"
        >
            <span aria-live="polite" className="font-medium">
                {allMatching ? fill('All :count selected', total) : fill(':count selected', selectedCount)}
            </span>

            <div className="ml-auto flex flex-wrap items-center gap-8">
                {!allMatching && !pageFullySelected && (
                    <button
                        type="button"
                        onClick={onSelectPage}
                        className="text-primary-600 hover:underline dark:text-primary-400"
                    >
                        {t('Select page')}
                    </button>
                )}

                {!allMatching && pageFullySelected && total > selectedCount && (
                    <button
                        type="button"
                        onClick={onSelectAllMatching}
                        className="text-primary-600 hover:underline dark:text-primary-400"
                    >
                        {fill('Select all :count', total)}
                    </button>
                )}

                <button
                    type="button"
                    onClick={onClear}
                    className="text-red-600 hover:underline dark:text-red-400"
                >
                    {t('Deselect all')}
                </button>
            </div>

            {/* Action buttons: uncomment when ready
            <div className="flex w-full flex-wrap items-center gap-2">
                {actions.map((action) => {
                    const Icon = action.icon;
                    return (
                        <button
                            key={action.label}
                            type="button"
                            onClick={() => action.onClick(selectedIds, onClear, ctx)}
                            className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                                action.danger
                                    ? 'text-red-600 hover:bg-red-100 dark:text-red-400 dark:hover:bg-red-500/10'
                                    : 'hover:bg-primary-100 dark:hover:bg-primary-500/20'
                            }`}
                        >
                            {Icon && <Icon className="size-4" />}
                            {action.label}
                        </button>
                    );
                })}
            </div>
            */}
        </div>
    );
}