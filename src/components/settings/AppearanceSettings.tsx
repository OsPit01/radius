import { type CSSProperties, useEffect, useState, useSyncExternalStore } from 'react';

import { useTheme } from 'next-themes';

import {
    DEFAULT_THEME_COLORS,
    DEFAULT_THEME_LABEL,
    normalizeHex,
    setThemeOverrides,
    THEME_MODES,
    THEME_PRESETS,
    THEME_SEED_KEYS,
    type ThemeMode,
    type ThemeOverrides,
    type ThemeSeedKey,
    type ThemeSeeds,
    useThemeOverrides,
} from '@/lib/theme';

const MODE_OPTIONS = [
    { value: 'system', label: 'Как в системе' },
    { value: 'light', label: 'Светлая' },
    { value: 'dark', label: 'Тёмная' },
] as const;

const COLOR_ROWS: { key: ThemeSeedKey; label: string; hint: string }[] = [
    { key: 'primary', label: 'Акцент', hint: 'Кнопки, ссылки, выделение' },
    { key: 'background', label: 'Фон', hint: 'Фон страниц' },
    { key: 'foreground', label: 'Текст', hint: 'Основной цвет текста и значков' },
];

/** false на сервере и при гидрации, true — после: next-themes знает выбранный режим только на клиенте. */
const subscribeNoop = () => () => undefined;
function useMounted() {
    return useSyncExternalStore(
        subscribeNoop,
        () => true,
        () => false,
    );
}

const DEFAULT_PRESET = 'default';
const CUSTOM_PRESET = 'custom';

/**
 * Что сейчас реально применено к странице: режим (по классу на <html>) и три базовых цвета.
 * Читаем из самого CSS, а не дублируем значения по умолчанию в JS — единственный источник
 * правды остаётся globals.css. MutationObserver ловит переключение режима: класс на <html>
 * next-themes выставляет в своём эффекте, уже ПОСЛЕ эффектов дочерних компонентов.
 */
function useAppliedTheme(overrides: ThemeOverrides) {
    const [applied, setApplied] = useState<{ mode: ThemeMode; seeds: ThemeSeeds } | null>(null);

    useEffect(() => {
        const root = document.documentElement;
        const read = () => {
            const style = getComputedStyle(root);
            setApplied({
                mode: root.classList.contains('dark') ? 'dark' : 'light',
                seeds: {
                    background: style.getPropertyValue('--background').trim(),
                    foreground: style.getPropertyValue('--foreground').trim(),
                    primary: style.getPropertyValue('--primary').trim(),
                },
            });
        };
        read();
        const observer = new MutationObserver(read);
        observer.observe(root, { attributes: true, attributeFilter: ['class'] });
        return () => observer.disconnect();
    }, [overrides]);

    return applied;
}

/** Какая готовая тема сейчас выбрана: по умолчанию / одна из списка / свои цвета. */
function detectPreset(overrides: ThemeOverrides): string {
    // Тема по умолчанию — это и «ничего не переопределено», и «переопределено теми же цветами».
    const isDefault = THEME_MODES.every((mode) =>
        THEME_SEED_KEYS.every((key) => {
            const value = overrides[mode]?.[key];
            return value === undefined || value === DEFAULT_THEME_COLORS[mode][key];
        }),
    );
    if (isDefault) {
        return DEFAULT_PRESET;
    }
    const match = THEME_PRESETS.find((preset) =>
        THEME_MODES.every((mode) =>
            THEME_SEED_KEYS.every((key) => overrides[mode]?.[key] === preset.colors[mode][key]),
        ),
    );
    return match?.id ?? CUSTOM_PRESET;
}

// Миниатюры режимов должны выглядеть как светлая / тёмная тема ВНЕ ЗАВИСИМОСТИ от текущей
// темы сайта, поэтому цвета тут намеренно зафиксированы и не берутся из токенов.
const PREVIEW_TONES = {
    light: { bg: '#ffffff', side: '#f0f0f0', line: '#d4d4d4' },
    dark: { bg: '#1c1c1e', side: '#2c2c2e', line: '#48484a' },
} as const;

