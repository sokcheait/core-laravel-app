import { FormEventHandler } from 'react';
import { Head, Link, useForm } from '@inertiajs/react';
import GuestLayout from '@/Layouts/GuestLayout';
import TextInput from '@/Components/TextInput';
import PrimaryButton from '@/Components/PrimaryButton';

export default function Register() {
    const { data, setData, post, processing, errors, reset } = useForm({
        name: '',
        email: '',
        password: '',
        password_confirmation: '',
    });

    const submit: FormEventHandler = (e) => {
        e.preventDefault();
        post('/register', {
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <GuestLayout title="Create account">
            <Head title="Register" />

            <form onSubmit={submit} noValidate>
                <TextInput
                    label="Name"
                    name="name"
                    value={data.name}
                    autoComplete="name"
                    autoFocus
                    onChange={(e) => setData('name', e.target.value)}
                    error={errors.name}
                />

                <TextInput
                    label="Email"
                    name="email"
                    type="email"
                    value={data.email}
                    autoComplete="username"
                    onChange={(e) => setData('email', e.target.value)}
                    error={errors.email}
                />

                <TextInput
                    label="Password"
                    name="password"
                    type="password"
                    value={data.password}
                    autoComplete="new-password"
                    onChange={(e) => setData('password', e.target.value)}
                    error={errors.password}
                />

                <TextInput
                    label="Confirm password"
                    name="password_confirmation"
                    type="password"
                    value={data.password_confirmation}
                    autoComplete="new-password"
                    onChange={(e) => setData('password_confirmation', e.target.value)}
                    error={errors.password_confirmation}
                />

                <PrimaryButton type="submit" disabled={processing}>
                    {processing ? 'Creating account…' : 'Register'}
                </PrimaryButton>
            </form>

            <p className="mt-5 text-center text-sm text-gray-600 dark:text-gray-400">
                Already registered?{' '}
                <Link href="/login" className="font-medium text-indigo-600 hover:underline dark:text-indigo-400">
                    Log in
                </Link>
            </p>
        </GuestLayout>
    );
}