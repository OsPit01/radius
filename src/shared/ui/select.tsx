import * as React from 'react';
import { createPortal } from 'react-dom';

import { Check, ChevronDown } from '@/components/icons';
import { cn } from '@/shared/lib/utils';

/*
 * Select без сторонних библиотек (раньше был Radix). API как у shadcn:
 *   <Select> <SelectTrigger><SelectValue /></SelectTrigger>
 *            <SelectContent><SelectGroup><SelectLabel /><SelectItem /></SelectGroup></SelectContent> </Select>
 *
 * Доступность — паттерн «select-only combobox»: фокус всегда остаётся на кнопке, подсвеченный пункт
 * указывается через aria-activedescendant. Список открывается в портале (position: fixed), поэтому его
 * не обрезают overflow-родители (модалки и т.п.).
 *
 * Ограничение: подписи пунктов (value → label) собираются обходом children у <Select>, поэтому <SelectItem>
 * должен стоять прямо в JSX (можно внутри map / Fragment / SelectGroup), а не внутри своего компонента-обёртки.
 */

type ItemData = { value: string; label: React.ReactNode; disabled: boolean };

type SelectContextValue = {
    value: string | undefined;
    items: ItemData[];
    open: boolean;
    setOpen: (open: boolean) => void;
    select: (value: string) => void;
    activeValue: string | undefined;
    setActiveValue: (value: string) => void;
    handleKeyDown: (event: React.KeyboardEvent<HTMLButtonElement>) => void;
    handleKeyUp: (event: React.KeyboardEvent<HTMLButtonElement>) => void;
    disabled: boolean;
    triggerRef: React.RefObject<HTMLButtonElement | null>;
    contentRef: React.RefObject<HTMLDivElement | null>;
    contentId: string;
    optionId: (index: number) => string;
};

const SelectContext = React.createContext<SelectContextValue | null>(null);

function useSelect() {
    const context = React.useContext(SelectContext);
    if (!context) {
        throw new Error('Компоненты Select* нужно использовать внутри <Select>');
    }
    return context;
}

const EDGE = 8; // минимальный отступ списка от края окна
const GAP = 4; // зазор между кнопкой и списком
const MAX_HEIGHT = 320;
const TYPEAHEAD_RESET_MS = 700;

function collectItems(children: React.ReactNode, items: ItemData[] = []): ItemData[] {
    React.Children.forEach(children, (child) => {
        if (!React.isValidElement<{ value?: string; disabled?: boolean; children?: React.ReactNode }>(child)) {
            return;
        }
        if (child.type === SelectItem) {
            items.push({
                value: child.props.value ?? '',
                label: child.props.children,
                disabled: Boolean(child.props.disabled),
            });
        } else {
            collectItems(child.props.children, items);
        }
    });
    return items;
}

function textOf(node: React.ReactNode): string {
    if (typeof node === 'string' || typeof node === 'number') {
        return String(node);
    }
    if (Array.isArray(node)) {
        return node.map(textOf).join('');
    }
    if (React.isValidElement<{ children?: React.ReactNode }>(node)) {
        return textOf(node.props.children);
    }
    return '';
}

/** Прокручивает список так, чтобы пункт был виден (center — поставить по центру). Без scrollIntoView, чтобы не трогать страницу. */
function scrollItemIntoView(content: HTMLElement, item: HTMLElement, center = false) {
    const top = item.offsetTop;
    const bottom = top + item.offsetHeight;
    if (center) {
        content.scrollTop = top - (content.clientHeight - item.offsetHeight) / 2;
    } else if (top < content.scrollTop) {
        content.scrollTop = top - EDGE / 2;
    } else if (bottom > content.scrollTop + content.clientHeight) {
        content.scrollTop = bottom - content.clientHeight + EDGE / 2;
    }
}

type SelectProps = {
    children?: React.ReactNode;
    value?: string;
    defaultValue?: string;
    onValueChange?: (value: string) => void;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    /** Имя для отправки значения в обычной <form> (через скрытый input). */
    name?: string;
    disabled?: boolean;
};

