import { DragEvent, useEffect, useId, useRef, useState } from 'react';
import { Upload, UploadCloud, X } from 'lucide-react';
import useT from '@/hooks/useT';

type Cols = 1 | 2 | 3;

interface BaseProps {
    label?: string;
    error?: string;
    hint?: string;
    required?: boolean;
    disabled?: boolean;
    /** Comma-separated mime types */
    accept?: string;
    /** Maximum file size in MB (per file) */
    maxSizeMB?: number;
    /** Grid span + preview size: 1 = small, 2 = medium, 3 = large */
    cols?: Cols;
}

interface SingleProps extends BaseProps {
    multiple?: false;
    /** The newly selected file (null when nothing is selected) */
    value: File | null;
    onChange: (file: File | null) => void;
    /** URL of the image already saved on the server */
    currentUrl?: string | null;
    /** Called when the user removes the saved image (e.g. set a `remove_image` flag) */
    onRemoveCurrent?: () => void;
}

interface MultiProps extends BaseProps {
    multiple: true;
    /** Newly selected files */
    value: File[];
    onChange: (files: File[]) => void;
    /** URLs of images already saved on the server */
    currentUrls?: string[];
    /** Called with the saved URL the user removed (e.g. collect ids to delete) */
    onRemoveCurrent?: (url: string) => void;
    /** Maximum number of images in total (saved + new) */
    maxFiles?: number;
}

type ImageUploadProps = SingleProps | MultiProps;

interface Item {
    key: string;
    src: string;
    name?: string;
    size?: number;
    file?: File;
    url?: string;
}

const EXIT_MS = 240;

const span: Record<Cols, string> = {
    1: 'col-span-1',
    2: 'col-span-1 sm:col-span-2',
    3: 'col-span-1 sm:col-span-2 lg:col-span-3',
};

const thumbSize: Record<Cols, string> = {
    1: 'size-9',
    2: 'size-11',
    3: 'size-14',
};

const fullHeight: Record<Cols, string> = {
    1: 'h-40',
    2: 'h-56',
    3: 'h-72',
};

const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
};

const roundButton =
    'grid size-[1.625rem] shrink-0 place-items-center rounded-full bg-[#2a2c31] text-white outline-none transition duration-200 hover:ring-2 hover:ring-white/80 focus-visible:ring-2 focus-visible:ring-white/80 active:scale-90 disabled:cursor-not-allowed disabled:opacity-60';

const css = `
@keyframes iu-in {
    from { opacity: 0; transform: translateY(10px) scale(.94); }
    to   { opacity: 1; transform: none; }
}
@keyframes iu-out {
    from { opacity: 1; transform: none; max-height: 6rem; margin-bottom: .5rem; }
    to   { opacity: 0; transform: translateX(24px) scale(.92); max-height: 0; margin-bottom: 0; }
}
@keyframes iu-out-full {
    from { opacity: 1; transform: none; }
    to   { opacity: 0; transform: scale(.94); }
}
@keyframes iu-fade {
    from { opacity: 0; }
    to   { opacity: 1; }
}
@keyframes iu-down {
    from { opacity: 0; transform: translateY(-6px); }
    to   { opacity: 1; transform: none; }
}
@keyframes iu-shake {
    10%, 90% { transform: translateX(-1px); }
    20%, 80% { transform: translateX(2px); }
    30%, 50%, 70% { transform: translateX(-4px); }
    40%, 60% { transform: translateX(4px); }
}
@keyframes iu-bounce {
    0%, 100% { transform: translateY(0); }
    50%      { transform: translateY(-5px); }
}
@keyframes iu-pulse {
    0%   { box-shadow: 0 0 0 0 rgb(99 102 241 / .35); }
    100% { box-shadow: 0 0 0 12px rgb(99 102 241 / 0); }
}
.iu-in       { animation: iu-in .38s cubic-bezier(.2,.8,.2,1) backwards; }
.iu-out      { animation: iu-out ${EXIT_MS}ms ease-in forwards; overflow: hidden; }
.iu-out-full { animation: iu-out-full ${EXIT_MS}ms ease-in forwards; }
.iu-fade     { animation: iu-fade .3s ease backwards; }
.iu-down     { animation: iu-down .25s ease backwards; }
.iu-shake    { animation: iu-shake .45s cubic-bezier(.36,.07,.19,.97); }
.iu-bounce   { animation: iu-bounce .7s ease-in-out infinite; }
.iu-pulse    { animation: iu-pulse 1.1s ease-out infinite; }
@media (prefers-reduced-motion: reduce) {
    .iu-in, .iu-out, .iu-out-full, .iu-fade, .iu-down, .iu-shake, .iu-bounce, .iu-pulse {
        animation-duration: .01ms !important;
        animation-iteration-count: 1 !important;
    }
}
`;

