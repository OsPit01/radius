import * as React from 'react';

import { Warning } from '@/components/icons';
import { cn } from '@/shared/lib/utils';
import { Label } from '@/shared/ui/label';
import { Separator } from '@/shared/ui/separator';

/*
 * Field связывает подпись, подсказку и ошибку с полем без ручных id:
 *   <Field invalid={…}> <FieldLabel>Город</FieldLabel> <Input /> <FieldDescription /> <FieldError /> </Field>
 * - FieldLabel получает htmlFor, а Input / SelectTrigger — id поля;
 * - у поля появляется aria-describedby на FieldDescription и FieldError (только пока они на странице);
 * - invalid → aria-invalid у поля.
 * Явные id / aria-describedby / aria-invalid, переданные полю, имеют приоритет.
 * Если внутри Field несколько полей (например, радио-кнопки), задавайте им свои id; группе можно дать
 * role="group" и aria-labelledby, а для группы с общей подписью лучше взять FieldSet + FieldLegend.
 */

type FieldContextValue = {
    controlId: string;
    descriptionId: string;
    errorId: string;
    describedBy: string | undefined;
    invalid: boolean;
    setHasDescription: (has: boolean) => void;
    setHasError: (has: boolean) => void;
};

const FieldContext = React.createContext<FieldContextValue | null>(null);

/** Свойства для поля ввода внутри <Field>; вне Field — null. */
function useFieldControl() {
    const context = React.useContext(FieldContext);
    return context ? { id: context.controlId, describedBy: context.describedBy, invalid: context.invalid } : null;
}

/** Сообщает Field, что подсказка/ошибка сейчас отрисована, чтобы поле ссылалось только на существующие элементы. */
function useRegister(present: boolean, setPresent: ((present: boolean) => void) | undefined) {
    React.useLayoutEffect(() => {
        if (!present || !setPresent) {
            return;
        }
        setPresent(true);
        return () => setPresent(false);
    }, [present, setPresent]);
}

function FieldSet({ className, ...props }: React.ComponentProps<'fieldset'>) {
    return (
        <fieldset
            data-slot="field-set"
            className={cn(
                'flex flex-col gap-3',
                'has-[>[data-slot=checkbox-group]]:gap-3 has-[>[data-slot=radio-group]]:gap-3',
                className,
            )}
            {...props}
        />
    );
}

function FieldLegend({
    className,
    variant = 'legend',
    ...props
}: React.ComponentProps<'legend'> & { variant?: 'legend' | 'label' }) {
    return (
        <legend
            data-slot="field-legend"
            data-variant={variant}
            className={cn(
                'mb-3 font-medium',
                'data-[variant=legend]:text-base',
                'data-[variant=label]:text-sm',
                className,
            )}
            {...props}
        />
    );
}

function FieldGroup({ className, ...props }: React.ComponentProps<'div'>) {
    return (
        <div
            data-slot="field-group"
            className={cn(
                'group/field-group @container/field-group flex w-full flex-col gap-7 data-[slot=checkbox-group]:gap-3 [&>[data-slot=field-group]]:gap-4',
                className,
            )}
            {...props}
        />
    );
}

const FIELD_ORIENTATION_CLASS = {
    vertical: 'flex-col [&>*]:w-full [&>.sr-only]:w-auto',
    horizontal: cn(
        'flex-row items-center',
        '[&>[data-slot=field-label]]:flex-auto',
        'has-[>[data-slot=field-content]]:items-start has-[>[data-slot=field-content]]:[&>[role=checkbox],[role=radio]]:mt-px',
    ),
    responsive: cn(
        'flex-col @md/field-group:flex-row @md/field-group:items-center [&>*]:w-full @md/field-group:[&>*]:w-auto [&>.sr-only]:w-auto',
        '@md/field-group:[&>[data-slot=field-label]]:flex-auto',
        '@md/field-group:has-[>[data-slot=field-content]]:items-start @md/field-group:has-[>[data-slot=field-content]]:[&>[role=checkbox],[role=radio]]:mt-px',
    ),
};

function Field({
    className,
    orientation = 'vertical',
    invalid = false,
    ...props
}: React.ComponentProps<'div'> & {
    orientation?: keyof typeof FIELD_ORIENTATION_CLASS | null;
    /** Поле с ошибкой: подпись краснеет, а полю выставляется aria-invalid. */
    invalid?: boolean;
}) {
    const baseId = React.useId();
    const [hasDescription, setHasDescription] = React.useState(false);
    const [hasError, setHasError] = React.useState(false);
    const descriptionId = `${baseId}-description`;
    const errorId = `${baseId}-error`;

    return (
        <FieldContext.Provider
            value={{
                controlId: `${baseId}-control`,
                descriptionId,
                errorId,
                describedBy: cn(hasDescription && descriptionId, hasError && errorId) || undefined,
                invalid,
                setHasDescription,
                setHasError,
            }}
        >
            <div
                data-slot="field"
                data-orientation={orientation}
                data-invalid={invalid}
                className={cn(
                    'group/field flex w-full gap-1',
                    FIELD_ORIENTATION_CLASS[orientation ?? 'vertical'],
                    className,
                )}
                {...props}
            />
        </FieldContext.Provider>
    );
}