function Select({
    children,
    value: valueProp,
    defaultValue,
    onValueChange,
    open: openProp,
    onOpenChange,
    name,
    disabled = false,
}: SelectProps) {
    const [valueState, setValueState] = React.useState(defaultValue);
    const [openState, setOpenState] = React.useState(false);
    const [activeValue, setActiveValue] = React.useState<string>();
    const baseId = React.useId();
    const triggerRef = React.useRef<HTMLButtonElement>(null);
    const contentRef = React.useRef<HTMLDivElement>(null);
    const typeahead = React.useRef({ text: '', timer: 0 });
    const swallowSpaceUp = React.useRef(false);

    const value = valueProp ?? valueState;
    const open = openProp ?? openState;
    const items = collectItems(children);
    const enabledItems = items.filter((item) => !item.disabled);
    const optionId = (index: number) => `${baseId}-option-${index}`;

    const setOpen = (next: boolean) => {
        if (next && disabled) {
            return;
        }
        if (next) {
            // при открытии подсвечиваем выбранный пункт, а если его нет — первый доступный
            setActiveValue(enabledItems.find((item) => item.value === value)?.value ?? enabledItems[0]?.value);
        } else {
            // поиск по буквам начинается заново при следующем открытии
            window.clearTimeout(typeahead.current.timer);
            typeahead.current.text = '';
        }
        setOpenState(next);
        onOpenChange?.(next);
    };

    const select = (next: string) => {
        setValueState(next);
        onValueChange?.(next);
        setOpen(false);
    };

    const activate = (item: ItemData | undefined) => {
        if (!item) {
            return;
        }
        setActiveValue(item.value);
        const element = document.getElementById(optionId(items.indexOf(item)));
        if (element && contentRef.current) {
            scrollItemIntoView(contentRef.current, element);
        }
    };

    const moveActive = (to: 'next' | 'prev' | 'first' | 'last') => {
        const current = enabledItems.findIndex((item) => item.value === activeValue);
        const target = {
            next: Math.min(current + 1, enabledItems.length - 1),
            prev: Math.max(current - 1, 0),
            first: 0,
            last: enabledItems.length - 1,
        }[to];
        activate(enabledItems[target]);
    };

    // Быстрый поиск по первым буквам: «м», «мин»… Одна и та же буква подряд листает совпадения.
    const search = (char: string) => {
        const state = typeahead.current;
        window.clearTimeout(state.timer);
        state.text += char.toLowerCase();
        state.timer = window.setTimeout(() => {
            state.text = '';
        }, TYPEAHEAD_RESET_MS);

        const current = enabledItems.findIndex((item) => item.value === activeValue);
        const from = current + (state.text.length === 1 ? 1 : 0);
        const ordered = [...enabledItems.slice(from), ...enabledItems.slice(0, from)];
        activate(ordered.find((item) => textOf(item.label).toLowerCase().startsWith(state.text)));
    };

    // Закрытый список открывают клик, Enter и Space (родной click у <button>), поэтому здесь — только стрелки.
    // Когда список открыт, Enter/Space выбирают пункт, а их родной click гасим.
    const handleKeyDown = (event: React.KeyboardEvent<HTMLButtonElement>) => {
        if (disabled) {
            return;
        }
        if (!open) {
            if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
                event.preventDefault();
                setOpen(true);
            }
            return;
        }
        switch (event.key) {
            case 'ArrowDown':
                event.preventDefault();
                moveActive('next');
                break;
            case 'ArrowUp':
                event.preventDefault();
                moveActive('prev');
                break;
            case 'Home':
                event.preventDefault();
                moveActive('first');
                break;
            case 'End':
                event.preventDefault();
                moveActive('last');
                break;
            case 'Enter':
                event.preventDefault();
                if (activeValue !== undefined) {
                    select(activeValue);
                }
                break;
            case ' ':
                event.preventDefault();
                swallowSpaceUp.current = true;
                if (typeahead.current.text) {
                    search(' ');
                } else if (activeValue !== undefined) {
                    select(activeValue);
                }
                break;
            case 'Escape':
                // не даём Esc закрыть ещё и модалку, в которой лежит Select
                event.preventDefault();
                event.stopPropagation();
                setOpen(false);
                break;
            case 'Tab':
                setOpen(false);
                break;
            default:
                if (event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
                    search(event.key);
                }
        }
    };

    // Space «кликает» кнопку на keyup — после выбора это снова открыло бы список.
    const handleKeyUp = (event: React.KeyboardEvent<HTMLButtonElement>) => {
        if (event.key === ' ' && swallowSpaceUp.current) {
            event.preventDefault();
            swallowSpaceUp.current = false;
        }
    };

    // Клик мимо закрывает список. setOpen берём из последнего рендера через ref, чтобы не пересоздавать подписку.
    const latestSetOpen = React.useRef(setOpen);
    React.useEffect(() => {
        latestSetOpen.current = setOpen;
    });
    React.useEffect(() => {
        if (!open) {
            return;
        }
        const onPointerDown = (event: PointerEvent) => {
            const target = event.target as Node;
            if (!triggerRef.current?.contains(target) && !contentRef.current?.contains(target)) {
                latestSetOpen.current(false);
            }
        };
        document.addEventListener('pointerdown', onPointerDown);
        return () => document.removeEventListener('pointerdown', onPointerDown);
    }, [open]);

    return (
        <SelectContext.Provider
            value={{
                value,
                items,
                open,
                setOpen,
                select,
                activeValue,
                setActiveValue,
                handleKeyDown,
                handleKeyUp,
                disabled,
                triggerRef,
                contentRef,
                contentId: `${baseId}-listbox`,
                optionId,
            }}
        >
            {children}
            {name ? (
                <input
                    type="hidden"
                    name={name}
                    value={value ?? ''}
                    disabled={disabled}
                />
            ) : null}
        </SelectContext.Provider>
    );
}

