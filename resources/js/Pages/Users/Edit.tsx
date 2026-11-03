import type { SubmitEvent } from 'react';
import { Link, useForm } from '@inertiajs/react';
import { Save, Mail } from 'lucide-react';
import AppLayout from '@/Layouts/AppLayout';
import DateInput from '@/Components/Form/DateInput';
import MultiSelectInput, { type MultiSelectOption } from '@/Components/Form/MultiSelectInput';
import PhoneInput from '@/Components/Form/PhoneInput';
import SelectInput from '@/Components/Form/SelectInput';
import TextInput from '@/Components/Form/TextInput';
import ToggleInput from '@/Components/Form/ToggleInput';
import ImageUpload from '@/Components/ImageUpload';
import useT from '@/hooks/useT';
import { useToast } from '@/Components/Toast/ToastProvider';

interface User {
    id: number;
    name: string;
    name_en: string | null;
    name_kh: string | null;
    email: string;
    phone: string | null;
    gender: string | null;
    date_of_birth: string | null;
    is_active: boolean;
    /** Ids of the roles the user currently has, e.g. ["1", "3"] */
    roles: string[];
    avatar_url: string | null;
}

interface Props {
    user: User;
    /** Role options sent by UserController@edit */
    roles: MultiSelectOption[];
}

export default function UsersEdit({ user, roles }: Props) {
    const { t } = useT();
    const toast = useToast();

    const { data, setData, put, processing, errors, reset, transform } = useForm({
        name_en: user.name_en ?? '',
        name_kh: user.name_kh ?? '',
        email: user.email ?? '',
        phone: user.phone ?? '',
        gender: user.gender ?? '',
        roles: user.roles ?? [],
        date_of_birth: user.date_of_birth ? user.date_of_birth.slice(0, 10) : '',
        password: '',
        password_confirmation: '',
        is_active: user.is_active,
        avatar: null as File | null,
    });

    // name = name_en + name_kh; password is only sent when the user typed one
    transform((formData) => {
        const { password, password_confirmation, ...rest } = formData;

        return {
            ...rest,
            name: [formData.name_en, formData.name_kh]
                .map((s) => s.trim())
                .filter(Boolean)
                .join(' '),
            ...(password ? { password, password_confirmation } : {}),
        };
    });

    const submit = (e: SubmitEvent<HTMLFormElement>) => {
        e.preventDefault();

        put(`/users/${user.id}`, {
            preserveScroll: true,
            onSuccess: () => toast.success(t('User updated.')),
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <AppLayout
            title="Edit user"
            breadcrumbs={[
                { label: 'Home', href: '/dashboard' },
                { label: 'Users', href: '/users' },
                { label: user.name },
                { label: 'Edit' },
            ]}
        >
            <form
                onSubmit={submit}
                noValidate
                className="max-w-full rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900/50"
            >
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <ImageUpload
                        cols={2}
                        label={t('Profile photo')}
                        value={data.avatar}
                        onChange={(f) => setData('avatar', f)}
                        currentUrl={user?.avatar_url}
                        error={errors.avatar}
                    />
                    <TextInput
                        label={t('Name (English)')}
                        value={data.name_en}
                        onChange={(v) => setData('name_en', v)}
                        error={errors.name_en ?? (errors as Record<string, string>).name}
                        disabled={processing}
                    />
                    <TextInput
                        label={t('Name (Khmer)')}
                        value={data.name_kh}
                        onChange={(v) => setData('name_kh', v)}
                        error={errors.name_kh}
                        disabled={processing}
                    />
                    {/* Icon + clear button */}
                    <TextInput
                        label={t('Email')}
                        type="email"
                        icon={Mail}
                        placeholder={t('name@example.com')}
                        clearable
                        value={data.email}
                        onChange={(v) => setData('email', v)}
                        error={errors.email}
                        autoComplete="email"
                        disabled={processing}
                    />

                    {/* Country select + number */}
                    <PhoneInput
                        label={t('Phone')}
                        value={data.phone}
                        onChange={(v) => setData('phone', v)}
                        error={errors.phone}
                        disabled={processing}
                    />
                    <SelectInput
                        label={t('Gender')}
                        value={data.gender}
                        onChange={(v) => setData('gender', v)}
                        error={errors.gender}
                        placeholder={t('Select an option')}
                        options={[
                            { value: 'male', label: t('Male') },
                            { value: 'female', label: t('Female') },
                        ]}
                        disabled={processing}
                    />
                    <DateInput
                        label={t('Date of birth')}
                        value={data.date_of_birth}
                        onChange={(v) => setData('date_of_birth', v)}
                        error={errors.date_of_birth}
                        max={new Date().toISOString().slice(0, 10)}
                        disabled={processing}
                    />
                    <ToggleInput
                        label={t('Active')}
                        checked={data.is_active}
                        onChange={(v) => setData('is_active', v)}
                        error={errors.is_active}
                        disabled={processing}
                    />
                    {/* Multi select */}
                    <MultiSelectInput
                        label={t('Roles')}
                        searchable
                        value={data.roles}
                        onChange={(v) => setData('roles', v)}
                        options={roles}
                        placeholder={t('Select roles')}
                        error={errors.roles}
                        disabled={processing}
                    />
                </div>

                <div className="mt-6 flex items-center justify-end gap-2 border-t border-gray-200 pt-5 dark:border-gray-800">
                    <Link
                        href="/users"
                        className="inline-flex items-center rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 shadow-sm transition hover:bg-gray-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:bg-gray-800 dark:focus-visible:ring-offset-gray-950"
                    >
                        {t('Cancel')}
                    </Link>
                    <button
                        type="submit"
                        disabled={processing}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-primary-600 px-3 py-2 text-xs font-medium text-white shadow-sm transition hover:bg-primary-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 dark:focus-visible:ring-offset-gray-950"
                    >
                        <Save className="size-4" />
                        {t('Save changes')}
                    </button>
                </div>
            </form>
        </AppLayout>
    );
}