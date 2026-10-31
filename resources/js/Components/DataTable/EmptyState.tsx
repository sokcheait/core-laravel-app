import { SearchX } from 'lucide-react';

interface Props {
    heading: string;
    showClear: boolean;
    onClear: () => void;
}

export default function EmptyState({ heading, showClear, onClear }: Props) {
    return (
        <div className="px-4 py-16 text-center">
            <SearchX className="mx-auto size-10 text-gray-300 dark:text-gray-600" />
            <p className="mt-3 font-semibold">{heading}</p>
            {showClear && (
                <button
                    type="button"
                    onClick={onClear}
                    className="mt-2 text-sm font-medium text-primary-600 hover:underline"
                >
                    Clear search and filters
                </button>
            )}
        </div>
    );
}