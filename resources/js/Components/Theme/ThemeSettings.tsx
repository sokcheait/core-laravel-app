import { useState, type CSSProperties } from 'react';
import { Check, Moon, Sun } from 'lucide-react';
import useT from '@/hooks/useT';
import {
    themes,
    applyTheme,
    getSavedTheme,
    enableThemeTransition,
    type ThemeName,
} from '@/config/themes';

interface Props {
    dark: boolean;
    onDarkChange: (dark: boolean) => void;
}

function saveTheme(name: ThemeName) {
    try {
        localStorage.setItem('primary-color', name);
    } catch {
        /* storage unavailable */
    }
}

const label = (name: string) => name.charAt(0).toUpperCase() + name.slice(1);
const delay = (ms: number): CSSProperties => ({ animationDelay: `${ms}ms` });

export default function ThemeSettings({ dark, onDarkChange }: Props) {
    const { t } = useT();
    const [color, setColor] = useState<ThemeName>(getSavedTheme);

    const changeColor = (name: ThemeName) => {
        enableThemeTransition();
        applyTheme(name);
        saveTheme(name);
        setColor(name);
    };

    const changeMode = (next: boolean) => {
        if (next === dark) return;
        enableThemeTransition();
        onDarkChange(next);
    };

    const modes = [
        { value: false, text: 'Light', Icon: Sun },
        { value: true, text: 'Dark', Icon: Moon },
    ];

    return (
        <div className="space-y-8 border-b border-gray-100 px-4 py-3 dark:border-white/10">
            {/* Mode */}
            <div className="theme-rise" style={delay(100)}>
                <p className="mb-3 text-xs font-medium text-gray-500 dark:text-gray-400">{t('Mode')}</p>
                <div
                    role="radiogroup"
                    aria-label={t('Mode')}
                    className="relative grid grid-cols-2 gap-1 rounded-lg bg-gray-100 p-1 dark:bg-white/5"
                >
                    {/* Sliding thumb */}
                    <span
                        aria-hidden="true"
                        className={`absolute inset-y-1 left-1 w-[calc(50%-6px)] rounded-md bg-white shadow-sm transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] motion-reduce:transition-none dark:bg-gray-700 ${
                            dark ? 'translate-x-[calc(100%+4px)]' : 'translate-x-0'
                        }`}
                    />
                    {modes.map(({ value, text, Icon }) => {
                        const active = dark === value;
                        return (
                            <button
                                key={text}
                                type="button"
                                role="radio"
                                aria-checked={active}
                                onClick={() => changeMode(value)}
                                className={`relative z-10 flex items-center justify-center gap-1.5 rounded-md py-1.5 text-sm font-medium transition-colors duration-300 ${
                                    active
                                        ? 'text-gray-950 dark:text-white'
                                        : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
                                }`}
                            >
                                <Icon
                                    className={`size-4 transition-transform duration-500 motion-reduce:transition-none ${
                                        active ? 'rotate-[360deg] scale-110' : ''
                                    }`}
                                />
                                {t(text)}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Color */}
            <div className="theme-rise" style={delay(180)}>
                <p className="mb-3 flex items-center justify-between text-xs font-medium text-gray-500 dark:text-gray-400">
                    <span>{t('Theme color')}</span>
                    <span key={color} className="theme-rise text-gray-700 dark:text-gray-200">
                        {t(label(color))}
                    </span>
                </p>
                <div role="radiogroup" aria-label={t('Theme color')} className="flex flex-wrap gap-3">
                    {(Object.keys(themes) as ThemeName[]).map((name, i) => {
                        const active = color === name;
                        const hex = themes[name][500];
                        return (
                            <button
                                key={name}
                                type="button"
                                role="radio"
                                aria-checked={active}
                                aria-label={t(label(name))}
                                title={t(label(name))}
                                onClick={() => changeColor(name)}
                                style={{
                                    backgroundColor: hex,
                                    '--tw-ring-color': hex,
                                    animationDelay: `${260 + i * 50}ms`,
                                } as CSSProperties}
                                className={`theme-pop grid size-9 place-items-center rounded-full text-white ring-offset-white transition duration-300 hover:scale-110 active:scale-90 motion-reduce:transition-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-950 dark:ring-offset-gray-900 dark:focus-visible:outline-white ${
                                    active ? 'ring-2 ring-offset-2' : 'ring-0 ring-offset-0'
                                }`}
                            >
                                {active && <Check key={color} className="theme-check size-4" strokeWidth={3} />}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}