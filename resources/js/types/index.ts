export type * from './auth';

export interface Paginated<T> {
    data: T[];
    current_page: number;
    last_page: number;
    from: number | null;
    to: number | null;
    total: number;
    prev_page_url: string | null;
    next_page_url: string | null;
    links: { url: string | null; label: string; active: boolean }[];
}

export interface UserRow {
    id: number;
    name: string;
    email: string;
    created_at: string;
}

export interface NotificationItem {
    id: string;
    title: string;
    body: string | null;
    url: string | null;
    type: 'info' | 'success' | 'warning' | 'danger';
    read: boolean;
    created_at: string;
}

export interface NotificationsProp {
    unread: number;
    items: NotificationItem[];
}
