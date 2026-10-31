import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
    type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { AlertTriangle, CheckCircle2, HelpCircle, Info, Loader2, Trash2 } from 'lucide-react';
import useT from '@/hooks/useT';

export type ConfirmType = 'warning' | 'danger' | 'success' | 'info' | 'question';

export interface ConfirmOptions {
    title: string;
    text?: string;
    type?: ConfirmType;
    confirmText?: string;
    cancelText?: string;
    /** false = alert-style dialog with only the OK button */
    showCancel?: boolean;
    /** User must type this exact text before the confirm button is enabled */
    requireText?: string;
    /** Runs when confirmed. The dialog shows a spinner and stays open until it finishes. */
    onConfirm?: () => void | Promise<unknown>;
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

/* Full class names so Tailwind can find them */
const styles: Record<
    ConfirmType,
    { icon: typeof Info; wrap: string; btn: string }
> = {
    warning: {
        icon: AlertTriangle,
        wrap: 'bg-amber-100 text-amber-600 dark:bg-amber-500/15 dark:text-amber-400',
        btn: 'bg-amber-500 hover:bg-amber-600 focus-visible:ring-amber-500',
    },
    danger: {
        icon: Trash2,
        wrap: 'bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-400',
        btn: 'bg-red-600 hover:bg-red-700 focus-visible:ring-red-500',
    },
    success: {
        icon: CheckCircle2,
        wrap: 'bg-green-100 text-green-600 dark:bg-green-500/15 dark:text-green-400',
        btn: 'bg-green-600 hover:bg-green-700 focus-visible:ring-green-500',
    },
    info: {
        icon: Info,
        wrap: 'bg-blue-100 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400',
        btn: 'bg-blue-600 hover:bg-blue-700 focus-visible:ring-blue-500',
    },
    question: {
        icon: HelpCircle,
        wrap: 'bg-primary-100 text-primary-600 dark:bg-primary-500/15 dark:text-primary-400',
        btn: 'bg-primary-600 hover:bg-primary-700 focus-visible:ring-primary-500',
    },
};

interface Dialog {
    options: ConfirmOptions;
    resolve: (value: boolean) => void;
}

function ConfirmDialog({ dialog, onClose }: { dialog: Dialog; onClose: (value: boolean) => void }) {
    const { t } = useT();
    const { options } = dialog;
    const type = options.type ?? 'warning';
    const s = styles[type];
    const Icon = s.icon;
    const showCancel = options.showCancel ?? true;

    const [typed, setTyped] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const panelRef = useRef<HTMLDivElement>(null);
    const cancelRef = useRef<HTMLButtonElement>(null);
    const confirmRef = useRef<HTMLButtonElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const locked = options.requireText ? typed !== options.requireText : false;

    const confirm = async () => {
        if (locked || loading) return;
        if (!options.onConfirm) return onClose(true);

        setLoading(true);
        setError(null);
        try {
            await options.onConfirm();
            onClose(true);
        } catch (e) {
            setLoading(false);
            setError(e instanceof Error && e.message ? e.message : t('Something went wrong'));
        }
    };

    /* Initial focus, scroll lock, and restore focus when closed */
    useEffect(() => {
        const previous = document.activeElement as HTMLElement | null;
        const overflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        // Danger dialogs focus the safe button (or the input) first
        if (options.requireText) inputRef.current?.focus();
        else if (type === 'danger' && showCancel) cancelRef.current?.focus();
        else confirmRef.current?.focus();

        return () => {
            document.body.style.overflow = overflow;
            previous?.focus?.();
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    /* Esc closes, Tab stays inside the dialog */
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && !loading) {
                onClose(false);
                return;
            }
            if (e.key !== 'Tab' || !panelRef.current) return;

            const focusable = panelRef.current.querySelectorAll<HTMLElement>(
                'button:not([disabled]), input:not([disabled])',
            );
            if (focusable.length === 0) return;
            const first = focusable[0];
            const last = focusable[focusable.length - 1];

            if (e.shiftKey && document.activeElement === first) {
                e.preventDefault();
                last.focus();
            } else if (!e.shiftKey && document.activeElement === last) {
                e.preventDefault();
                first.focus();
            }
        };
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [loading, onClose]);

    return createPortal(
        <div
            className="fixed inset-0 z-[200] grid place-items-center p-4"
            onMouseDown={(e) => {
                if (e.target === e.currentTarget && !loading) onClose(false);
            }}
        >
            <div className="swal-fade absolute inset-0 bg-gray-950/50 backdrop-blur-[2px]" aria-hidden="true" />

            <div
                ref={panelRef}
                role={type === 'danger' ? 'alertdialog' : 'dialog'}
                aria-modal="true"
                aria-labelledby="confirm-title"
                aria-describedby={options.text ? 'confirm-text' : undefined}
                className="swal-pop relative w-full max-w-md rounded-2xl bg-white p-6 text-center shadow-2xl ring-1 ring-gray-950/5 dark:bg-gray-900 dark:ring-white/10"
            >
                <div className={`swal-icon mx-auto grid size-16 place-items-center rounded-full ${s.wrap}`}>
                    <Icon className="size-8" />
                </div>

                <h2 id="confirm-title" className="mt-4 text-xl font-semibold text-gray-900 dark:text-gray-100">
                    {options.title}
                </h2>

                {options.text && (
                    <p id="confirm-text" className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                        {options.text}
                    </p>
                )}

                {options.requireText && (
                    <div className="mt-4 text-left">
                        <label className="block text-sm text-gray-600 dark:text-gray-300">
                            {t('Type')}{' '}
                            <span className="rounded bg-gray-100 px-1.5 py-0.5 font-mono text-xs font-semibold text-gray-900 dark:bg-white/10 dark:text-gray-100">
                                {options.requireText}
                            </span>{' '}
                            {t('to confirm')}
                            <input
                                ref={inputRef}
                                value={typed}
                                onChange={(e) => setTyped(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && confirm()}
                                autoComplete="off"
                                className="mt-2 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-primary-500 dark:border-gray-700 dark:bg-gray-950"
                            />
                        </label>
                    </div>
                )}

                {error && (
                    <p role="alert" className="mt-3 text-sm text-red-600 dark:text-red-400">
                        {error}
                    </p>
                )}

                <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-center">
                    {showCancel && (
                        <button
                            ref={cancelRef}
                            type="button"
                            disabled={loading}
                            onClick={() => onClose(false)}
                            className="rounded-lg border border-gray-300 bg-white px-5 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-950 dark:text-gray-200 dark:hover:bg-white/5"
                        >
                            {options.cancelText ?? t('Cancel')}
                        </button>
                    )}

                    <button
                        ref={confirmRef}
                        type="button"
                        disabled={locked || loading}
                        onClick={confirm}
                        className={`flex items-center justify-center gap-2 rounded-lg px-5 py-2 text-sm font-medium text-white transition focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:focus-visible:ring-offset-gray-900 ${s.btn}`}
                    >
                        {loading && <Loader2 className="size-4 animate-spin" />}
                        {options.confirmText ?? t('OK')}
                    </button>
                </div>
            </div>
        </div>,
        document.body,
    );
}

export function ConfirmProvider({ children }: { children: ReactNode }) {
    const [dialog, setDialog] = useState<Dialog | null>(null);

    const confirm = useCallback<ConfirmFn>(
        (options) =>
            new Promise<boolean>((resolve) => {
                setDialog((current) => {
                    current?.resolve(false); // a new dialog cancels the previous one
                    return { options, resolve };
                });
            }),
        [],
    );

    const close = useCallback((value: boolean) => {
        setDialog((current) => {
            current?.resolve(value);
            return null;
        });
    }, []);

    const api = useMemo(() => confirm, [confirm]);

    return (
        <ConfirmContext.Provider value={api}>
            {children}
            {dialog && <ConfirmDialog dialog={dialog} onClose={close} />}
        </ConfirmContext.Provider>
    );
}

export function useConfirm(): ConfirmFn {
    const ctx = useContext(ConfirmContext);
    if (!ctx) throw new Error('useConfirm must be used inside <ConfirmProvider>');
    return ctx;
}