export default function ImageUpload(props: ImageUploadProps) {
    const {
        label,
        error,
        hint,
        required,
        disabled,
        accept = 'image/png,image/jpeg,image/webp',
        maxSizeMB = 2,
        cols = 2,
    } = props;

    const { t } = useT();
    const id = useId();
    const inputRef = useRef<HTMLInputElement>(null);
    const timers = useRef<number[]>([]);
    const [previews, setPreviews] = useState<string[]>([]);
    const [hidden, setHidden] = useState<Set<string>>(new Set());
    const [leaving, setLeaving] = useState<Set<string>>(new Set());
    const [dragging, setDragging] = useState(false);
    const [shake, setShake] = useState(false);
    const [localError, setLocalError] = useState<string | null>(null);

    const files: File[] = props.multiple ? props.value : props.value ? [props.value] : [];
    const savedUrls: string[] = props.multiple ? (props.currentUrls ?? []) : props.currentUrl ? [props.currentUrl] : [];
    const savedKey = savedUrls.join('\n');

    // Clear pending exit timers on unmount
    useEffect(() => {
        const list = timers.current;
        return () => list.forEach((tid) => window.clearTimeout(tid));
    }, []);

    // Show saved images again if the server list changes (e.g. after saving)
    useEffect(() => {
        setHidden(new Set());
    }, [savedKey]);

    // Build / revoke preview URLs whenever the selected files change
    useEffect(() => {
        const list = props.value ? (Array.isArray(props.value) ? props.value : [props.value]) : [];
        const urls = list.map((f) => URL.createObjectURL(f));
        setPreviews(urls);
        return () => urls.forEach((u) => URL.revokeObjectURL(u));
    }, [props.value]);

    const savedItems: Item[] = savedUrls
        .filter((u) => !hidden.has(u))
        .map((u) => ({ key: `url-${u}`, src: u, url: u }));

    const fileItems: Item[] = files.flatMap((f, i) =>
        previews[i]
            ? [{ key: `file-${i}-${f.name}-${f.lastModified}`, src: previews[i], name: f.name, size: f.size, file: f }]
            : [],
    );

    // Single: a new file wins over the saved image. Multiple: saved first, then new.
    const items: Item[] = props.multiple
        ? [...savedItems, ...fileItems]
        : fileItems.length
          ? fileItems
          : savedItems.slice(0, 1);

    const single = !props.multiple ? items[0] : undefined;
    const maxFiles = props.multiple ? props.maxFiles : undefined;
    const limitReached = !!maxFiles && items.length >= maxFiles;
    const canAdd = !disabled && !limitReached;

    const message = error ?? localError ?? undefined;
    const types = accept.split(',').map((s) => s.trim());
    const formats = types.map((m) => m.replace('image/', '').toUpperCase().replace('JPEG', 'JPG')).join(', ');

    const fail = (msg: string | null) => {
        setLocalError(msg);
        if (msg) {
            setShake(true);
            timers.current.push(window.setTimeout(() => setShake(false), 450));
        }
    };

    const pick = (list: FileList | null) => {
        if (!list || !canAdd) return;

        const incoming = Array.from(list).slice(0, props.multiple ? undefined : 1);
        const valid: File[] = [];
        let problem: string | null = null;

        for (const file of incoming) {
            if (!types.includes(file.type)) {
                problem = t('Please choose a valid image file');
            } else if (file.size > maxSizeMB * 1024 * 1024) {
                problem = `${t('Image must be smaller than')} ${maxSizeMB} MB`;
            } else {
                valid.push(file);
            }
        }

        if (props.multiple && valid.length) {
            let next = [...props.value, ...valid];
            if (maxFiles) {
                const room = Math.max(maxFiles - savedItems.length, 0);
                if (next.length > room) {
                    next = next.slice(0, room);
                    problem = `${t('Maximum number of images')}: ${maxFiles}`;
                }
            }
            props.onChange(next);
        } else if (!props.multiple && valid.length) {
            props.onChange(valid[0]);
        }

        fail(problem);
    };

    const open = () => canAdd && inputRef.current?.click();

    const onDrop = (e: DragEvent) => {
        e.preventDefault();
        setDragging(false);
        pick(e.dataTransfer.files);
    };

    const remove = (item: Item) => {
        setLocalError(null);

        if (props.multiple) {
            if (item.file) {
                props.onChange(props.value.filter((f) => f !== item.file));
            } else if (item.url) {
                const url = item.url;
                setHidden((prev) => new Set(prev).add(url));
                props.onRemoveCurrent?.(url);
            }
            return;
        }

        props.onChange(null);
        if (props.currentUrl) {
            setHidden(new Set([props.currentUrl]));
            props.onRemoveCurrent?.();
        }
    };

    // Always call the latest `remove` from the delayed exit
    const removeRef = useRef(remove);
    removeRef.current = remove;

    // Play the exit animation first, then actually remove
    const requestRemove = (item: Item) => {
        if (leaving.has(item.key)) return;
        setLeaving((prev) => new Set(prev).add(item.key));
        timers.current.push(
            window.setTimeout(() => {
                removeRef.current(item);
                setLeaving((prev) => {
                    const next = new Set(prev);
                    next.delete(item.key);
                    return next;
                });
            }, EXIT_MS),
        );
    };

    const ring = message ? 'ring-red-500' : dragging ? 'ring-primary-500' : 'ring-transparent';
    const showFull = !props.multiple && !!single;

    const dropLabel = (
        <button
            type="button"
            onClick={open}
            disabled={!canAdd}
            className="flex min-h-[5.5rem] w-full cursor-pointer flex-col items-center justify-center rounded-2xl px-4 py-6 text-center text-sm text-[#4f4f4f] outline-none transition-colors hover:text-gray-900 focus-visible:ring-2 focus-visible:ring-primary-500 disabled:cursor-not-allowed dark:text-gray-300 dark:hover:text-white"
        >
            {dragging ? (
                <span key="drop" className="iu-fade flex flex-col items-center gap-1 font-medium">
                    <UploadCloud className="iu-bounce size-6 text-primary-500" />
                    {t('Drop to upload')}
                </span>
            ) : (
                <span key="idle" className="iu-fade flex flex-col items-center">
                    <span>
                        {t('Drag & Drop your files or')}{' '}
                        <span className="underline decoration-[#a7a4a4] underline-offset-2 transition-colors hover:decoration-current">
                            {t('Browse')}
                        </span>
                    </span>
                    <span className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        {formats} {t('up to')} {maxSizeMB} MB
                        {maxFiles ? ` · ${items.length}/${maxFiles}` : ''}
                    </span>
                </span>
            )}
        </button>
    );

    return (
        <div className={span[cols]}>
            <style>{css}</style>

            {label && (
                <label htmlFor={id} className="mb-2 block text-sm font-medium text-gray-900 dark:text-gray-100">
                    {label}
                    {required && (
                        <span className="ml-0.5 text-red-500" aria-hidden="true">
                            *
                        </span>
                    )}
                </label>
            )}

            {/* FilePond panel */}
            <div
                onDragOver={(e) => {
                    e.preventDefault();
                    if (canAdd) setDragging(true);
                }}
                onDragLeave={(e) => {
                    // Ignore leave events fired when moving over child elements
                    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setDragging(false);
                }}
                onDrop={onDrop}
                className={`rounded-3xl bg-[#ecf0f5] ring-2 transition duration-300 dark:bg-white/5 ${ring} ${
                    dragging ? 'iu-pulse scale-[1.015]' : ''
                } ${shake ? 'iu-shake' : ''} ${
                    showFull ? 'p-2.5' : 'px-4 pb-2 pt-2'
                } ${disabled ? 'opacity-60' : ''}`}
            >
                {showFull && single ? (
                    /* ---------- SINGLE: full preview ---------- */
                    <div
                        key={single.key}
                        className={`group relative overflow-hidden rounded-2xl bg-[#5b5e68] ${
                            leaving.has(single.key) ? 'iu-out-full' : 'iu-in'
                        }`}
                    >
                        <button
                            type="button"
                            onClick={open}
                            disabled={disabled}
                            aria-label={t('Change photo')}
                            className="block w-full overflow-hidden outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-white disabled:cursor-not-allowed"
                        >
                            <img
                                src={single.src}
                                alt={t('Image preview')}
                                className={`w-full object-contain transition-transform duration-500 ease-out group-hover:scale-105 ${fullHeight[cols]}`}
                            />
                        </button>

                        {single.name && (
                            <div className="iu-down pointer-events-none absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent px-3 pb-2 pt-6 text-white">
                                <p className="truncate text-sm font-semibold leading-tight">{single.name}</p>
                                {single.size !== undefined && (
                                    <p className="mt-0.5 text-xs font-semibold leading-tight text-white/60">
                                        {formatBytes(single.size)}
                                    </p>
                                )}
                            </div>
                        )}

                        {!disabled && (
                            <>
                                <button
                                    type="button"
                                    onClick={() => requestRemove(single)}
                                    aria-label={t('Remove')}
                                    style={{ animationDelay: '120ms' }}
                                    className={`${roundButton} iu-in absolute left-2.5 top-2.5 hover:rotate-90`}
                                >
                                    <X className="size-3.5" strokeWidth={3} />
                                </button>
                                <button
                                    type="button"
                                    onClick={open}
                                    aria-label={t('Change photo')}
                                    style={{ animationDelay: '180ms' }}
                                    className={`${roundButton} iu-in absolute right-2.5 top-2.5 hover:-translate-y-0.5`}
                                >
                                    <Upload className="size-3.5" strokeWidth={3} />
                                </button>
                            </>
                        )}
                    </div>
                ) : (
                    <>
                        <div className="iu-fade">{dropLabel}</div>

                        {/* ---------- MULTIPLE: list (height animates open/closed) ---------- */}
                        {props.multiple && (
                            <div
                                className="grid transition-[grid-template-rows] duration-300 ease-out"
                                style={{ gridTemplateRows: items.length ? '1fr' : '0fr' }}
                            >
                                <div className="min-h-0 overflow-hidden">
                                    <ul className="pb-2">
                                        {items.map((item, i) => {
                                            const isLeaving = leaving.has(item.key);
                                            return (
                                                <li
                                                    key={item.key}
                                                    style={isLeaving ? undefined : { animationDelay: `${Math.min(i, 6) * 40}ms` }}
                                                    className={`mb-2 flex items-center gap-2.5 rounded-xl bg-[#5b5e68] p-2 last:mb-0 ${
                                                        isLeaving ? 'iu-out' : 'iu-in'
                                                    }`}
                                                >
                                                    {!disabled && (
                                                        <button
                                                            type="button"
                                                            onClick={() => requestRemove(item)}
                                                            aria-label={t('Remove')}
                                                            className={`${roundButton} hover:rotate-90`}
                                                        >
                                                            <X className="size-3.5" strokeWidth={3} />
                                                        </button>
                                                    )}

                                                    <img
                                                        src={item.src}
                                                        alt={t('Image preview')}
                                                        className={`shrink-0 rounded-md object-contain transition-transform duration-300 hover:scale-110 ${thumbSize[cols]}`}
                                                    />

                                                    <div className="min-w-0 flex-1 leading-tight text-white">
                                                        <p className="truncate text-sm font-semibold">
                                                            {item.name ?? t('Current image')}
                                                        </p>
                                                        {item.size !== undefined && (
                                                            <p className="mt-0.5 text-xs font-semibold text-white/50">
                                                                {formatBytes(item.size)}
                                                            </p>
                                                        )}
                                                    </div>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                </div>
                            </div>
                        )}
                    </>
                )}
            </div>

            <input
                ref={inputRef}
                id={id}
                type="file"
                accept={accept}
                multiple={!!props.multiple}
                disabled={disabled}
                className="sr-only"
                tabIndex={-1}
                onChange={(e) => {
                    pick(e.target.files);
                    e.target.value = ''; // allow re-selecting the same file
                }}
            />

            {message ? (
                <p key={message} className="iu-down mt-2 text-sm text-red-600 dark:text-red-400">
                    {message}
                </p>
            ) : (
                hint && <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">{hint}</p>
            )}
        </div>
    );
}