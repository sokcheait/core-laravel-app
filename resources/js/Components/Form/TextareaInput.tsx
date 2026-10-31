import { useId, type TextareaHTMLAttributes } from 'react';
import FormField from './FormField';
import { controlClass, describedBy } from './styles';

export interface TextareaInputProps
    extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'onChange' | 'value' | 'className'> {
    label?: string;
    value: string;
    onChange: (value: string) => void;
    error?: string;
    hint?: string;
    className?: string;
    inputClassName?: string;
}

export default function TextareaInput({
    id,
    label,
    value,
    onChange,
    error,
    hint,
    className,
    inputClassName,
    rows = 4,
    required,
    ...rest
}: TextareaInputProps) {
    const autoId = useId();
    const areaId = id ?? autoId;

    return (
        <FormField id={areaId} label={label} error={error} hint={hint} required={required} className={className}>
            <textarea
                {...rest}
                id={areaId}
                rows={rows}
                value={value}
                required={required}
                onChange={(e) => onChange(e.target.value)}
                aria-invalid={!!error}
                aria-describedby={describedBy(areaId, error, hint)}
                className={controlClass(!!error, `resize-y ${inputClassName ?? ''}`)}
            />
        </FormField>
    );
}