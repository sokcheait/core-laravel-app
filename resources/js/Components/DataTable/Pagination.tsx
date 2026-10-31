import { ReactNode } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Props {
    currentPage: number;
    lastPage: number;
    summary: string;
    perPageLabel: string;
    perPage: number;
    perPageOptions: number[];
    onPage: (page: number) => void;
    onPerPage: (perPage: number) => void;
}

function pageRange(current: number, last: number): (number | '…')[] {
    const pages = new Set([1, last, current - 1, current, current + 1].filter((p) => p >= 1 && p <= last));
    const sorted = [...pages].sort((a, b) => a - b);
    const out: (number | '…')[] = [];
    let prev = 0;

    for (const p of sorted) {
        if (p - prev > 1) out.push('…');
        out.push(p);
        prev = p;
    }
    return out;
}

function PageButton({
    children,
    label,
    active = false,
    disabled = false,
    onClick,
}: {
    children: ReactNode;
    label: string;
    active?: boolean;
    disabled?: boolean;
    onClick: () => void;
}) {
    return (
        <button
            type="button"
            aria-label={label}
            aria-current={active ? 'page' : undefined}
            disabled={disabled}
            onClick={onClick}
            className={`grid h-8 min-w-8 place-items-center rounded-lg px-2 text-sm ${
                active
                    ? 'bg-primary-500 font-semibold text-white'
                    : 'text-gray-700 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-40 dark:text-gray-200 dark:hover:bg-white/5'
            }`}
        >
            {children}
        </button>
    );
}

export default function Pagination({
    currentPage,
    lastPage,
    summary,
    perPageLabel,
    perPage,
    perPageOptions,
    onPage,
    onPerPage,
}: Props) {
    return (
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 p-4 text-sm dark:border-white/10">
            <p className="text-gray-500">{summary}</p>

            <label className="flex px-2 items-center overflow-hidden rounded-lg border border-gray-300 shadow-sm dark:border-gray-700">
                <span className="border-r border-gray-300 px-1 py-1.5 text-gray-600 dark:border-gray-700 dark:bg-white/5 dark:text-gray-300">
                    {perPageLabel}
                </span>
                <select
                    value={perPage}
                    onChange={(e) => onPerPage(Number(e.target.value))}
                    className="bg-white px-3 py-1.5 outline-none dark:bg-gray-950"
                >
                    {perPageOptions.map((n) => (
                        <option key={n} value={n}>
                            {n}
                        </option>
                    ))}
                </select>
            </label>

            {lastPage > 1 ? (
                <nav aria-label="Pagination" className="flex items-center gap-1">
                    <PageButton
                        label="Previous page"
                        disabled={currentPage === 1}
                        onClick={() => onPage(currentPage - 1)}
                    >
                        <ChevronLeft className="size-4" />
                    </PageButton>

                    {pageRange(currentPage, lastPage).map((p, i) =>
                        p === '…' ? (
                            <span key={`gap-${i}`} className="px-2 text-gray-400">
                                …
                            </span>
                        ) : (
                            <PageButton
                                key={p}
                                label={`Page ${p}`}
                                active={p === currentPage}
                                onClick={() => onPage(p)}
                            >
                                {p}
                            </PageButton>
                        ),
                    )}

                    <PageButton
                        label="Next page"
                        disabled={currentPage === lastPage}
                        onClick={() => onPage(currentPage + 1)}
                    >
                        <ChevronRight className="size-4" />
                    </PageButton>
                </nav>
            ) : (
                <span className="hidden sm:block sm:w-24" aria-hidden="true" />
            )}
        </div>
    );
}