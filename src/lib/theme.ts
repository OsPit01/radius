// ============================================================
// src/lib/theme.ts - ТЕМА: пользовательские цвета (3 базовых на режим)
//
// Режим (светлая / тёмная / системная) хранит next-themes (ключ THEME_MODE_STORAGE_KEY).
// Здесь — переопределения трёх базовых цветов (--background, --foreground, --primary)
// для каждого режима. Все остальные цвета сайта выводятся из них в globals.css.
//
// Переопределения лежат в localStorage (на устройстве) и применяются как
// <style id="radius-theme-colors"> в <head>. Первый раз этот <style> создаёт
// inline-скрипт из _document ещё ДО отрисовки страницы — поэтому нет «вспышки».
// ============================================================
import { useMemo, useSyncExternalStore } from 'react';

import { hasPermission } from '@/lib/constants/roles';

export type ThemeMode = 'light' | 'dark';
export type ThemeSeedKey = 'background' | 'foreground' | 'primary';
export type ThemeSeeds = Record<ThemeSeedKey, string>;
export type ThemeOverrides = Partial<Record<ThemeMode, Partial<ThemeSeeds>>>;

export const THEME_MODES: readonly ThemeMode[] = ['light', 'dark'];
export const THEME_SEED_KEYS: readonly ThemeSeedKey[] = ['primary', 'background', 'foreground'];

export const THEME_MODE_STORAGE_KEY = 'radius-theme';
export const THEME_COLORS_STORAGE_KEY = 'radius-theme-colors';
const THEME_STYLE_ID = 'radius-theme-colors';

// Пока настройка темы доступна только суперадминам (и выше).
export function canCustomizeTheme(role: string | undefined | null): boolean {
    return !!role && hasPermission(role, 'superadmin');
}

// ===== ГОТОВЫЕ ТЕМЫ =====
export type ThemePreset = {
    id: string;
    label: string;
    colors: Record<ThemeMode, ThemeSeeds>;
};

/** Название темы по умолчанию (она же — «нет переопределений»: цвета берутся из globals.css). */
export const DEFAULT_THEME_LABEL = 'По умолчанию';

/**
 * Цвета темы по умолчанию (в стиле ChatGPT) — копия :root / .dark из globals.css.
 * Нужна только затем, чтобы узнать, что сохранённые цвета совпадают с темой по умолчанию
 * (например, их записала прошлая версия «ChatGPT»). Меняя globals.css, меняйте и это.
 */
export const DEFAULT_THEME_COLORS: Record<ThemeMode, ThemeSeeds> = {
    light: { background: '#ffffff', foreground: '#0d0d0d', primary: '#ff6200' },
    dark: { background: '#000000', foreground: '#ffffff', primary: '#ff6200' },
};

// Остальные темы — с характером. id нигде не хранится (в localStorage лежат только цвета),
// так что переименовывать их безопасно.
export const THEME_PRESETS: readonly ThemePreset[] = [
    {
        id: 'blue-whale',
        label: 'Синий кит',
        colors: {
            light: { background: '#f0f7ff', foreground: '#0f2942', primary: '#0369a1' },
            dark: { background: '#07111c', foreground: '#e6f1fb', primary: '#38bdf8' },
        },
    },
    {
        id: 'mojito',
        label: 'Мохито',
        colors: {
            light: { background: '#f3f7f2', foreground: '#1c2b1f', primary: '#15803d' },
            dark: { background: '#0a110c', foreground: '#e8f1e9', primary: '#4ade80' },
        },
    },
    {
        id: 'flamingo',
        label: 'Фламинго',
        colors: {
            light: { background: '#fff5f7', foreground: '#3b1220', primary: '#e11d48' },
            dark: { background: '#140a0d', foreground: '#fbe9ee', primary: '#fb7185' },
        },
    },
    {
        id: 'penguin',
        label: 'Пингвин',
        colors: {
            light: { background: '#ffffff', foreground: '#111111', primary: '#111111' },
            dark: { background: '#0a0a0a', foreground: '#fafafa', primary: '#fafafa' },
        },
    },
];

// ===== ЦВЕТА =====
const HEX_COLOR = /^#[0-9a-f]{6}$/i;

/** "#abc" / "ABCDEF" / "#AbCdEf" → "#aabbcc" / "#abcdef"; невалидное → null. */
export function normalizeHex(value: string): string | null {
    let hex = value.trim().toLowerCase();
    if (!hex.startsWith('#')) {
        hex = `#${hex}`;
    }
    if (/^#[0-9a-f]{3}$/.test(hex)) {
        hex = `#${hex[1]}${hex[1]}${hex[2]}${hex[2]}${hex[3]}${hex[3]}`;
    }
    return HEX_COLOR.test(hex) ? hex : null;
}

