import { useEffect, useRef, useState } from 'react';
import type { Paginated } from '@/types';
import BulkActionBar from './BulkActionBar';
import ColumnToggle from './ColumnToggle';
import EmptyState from './EmptyState';
import Pagination from './Pagination';
import SearchPanel, { type SearchPanelLabels } from './SearchPanel';
import Table from './Table';
import Toolbar from './Toolbar';
import useTableQuery from './useTableQuery';
import type {
    BulkAction,
    Column,
    FilterDef,
    RowAction,
    RowMenuItem,
    SearchField,
    TableLabels,
    TableState,
    ToolbarAction
} from './types';

interface Props<T extends { id: number }> {
    url: string;
    data: Paginated<T>;
    state: TableState;
    columns: Column<T>[];

    /* Toolbar mode: live search + inline filters */
    filters?: FilterDef[];
    searchPlaceholder?: string;
    toolbarActions?: ToolbarAction[];
    maxVisibleActions?: number;

    /* Panel mode: form with a Search button. Takes over from the toolbar. */
    searchFields?: SearchField[];
    searchLabels?: Partial<SearchPanelLabels>;

    rowActions?: RowAction<T>[];
    rowMenu?: RowMenuItem<T>[];
    bulkActions?: BulkAction[];
    selectable?: boolean;
    isSelectable?: (row: T) => boolean;

    perPageOptions?: number[];
    emptyHeading?: string;
    labels?: Partial<TableLabels>;
}

const defaultLabels: TableLabels = {
    actions: 'Actions',
    perPage: 'Per page',
    noResults: 'No results',
    summary: (from, to, total) => `Showing ${from} to ${to} of ${total} results`,
};

export default function DataTable<T extends { id: number }>({
    url,
    data,
    state,
    columns,
    filters = [],
    searchPlaceholder = 'Search',
    toolbarActions = [],
    maxVisibleActions = 2,
    searchFields = [],
    searchLabels,
    rowActions = [],
    rowMenu = [],
    bulkActions = [],
    selectable,
    isSelectable = () => true,
    perPageOptions = [10, 25, 50],
    emptyHeading = 'No records found',
    labels,
}: Props<T>) {
    const text = { ...defaultLabels, ...labels };
    const panelMode = searchFields.length > 0;
    const showCheckboxes = selectable ?? bulkActions.length > 0;

    const { visit, loading } = useTableQuery(url, state);

    const [search, setSearch] = useState(state.search);
    const [selected, setSelected] = useState<Set<number>>(new Set());
    const [visible, setVisible] = useState(
        () => new Set(columns.filter((c) => !c.hiddenByDefault).map((c) => c.key)),
    );
    const firstRender = useRef(true);

    /* "Select all N matching results" mode.
       Tied to the current search + filters, so it switches off by itself when they change. */
    const queryKey = JSON.stringify([state.search, state.filters]);
    const [allMatchingKey, setAllMatchingKey] = useState<string | null>(null);
    const allMatching = allMatchingKey === queryKey;

    /* Debounced search (toolbar mode) */
    useEffect(() => {
        if (firstRender.current) {
            firstRender.current = false;
            return;
        }
        const timer = setTimeout(() => visit({ search, page: 1 }), 300);
        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [search]);

    /* Selection resets when rows change, except in all-matching mode,
       where every row on the new page stays selected */
    useEffect(() => {
        setSelected(
            allMatching ? new Set(data.data.filter(isSelectable).map((r) => r.id)) : new Set(),
        );
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [data.data]);

    const selectableIds = data.data.filter(isSelectable).map((r) => r.id);
    const allSelected = selectableIds.length > 0 && selectableIds.every((id) => selected.has(id));
    const shownColumns = columns.filter((c) => visible.has(c.key));
    const filtering = state.search !== '' || Object.values(state.filters).some(Boolean);

    const clearSelection = () => {
        setAllMatchingKey(null);
        setSelected(new Set());
    };

    const toggleAll = () => {
        setAllMatchingKey(null);
        setSelected(allSelected ? new Set() : new Set(selectableIds));
    };

    const toggleRow = (id: number) => {
        setAllMatchingKey(null);
        setSelected((prev) => {
            const next = new Set(prev);
            next.has(id) ? next.delete(id) : next.add(id);
            return next;
        });
    };

    const toggleColumn = (key: string) =>
        setVisible((prev) => {
            const next = new Set(prev);
            next.has(key) ? next.delete(key) : next.add(key);
            return next;
        });

    const sortBy = (key: string) =>
        visit({
            sort: key,
            direction: state.sort === key && state.direction === 'asc' ? 'desc' : 'asc',
            page: 1,
        });

    const clearAll = () => {
        setSearch('');
        visit({ search: '', filters: {}, page: 1 });
    };

    const selectedCount = allMatching ? data.total : selected.size;

    const bulkCtx = { allMatching, search: state.search, filters: state.filters };

    const shownToolbarActions = toolbarActions
        .filter((a) => !a.selectedOnly || selectedCount > 0)
        .map((a) =>
            a.selectedOnly && a.onSelected
                ? { ...a, onClick: () => a.onSelected!([...selected], bulkCtx) }
                : a,
        );
    

    const summary =
        data.total === 0 ? text.noResults : text.summary(data.from ?? 0, data.to ?? 0, data.total);

    return (
        <div className="rounded-xl bg-white shadow-sm ring-1 ring-gray-950/5 dark:bg-gray-900 dark:ring-white/10">
            {(panelMode &&
                <SearchPanel
                    fields={searchFields}
                    values={state.filters}
                    labels={searchLabels}
                    onSearch={(values) => visit({ filters: values, page: 1 })}
                />
           )}
            <Toolbar
                search={search}
                onSearch={setSearch}
                placeholder={searchPlaceholder}
                filters={filters}
                filterValues={state.filters}
                onFilterChange={(key, value) =>
                    visit({ filters: { ...state.filters, [key]: value }, page: 1 })
                }
                actions={shownToolbarActions}
                onResetFilters={() => visit({ filters: {}, page: 1 })}
            >
                <ColumnToggle columns={columns} visible={visible} onToggle={toggleColumn} />
            </Toolbar>

            <BulkActionBar
                selectedCount={allMatching ? data.total : selected.size}
                total={data.total}
                allMatching={allMatching}
                pageFullySelected={allSelected}
                actions={bulkActions}
                onClear={clearSelection}
                onSelectPage={() => setSelected(new Set(selectableIds))}
                onSelectAllMatching={() => {
                    setSelected(new Set(selectableIds));
                    setAllMatchingKey(queryKey);
                }}
            />

            <Table
                rows={data.data}
                columns={shownColumns}
                sort={state.sort}
                direction={state.direction}
                onSort={sortBy}
                selectable={showCheckboxes}
                selected={selected}
                selectableIds={selectableIds}
                isSelectable={isSelectable}
                onToggleRow={toggleRow}
                onToggleAll={toggleAll}
                rowActions={rowActions}
                rowMenu={rowMenu}
                menuLabel={text.actions}
                loading={loading}
                emptyState={
                    <EmptyState heading={emptyHeading} showClear={filtering} onClear={clearAll} />
                }
            />

            <Pagination
                currentPage={data.current_page}
                lastPage={data.last_page}
                summary={summary}
                perPageLabel={text.perPage}
                perPage={state.per_page}
                perPageOptions={perPageOptions}
                onPage={(page) => visit({ page })}
                onPerPage={(per_page) => visit({ per_page, page: 1 })}
            />
        </div>
    );
}