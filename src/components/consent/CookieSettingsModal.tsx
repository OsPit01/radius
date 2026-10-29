'use client';

// ============================================================
// CookieSettingsModal — окно настройки категорий cookie
// ============================================================
//
// Открывается из баннера («Настроить») и кнопкой на странице /cookies.
// Категории «Аналитика» и «Маркетинг» — независимые переключатели:
// можно включить аналитику и не включать рекламу (закон требует
// конкретности согласия, одной кнопкой «на всё» больше нет).
// ============================================================

import { useEffect, useState } from 'react';

import { useCookieConsent } from '@/components/consent/CookieConsentContext';
import { Modal } from '@/components/ui/Modal';

type CookieSettingsModalProps = {
    open: boolean;
    onClose: () => void;
};

export function CookieSettingsModal({ open, onClose }: CookieSettingsModalProps) {
    const { consent, save, acceptAll } = useCookieConsent();

    // Локальное состояние переключателей. Инициализируем при каждом
    // открытии окна из уже сохранённого выбора (или выключенным,
    // если выбора ещё не было).
    const [analytics, setAnalytics] = useState(false);
    const [marketing, setMarketing] = useState(false);

    useEffect(() => {
        if (open) {
            setAnalytics(consent?.categories.analytics ?? false);
            setMarketing(consent?.categories.marketing ?? false);
        }
    }, [open, consent]);

    return (
        <Modal
            open={open}
            onClose={onClose}
            title="Настройки cookie"
        >
            <div className="flex flex-col gap-4">
                {/* Необходимые — всегда включены, отключить нельзя */}
                <Toggle
                    checked
                    disabled
                    title="Необходимые"
                    description="Вход в аккаунт, защита форм, хранение вашего выбора. Без них сайт не работает."
                />
                <Toggle
                    checked={analytics}
                    onChange={setAnalytics}
                    title="Аналитика"
                    description="Подсчёт визитов и просмотров, оценка качества работы сайта (Google Analytics, счётчик NaRadare)."
                />
                <Toggle
                    checked={marketing}
                    onChange={setMarketing}
                    title="Реклама"
                    description="Оценка эффективности рекламных кампаний (Google Ads)."
                />

                <div className="mt-2 flex flex-col gap-2 sm:flex-row-reverse">
                    <button
                        type="button"
                        onClick={() => {
                            save({ necessary: true, analytics, marketing });
                            onClose();
                        }}
                        className="min-h-11 flex-1 cursor-pointer rounded-[30px] bg-foreground px-6 py-2.5 text-sm font-medium text-background transition-colors hover:bg-foreground/85"
                    >
                        Сохранить выбор
                    </button>
                    <button
                        type="button"
                        onClick={() => {
                            acceptAll();
                            onClose();
                        }}
                        className="min-h-11 flex-1 cursor-pointer rounded-[30px] border border-border px-6 py-2.5 text-sm font-medium text-foreground transition-colors hover:border-primary hover:text-primary"
                    >
                        Принять все
                    </button>
                </div>
            </div>
        </Modal>
    );
}

/** Переключатель категории: кликабельная строка целиком (44px+). */
function Toggle({
    checked,
    onChange,
    title,
    description,
    disabled,
}: {
    checked: boolean;
    onChange?: (value: boolean) => void;
    title: string;
    description: string;
    disabled?: boolean;
}) {
    return (
        <label className="flex cursor-pointer items-start gap-3 rounded-xl p-2 transition-colors hover:bg-muted">
            {/* Чекбокс оставляем в разметке для доступности (скринридеры),
                а рисуем свой «свитч» — крупный и заметный на телефоне. */}
            <input
                type="checkbox"
                checked={checked}
                disabled={disabled}
                onChange={onChange ? (e) => onChange(e.target.checked) : undefined}
                className="sr-only"
            />
            <span
                aria-hidden="true"
                className={`mt-0.5 flex h-6 w-11 shrink-0 items-center rounded-full border px-0.5 transition-colors ${
                    checked ? 'border-primary bg-primary' : 'border-border bg-muted'
                } ${disabled ? 'opacity-60' : ''}`}
            >
                <span
                    className={`h-5 w-5 rounded-full bg-card shadow transition-transform ${
                        checked ? 'translate-x-5' : 'translate-x-0'
                    }`}
                />
            </span>
            <span className="min-w-0">
                <span className="block text-sm font-medium text-foreground">{title}</span>
                <span className="block text-sm leading-snug text-muted-foreground">{description}</span>
            </span>
        </label>
    );
}
