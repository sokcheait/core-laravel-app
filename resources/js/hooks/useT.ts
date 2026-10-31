import { usePage } from '@inertiajs/react';

export type Locale = 'en' | 'km';

interface SharedI18n {
    locale?: Locale;
    translations?: Record<string, string>;
}

/**
 * English text is the key. A missing translation falls back to English
 * and logs a warning in development so you can spot gaps.
 */
export default function useT() {
    const props = usePage().props as unknown as SharedI18n;
    const translations = props.translations ?? {};
    const locale: Locale = props.locale ?? 'en';

    const t = (key: string): string => {
        const value = translations[key];
        if (value === undefined && locale !== 'en' && import.meta.env.DEV) {
            console.warn(`Missing translation: "${key}"`);
        }
        return value ?? key;
    };

    return { t, locale };
}