function SelectGroup({ ...props }: React.ComponentProps<'div'>) {
    return (
        <div
            role="group"
            data-slot="select-group"
            {...props}
        />
    );
}

function SelectValue({
    className,
    placeholder,
    children,
    ...props
}: React.ComponentProps<'span'> & { placeholder?: React.ReactNode }) {
    const { value, items } = useSelect();
    const hasValue = value !== undefined && value !== '';
    // если пункт не нашёлся обходом children (см. ограничение вверху файла) — показываем само значение
    const content = hasValue ? (items.find((item) => item.value === value)?.label ?? value) : placeholder;

    return (
        <span
            data-slot="select-value"
            className={className}
            {...props}
        >
            {children ?? content}
        </span>
    );
}

function SelectTrigger({
    className,
    size = 'default',
    children,
    ref,
    disabled,
    onClick,
    onKeyDown,
    onKeyUp,
    ...props
}: React.ComponentProps<'button'> & {
    size?: 'sm' | 'default';
}) {
    const context = useSelect();
    const hasValue = context.value !== undefined && context.value !== '';
    const activeIndex = context.open ? context.items.findIndex((item) => item.value === context.activeValue) : -1;

    const setRefs = (node: HTMLButtonElement | null) => {
        context.triggerRef.current = node;
        if (typeof ref === 'function') {
            ref(node);
        } else if (ref) {
            ref.current = node;
        }
    };

    return (
        <button
            ref={setRefs}
            type="button"
            role="combobox"
            aria-haspopup="listbox"
            aria-expanded={context.open}
            aria-controls={context.open ? context.contentId : undefined}
            aria-activedescendant={activeIndex >= 0 ? context.optionId(activeIndex) : undefined}
            data-slot="select-trigger"
            data-size={size}
            data-state={context.open ? 'open' : 'closed'}
            data-placeholder={hasValue ? undefined : ''}
            disabled={Boolean(disabled) || context.disabled}
            onClick={(event) => {
                onClick?.(event);
                if (!event.defaultPrevented) {
                    context.setOpen(!context.open);
                }
            }}
            onKeyDown={(event) => {
                onKeyDown?.(event);
                if (!event.defaultPrevented) {
                    context.handleKeyDown(event);
                }
            }}
            onKeyUp={(event) => {
                onKeyUp?.(event);
                context.handleKeyUp(event);
            }}
            className={cn(
                "flex w-fit cursor-pointer items-center justify-between gap-2 rounded-md border border-input bg-transparent px-3 py-2 text-sm whitespace-nowrap shadow-xs transition-[color,box-shadow] outline-none focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-destructive/20 data-[placeholder]:text-muted-foreground data-[size=default]:h-9 data-[size=sm]:h-8 *:data-[slot=select-value]:line-clamp-1 *:data-[slot=select-value]:flex *:data-[slot=select-value]:items-center *:data-[slot=select-value]:gap-2 dark:bg-input/30 dark:hover:bg-input/50 dark:aria-invalid:ring-destructive/40 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 [&_svg:not([class*='text-'])]:text-muted-foreground",
                className,
            )}
            {...props}
        >
            {children}
            <ChevronDown className="size-4 opacity-50" />
        </button>
    );
}

type Placement = {
    side: 'top' | 'bottom';
    top?: number;
    bottom?: number;
    left: number;
    minWidth: number;
    maxHeight: number;
};

