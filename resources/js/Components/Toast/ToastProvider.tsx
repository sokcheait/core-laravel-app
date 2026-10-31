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
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';
import useT from '@/hooks/useT';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

interface ToastItemData {
    id: number;
    type: ToastType;
    message: string;
    title?: string;
    duration: number; // ms, 0 = stays until closed
}

interface ToastOptions {
    title?: string;
    duration?: number;
}

interface ToastApi {
    show: (type: ToastType, message: string, options?: ToastOptions) => void;
    success: (message: string, options?: ToastOptions) => void;
    error: (message: string, options?: ToastOptions) => void;
    warning: (message: string, options?: ToastOptions) => void;
    info: (message: string, options?: ToastOptions) => void;
}

const ToastContext = createContext<ToastApi | null>(null);

/* Full class names so Tailwind can find them */
const styles: Record<ToastType, { icon: typeof Info; iconCls: string; bar: string; ring: string }> = {
    success: { icon: CheckCircle2, iconCls: 'text-green-500', bar: 'bg-green-500', ring: 'ring-green-500/20' },
    error: { icon: XCircle, iconCls: 'text-red-500', bar: 'bg-red-500', ring: 'ring-red-500/20' },
    warning: { icon: AlertTriangle, iconCls: 'text-amber-500', bar: 'bg-amber-500', ring: 'ring-amber-500/20' },
    info: { icon: Info, iconCls: 'text-blue-500', bar: 'bg-blue-500', ring: 'ring-blue-500/20' },
};

function ToastItem({ toast, onClose }: { toast: ToastItemData; onClose: (id: number) => void }) {
    const { t } = useT();
    const [entered, setEntered] = useState(false);
    const [paused, setPaused] = useState(false);
    const remaining = useRef(toast.duration);
    const startedAt = useRef(0);
    const s = styles[toast.type];
    const Icon = s.icon;

    /* Slide-in */
    useEffect(() => {
        const frame = requestAnimationFrame(() => setEntered(true));
        return () => cancelAnimationFrame(frame);
    }, []);

    /* Auto-dismiss; hovering pauses and resumes with the time left */
    useEffect(() => {
        if (toast.duration <= 0 || paused) return;
        startedAt.current = Date.now();
        const timer = setTimeout(() => onClose(toast.id), remaining.current);
        return () => {
            clearTimeout(timer);
            remaining.current -= Date.now() - startedAt.current;
        };
    }, [paused, toast.id, toast.duration, onClose]);

    return (
        <div
            role={toast.type === 'error' ? 'alert' : 'status'}
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
            className={`pointer-events-auto relative w-full max-w-sm overflow-hidden rounded-xl bg-white shadow-lg ring-1 ${s.ring} transition duration-300 dark:bg-gray-900 ${
                entered ? 'translate-x-0 opacity-100' : 'translate-x-6 opacity-0'
            }`}
        >
            <div className="flex items-start gap-3 p-4">
                <Icon className={`mt-0.5 size-5 shrink-0 ${s.iconCls}`} />

                <div className="min-w-0 flex-1 text-sm">
                    {toast.title && (
                        <p className="font-semibold text-gray-900 dark:text-gray-100">{toast.title}</p>
                    )}
                    <p className="break-words text-gray-600 dark:text-gray-300">{toast.message}</p>
                </div>

                <button
                    type="button"
                    onClick={() => onClose(toast.id)}
                    aria-label={t('Close')}
                    className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 dark:hover:bg-white/5 dark:hover:text-gray-200"
                >
                    <X className="size-4" />
                </button>
            </div>

            {toast.duration > 0 && (
                <div className="h-1 w-full bg-gray-100 dark:bg-white/5">
                    <div
                        className={`h-full origin-left ${s.bar}`}
                        style={{
                            animation: `toast-progress ${toast.duration}ms linear forwards`,
                            animationPlayState: paused ? 'paused' : 'running',
                        }}
                    />
                </div>
            )}
        </div>
    );
}

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<ToastItemData[]>([]);
    const nextId = useRef(1);

    const close = useCallback((id: number) => setToasts((all) => all.filter((x) => x.id !== id)), []);

    const show = useCallback((type: ToastType, message: string, options: ToastOptions = {}) => {
        setToasts((all) => {
            // Ignore an identical toast that is already on screen (also guards StrictMode double effects)
            if (all.some((x) => x.type === type && x.message === message)) return all;

            const item: ToastItemData = {
                id: nextId.current++,
                type,
                message,
                title: options.title,
                duration: options.duration ?? (type === 'error' ? 7000 : 4000),
            };
            return [...all, item].slice(-5); // keep at most 5
        });
    }, []);

    const api = useMemo<ToastApi>(
        () => ({
            show,
            success: (m, o) => show('success', m, o),
            error: (m, o) => show('error', m, o),
            warning: (m, o) => show('warning', m, o),
            info: (m, o) => show('info', m, o),
        }),
        [show],
    );

    return (
        <ToastContext.Provider value={api}>
            {children}

            <div
                aria-live="polite"
                className="pointer-events-none fixed inset-x-0 top-0 z-[100] flex flex-col items-end gap-3 p-4 sm:p-6"
            >
                {toasts.map((toast) => (
                    <ToastItem key={toast.id} toast={toast} onClose={close} />
                ))}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast(): ToastApi {
    const ctx = useContext(ToastContext);
    if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
    return ctx;
}