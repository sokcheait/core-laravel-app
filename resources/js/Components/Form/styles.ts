/** Shared control styling so every form input looks and behaves the same. */
export function controlClass(hasError: boolean, extra = ''): string {
    return [
        'block w-full rounded-lg border bg-white px-3 py-2 text-sm text-gray-900 shadow-sm',
        'placeholder:text-gray-400 focus:outline-none focus:ring-2',
        'disabled:cursor-not-allowed disabled:opacity-60',
        'dark:bg-gray-900 dark:text-gray-100 dark:placeholder:text-gray-500',
        hasError
            ? 'border-red-500 focus:border-red-500 focus:ring-red-500/30 dark:border-red-500'
            : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500/30 dark:border-gray-700',
        extra,
    ]
        .filter(Boolean)
        .join(' ');
}

/** Builds the aria-describedby value for a control. */
export function describedBy(id: string, error?: string, hint?: string): string | undefined {
    const ids = [error && `${id}-error`, hint && `${id}-hint`].filter(Boolean);
    return ids.length ? ids.join(' ') : undefined;
}

/** Bordered shell for inputs that carry icons, addons or buttons next to the field. */
export function shellClass(hasError: boolean, disabled?: boolean): string {
    return [
        'flex items-stretch overflow-hidden rounded-lg border bg-white shadow-sm transition',
        'focus-within:ring-2 dark:bg-gray-900',
        hasError
            ? 'border-red-500 focus-within:border-red-500 focus-within:ring-red-500/30'
            : 'border-gray-300 focus-within:border-primary-500 focus-within:ring-primary-500/30 dark:border-gray-700',
        disabled ? 'cursor-not-allowed opacity-60' : 'cursor-text',
    ].join(' ');
}