// ===== CSS =====
/**
 * Переопределения → CSS. Светлые — для html без .dark, тёмные — для html.dark;
 * специфичность выше, чем у :root / .dark в globals.css, поэтому порядок
 * подключения стилей не важен.
 *
 * ВАЖНО: функция самодостаточна (никаких внешних ссылок) — её исходник
 * встраивается в inline-скрипт (THEME_INIT_SCRIPT), чтобы логика
 * первого рендера и логика редактора не расходились.
 */
export function buildThemeCss(overrides: unknown): string {
    const hex = /^#[0-9a-f]{6}$/i;
    const selectors = { light: 'html:not(.dark)', dark: 'html.dark' };
    const keys = ['background', 'foreground', 'primary'];
    const modes = ['light', 'dark'] as const;
    const source = (overrides ?? {}) as Record<string, Record<string, unknown> | undefined>;

    let css = '';
    for (const mode of modes) {
        const seeds = source[mode];
        if (!seeds) {
            continue;
        }
        const declarations: string[] = [];
        for (const key of keys) {
            const value = seeds[key];
            if (typeof value === 'string' && hex.test(value)) {
                declarations.push(`--${key}:${value}`);
            }
        }
        if (declarations.length > 0) {
            css += `${selectors[mode]}{${declarations.join(';')}}`;
        }
    }
    return css;
}

/** Скрипт для <head>: применяет сохранённые цвета до первой отрисовки. */
export const THEME_INIT_SCRIPT = `(function(){try{var raw=localStorage.getItem(${JSON.stringify(
    THEME_COLORS_STORAGE_KEY,
)});if(!raw)return;var css=(${buildThemeCss.toString()})(JSON.parse(raw));if(!css)return;var el=document.createElement('style');el.id=${JSON.stringify(
    THEME_STYLE_ID,
)};el.textContent=css;document.head.appendChild(el)}catch(e){}})()`;

// ===== ХРАНИЛИЩЕ (localStorage + подписка для React) =====
const listeners = new Set<() => void>();

function readRaw(): string | null {
    try {
        return localStorage.getItem(THEME_COLORS_STORAGE_KEY);
    } catch {
        return null;
    }
}

/** Достаём только валидные hex-цвета: в localStorage могло оказаться что угодно. */
function parseOverrides(raw: string | null): ThemeOverrides {
    if (!raw) {
        return {};
    }
    try {
        const data = JSON.parse(raw) as Record<string, Record<string, unknown> | undefined> | null;
        const result: ThemeOverrides = {};
        for (const mode of THEME_MODES) {
            const seeds: Partial<ThemeSeeds> = {};
            for (const key of THEME_SEED_KEYS) {
                const value = data?.[mode]?.[key];
                const hex = typeof value === 'string' ? normalizeHex(value) : null;
                if (hex) {
                    seeds[key] = hex;
                }
            }
            if (Object.keys(seeds).length > 0) {
                result[mode] = seeds;
            }
        }
        return result;
    } catch {
        return {};
    }
}

function applyStyle(overrides: ThemeOverrides) {
    let el = document.getElementById(THEME_STYLE_ID);
    if (!el) {
        el = document.createElement('style');
        el.id = THEME_STYLE_ID;
        document.head.appendChild(el);
    }
    el.textContent = buildThemeCss(overrides);
}

/** Сохраняет переопределения и мгновенно применяет их к странице. */
export function setThemeOverrides(next: ThemeOverrides) {
    const hasAny = THEME_MODES.some((mode) => Object.keys(next[mode] ?? {}).length > 0);
    try {
        if (hasAny) {
            localStorage.setItem(THEME_COLORS_STORAGE_KEY, JSON.stringify(next));
        } else {
            localStorage.removeItem(THEME_COLORS_STORAGE_KEY);
        }
    } catch {
        // localStorage недоступен (приватный режим и т.п.) — тема применится до перезагрузки.
    }
    applyStyle(next);
    listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
    listeners.add(listener);
    // 'storage' приходит из других вкладок — синхронизируем и их.
    const onStorage = (event: StorageEvent) => {
        if (event.key === THEME_COLORS_STORAGE_KEY || event.key === null) {
            applyStyle(parseOverrides(readRaw()));
            listener();
        }
    };
    window.addEventListener('storage', onStorage);
    return () => {
        listeners.delete(listener);
        window.removeEventListener('storage', onStorage);
    };
}

/** Текущие пользовательские цвета. На сервере и до гидрации — пусто. */
export function useThemeOverrides(): ThemeOverrides {
    const raw = useSyncExternalStore(subscribe, readRaw, () => null);
    return useMemo(() => parseOverrides(raw), [raw]);
}
