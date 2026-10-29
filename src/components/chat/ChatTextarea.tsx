'use client';

import { useEffect, useRef } from 'react';

import { MAX_MESSAGE_LENGTH } from '@/lib/chat';

/** Максимальная высота поля ≈ 10 строк. Дальше текст прокручивается ВНУТРИ
 *  поля (скроллбар скрыт — по паттерну ChatWindow, как в Vercel/ChatGPT). */
const MAX_FIELD_HEIGHT = 220;

type ChatTextareaProps = {
    /** Текущий текст (управляемый компонент: состояние живёт у родителя). */
    value: string;
    /** Родитель обновляет текст (обычно это setText из useState). */
    onChange: (value: string) => void;
    /** Подсказка в пустом поле. */
    placeholder: string;
    /** Если передать — Enter отправляет сообщение, Shift+Enter — новая строка
     *  (как в мессенджерах; ровно так же сделано в ChatWindow основного чата). */
    onSend?: () => void;
};

/**
 * Поле ввода сообщения для чатов (поддержка, основной чат).
 *
 * 1. Авторост по образцу ChatWindow: высота растёт с текстом до 10 строк,
 *    дальше — прокрутка ВНУТРИ поля без скроллбара (overflow-hidden):
 *    никакого «стрелочного» скролла Windows, поле само держит
 *    последнюю строку (курсор) видимой.
 * 2. maxLength — браузер НЕ ДАЁТ ввести больше лимита (серверная проверка
 *    Zod остаётся второй линией защиты от прямых запросов к API).
 * 3. Счётчик «N/500» — появляется только при длинном тексте (≈3–4 строки):
 *    в начале поле чистое, цифры не шумят рядом с кнопкой отправки.
 */
export function ChatTextarea({ value, onChange, placeholder, onSend }: ChatTextareaProps) {
    // Ссылка на DOM-элемент: нужна для пересчёта высоты из useEffect.
    const ref = useRef<HTMLTextAreaElement>(null);

    // ===== Пересчёт высоты при ЛЮБОМ изменении value =====
    // Inline-логика в onChange срабатывает только при ВВОДЕ пользователя.
    // А после отправки родитель очищает текст программно (setText('')) —
    // без этого эффекта поле оставалось высоким (220px) с пустым текстом
    // до следующего нажатия клавиши. Идемпотентно с inline-версией:
    // двойной пересчёт безвреден (одно и то же значение).
    useEffect(() => {
        const el = ref.current;
        if (!el) {
            return;
        }
        el.style.height = 'auto';
        el.style.height = `${Math.min(el.scrollHeight, MAX_FIELD_HEIGHT)}px`;
    }, [value]);

    // При заполнении (>= 90% лимита) счётчик краснеет — «скоро предел».
    const isNearLimit = value.length >= MAX_MESSAGE_LENGTH * 0.9;

    // Счётчик показываем ТОЛЬКО когда текст уже длинный (≈3–4 строки / 120+ символов).
    // Место под строку зарезервировано (фиксированная высота), поэтому
    // появление НЕ дёргает вёрстку; opacity — плавное проявление.
    const showCounter = value.length >= 120 || value.includes('\n');

    return (
        <div className="flex min-w-0 flex-1 flex-col">
            <textarea
                ref={ref}
                rows={1}
                value={value}
                onChange={(e) => {
                    onChange(e.target.value);
                    const el = e.target;

                    // ===== Авторост (паттерн ChatWindow) =====
                    // Шаг 1: сброс высоты в 'auto' — иначе браузер не пересчитает scrollHeight.
                    // Шаг 2: замер и установка высоты ровно под текст, но не выше капа.
                    el.style.height = 'auto';
                    el.style.height = `${Math.min(el.scrollHeight, MAX_FIELD_HEIGHT)}px`;

                    // Текста больше капа: держим последнюю строку видимой.
                    // Скроллбар СКРЫТ (overflow-hidden) — без этого хвост
                    // текста был бы недоступен глазу.
                    if (el.scrollHeight > MAX_FIELD_HEIGHT) {
                        el.scrollTop = el.scrollHeight;
                    }
                }}
                onKeyDown={(e) => {
                    // Enter — отправить, Shift+Enter — новая строка.
                    // preventDefault — чтобы Enter НЕ вставлял пустую строку перед отправкой.
                    if (e.key === 'Enter' && !e.shiftKey && onSend) {
                        e.preventDefault();
                        onSend();
                    }
                }}
                maxLength={MAX_MESSAGE_LENGTH}
                placeholder={placeholder}
                // overflow-hidden — ГЛАВНОЕ отличие: скроллбара НЕТ вообще
                // (никаких стрелок Windows), прокрутка — программная, см. onChange.
                className="max-h-[220px] w-full resize-none overflow-hidden rounded-xl border border-border bg-transparent p-3 text-[15px] leading-relaxed text-foreground outline-none focus:border-primary"
            />
            {/* Счётчик символов: прижат вправо, мелкий, появляется при длинном тексте. */}
            <span
                className={`self-end pt-1 text-[11px] tabular-nums transition-opacity ${
                    !showCounter
                        ? 'opacity-0'
                        : isNearLimit
                          ? 'font-semibold text-destructive'
                          : 'text-muted-foreground'
                }`}
            >
                {value.length}/{MAX_MESSAGE_LENGTH}
            </span>
        </div>
    );
}
