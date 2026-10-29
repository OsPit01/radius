import * as React from 'react';

import { cn } from '@/shared/lib/utils';

// Фокус — настоящий outline (виден и в режиме высокой контрастности). Hover только у доступной кнопки (enabled:),
// чтобы заблокированная (в т.ч. на время отправки) не реагировала на наведение.
const BASE_CLASS =
    "inline-flex shrink-0 cursor-pointer items-center justify-center gap-2 rounded-md text-sm font-medium whitespace-nowrap transition-[color,background-color,border-color] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4";

// В режиме высокой контрастности браузер перекрашивает фон системным цветом, и кнопка без рамки теряет границы —
// поэтому заливочным вариантам там добавляется рамка системного цвета.
const FORCED_COLORS_BORDER = 'forced-colors:border forced-colors:border-[color:ButtonText]';

const VARIANT_CLASS = {
    default: cn('bg-primary text-primary-foreground enabled:hover:bg-primary/90', FORCED_COLORS_BORDER),
    destructive: cn(
        'bg-destructive text-destructive-foreground focus-visible:outline-destructive enabled:hover:bg-destructive/90',
        FORCED_COLORS_BORDER,
    ),
    outline: 'border border-input bg-background shadow-xs enabled:hover:bg-accent enabled:hover:text-accent-foreground',
    secondary: cn('bg-secondary text-secondary-foreground enabled:hover:bg-secondary/80', FORCED_COLORS_BORDER),
    ghost: 'enabled:hover:bg-accent enabled:hover:text-accent-foreground',
    link: 'text-primary underline-offset-4 enabled:hover:underline',
};

// На сенсорных экранах (pointer-coarse) область нажатия увеличивается до 44px; min-*, а не h-*, чтобы контент мог её только расширять.
const SIZE_CLASS = {
    default: 'h-9 px-4 py-2 pointer-coarse:min-h-11 has-[>svg]:px-3',
    xs: "h-6 gap-1 rounded-md px-2 text-xs pointer-coarse:min-h-11 has-[>svg]:px-1.5 [&_svg:not([class*='size-'])]:size-3",
    sm: 'h-8 gap-1.5 rounded-md px-3 pointer-coarse:min-h-11 has-[>svg]:px-2.5',
    lg: 'h-10 rounded-md px-6 pointer-coarse:min-h-11 has-[>svg]:px-4',
    icon: 'size-9 pointer-coarse:min-h-11 pointer-coarse:min-w-11',
    'icon-xs': "size-6 rounded-md pointer-coarse:min-h-11 pointer-coarse:min-w-11 [&_svg:not([class*='size-'])]:size-3",
    'icon-sm': 'size-8 pointer-coarse:min-h-11 pointer-coarse:min-w-11',
    'icon-lg': 'size-10 pointer-coarse:min-h-11 pointer-coarse:min-w-11',
};

type ButtonVariant = keyof typeof VARIANT_CLASS;
type ButtonSize = keyof typeof SIZE_CLASS;

/** Классы кнопки — можно повесить и на другой элемент, например на <Link>. */
function buttonVariants({
    variant = 'default',
    size = 'default',
    className,
}: {
    variant?: ButtonVariant | null;
    size?: ButtonSize | null;
    className?: string;
} = {}) {
    return cn(BASE_CLASS, VARIANT_CLASS[variant ?? 'default'], SIZE_CLASS[size ?? 'default'], className);
}

function Button({
    className,
    variant = 'default',
    size = 'default',
    ...props
}: React.ComponentProps<'button'> & {
    variant?: ButtonVariant | null;
    size?: ButtonSize | null;
}) {
    return (
        <button
            data-slot="button"
            data-variant={variant}
            data-size={size}
            className={buttonVariants({ variant, size, className })}
            {...props}
        />
    );
}

export { Button, buttonVariants };
