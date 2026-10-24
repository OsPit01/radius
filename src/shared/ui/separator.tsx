import * as React from 'react';

import { cn } from '@/shared/lib/utils';

function Separator({
    className,
    orientation = 'horizontal',
    decorative = true,
    ...props
}: React.ComponentProps<'div'> & {
    orientation?: 'horizontal' | 'vertical';
    /** Чисто визуальная линия — скрыта от скринридеров. */
    decorative?: boolean;
}) {
    return (
        <div
            data-slot="separator"
            data-orientation={orientation}
            role={decorative ? 'none' : 'separator'}
            aria-orientation={!decorative && orientation === 'vertical' ? 'vertical' : undefined}
            className={cn(
                'shrink-0 bg-border data-[orientation=horizontal]:h-px data-[orientation=horizontal]:w-full data-[orientation=vertical]:h-full data-[orientation=vertical]:w-px',
                className,
            )}
            {...props}
        />
    );
}

export { Separator };
