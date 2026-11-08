import * as React from 'react';

import { ChevronDown, ChevronUp } from '@/components/icons';
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
    const isNumber = type === 'number';

    const input = (
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
                // число: свои кнопки вместо нативных стрелок — прячем их и оставляем справа место под кнопки
                isNumber &&
                    'peer [appearance:textfield] pe-10 pointer-coarse:pe-14 [&::-webkit-inner-spin-button]:m-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0 [&::-webkit-outer-spin-button]:appearance-none',
                className,
            )}
            {...props}
        />
    );

    if (!isNumber) {
        return input;
    }

    return <NumberStepper locked={props.disabled === true || props.readOnly === true}>{input}</NumberStepper>;
}

const STEP_BUTTON_CLASS = cn(
    'flex flex-1 cursor-pointer items-center justify-center text-muted-foreground transition-[color,background-color]',
    'enabled:hover:bg-muted enabled:hover:text-foreground',
    'focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ring',
    'disabled:cursor-not-allowed disabled:opacity-40 forced-colors:disabled:text-[GrayText]',
);

/**
 * Кнопки «больше / меньше» у type="number". Шагают нативными stepUp() / stepDown() — те сами учитывают min, max и step
 * и выравнивают значение по шагу. На границе (значение ≥ max или ≤ min) кнопка гаснет.
 *
 * Поле бывает неуправляемым (register из react-hook-form): значение живёт в DOM, поэтому границы читаем из DOM —
 * после каждого рендера (значение пришло пропсом, форму сбросили) и после каждого ввода.
 *
 * Клавиатура — нативная (стрелки ↑/↓ в самом поле), поэтому кнопок нет в порядке Tab, но читалки их видят и могут нажать.
 */
function NumberStepper({ locked, children }: { locked: boolean; children: React.ReactElement }) {
    const ref = React.useRef<HTMLDivElement>(null);
    const pointerType = React.useRef('');
    const [atMin, setAtMin] = React.useState(false);
    const [atMax, setAtMax] = React.useState(false);

    const getInput = () => ref.current?.querySelector('input') ?? null;

    const sync = () => {
        const input = getInput();
        if (!input) {
            return;
        }
        // пустое поле или нет атрибута → NaN, а сравнение с NaN ложно: кнопка активна
        setAtMin(input.valueAsNumber <= parseFloat(input.min));
        setAtMax(input.valueAsNumber >= parseFloat(input.max));
    };

    React.useLayoutEffect(sync);

    const step = (direction: 1 | -1) => {
        const input = getInput();
        if (!input) {
            return;
        }
        const before = input.value;
        const min = parseFloat(input.min);
        const max = parseFloat(input.max);

        // Меняем значение через stepUp() / valueAsNumber, а не `input.value = …`: присваивание value React перехватывает
        // и потом не видит изменения — onChange (а с ним и register) не сработал бы.
        if (Number.isNaN(input.valueAsNumber) && !Number.isNaN(min)) {
            // пустое поле — начинаем с min: нативный stepDown() считает пустое поле нулём, упирается в min и ничего не делает
            input.valueAsNumber = min;
        } else if (input.step === 'any') {
            // у step="any" нет шага, и stepUp() бросил бы исключение — шагаем на 1 сами
            let next = (Number.isNaN(input.valueAsNumber) ? 0 : input.valueAsNumber) + direction;
            if (next > max) {
                next = max;
            }
            if (next < min) {
                next = min;
            }
            input.valueAsNumber = next;
        } else if (direction > 0) {
            input.stepUp();
        } else {
            input.stepDown();
        }

        if (input.value === before) {
            return;
        }
        // те же события, что шлёт браузер при вводе: их ловят onChange / onInput (и register из react-hook-form)
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
        sync();

        // мышью — как у нативных стрелок: фокус в поле, дальше можно стрелками. На тач-экранах не фокусируем,
        // чтобы не выезжала клавиатура
        if (pointerType.current === 'mouse') {
            input.focus({ preventScroll: true });
        }
    };

    const buttonProps = (direction: 1 | -1) => ({
        type: 'button' as const,
        tabIndex: -1,
        className: STEP_BUTTON_CLASS,
        onPointerDown: (event: React.PointerEvent) => {
            pointerType.current = event.pointerType;
        },
        // кнопка не забирает фокус: иначе, погаснув на границе, она уронила бы его на <body>
        onMouseDown: (event: React.MouseEvent) => event.preventDefault(),
        onClick: () => {
            step(direction);
            pointerType.current = '';
        },
    });

    return (
        <div
            ref={ref}
            data-slot="number-input"
            className="relative w-full min-w-0"
            onInput={sync}
        >
            {children}
            <div className="absolute inset-y-px end-px flex w-8 flex-col overflow-hidden rounded-e-[calc(var(--radius-md)-1px)] border-s border-input peer-disabled:opacity-50 pointer-coarse:w-11">
                <button
                    {...buttonProps(1)}
                    aria-label="Увеличить"
                    disabled={locked || atMax}
                >
                    <ChevronUp className="size-3.5" />
                </button>
                <button
                    {...buttonProps(-1)}
                    aria-label="Уменьшить"
                    disabled={locked || atMin}
                    className={cn(STEP_BUTTON_CLASS, 'border-t border-input')}
                >
                    <ChevronDown className="size-3.5" />
                </button>
            </div>
        </div>
    );
}

export { Input };
