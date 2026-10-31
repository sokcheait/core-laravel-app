import { FormEvent, useEffect, useState } from 'react';
import { DateInput, SelectInput, TextInput } from '@/Components/Form';
import type { Option, SearchField } from './types';

export interface SearchPanelLabels {
    title: string;
    reset: string;
    search: string;
}

interface Props {
    fields: SearchField[];
    values: Record<string, string>;
    onSearch: (values: Record<string, string>) => void;
    labels?: Partial<SearchPanelLabels>;
}

const spanClass = { 1: '', 2: 'md:col-span-2', 3: 'md:col-span-3' } as const;

function descendantsOf(fields: SearchField[], key: string): string[] {
    const children = fields.filter((f) => f.dependsOn === key).map((f) => f.key);
    return children.flatMap((child) => [child, ...descendantsOf(fields, child)]);
}

function SelectField({
    field,
    value,
    parentValue,
    onChange,
}: {
    field: SearchField;
    value: string;
    parentValue: string;
    onChange: (value: string) => void;
}) {
    const [options, setOptions] = useState<Option[]>(field.options ?? []);
    const needsParent = Boolean(field.dependsOn);

    useEffect(() => {
        if (!field.loadOptions) {
            setOptions(field.options ?? []);
            return;
        }
        if (!parentValue) {
            setOptions([]);
            return;
        }

        let cancelled = false;
        field
            .loadOptions(parentValue)
            .then((loaded) => {
                if (!cancelled) setOptions(loaded);
            })
            .catch(() => {
                if (!cancelled) setOptions([]);
            });

        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [parentValue, field.options]);

    return (
        <SelectInput
            label={field.label}
            value={value}
            onChange={onChange}
            options={options}
            placeholder={field.clearable !== false ? (field.placeholder ?? 'Select an option') : undefined}
            disabled={needsParent && !parentValue}
        />
    );
}

export default function SearchPanel({ fields, values, onSearch, labels }: Props) {
    const text = { title: 'Search', reset: 'Reset', search: 'Search', ...labels };

    const defaults = Object.fromEntries(
        fields.filter((f) => f.defaultValue).map((f) => [f.key, f.defaultValue as string]),
    );
    const appliedKey = JSON.stringify(values);

    const [draft, setDraft] = useState<Record<string, string>>(values);
    const [resetKey, setResetKey] = useState(0);

    // Keep the form in sync when the URL changes (back/forward, reset)
    useEffect(() => {
        setDraft(values);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [appliedKey]);

    const setValue = (key: string, value: string) =>
        setDraft((prev) => {
            const next = { ...prev, [key]: value };
            for (const child of descendantsOf(fields, key)) delete next[child];
            return next;
        });

    const submit = (e: FormEvent) => {
        e.preventDefault();
        onSearch(draft);
    };

    const reset = () => {
        setDraft(defaults);
        setResetKey((k) => k + 1);
        onSearch(defaults);
    };

    return (
        <form onSubmit={submit} className="p-6">
            <div className="mb-4 flex items-center justify-between">
                <h2 className="text-lg font-bold">{text.title}</h2>
                <button
                    type="button"
                    onClick={reset}
                    className="text-sm font-medium text-red-700 hover:underline dark:text-red-400"
                >
                    {text.reset}
                </button>
            </div>

            <div
                key={`${resetKey}-${appliedKey}`}
                className="grid grid-cols-1 gap-x-4 gap-y-6 md:grid-cols-3"
            >
                {fields.map((f) => {
                    const value = draft[f.key] ?? '';

                    return (
                        <div key={f.key} className={spanClass[f.span ?? 1]}>
                            {f.type === 'date' ? (
                                <DateInput label={f.label} value={value} onChange={(v) => setValue(f.key, v)} />
                            ) : f.type === 'select' ? (
                                <SelectField
                                    field={f}
                                    value={value}
                                    parentValue={f.dependsOn ? (draft[f.dependsOn] ?? '') : ''}
                                    onChange={(v) => setValue(f.key, v)}
                                />
                            ) : (
                                <TextInput
                                    label={f.label}
                                    value={value}
                                    placeholder={f.placeholder}
                                    onChange={(v) => setValue(f.key, v)}
                                    clearable
                                />
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="mt-6 flex justify-end">
                <button
                    type="submit"
                    className="rounded-lg bg-primary-600 px-4 py-1.5 text-sm text-white hover:bg-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900"
                >
                    {text.search}
                </button>
            </div>
        </form>
    );
}