function FieldContent({ className, ...props }: React.ComponentProps<'div'>) {
    return (
        <div
            data-slot="field-content"
            className={cn('group/field-content flex flex-1 flex-col gap-1.5 leading-snug', className)}
            {...props}
        />
    );
}

function FieldLabel({ className, htmlFor, ...props }: React.ComponentProps<typeof Label>) {
    const field = useFieldControl();

    return (
        <Label
            data-slot="field-label"
            htmlFor={htmlFor ?? field?.id}
            className={cn(
                'group/field-label peer/field-label flex w-fit gap-2 leading-snug group-data-[disabled=true]/field:opacity-50',
                // подпись краснеет и по пропу invalid, и когда браузер (через :user-invalid) выставил aria-invalid полю
                'group-has-[[aria-invalid=true]]/field:text-destructive group-data-[invalid=true]/field:text-destructive',
                'has-[>[data-slot=field]]:w-full has-[>[data-slot=field]]:flex-col has-[>[data-slot=field]]:rounded-md has-[>[data-slot=field]]:border [&>*]:data-[slot=field]:p-4',
                'has-data-[state=checked]:border-primary has-data-[state=checked]:bg-primary/5 dark:has-data-[state=checked]:bg-primary/10',
                className,
            )}
            {...props}
        />
    );
}

function FieldTitle({ className, ...props }: React.ComponentProps<'div'>) {
    return (
        <div
            data-slot="field-label"
            className={cn(
                'flex w-fit items-center gap-2 text-sm leading-snug font-medium group-data-[disabled=true]/field:opacity-50',
                className,
            )}
            {...props}
        />
    );
}

function FieldDescription({ className, id, ...props }: React.ComponentProps<'p'>) {
    const context = React.useContext(FieldContext);
    useRegister(true, context?.setHasDescription);

    return (
        <p
            data-slot="field-description"
            className={cn(
                'text-sm leading-normal font-normal text-muted-foreground group-has-[[data-orientation=horizontal]]/field:text-balance',
                'last:mt-0 nth-last-2:-mt-1 [[data-variant=legend]+&]:-mt-1.5',
                '[&>a]:underline [&>a]:underline-offset-4 [&>a:hover]:text-primary',
                className,
            )}
            {...props}
            id={context?.descriptionId ?? id}
        />
    );
}

/** Звёздочка «поле обязательное». Читалкам её не зачитываем: о required им сообщает сам <input required>. */
function FieldRequired({ className, ...props }: React.ComponentProps<'span'>) {
    return (
        <span
            aria-hidden="true"
            data-slot="field-required"
            className={cn('text-primary', className)}
            {...props}
        >
            *
        </span>
    );
}

function FieldSeparator({
    children,
    className,
    ...props
}: React.ComponentProps<'div'> & {
    children?: React.ReactNode;
}) {
    return (
        <div
            data-slot="field-separator"
            data-content={!!children}
            className={cn('relative -my-2 h-5 text-sm group-data-[variant=outline]/field-group:-mb-2', className)}
            {...props}
        >
            <Separator className="absolute inset-0 top-1/2" />
            {children && (
                <span
                    className="relative mx-auto block w-fit bg-background px-2 text-muted-foreground"
                    data-slot="field-separator-content"
                >
                    {children}
                </span>
            )}
        </div>
    );
}

function FieldError({
    className,
    children,
    errors,
    id,
    ...props
}: React.ComponentProps<'div'> & {
    errors?: Array<{ message?: string } | undefined>;
}) {
    const context = React.useContext(FieldContext);

    const content = React.useMemo(() => {
        if (children) {
            return children;
        }

        if (!errors?.length) {
            return null;
        }

        const uniqueErrors = [...new Map(errors.map((error) => [error?.message, error])).values()];

        if (uniqueErrors?.length == 1) {
            return uniqueErrors[0]?.message;
        }

        return (
            <ul className="ms-4 flex list-disc flex-col gap-1">
                {uniqueErrors.map((error, index) => error?.message && <li key={index}>{error.message}</li>)}
            </ul>
        );
    }, [children, errors]);

    useRegister(Boolean(content), context?.setHasError);

    if (!content) {
        return null;
    }

    return (
        <div
            role="alert"
            data-slot="field-error"
            className={cn('flex items-start gap-1.5 text-sm font-normal text-destructive', className)}
            {...props}
            id={context?.errorId ?? id}
        >
            {/* значок рядом с текстом: ошибка не должна передаваться одним лишь цветом */}
            <Warning className="mt-0.5 size-4" />
            <div>{content}</div>
        </div>
    );
}

export {
    Field,
    FieldContent,
    FieldDescription,
    FieldError,
    FieldGroup,
    FieldLabel,
    FieldLegend,
    FieldRequired,
    FieldSeparator,
    FieldSet,
    FieldTitle,
    useFieldControl,
};
