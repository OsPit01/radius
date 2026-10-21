import type { ReactNode } from 'react';

import { ThemeProvider as NextThemesProvider } from 'next-themes';

import { THEME_MODE_STORAGE_KEY } from '@/lib/theme';

/**
 * Режим темы: светлая / тёмная / системная.
 * По умолчанию — системная (prefers-color-scheme), пока пользователь не выбрал иное.
 * Провайдер вешает класс `light` / `dark` на <html>; цвета для него лежат в globals.css.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
    return (
        <NextThemesProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            // Без этого при переключении темы элементы «плывут» через CSS-transition.
            disableTransitionOnChange
            storageKey={THEME_MODE_STORAGE_KEY}
        >
            {children}
        </NextThemesProvider>
    );
}
