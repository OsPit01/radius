import { type KeyboardEvent, useEffect, useRef, useState } from 'react';

import { TRPCClientError } from '@trpc/client';

import { Search } from '@/components/icons';
import type { AppRouter } from '@/server/api/root';
import { cn } from '@/shared/lib/utils';
import { Field, FieldError, FieldLabel } from '@/shared/ui/field';
import { Input } from '@/shared/ui/input';
import { api, type RouterOutputs } from '@/trpc/react';

type AddressHint = RouterOutputs['geo']['suggestAddress'][number];
/** Все данные выбранного адреса: область, район, город, улица, дом, координаты. */
export type AddressSuggestion = NonNullable<RouterOutputs['geo']['resolveAddress']>;

type AddressSearchProps = {
    /** Что показать в поле при открытии (например, при возврате на шаг): адрес, который уже выбран. */
    initialValue?: string;
    /** Адрес выбран до дома и определён — можно заполнять форму. */
    onResolved: (address: AddressSuggestion) => void;
};

type Status = 'idle' | 'loading' | 'done' | 'error';

const MIN_QUERY_LENGTH = 3;
// Бесплатная квота Яндекса ограничена — не ищем на каждую букву и не повторяем одинаковые запросы.
const DEBOUNCE_MS = 500;
const CACHE_MS = 5 * 60 * 1000;
const GENERIC_ERROR = 'Поиск адреса сейчас недоступен. Заполните адрес вручную.';
const NOT_RESOLVED_ERROR = 'Не удалось определить этот адрес. Выберите другой или заполните адрес вручную.';

// Нужны только aria-controls и aria-activedescendant — они ссылаются на элементы по id. Поле адреса на странице одно,
// поэтому id статические; у самого поля id и подпись выдаёт <Field>. Имя списка — обычный aria-label.
const LIST_ID = 'address-suggestions';
const optionId = (index: number) => `address-suggestion-${index}`;

function isRateLimited(err: unknown): err is TRPCClientError<AppRouter> {
    return err instanceof TRPCClientError && (err as TRPCClientError<AppRouter>).data?.code === 'TOO_MANY_REQUESTS';
}