function MiniUi({ tone, style }: { tone: ThemeMode; style?: CSSProperties }) {
    const colors = PREVIEW_TONES[tone];
    return (
        <div
            className="absolute inset-0 flex"
            style={{ backgroundColor: colors.bg, ...style }}
        >
            <div
                className="w-1/4"
                style={{ backgroundColor: colors.side }}
            />
            <div className="flex flex-1 flex-col justify-center gap-1.5 px-2">
                <div
                    className="h-1 w-3/4 rounded-full"
                    style={{ backgroundColor: colors.line }}
                />
                <div
                    className="h-1 w-1/2 rounded-full"
                    style={{ backgroundColor: colors.line }}
                />
                <div className="h-1 w-2/3 rounded-full bg-primary" />
            </div>
        </div>
    );
}

function ModePreview({ value }: { value: (typeof MODE_OPTIONS)[number]['value'] }) {
    return (
        <div className="relative h-14 w-20 overflow-hidden rounded-lg border border-border">
            {value === 'system' ? (
                <>
                    <MiniUi tone="light" />
                    <MiniUi
                        tone="dark"
                        style={{ clipPath: 'inset(0 0 0 50%)' }}
                    />
                </>
            ) : (
                <MiniUi tone={value} />
            )}
        </div>
    );
}

function ColorField({
    label,
    hint,
    value,
    onChange,
}: {
    label: string;
    hint: string;
    value: string;
    onChange: (hex: string) => void;
}) {
    // Пока пользователь печатает hex, показываем то, что он набрал (draft); null — не редактируется.
    const [draft, setDraft] = useState<string | null>(null);
    const normalized = normalizeHex(value) ?? '#000000';

    return (
        <div className="flex items-center justify-between gap-4 py-4">
            <div>
                <p className="text-base font-medium">{label}</p>
                <p className="text-xs text-muted-foreground">{hint}</p>
            </div>
            <label className="flex cursor-pointer items-center gap-2.5 rounded-full border bg-background py-1.5 pr-4 pl-2 transition-colors focus-within:border-primary hover:border-primary">
                <input
                    type="color"
                    aria-label={label}
                    value={normalized}
                    onChange={(e) => onChange(e.target.value)}
                    className="h-6 w-6 cursor-pointer appearance-none rounded-full border-0 bg-transparent p-0 [&::-moz-color-swatch]:rounded-full [&::-moz-color-swatch]:border-0 [&::-webkit-color-swatch]:rounded-full [&::-webkit-color-swatch]:border [&::-webkit-color-swatch-wrapper]:p-0"
                />
                <input
                    type="text"
                    aria-label={`${label}: hex`}
                    value={draft ?? normalized.toUpperCase()}
                    maxLength={7}
                    spellCheck={false}
                    onChange={(e) => {
                        setDraft(e.target.value);
                        const hex = normalizeHex(e.target.value);
                        if (hex) {
                            onChange(hex);
                        }
                    }}
                    onBlur={() => setDraft(null)}
                    className="w-[4.5rem] bg-transparent font-mono text-sm outline-none"
                />
            </label>
        </div>
    );
}

/**
 * «Внешний вид»: режим (системная / светлая / тёмная) и три базовых цвета.
 * Всё применяется сразу и хранится на этом устройстве (см. src/lib/theme.ts).
 * Показывается только тем, кому разрешено (canCustomizeTheme) — проверка на странице.
 */
