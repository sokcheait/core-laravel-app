import type { ReactNode } from 'react';
import type { LucideIcon } from 'lucide-react';

export interface Column<T> {
    key: string;
    label: string;
    sortable?: boolean;
    toggleable?: boolean; // default true
    hiddenByDefault?: boolean;
    render?: (row: T) => ReactNode;
}

export interface FilterDef {
    key: string;
    label: string;
    options: { value: string; label: string }[];
}

export interface RowAction<T> {
    label: string;
    icon: LucideIcon;
    danger?: boolean;
    onClick: (row: T) => void;
}

export interface BulkAction {
    label: string;
    icon?: LucideIcon;
    danger?: boolean;
    onClick: (ids: number[], clear: () => void, ctx: BulkContext) => void;
}

export interface BulkContext {
    allMatching: boolean;
    search: string;
    filters: Record<string, string>;
}
export type ActionColor = 'primary' | 'green' | 'red' | 'blue' | 'amber' | 'gray';

/** Buttons shown in the Toolbar; the overflow goes into a "More" menu */
export interface ToolbarAction {
    label: string;
    icon?: LucideIcon;
    href?: string;
    onClick?: () => void;
    primary?: boolean;
    danger?: boolean; // same as color: 'red'
    color?: ActionColor;
    variant?: 'solid' | 'outline'; // default: solid
    /** Only show when at least one row is selected */
    selectedOnly?: boolean;
    /** Used with selectedOnly: receives the selected ids and the bulk context */
    onSelected?: (ids: number[], ctx: BulkContext) => void;
}

export interface TableState {
    search: string;
    sort: string;
    direction: 'asc' | 'desc';
    per_page: number;
    filters: Record<string, string>;
}

export interface Option {
    value: string | boolean;
    label: string;
}

export interface SearchField {
    key: string;
    label: string;
    type?: 'text' | 'date' | 'select';
    span?: 1 | 2 | 3;
    placeholder?: string;
    defaultValue?: string;
    /** Selects: false removes the empty option */
    clearable?: boolean;
    options?: Option[];
    /** Cascading select: key of the parent field */
    dependsOn?: string;
    loadOptions?: (parentValue: string) => Promise<Option[]>;
}

export interface RowMenuItem<T> {
    label: string;
    icon?: LucideIcon;
    danger?: boolean;
    hidden?: (row: T) => boolean;
    onClick: (row: T) => void;
}

export interface TableLabels {
    actions: string;
    perPage: string;
    noResults: string;
    summary: (from: number, to: number, total: number) => string;
}