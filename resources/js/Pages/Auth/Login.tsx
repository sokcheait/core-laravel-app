import { FormEventHandler } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import GuestLayout from '@/Layouts/GuestLayout';
import TextInput from '@/Components/TextInput';
import PrimaryButton from '@/Components/PrimaryButton';

export default function Login() {
    const { data, setData, post, processing, errors, reset } = useForm({
        email: '',
        password: '',
        remember: false,
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post('/login', { onFinish: () => reset('password') });
    };

    return (
        <GuestLayout title="Log in">
            <Head title="Log in" />

            <form onSubmit={submit} noValidate>
                <TextInput
                    label="Email"
                    name="email"
                    type="email"
                    value={data.email}
                    autoComplete="username"
                    autoFocus
                    onChange={(e) => setData('email', e.target.value)}
                    error={errors.email}
                />

                <TextInput
                    label="Password"
                    name="password"
                    type="password"
                    value={data.password}
                    autoComplete="current-password"
                    onChange={(e) => setData('password', e.target.value)}
                    error={errors.password}
                />

                <label className="mb-5 flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                    <input
                        type="checkbox"
                        checked={data.remember}
                        onChange={(e) => setData('remember', e.target.checked)}
                        className="size-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    Remember me
                </label>

                <PrimaryButton type="submit" disabled={processing}>
                    {processing ? 'Logging in…' : 'Log in'}
                </PrimaryButton>
            </form>

            <p className="mt-5 text-center text-sm text-gray-600 dark:text-gray-400">
                No account?{' '}
                <Link href="/register" className="font-medium text-indigo-600 hover:underline dark:text-indigo-400">
                    Register
                </Link>
            </p>
        </GuestLayout>
    );
}