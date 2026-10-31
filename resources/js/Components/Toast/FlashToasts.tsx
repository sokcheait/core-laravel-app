
import { useEffect } from 'react';
import { usePage } from '@inertiajs/react';
import { useToast } from './ToastProvider';

interface Flash {
    success?: string | null;
    error?: string | null;
    warning?: string | null;
    info?: string | null;
}

export default function FlashToasts() {
    const { flash } = usePage<{ flash?: Flash }>().props;
    const toast = useToast();

    useEffect(() => {
        if (!flash) return;

        (['success', 'error', 'warning', 'info'] as const).forEach((type) => {
            const message = flash[type];

            if (message) {
                toast[type](message);
            }
        });
    }, [flash]);

    return null;
}
