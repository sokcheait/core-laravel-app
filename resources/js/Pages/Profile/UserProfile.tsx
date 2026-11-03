import { FormEvent, ReactNode } from 'react';
import { useForm, usePage } from '@inertiajs/react';
import { Loader2, Mail } from 'lucide-react';
import AppLayout from '@/Layouts/AppLayout';
import PasswordInput from '@/Components/Form/PasswordInput';
import TextInput from '@/Components/Form/TextInput';
import { useToast } from '@/Components/Toast/ToastProvider';
import useT from '@/hooks/useT';
import type { PageProps } from '@/types';

/* ---------- Password strength ---------- */

function strengthOf(pw: string): number {
    if (!pw) return 0;
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
    if (/\d/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    return Math.max(score, 1);
}

const strengthStyle = [
    { label: '', bar: 'bg-gray-300' },
    { label: 'Weak', bar: 'bg-red-500' },
    { label: 'Fair', bar: 'bg-amber-500' },
    { label: 'Good', bar: 'bg-lime-500' },
    { label: 'Strong', bar: 'bg-emerald-500' },
];

/* ---------- Section: label column + form column ---------- */

function Section({ title, description, children }: { title: string; description: string; children: ReactNode }) {
    return (
        <section className="grid gap-6 py-10 md:grid-cols-3 md:gap-12">
            <div>
                <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
                <p className="mt-1 text-sm leading-relaxed text-gray-500 dark:text-gray-400">{description}</p>
            </div>
            <div className="md:col-span-2">{children}</div>
        </section>
    );
}

function SubmitButton({ processing, children }: { processing: boolean; children: ReactNode }) {
    return (
        <button
            type="submit"
            disabled={processing}
            className="inline-flex items-center gap-2 rounded-md bg-primary-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-primary-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 dark:focus-visible:ring-offset-gray-950"
        >
            {processing && <Loader2 className="size-4 animate-spin" />}
            {children}
        </button>
    );
}

/* ---------- Page ---------- */

export default function UserProfile() {
    const { t } = useT();
    const toast = useToast();
    const { user } = usePage<PageProps>().props.auth;

    // Single place to adapt if your toast API is named differently
    const notify = (type: 'success' | 'error', message: string) => toast[type](message);

    const profile = useForm({ name: user?.name ?? '', email: user?.email ?? '' });
    const password = useForm({ current_password: '', password: '', password_confirmation: '' });

    const strength = strengthOf(password.data.password);
    const mismatch =
        password.data.password_confirmation !== '' &&
        password.data.password !== password.data.password_confirmation;

    const submitProfile = (e: FormEvent) => {
        e.preventDefault();
        profile.patch('/profile', {
            preserveScroll: true,
            onSuccess: () => notify('success', t('Profile updated successfully')),
            onError: () => notify('error', t('Please fix the errors and try again')),
        });
    };

    const submitPassword = (e: FormEvent) => {
        e.preventDefault();
        password.put('/password', {
            preserveScroll: true,
            onSuccess: () => {
                password.reset();
                notify('success', t('Password updated successfully'));
            },
            onError: () => {
                password.reset('password', 'password_confirmation');
                notify('error', t('Please fix the errors and try again'));
            },
        });
    };

    return (
        <AppLayout
            title="My profile"
            breadcrumbs={[{ label: 'Home', href: '/dashboard' }, { label: 'My profile' }]}
        >
            <div className="swal-fade mx-auto max-w-4xl">
                {/* Identity */}
                <div className="flex items-center gap-5 pb-10">
                    <span className="grid size-16 shrink-0 place-items-center rounded-full bg-primary-600 text-2xl font-semibold text-white">
                        {user?.name?.charAt(0).toUpperCase()}
                    </span>
                    <div className="min-w-0">
                        <p className="truncate text-2xl font-bold tracking-tight">{user?.name}</p>
                        <p className="truncate text-base text-gray-500 dark:text-gray-400">{user?.email}</p>
                    </div>
                </div>

                <div className="divide-y divide-gray-200 border-t border-gray-200 dark:divide-white/10 dark:border-white/10">
                    {/* Profile information */}
                    <Section
                        title={t('Profile information')}
                        description={t('Update your name and email address')}
                    >
                        <form onSubmit={submitProfile} noValidate className="space-y-5">
                            <TextInput
                                label={t('Name')}
                                placeholder={`${t('Enter')} ${t('Name')}`}
                                value={profile.data.name}
                                onChange={(v) => profile.setData('name', v)}
                                error={profile.errors.name}
                                autoComplete="name"
                                required
                                disabled={profile.processing}
                            />
                            <TextInput
                                label={t('Email')}
                                type="email"
                                icon={Mail}
                                placeholder={t('name@example.com')}
                                clearable
                                value={profile.data.email}
                                onChange={(v) => profile.setData('email', v)}
                                error={profile.errors.email}
                                autoComplete="email"
                                required
                                disabled={profile.processing}
                            />
                            <SubmitButton processing={profile.processing}>{t('Save')}</SubmitButton>
                        </form>
                    </Section>

                    {/* Password */}
                    <Section
                        title={t('Update password')}
                        description={t('Use a long, random password to keep your account secure')}
                    >
                        <form onSubmit={submitPassword} noValidate className="space-y-5">
                            <PasswordInput
                                label={t('Current password')}
                                value={password.data.current_password}
                                onChange={(v) => password.setData('current_password', v)}
                                error={password.errors.current_password}
                                autoComplete="current-password"
                                required
                                disabled={password.processing}
                            />

                            <div>
                                <PasswordInput
                                    label={t('New password')}
                                    value={password.data.password}
                                    onChange={(v) => password.setData('password', v)}
                                    error={password.errors.password}
                                    autoComplete="new-password"
                                    required
                                    disabled={password.processing}
                                />
                                {/* Strength meter */}
                                {password.data.password && (
                                    <div className="mt-2.5 flex items-center gap-3" aria-live="polite">
                                        <div className="flex flex-1 gap-1">
                                            {[1, 2, 3, 4].map((n) => (
                                                <span
                                                    key={n}
                                                    className={`h-1 flex-1 rounded-full transition-colors duration-300 ${
                                                        n <= strength
                                                            ? strengthStyle[strength].bar
                                                            : 'bg-gray-200 dark:bg-white/10'
                                                    }`}
                                                />
                                            ))}
                                        </div>
                                        <span className="w-14 text-right text-xs font-medium text-gray-500 dark:text-gray-400">
                                            {t(strengthStyle[strength].label)}
                                        </span>
                                    </div>
                                )}
                            </div>

                            <PasswordInput
                                label={t('Confirm password')}
                                value={password.data.password_confirmation}
                                onChange={(v) => password.setData('password_confirmation', v)}
                                error={
                                    password.errors.password_confirmation ??
                                    (mismatch ? t('Passwords do not match') : undefined)
                                }
                                autoComplete="new-password"
                                required
                                disabled={password.processing}
                            />

                            <SubmitButton processing={password.processing}>{t('Update password')}</SubmitButton>
                        </form>
                    </Section>
                </div>
            </div>
        </AppLayout>
    );
}