export function AppearanceSettings() {
    const { theme, setTheme } = useTheme();
    const mounted = useMounted();
    const overrides = useThemeOverrides();
    const applied = useAppliedTheme(overrides);

    const mode = applied?.mode;
    const modeLabel = mode === 'dark' ? 'тёмной' : 'светлой';
    const preset = detectPreset(overrides);
    const modeHasOverrides = !!mode && Object.keys(overrides[mode] ?? {}).length > 0;

    const setSeed = (key: ThemeSeedKey, hex: string) => {
        if (mode) {
            setThemeOverrides({ ...overrides, [mode]: { ...overrides[mode], [key]: hex } });
        }
    };

    const applyPreset = (id: string) => {
        if (id === DEFAULT_PRESET) {
            setThemeOverrides({});
            return;
        }
        const found = THEME_PRESETS.find((item) => item.id === id);
        if (found) {
            setThemeOverrides({ light: { ...found.colors.light }, dark: { ...found.colors.dark } });
        }
    };

    return (
        <section className="mt-6 rounded-[15px] bg-card p-10 shadow-[0_2px_8px_rgba(0,0,0,0.08)] max-[480px]:p-4 max-md:p-5">
            <h2 className="text-[22px] font-bold max-md:text-xl">Внешний вид</h2>
            <p className="mt-1 text-sm text-muted-foreground">
                По умолчанию сайт повторяет тему вашей системы. Настройки применяются сразу и хранятся на этом
                устройстве.
            </p>

            {/* РЕЖИМ */}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-2xl border p-5">
                <span className="text-base font-medium">Режим</span>
                <div
                    className="flex gap-3"
                    role="group"
                    aria-label="Режим"
                >
                    {MODE_OPTIONS.map((option) => {
                        const active = mounted && theme === option.value;
                        return (
                            <button
                                key={option.value}
                                type="button"
                                aria-pressed={active}
                                onClick={() => setTheme(option.value)}
                                className={`flex cursor-pointer flex-col items-center gap-1.5 rounded-xl border-2 p-1.5 transition-colors ${
                                    active ? 'border-primary' : 'border-transparent hover:border-border'
                                }`}
                            >
                                <ModePreview value={option.value} />
                                <span className="text-xs text-muted-foreground">{option.label}</span>
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* ТЕМА И ЦВЕТА */}
            <div className="mt-4 rounded-2xl border px-5">
                <div className="flex items-center justify-between gap-4 border-b py-4">
                    <span className="text-base font-medium">Тема</span>
                    <select
                        aria-label="Готовая тема"
                        value={preset}
                        onChange={(e) => applyPreset(e.target.value)}
                        className="cursor-pointer rounded-full border bg-background px-4 py-2 text-sm outline-none focus:border-primary"
                    >
                        <option value={DEFAULT_PRESET}>{DEFAULT_THEME_LABEL}</option>
                        {THEME_PRESETS.map((item) => (
                            <option
                                key={item.id}
                                value={item.id}
                            >
                                {item.label}
                            </option>
                        ))}
                        {preset === CUSTOM_PRESET && <option value={CUSTOM_PRESET}>Свои цвета</option>}
                    </select>
                </div>

                <div className="divide-y">
                    {applied &&
                        COLOR_ROWS.map((row) => (
                            <ColorField
                                key={`${applied.mode}-${row.key}`}
                                label={row.label}
                                hint={row.hint}
                                value={applied.seeds[row.key]}
                                onChange={(hex) => setSeed(row.key, hex)}
                            />
                        ))}
                </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                <p className="max-w-xl text-xs text-muted-foreground">
                    Сейчас вы настраиваете цвета {modeLabel} темы — переключите режим, чтобы настроить вторую. Остальные
                    оттенки (карточки, границы, второстепенный текст) рассчитываются из этих трёх цветов автоматически.
                </p>
                {modeHasOverrides && mode && (
                    <button
                        type="button"
                        onClick={() => setThemeOverrides({ ...overrides, [mode]: undefined })}
                        className="cursor-pointer rounded-full border px-4 py-1.5 text-sm transition-colors hover:bg-muted"
                    >
                        Сбросить цвета {modeLabel} темы
                    </button>
                )}
            </div>
        </section>
    );
}
