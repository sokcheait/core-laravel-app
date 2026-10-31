import { useEffect } from 'react';

interface Props {
    open: boolean;
    title: string;
    description: string;
    confirmLabel?: string;
    danger?: boolean;
    processing?: boolean;
    onConfirm: () => void;
    onCancel: () => void;
}

export default function ConfirmModal({
    open,
    title,
    description,
    confirmLabel = 'Confirm',
    danger = false,
    processing = false,
    onConfirm,
    onCancel,
}: Props) {
    useEffect(() => {
        if (!open) return;
        const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onCancel();
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [open, onCancel]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-50 grid place-items-center bg-gray-950/50 p-4" onClick={onCancel}>
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="confirm-title"
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-md rounded-xl bg-white p-6 shadow-xl ring-1 ring-gray-950/5 dark:bg-gray-900 dark:ring-white/10"
            >
                <h2 id="confirm-title" className="text-lg font-semibold">
                    {title}
                </h2>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{description}</p>

                <div className="mt-6 flex justify-end gap-2">
                    <button
                        type="button"
                        autoFocus
                        onClick={onCancel}
                        className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-white/5"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        disabled={processing}
                        onClick={onConfirm}
                        className={`rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-60 ${
                            danger ? 'bg-red-600 hover:bg-red-500' : 'bg-primary-600 hover:bg-primary-500'
                        }`}
                    >
                        {processing ? 'Working…' : confirmLabel}
                    </button>
                </div>
            </div>
        </div>
    );
}