export function AddressSearch({ initialValue = '', onResolved }: AddressSearchProps) {
    const utils = api.useUtils();

    // value — то, что видно в поле; term — то, что человек напечатал и по чему ищем
    // (после выбора дома value меняется, а искать заново не нужно).
    const [value, setValue] = useState(initialValue);
    const [inputValue, setInputValue] = useState('');
    const [hints, setHints] = useState<AddressHint[]>([]);
    const [status, setStatus] = useState<Status>('idle');
    const [resolving, setResolving] = useState(false);
    const [errorText, setErrorText] = useState(GENERIC_ERROR);
    const [focused, setFocused] = useState(false);
    const [dismissed, setDismissed] = useState(false);
    const [activeIndex, setActiveIndex] = useState(-1);
    // Номер последнего выбора: если человек уже печатает дальше, ответ на прежний выбор игнорируем.
    const resolveRequest = useRef(0);

    const open = focused && !dismissed && hints.length > 0;

    useEffect(() => {
        // Хвостовой пробел не режем: «улица Ленина, Минск, » говорит Яндексу «дальше идёт дом», а без него он подсказал бы ту же улицу.
        const query = inputValue.trimStart();
        if (query.trim().length < MIN_QUERY_LENGTH) {
            setHints([]);
            setStatus('idle');
            return;
        }

        let cancelled = false;
        const timer = setTimeout(() => {
            setStatus('loading');
            void (async () => {
                try {
                    const found = await utils.geo.suggestAddress.fetch({ query }, { staleTime: CACHE_MS });

                    if (cancelled) {
                        return;
                    }

                    setHints(found);
                    setActiveIndex(-1);
                    setStatus('done');
                } catch (err) {
                    if (cancelled) {
                        return;
                    }

                    setHints([]);
                    setStatus('error');
                    // Свой текст показываем только для лимита запросов — остальное сервер не должен «просвечивать».
                    setErrorText(isRateLimited(err) ? err.message : GENERIC_ERROR);
                }
            })();
        }, DEBOUNCE_MS);

        // Новый ввод отменяет и таймер, и устаревший ответ — иначе медленный ответ затрёт свежий.
        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, [inputValue, utils]);

    const choose = (hint: AddressHint) => {
        // Улица, город, район — это ещё не адрес: дописываем их в поле, и Яндекс подсказывает следующий шаг (дома этой улицы).
        if (!hint.final || !hint.uri) {
            resolveRequest.current += 1;
            setValue(hint.text);
            setInputValue(hint.text);
            setDismissed(false);
            setActiveIndex(-1);
            return;
        }

        // Дом — адрес закончен: по нему берём все данные и заполняем форму.
        const { uri } = hint;
        const requestId = ++resolveRequest.current;
        setValue([hint.label, hint.description].filter(Boolean).join(', '));
        setDismissed(true);
        setActiveIndex(-1);
        setStatus('idle');
        setResolving(true);

        void (async () => {
            try {
                const address = await utils.geo.resolveAddress.fetch({ uri }, { staleTime: CACHE_MS });

                if (requestId !== resolveRequest.current) {
                    return;
                }

                if (address) {
                    onResolved(address);
                } else {
                    setStatus('error');
                    setErrorText(NOT_RESOLVED_ERROR);
                }
            } catch (err) {
                if (requestId !== resolveRequest.current) {
                    return;
                }

                setStatus('error');
                setErrorText(isRateLimited(err) ? err.message : GENERIC_ERROR);
            } finally {
                if (requestId === resolveRequest.current) {
                    setResolving(false);
                }
            }
        })();
    };

    const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            if (hints.length === 0) {
                return;
            }
            e.preventDefault();
            setDismissed(false);
            const last = hints.length - 1;
            let next: number;
            if (e.key === 'ArrowDown') {
                next = activeIndex >= last ? 0 : activeIndex + 1;
            } else {
                next = activeIndex <= 0 ? last : activeIndex - 1;
            }
            setActiveIndex(next);
            // В списке с прокруткой пункт может оказаться за краем. Ждём кадр: после Escape список закрыт и ещё не отрисован.
            requestAnimationFrame(() => document.getElementById(optionId(next))?.scrollIntoView({ block: 'nearest' }));
        } else if (e.key === 'Enter' && open && activeIndex >= 0) {
            e.preventDefault();
            const hint = hints[activeIndex];
            if (hint) {
                choose(hint);
            }
        } else if (e.key === 'Escape' && open) {
            e.preventDefault();
            setDismissed(true);
        }
    };

    const showEmpty = status === 'done' && hints.length === 0;

    return (
        <Field>
            <FieldLabel>
                Начните вводить адрес — город, улицу, дом. Выберите его из списка, остальное заполним сами.
            </FieldLabel>
            <div>
                <div className="relative">
                    <Search
                        aria-hidden="true"
                        className={cn(
                            'pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground',
                            (status === 'loading' || resolving) && 'animate-pulse',
                        )}
                    />
                    <Input
                        type="text"
                        role="combobox"
                        aria-expanded={open}
                        aria-controls={open ? LIST_ID : undefined}
                        aria-autocomplete="list"
                        aria-activedescendant={open && activeIndex >= 0 ? optionId(activeIndex) : undefined}
                        autoComplete="off"
                        value={value}
                        placeholder="Например: Гродно, Советская 1"
                        className="pl-9!"
                        onChange={(e) => {
                            resolveRequest.current += 1;
                            setResolving(false);
                            setValue(e.target.value);
                            setInputValue(e.target.value);
                            setDismissed(false);
                        }}
                        onFocus={() => setFocused(true)}
                        onBlur={() => setFocused(false)}
                        onKeyDown={handleKeyDown}
                    />

                    {open && (
                        <ul
                            id={LIST_ID}
                            role="listbox"
                            aria-label="Подсказки адреса"
                            className="absolute top-full right-0 left-0 z-50 mt-1 max-h-72 origin-top overflow-y-auto rounded-md border bg-popover p-1 text-popover-foreground shadow-md motion-safe:animate-popover-in"
                        >
                            {hints.map((hint, index) => (
                                <li
                                    key={`${hint.label}|${hint.description}`}
                                    id={optionId(index)}
                                    role="option"
                                    aria-selected={index === activeIndex}
                                    // mousedown, а не click: иначе поле успеет потерять фокус и список закроется раньше выбора
                                    onMouseDown={(e) => {
                                        e.preventDefault();
                                        choose(hint);
                                    }}
                                    onMouseMove={() => setActiveIndex(index)}
                                    className={cn(
                                        'cursor-pointer rounded-sm px-2 py-1.5 text-sm select-none',
                                        index === activeIndex && 'bg-accent text-accent-foreground',
                                    )}
                                >
                                    <span className="block">{hint.label}</span>
                                    {/* где это: одинаковые «Советская улица, 1» бывают в десятках городов */}
                                    {hint.description && (
                                        <span className="block text-xs opacity-70">{hint.description}</span>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <div aria-live="polite">
                    {showEmpty && (
                        <p className="mt-3 text-sm text-muted-foreground">
                            Ничего не найдено. Проверьте написание или заполните адрес вручную.
                        </p>
                    )}
                    {open && <p className="sr-only">Найдено подсказок: {hints.length}</p>}
                </div>
                {status === 'error' && <FieldError className="mt-3">{errorText}</FieldError>}
            </div>
        </Field>
    );
}