function SelectContent({ className, children, style, ref, ...props }: React.ComponentProps<'div'>) {
    const { open, triggerRef, contentRef, contentId } = useSelect();
    const [placement, setPlacement] = React.useState<Placement>();

    // Ставим список под кнопкой (или над ней, если снизу не хватает места) и держим там при скролле/ресайзе.
    React.useLayoutEffect(() => {
        if (!open) {
            return;
        }
        const update = () => {
            const trigger = triggerRef.current;
            const content = contentRef.current;
            if (!trigger || !content) {
                return;
            }
            const rect = trigger.getBoundingClientRect();
            const spaceBelow = window.innerHeight - rect.bottom - EDGE - GAP;
            const spaceAbove = rect.top - EDGE - GAP;
            const side = content.scrollHeight <= spaceBelow || spaceBelow >= spaceAbove ? 'bottom' : 'top';
            setPlacement({
                side,
                ...(side === 'bottom' ? { top: rect.bottom + GAP } : { bottom: window.innerHeight - rect.top + GAP }),
                left: Math.max(EDGE, Math.min(rect.left, window.innerWidth - content.offsetWidth - EDGE)),
                minWidth: rect.width,
                maxHeight: Math.min(MAX_HEIGHT, side === 'bottom' ? spaceBelow : spaceAbove),
            });
        };
        const onScroll = (event: Event) => {
            // прокрутка самого списка не двигает его
            if (!contentRef.current?.contains(event.target as Node)) {
                update();
            }
        };
        update();
        window.addEventListener('resize', update);
        window.addEventListener('scroll', onScroll, true);
        return () => {
            window.removeEventListener('resize', update);
            window.removeEventListener('scroll', onScroll, true);
            setPlacement(undefined);
        };
    }, [open, triggerRef, contentRef]);

    if (!open || typeof document === 'undefined') {
        return null;
    }

    const setRefs = (node: HTMLDivElement | null) => {
        contentRef.current = node;
        if (typeof ref === 'function') {
            ref(node);
        } else if (ref) {
            ref.current = node;
        }
    };

    return createPortal(
        <div
            ref={setRefs}
            id={contentId}
            role="listbox"
            data-slot="select-content"
            data-state="open"
            data-side={placement?.side ?? 'bottom'}
            // Клик по любой части списка (метка, разделитель, отступ, полоса прокрутки) фокусирует сам список —
            // сразу возвращаем фокус кнопке, иначе клавиатура перестанет работать.
            tabIndex={-1}
            onFocus={() => triggerRef.current?.focus({ preventScroll: true })}
            style={{
                position: 'fixed',
                top: placement ? placement.top : 0,
                bottom: placement?.bottom,
                left: placement?.left ?? 0,
                minWidth: placement?.minWidth,
                maxHeight: placement?.maxHeight,
                // до первого замера положения не показываем, чтобы список не мигнул в углу
                visibility: placement ? undefined : 'hidden',
                ...style,
            }}
            className={cn(
                'z-[1100] max-h-80 min-w-32 origin-top overflow-x-hidden overflow-y-auto rounded-md border bg-popover text-popover-foreground shadow-md outline-hidden data-[side=top]:origin-bottom motion-safe:animate-popover-in',
                className,
            )}
            {...props}
        >
            <div className="p-1">{children}</div>
        </div>,
        document.body,
    );
}

function SelectLabel({ className, ...props }: React.ComponentProps<'div'>) {
    return (
        <div
            data-slot="select-label"
            className={cn('px-2 py-1.5 text-xs text-muted-foreground', className)}
            {...props}
        />
    );
}

function SelectItem({
    className,
    children,
    value,
    disabled = false,
    ...props
}: React.ComponentProps<'div'> & { value: string; disabled?: boolean }) {
    const context = useSelect();
    const selected = context.value === value;
    const active = context.activeValue === value;
    const ref = React.useRef<HTMLDivElement>(null);

    // Пункты монтируются только при открытии списка: выбранный сразу ставим по центру видимой области.
    React.useLayoutEffect(() => {
        if (selected && ref.current && context.contentRef.current) {
            scrollItemIntoView(context.contentRef.current, ref.current, true);
        }
        // только при монтировании
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    return (
        <div
            ref={ref}
            id={context.optionId(context.items.findIndex((item) => item.value === value))}
            role="option"
            aria-selected={selected}
            aria-disabled={disabled || undefined}
            data-slot="select-item"
            data-state={selected ? 'checked' : 'unchecked'}
            data-highlighted={active ? '' : undefined}
            data-disabled={disabled ? '' : undefined}
            onPointerMove={() => {
                if (!disabled && !active) {
                    context.setActiveValue(value);
                }
            }}
            onClick={() => {
                if (!disabled) {
                    context.select(value);
                }
            }}
            className={cn(
                "relative flex w-full cursor-pointer items-center gap-2 rounded-sm py-1.5 pr-8 pl-2 text-sm outline-hidden select-none data-[disabled]:pointer-events-none data-[disabled]:opacity-50 data-[highlighted]:bg-accent data-[highlighted]:text-accent-foreground [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4 [&_svg:not([class*='text-'])]:text-muted-foreground *:[span]:last:flex *:[span]:last:items-center *:[span]:last:gap-2",
                className,
            )}
            {...props}
        >
            <span
                data-slot="select-item-indicator"
                className="absolute right-2 flex size-3.5 items-center justify-center"
            >
                {selected ? <Check className="size-4" /> : null}
            </span>
            <span>{children}</span>
        </div>
    );
}

function SelectSeparator({ className, ...props }: React.ComponentProps<'div'>) {
    return (
        <div
            role="separator"
            data-slot="select-separator"
            className={cn('pointer-events-none -mx-1 my-1 h-px bg-border', className)}
            {...props}
        />
    );
}

export { Select, SelectContent, SelectGroup, SelectItem, SelectLabel, SelectSeparator, SelectTrigger, SelectValue };
