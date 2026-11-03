import type { SubmitEvent } from 'react';
import { Link, useForm } from '@inertiajs/react';
import { Save,Mail,Phone } from 'lucide-react';
import AppLayout from '@/Layouts/AppLayout';
import CheckboxInput from '@/Components/Form/CheckboxInput';
import DateInput from '@/Components/Form/DateInput';
import PasswordInput from '@/Components/Form/PasswordInput';
import SelectInput from '@/Components/Form/SelectInput';
import TextInput from '@/Components/Form/TextInput';
import ToggleInput from '@/Components/Form/ToggleInput';
import PhoneInput from '@/Components/Form/PhoneInput';
import ImageUpload from '@/Components/ImageUpload';
import MultiSelectInput, { type MultiSelectOption } from '@/Components/Form/MultiSelectInput';
import useT from '@/hooks/useT';
import { useToast } from '@/Components/Toast/ToastProvider';

interface Props {
    /** Role options sent by UserController@create */
    roles: MultiSelectOption[];
};

export default function UsersCreate({ roles }: Props) {
    const { t } = useT();
    const toast = useToast();

    const { data, setData, post, processing, errors, reset,transform } = useForm({
        name: '',
        name_en: '',
        name_kh: '',
        email: '',
        phone: '',
        gender: '',
        roles: [] as string[],
        date_of_birth: '',
        password: '',
        password_confirmation: '',
        is_active: true,
        avatar: null as File | null,
    });

    transform((formData) => ({
        ...formData,
        name: [formData.name_en, formData.name_kh]
            .map((s) => s.trim())
            .filter(Boolean)
            .join(' '),
    }));

    const submit = (e: SubmitEvent<HTMLFormElement>) => {
        e.preventDefault();

        post('/users', {
            preserveScroll: true,
            onSuccess: () => toast.success(t('User created.')),
            onFinish: () => reset('password', 'password_confirmation'),
        });
    };

    return (
        <AppLayout
            title="Create user"
            breadcrumbs={[
                { label: 'Home', href: '/dashboard' },
                { label: 'Users', href: '/users' },
                { label: 'Create' },
            ]}
        >
            <form
                onSubmit={submit}
                noValidate
                className="max-w-full rounded-xl border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-800 dark:bg-gray-900/50"
            >
                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <ImageUpload
                        label={t('Profile photo')}
                        value={data.avatar}
                        onChange={(f) => setData('avatar', f)}
                        error={errors.avatar}
                    />
                    <TextInput
                        label={t('Name (English)')}
                        value={data.name_en}
                        placeholder={`${t('Enter')} ${t('Name (English)')}`}
                        required
                        onChange={(v) => setData('name_en', v)}
                        error={errors.name_en}
                        disabled={processing}
                    />
                    <TextInput
                        label={t('Name (Khmer)')}
                        value={data.name_kh}
                        required
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
                    />

                    {/* Prefix addon */}
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
                    <PasswordInput
                        label={t('Password')}
                        value={data.password}
                        onChange={(v) => setData('password', v)}
                        error={errors.password}
                        autoComplete="new-password"
                        required
                        disabled={processing}
                    />
                    <PasswordInput
                        label={t('Confirm password')}
                        value={data.password_confirmation}
                        onChange={(v) => setData('password_confirmation', v)}
                        error={errors.password_confirmation}
                        autoComplete="new-password"
                        required
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
                        {t('Create user')}
                    </button>
                </div>
            </form>
        </AppLayout>
    );
}