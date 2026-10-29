import * as React from 'react';

import { cn } from '@/shared/lib/utils';

/*
 * Линия — это border, а не фон: в режиме высокой контрастности (forced-colors) браузер заменяет background
 * системным цветом холста, и фоновая «линия» исчезает, а border остаётся видимой.
 * Горизонтальная — нативный <hr>; вертикальной нативного элемента нет, поэтому <div role="separator">.
 */
function Separator({
    className,
    orientation = 'horizontal',
    decorative = true,
    ...props
}: React.ComponentProps<'hr'> & {
    orientation?: 'horizontal' | 'vertical';
    /** Чисто визуальная линия — скрыта от скринридеров. */
    decorative?: boolean;
}) {
    const classes = cn(
        'shrink-0',
        'data-[orientation=horizontal]:h-0 data-[orientation=horizontal]:w-full data-[orientation=horizontal]:border-t',
        'data-[orientation=vertical]:h-full data-[orientation=vertical]:w-0 data-[orientation=vertical]:border-s',
        className,
    );

    if (orientation === 'vertical') {
        return (
            <div
                data-slot="separator"
                data-orientation={orientation}
                role={decorative ? 'none' : 'separator'}
                aria-orientation={decorative ? undefined : 'vertical'}
                className={classes}
                {...props}
            />
        );
    }

    return (
        <hr
            data-slot="separator"
            data-orientation={orientation}
            role={decorative ? 'none' : undefined}
            className={classes}
            {...props}
        />
    );
}

export { Separator };
