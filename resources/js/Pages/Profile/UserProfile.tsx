import { FormEvent, InputHTMLAttributes, ReactNode, useState } from 'react';
import { useForm, usePage } from '@inertiajs/react';
import { Eye, EyeOff, KeyRound, Loader2, Mail, User as UserIcon } from 'lucide-react';
import AppLayout from '@/Layouts/AppLayout';
import { useToast } from '@/Components/Toast/ToastProvider';
import useT from '@/hooks/useT';
import type { PageProps } from '@/types';

/* ---------- Field ---------- */

interface FieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'className'> {
    id: string;
    label: string;
    error?: string;
    icon?: ReactNode;
}

function Field({ id, label, error, icon, type = 'text', ...rest }: FieldProps) {
    const { t } = useT();
    const [show, setShow] = useState(false);
    const isPassword = type === 'password';

    return (
        <div>
            <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-gray-800 dark:text-gray-200">
                {label}
            </label>
            <div className="relative">
                {icon && (
                    <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                        {icon}
                    </span>
                )}
                <input
                    id={id}
                    type={isPassword && show ? 'text' : type}
                    aria-invalid={!!error}
                    className={`w-full rounded-lg border bg-white py-2 text-base shadow-sm outline-none transition focus:ring-2 dark:bg-gray-950 ${
                        icon ? 'pl-10' : 'pl-3'
                    } ${isPassword ? 'pr-10' : 'pr-3'} ${
                        error
                            ? 'border-red-400 focus:border-red-500 focus:ring-red-500/30'
                            : 'border-gray-300 focus:border-primary-500 focus:ring-primary-500/30 dark:border-gray-700'
                    }`}
                    {...rest}
                />
                {isPassword && (
                    <button
                        type="button"
                        onClick={() => setShow((s) => !s)}
                        aria-label={show ? t('Hide password') : t('Show password')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-gray-400 transition hover:text-gray-600 dark:hover:text-gray-200"
                    >
                        {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                    </button>
                )}
            </div>
            {error && <p className="mt-1.5 text-sm text-red-500">{error}</p>}
        </div>
    );
}

/* ---------- Password strength ---------- */

function strengthOf(pw: string): number {
    if (!pw) return 0;
    let score = 0;
    if (pw.length >= 8) score++;
    if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
    if (/\d/.test(pw)) score++;
    if (/[^A-Za-z0-9]/.test(pw)) score++;
    return score;
}

const strengthStyle = [
    { label: '', bar: 'bg-gray-300' },
    { label: 'Weak', bar: 'bg-red-500' },
    { label: 'Fair', bar: 'bg-amber-500' },
    { label: 'Good', bar: 'bg-lime-500' },
    { label: 'Strong', bar: 'bg-emerald-500' },
];

/* ---------- Card ---------- */

function Card({ title, description, children }: { title: string; description: string; children: ReactNode }) {
    return (
        <section className="swal-fade rounded-2xl bg-white p-6 shadow-sm ring-1 ring-gray-950/5 dark:bg-gray-900 dark:ring-white/10">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">{title}</h2>
            <p className="mb-6 text-sm text-gray-500 dark:text-gray-400">{description}</p>
            {children}
        </section>
    );
}

function SubmitButton({ processing, children }: { processing: boolean; children: ReactNode }) {
    return (
        <button
            type="submit"
            disabled={processing}
            className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-6 py-2 text-base font-medium text-white shadow-sm transition hover:bg-primary-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 active:scale-95 disabled:opacity-60 dark:focus-visible:ring-offset-gray-900"
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
            <div className="mx-auto max-w-3xl space-y-6">
                {/* Banner */}
                <div className="swal-fade overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-gray-950/5 dark:bg-gray-900 dark:ring-white/10">
                    <div className="h-24 bg-gradient-to-r from-primary-500 to-primary-700" />
                    <div className="flex items-end gap-4 px-6 pb-6">
                        <span className="-mt-10 grid size-20 shrink-0 place-items-center rounded-2xl bg-primary-600 text-3xl font-bold text-white shadow-lg ring-4 ring-white dark:ring-gray-900">
                            {user?.name?.charAt(0).toUpperCase()}
                        </span>
                        <div className="min-w-0 pb-1">
                            <p className="truncate text-xl font-bold tracking-tight">{user?.name}</p>
                            <p className="truncate text-sm text-gray-500 dark:text-gray-400">{user?.email}</p>
                        </div>
                    </div>
                </div>

                {/* Profile information */}
                <Card
                    title={t('Profile information')}
                    description={t('Update your name and email address')}
                >
                    <form onSubmit={submitProfile} className="space-y-5">
                        <div className="grid gap-5 sm:grid-cols-2">
                            <Field
                                id="name"
                                label={t('Name')}
                                icon={<UserIcon className="size-4" />}
                                value={profile.data.name}
                                onChange={(e) => profile.setData('name', e.target.value)}
                                error={profile.errors.name}
                                autoComplete="name"
                            />
                            <Field
                                id="email"
                                type="email"
                                label={t('Email')}
                                icon={<Mail className="size-4" />}
                                value={profile.data.email}
                                onChange={(e) => profile.setData('email', e.target.value)}
                                error={profile.errors.email}
                                autoComplete="email"
                            />
                        </div>
                        <div className="flex justify-end border-t border-gray-100 pt-5 dark:border-white/10">
                            <SubmitButton processing={profile.processing}>{t('Save')}</SubmitButton>
                        </div>
                    </form>
                </Card>

                {/* Password */}
                <Card
                    title={t('Update password')}
                    description={t('Use a long, random password to keep your account secure')}
                >
                    <form onSubmit={submitPassword} className="space-y-5">
                        <div className="max-w-md space-y-5">
                            <Field
                                id="current_password"
                                type="password"
                                label={t('Current password')}
                                icon={<KeyRound className="size-4" />}
                                value={password.data.current_password}
                                onChange={(e) => password.setData('current_password', e.target.value)}
                                error={password.errors.current_password}
                                autoComplete="current-password"
                            />

                            <div>
                                <Field
                                    id="password"
                                    type="password"
                                    label={t('New password')}
                                    icon={<KeyRound className="size-4" />}
                                    value={password.data.password}
                                    onChange={(e) => password.setData('password', e.target.value)}
                                    error={password.errors.password}
                                    autoComplete="new-password"
                                />
                                {/* Strength meter */}
                                {password.data.password && (
                                    <div className="mt-2 flex items-center gap-3" aria-live="polite">
                                        <div className="flex flex-1 gap-1">
                                            {[1, 2, 3, 4].map((n) => (
                                                <span
                                                    key={n}
                                                    className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
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

                            <Field
                                id="password_confirmation"
                                type="password"
                                label={t('Confirm password')}
                                icon={<KeyRound className="size-4" />}
                                value={password.data.password_confirmation}
                                onChange={(e) => password.setData('password_confirmation', e.target.value)}
                                error={
                                    password.errors.password_confirmation ??
                                    (mismatch ? t('Passwords do not match') : undefined)
                                }
                                autoComplete="new-password"
                            />
                        </div>

                        <div className="flex justify-end border-t border-gray-100 pt-5 dark:border-white/10">
                            <SubmitButton processing={password.processing}>{t('Update password')}</SubmitButton>
                        </div>
                    </form>
                </Card>
            </div>
        </AppLayout>
    );
}