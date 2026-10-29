import * as React from 'react';

import { useUserInvalid } from '@/shared/lib/use-user-invalid';
import { cn } from '@/shared/lib/utils';
import { useFieldControl } from '@/shared/ui/field';

/*
 * Многострочное поле — тот же Input, только <textarea>: id, aria-describedby и aria-invalid берутся из <Field>,
 * а :user-invalid превращается в aria-invalid (см. use-user-invalid). Высоту можно менять вручную по вертикали:
 * запрет resize без запасного способа увеличить поле ухудшает ввод длинного текста.
 *
 * Поле растёт вместе с текстом (field-sizing), но не выше 10 строк, а ниже min-h не сжимается. Где field-sizing нет
 * (Chrome/Edge < 123, Safari < 26.2, Firefox < 152), остаётся обычная высота по rows. Чтобы отключить рост у конкретного
 * поля, передайте `field-sizing-fixed!` (cn не разрешает конфликты классов).
 */
function Textarea({
    className,
    id,
    onBlur,
    onInput,
    onInvalid,
    'aria-invalid': ariaInvalid,
    'aria-describedby': describedBy,
    ...props
}: React.ComponentProps<'textarea'>) {
    const field = useFieldControl();
    const userInvalid = useUserInvalid();

    return (
        <textarea
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
            data-slot="textarea"
            className={cn(
                // 16px на сенсорных экранах: меньший шрифт заставляет iOS приближать страницу при фокусе
                'field-sizing-content max-h-[10lh] min-h-24 w-full min-w-0 resize-y rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-xs transition-[color,background-color,border-color] selection:bg-primary selection:text-primary-foreground placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50 md:pointer-fine:text-sm',
                // фокус — настоящий outline, он остаётся видимым в режиме высокой контрастности
                'focus-visible:border-ring focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring',
                'aria-invalid:border-destructive focus-visible:aria-invalid:border-destructive focus-visible:aria-invalid:outline-destructive',
                className,
            )}
            {...props}
        />
    );
}

export { Textarea };
