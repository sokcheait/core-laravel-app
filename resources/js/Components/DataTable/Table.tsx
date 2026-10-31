import { ReactNode, useEffect, useRef } from 'react';
import { ArrowDown, ArrowUp } from 'lucide-react';
import RowActionMenu from './RowActionMenu';
import type { Column, RowAction, RowMenuItem } from './types';

interface Props<T extends { id: number }> {
    rows: T[];
    columns: Column<T>[]; // already filtered to visible columns
    sort: string;
    direction: 'asc' | 'desc';
    onSort: (key: string) => void;

    selectable: boolean;
    selected: Set<number>;
    selectableIds: number[];
    isSelectable: (row: T) => boolean;
    onToggleRow: (id: number) => void;
    onToggleAll: () => void;

    rowActions: RowAction<T>[];
    rowMenu: RowMenuItem<T>[];
    menuLabel: string;
    loading: boolean;
    emptyState: ReactNode;
}

export default function Table<T extends { id: number }>({
    rows,
    columns,
    sort,
    direction,
    onSort,
    selectable,
    selected,
    selectableIds,
    isSelectable,
    onToggleRow,
    onToggleAll,
    rowActions,
    rowMenu,
    menuLabel,
    loading,
    emptyState,
}: Props<T>) {
    const allRef = useRef<HTMLInputElement>(null);

    const allSelected = selectableIds.length > 0 && selectableIds.every((id) => selected.has(id));

    useEffect(() => {
        if (allRef.current) allRef.current.indeterminate = selected.size > 0 && !allSelected;
    }, [selected, allSelected]);

    const colSpan =
        columns.length + (selectable ? 1 : 0) + (rowActions.length ? 1 : 0) + (rowMenu.length ? 1 : 0);

    return (
        <div className="overflow-x-auto dark:border-white/10">
            <table className="w-full border-collapse text-left text-sm">
                <thead className="border-y border-gray-200 bg-gray-50 dark:border-white/10 dark:bg-white/5">
                    <tr>
                        {rowMenu.length > 0 && (
                            <th scope="col" className="w-px px-3 py-3">
                                <span className="sr-only">{menuLabel}</span>
                            </th>
                        )}

                        {selectable && (
                            <th scope="col" className="w-10 px-4 py-3">
                                {/* <input
                                    ref={allRef}
                                    type="checkbox"
                                    checked={allSelected}
                                    onChange={onToggleAll}
                                    disabled={selectableIds.length === 0}
                                    aria-label="Select all rows on this page"
                                    className="size-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                /> */}
                                <label className="group inline-flex cursor-pointer items-center justify-center">
                                    <input
                                        ref={allRef}
                                        type="checkbox"
                                        checked={allSelected}
                                        onChange={onToggleAll}
                                        disabled={selectableIds.length === 0}
                                        aria-label="Select all rows on this page"
                                        className="peer sr-only"
                                    />

                                    <span
                                        className="
                                            flex size-5 items-center justify-center
                                            rounded-md border border-gray-300 bg-white
                                            shadow-sm
                                            transition-all duration-200 ease-out
                                            group-hover:border-primary-500
                                            group-active:scale-90
                                            peer-checked:border-primary-600
                                            peer-checked:bg-primary-600
                                            peer-checked:shadow-md
                                            peer-checked:shadow-primary-500/30
                                            peer-focus-visible:ring-4
                                            peer-focus-visible:ring-primary-500/20
                                            peer-disabled:cursor-not-allowed
                                            peer-disabled:opacity-40
                                        "
                                    >
                                        <svg
                                            viewBox="0 0 20 20"
                                            fill="none"
                                            aria-hidden="true"
                                            className="
                                                size-3.5 text-white
                                                scale-50 opacity-0
                                                transition-all duration-200 ease-out
                                                group-has-[:checked]:scale-100
                                                group-has-[:checked]:opacity-100
                                            "
                                        >
                                            <path
                                                d="M4 10.5L8 14L16 6"
                                                stroke="currentColor"
                                                strokeWidth="2.5"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                            />
                                        </svg>
                                    </span>
                                </label>
                            </th>
                        )}

                        {columns.map((col) => {
                            const active = sort === col.key;
                            return (
                                <th
                                    key={col.key}
                                    scope="col"
                                    aria-sort={
                                        col.sortable
                                            ? active
                                                ? direction === 'asc'
                                                    ? 'ascending'
                                                    : 'descending'
                                                : 'none'
                                            : undefined
                                    }
                                    className="whitespace-nowrap px-4 py-3 font-semibold"
                                >
                                    {col.sortable ? (
                                        <button
                                            type="button"
                                            onClick={() => onSort(col.key)}
                                            className="flex items-center gap-1 hover:text-primary-600"
                                        >
                                            {col.label}
                                            {active &&
                                                (direction === 'asc' ? (
                                                    <ArrowUp className="size-3.5" />
                                                ) : (
                                                    <ArrowDown className="size-3.5" />
                                                ))}
                                        </button>
                                    ) : (
                                        col.label
                                    )}
                                </th>
                            );
                        })}

                        {rowActions.length > 0 && (
                            <th scope="col" className="px-4 py-3 text-right">
                                <span className="sr-only">Actions</span>
                            </th>
                        )}
                    </tr>
                </thead>

                <tbody
                    className={`divide-y divide-gray-100 transition-opacity dark:divide-white/5 ${
                        loading ? 'opacity-50' : ''
                    }`}
                >
                    {rows.length === 0 ? (
                        <tr>
                            <td colSpan={colSpan}>{emptyState}</td>
                        </tr>
                    ) : (
                        rows.map((row) => {
                            const isSelected = selected.has(row.id);
                            return (
                                <tr
                                    key={row.id}
                                    className={
                                        isSelected
                                            ? 'bg-primary-50/60 dark:bg-primary-500/10'
                                            : 'hover:bg-gray-50 dark:hover:bg-white/5'
                                    }
                                >
                                    {rowMenu.length > 0 && (
                                        <td className="px-2.5 py-1.5">
                                            <RowActionMenu row={row} items={rowMenu} label={menuLabel} />
                                        </td>
                                    )}

                                    {selectable && (
                                        <td className="px-4 py-3">
                                            {/* <input
                                                type="checkbox"
                                                checked={isSelected}
                                                disabled={!isSelectable(row)}
                                                onChange={() => onToggleRow(row.id)}
                                                aria-label={`Select row ${row.id}`}
                                                className="size-4 rounded border-gray-300 text-primary-600 focus:ring-primary-500 disabled:opacity-30"
                                            /> */}
                                            <label className="group inline-flex cursor-pointer items-center justify-center">
                                                <input
                                                    ref={allRef}
                                                    type="checkbox"
                                                    checked={isSelected}
                                                    disabled={!isSelectable(row)}
                                                    onChange={() => onToggleRow(row.id)}
                                                    aria-label={`Select row ${row.id}`}
                                                    className="peer sr-only"
                                                />

                                                <span
                                                    className="
                                                        flex size-5 items-center justify-center
                                                        rounded-md border border-gray-300 bg-white
                                                        shadow
                                                        transition-all duration-200 ease-out
                                                        group-hover:border-primary-500
                                                        group-active:scale-90
                                                        peer-checked:border-primary-600
                                                        peer-checked:bg-primary-600
                                                        peer-checked:shadow-md
                                                        peer-checked:shadow-primary-500/30
                                                        peer-focus-visible:ring-4
                                                        peer-focus-visible:ring-primary-500/20
                                                        peer-disabled:cursor-not-allowed
                                                        peer-disabled:opacity-40
                                                    "
                                                >
                                                    <svg
                                                        viewBox="0 0 20 20"
                                                        fill="none"
                                                        aria-hidden="true"
                                                        className="
                                                            size-3.5 text-white
                                                            scale-50 opacity-0
                                                            transition-all duration-200 ease-out
                                                            group-has-[:checked]:scale-100
                                                            group-has-[:checked]:opacity-100
                                                        "
                                                    >
                                                        <path
                                                            d="M4 10.5L8 14L16 6"
                                                            stroke="currentColor"
                                                            strokeWidth="2.5"
                                                            strokeLinecap="round"
                                                            strokeLinejoin="round"
                                                        />
                                                    </svg>
                                                </span>
                                            </label>
                                        </td>
                                    )}

                                    {columns.map((col) => (
                                        <td key={col.key} className="whitespace-nowrap px-4 py-3">
                                            {col.render
                                                ? col.render(row)
                                                : String((row as unknown as Record<string, unknown>)[col.key] ?? '')}
                                        </td>
                                    ))}

                                    {rowActions.length > 0 && (
                                        <td className="px-4 py-3">
                                            <div className="flex justify-end gap-1">
                                                {rowActions.map((a) => {
                                                    const Icon = a.icon;
                                                    return (
                                                        <button
                                                            key={a.label}
                                                            type="button"
                                                            title={a.label}
                                                            aria-label={a.label}
                                                            onClick={() => a.onClick(row)}
                                                            className={`rounded-lg p-2 ${
                                                                a.danger
                                                                    ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10'
                                                                    : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5'
                                                            }`}
                                                        >
                                                            <Icon className="size-4" />
                                                        </button>
                                                    );
                                                })}
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            );
                        })
                    )}
                </tbody>
            </table>
        </div>
    );
}