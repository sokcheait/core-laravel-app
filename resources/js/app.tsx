import { createInertiaApp } from '@inertiajs/react';
import { createRoot } from 'react-dom/client';
import 'flag-icons/css/flag-icons.min.css';
import type { ComponentType } from 'react';
import { ToastProvider } from '@/Components/Toast/ToastProvider';
import { ConfirmProvider } from '@/Components/Confirm/ConfirmProvider';
import FlashToasts from '@/Components/Toast/FlashToasts';
import { applyTheme, getSavedTheme } from '@/config/themes';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

applyTheme(getSavedTheme());

// Lazy: each page becomes its own chunk (no eager: true)
const pages = import.meta.glob<{ default: ComponentType<any> }>('./Pages/**/*.tsx');

void createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    progress: {
        color: '#4B5563',
    },

    // Folder casing must match your real folder: Pages or pages
    resolve: async (name) => {
        const importPage = pages[`./Pages/${name}.tsx`];

        if (!importPage) {
            throw new Error(`Page not found: ./Pages/${name}.tsx`);
        }

        return (await importPage()).default;
    },

    setup({ el, App, props }) {
        if (!el) return;

        createRoot(el).render(
            <App {...props}>
                {({ Component, props: pageProps, key }) => (
                    <ToastProvider>
                        <ConfirmProvider>
                            <FlashToasts />
                            <Component key={key} {...pageProps} />
                        </ConfirmProvider>
                    </ToastProvider>
                )}
            </App>,
        );
    },
});