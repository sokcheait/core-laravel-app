import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import useT from '@/hooks/useT';
import TextInput, { type TextInputProps } from './TextInput';

export type PasswordInputProps = Omit<TextInputProps, 'type' | 'trailing'>;

export default function PasswordInput(props: PasswordInputProps) {
    const { t } = useT();
    const [visible, setVisible] = useState(false);

    return (
        <TextInput
            {...props}
            type={visible ? 'text' : 'password'}
            trailing={
                <button
                    type="button"
                    onClick={() => setVisible((v) => !v)}
                    aria-label={visible ? t('Hide password') : t('Show password')}
                    aria-pressed={visible}
                    disabled={props.disabled}
                    className="grid size-6 place-items-center rounded-md text-gray-400 transition hover:bg-gray-100 hover:text-gray-600 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 disabled:cursor-not-allowed dark:hover:bg-white/10 dark:hover:text-gray-200"
                >
                    {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                </button>
            }
        />
    );
}