import { PropsWithChildren } from 'react';

export default function GuestLayout({
    title,
    children,
}: PropsWithChildren<{ title: string }>) {
    return (
        <div className="grid min-h-screen place-items-center bg-gray-100 p-4 dark:bg-gray-950">
            <div className="w-full max-w-md rounded-xl border border-gray-200 bg-white p-8 shadow-sm dark:border-gray-800 dark:bg-gray-900">
                <h1 className="mb-6 text-2xl font-semibold text-gray-900 dark:text-gray-100">
                    {title}
                </h1>
                {children}
            </div>
        </div>
    );
}