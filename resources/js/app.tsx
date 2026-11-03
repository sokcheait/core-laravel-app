import { createInertiaApp } from '@inertiajs/react';
import { createRoot } from 'react-dom/client';
import 'flag-icons/css/flag-icons.min.css';
import type { ComponentType } from 'react';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

const pages = import.meta.glob<{ default: ComponentType<any> }>(
    './Pages/**/*.tsx'
);

void createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),

    progress: {
        color: '#4B5563',
    },

    resolve: async (name) => {
        const importPage = pages[`./Pages/${name}.tsx`];

        if (!importPage) {
            throw new Error(`Page not found: ./Pages/${name}.tsx`);
        }

        return (await importPage()).default;
    },

    setup: async ({ el, App, props }) => {
        if (typeof window === 'undefined' || !el) return;

        const [
            { ToastProvider },
            { ConfirmProvider },
            { default: FlashToasts },
            { applyTheme, getSavedTheme },
        ] = await Promise.all([
            import('@/Components/Toast/ToastProvider'),
            import('@/Components/Confirm/ConfirmProvider'),
            import('@/Components/Toast/FlashToasts'),
            import('@/config/themes'),
        ]);

        applyTheme(getSavedTheme());

        // Providers live INSIDE <App> so hooks that call usePage() (e.g. useT)
        // work in ToastItem and the confirm dialog.
        createRoot(el).render(
            <App {...props}>
                {({ Component, props: pageProps, key }: any) => (
                    <ToastProvider>
                        <ConfirmProvider>
                            <FlashToasts />
                            <Component key={key} {...pageProps} />
                        </ConfirmProvider>
                    </ToastProvider>
                )}
            </App>
        );
    },
});