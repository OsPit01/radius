import * as React from 'react';

import { useUserInvalid } from '@/shared/lib/use-user-invalid';
import { cn } from '@/shared/lib/utils';
import { useFieldControl } from '@/shared/ui/field';

function Input({
    className,
    type,
    id,
    onBlur,
    onInput,
    onInvalid,
    'aria-invalid': ariaInvalid,
    'aria-describedby': describedBy,
    ...props
}: React.ComponentProps<'input'>) {
    const field = useFieldControl();
    const userInvalid = useUserInvalid();

    return (
        <input
            type={type}
            id={id ?? field?.id}
            aria-describedby={cn(describedBy, field?.describedBy) || undefined}
            // aria-invalid — единственный источник состояния «ошибка»: и для читалок, и для стилей ниже
            aria-invalid={ariaInvalid ?? (field?.invalid || userInvalid.invalid ? true : undefined)}
            onBlur={(event) => {
                onBlur?.(event);
                userInvalid.onBlur(event.currentTarget);
            }}
            onInput={(event) => {
                onInput?.(event);
                userInvalid.onInput(event.currentTarget);
            }}
            onInvalid={(event) => {
                onInvalid?.(event);
                userInvalid.onInvalid(event.currentTarget);
            }}
            data-slot="input"
            className={cn(
                // 16px на сенсорных экранах: меньший шрифт заставляет iOS приближать страницу при фокусе
                'h-9 w-full min-w-0 rounded-md border border-input bg-transparent px-3 py-1 text-base shadow-xs transition-[color,background-color,border-color] selection:bg-primary selection:text-primary-foreground file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 pointer-coarse:min-h-12 md:pointer-fine:text-sm',
                // фокус — настоящий outline, он остаётся видимым в режиме высокой контрастности
                'focus-visible:border-ring focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                'aria-invalid:border-destructive focus-visible:aria-invalid:border-destructive focus-visible:aria-invalid:outline-destructive',
                className,
            )}
            {...props}
        />
    );
}

export { Input };
