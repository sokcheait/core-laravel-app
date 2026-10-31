import { useState } from 'react';
import { router } from '@inertiajs/react';
import type { TableState } from './types';

export type VisitPatch = Partial<TableState> & { page?: number };

export default function useTableQuery(url: string, state: TableState) {
    const [loading, setLoading] = useState(false);

    const visit = (patch: VisitPatch) => {
        const next = { ...state, ...patch };

        const query: Record<string, unknown> = {
            sort: next.sort,
            direction: next.direction,
            per_page: next.per_page,
        };

        if (next.search) query.search = next.search;

        const active = Object.fromEntries(Object.entries(next.filters).filter(([, v]) => v));
        if (Object.keys(active).length) query.filter = active;

        if (patch.page && patch.page > 1) query.page = patch.page;

        router.get(url, query, {
            preserveState: true,
            preserveScroll: true,
            replace: true,
            onStart: () => setLoading(true),
            onFinish: () => setLoading(false),
        });
    };

    return { visit, loading };
}