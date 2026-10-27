// ============================================================
// /admin/requisites — управление реквизитами (МАКЕТ)
// ============================================================
//
// Страница для супера админа и выше: здесь редактируются реквизиты
// оператора (ФИО, УНП, адрес, почта, Telegram), которые показываются
// в футере, на /contacts и в юридических документах.
//
// ⚠️ ВАЖНО — это МАКЕТ по договорённости с владельцем:
// кнопка «Сохранить» пока НЕ пишет в базу. Реальные значения берутся
// из src/lib/legal/operator.ts. Как только появится таблица в БД —
// вместо констант подключается tRPC-процедура (получить/сохранить),
// а интерфейс остаётся тем же.
//
// Доступ: серверно — requireRole('superadmin') (остальные получают
// 404 ещё до рендера), на клиенте — дополнительная проверка роли.
// ============================================================

import { useState } from 'react';

import { useSession } from 'next-auth/react';

import { Info, Settings } from '@/components/icons';
import { AuthGuard } from '@/components/layout/AuthGuard';
import { ClientHeader } from '@/components/layout/ClientHeader';
import { hasPermission } from '@/lib/constants/roles';
import { OPERATOR } from '@/lib/legal/operator';
import { requireRole } from '@/server/auth/require-auth';

// Не-админ получает 404 ещё на сервере — страницу не видно вовсе.
export const getServerSideProps = requireRole('superadmin');

type FieldKey = 'legalName' | 'unp' | 'legalAddress' | 'supportEmail' | 'privacyEmail' | 'supportTelegram';

// Описание полей: и данные, и подсказки — в одном месте.
const FIELDS: { key: FieldKey; label: string; hint: string }[] = [
    {
        key: 'legalName',
        label: 'Наименование оператора',
        hint: 'Показывается в футере, на /contacts и в юридических документах',
    },
    {
        key: 'unp',
        label: 'УНП',
        hint: 'Учётный номер плательщика',
    },
    {
        key: 'legalAddress',
        label: 'Юридический адрес',
        hint: 'Адрес, указанный при регистрации ИП',
    },
    {
        key: 'supportEmail',
        label: 'Email поддержки',
        hint: 'Куда пишут пользователи по вопросам сайта и бронирований',
    },
    {
        key: 'privacyEmail',
        label: 'Email по персональным данным',
        hint: 'Запросы на изменение/удаление данных, отзыв согласия',
    },
    {
        key: 'supportTelegram',
        label: 'Telegram поддержки',
        hint: 'Например: @naradare_booking',
    },
];

export default function RequisitesAdminPage() {
    const { data: session } = useSession();
    const role = session?.user?.role;

    // Форма инициализируется текущими значениями из operator.ts.
    // Пока БД нет — это единственный источник, и админ видит,
    // что именно показывается на сайте прямо сейчас.
    const [form, setForm] = useState({
        legalName: OPERATOR.legalName,
        unp: OPERATOR.unp,
        legalAddress: OPERATOR.legalAddress,
        supportEmail: OPERATOR.supportEmail,
        privacyEmail: OPERATOR.privacyEmail,
        supportTelegram: OPERATOR.supportTelegram,
    });

    // Показывается после «Сохранить» — честно объясняем статус макета.
    const [savedNotice, setSavedNotice] = useState(false);

    if (!hasPermission(role ?? '', 'superadmin')) {
        return (
            <AuthGuard>
                <ClientHeader />
                <div className="p-[60px_20px] text-center text-lg">Нет доступа</div>
            </AuthGuard>
        );
    }

    return (
        <AuthGuard>
            <ClientHeader />
            <div className="min-h-screen bg-background px-5 py-10 max-md:px-3 max-md:py-4">
                <div className="mx-auto max-w-[900px] rounded-[24px] bg-muted p-12 shadow-[0_20px_60px_rgba(0,0,0,0.08)] max-[480px]:rounded-2xl max-[480px]:p-4 max-md:rounded-[20px] max-md:p-6">
                    <h1 className="mb-6 flex items-center gap-3 text-[28px] font-bold text-foreground max-md:text-[22px]">
                        <Settings className="h-9 w-9" />
                        Реквизиты платформы
                    </h1>

                    {/* Предупреждение о статусе макета — чтобы не было иллюзии сохранения */}
                    <div className="mb-6 flex items-start gap-3 rounded-xl border-l-4 border-primary bg-card p-4 text-sm leading-relaxed">
                        <Info className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                        <p>
                            Это макет страницы управления. Значения ниже — те, что сейчас берутся из{' '}
                            <code className="rounded bg-muted px-1 py-0.5 text-xs break-all">
                                src/lib/legal/operator.ts
                            </code>{' '}
                            и показываются на сайте. После подключения таблицы в БД здесь появится сохранение.
                        </p>
                    </div>

                    <div className="flex flex-col gap-5">
                        {FIELDS.map((field) => (
                            <label
                                key={field.key}
                                className="flex flex-col gap-1.5"
                            >
                                <span className="text-sm font-medium text-foreground">{field.label}</span>
                                <input
                                    type="text"
                                    value={form[field.key]}
                                    onChange={(e) => setForm({ ...form, [field.key]: e.target.value })}
                                    className="min-h-11 w-full rounded-xl border border-border bg-card px-4 text-[15px] text-foreground outline-none focus:border-primary"
                                />
                                <span className="text-xs text-muted-foreground">{field.hint}</span>
                            </label>
                        ))}
                    </div>

                    <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                        <button
                            type="button"
                            onClick={() => setSavedNotice(true)}
                            className="min-h-11 cursor-pointer rounded-[30px] bg-foreground px-8 py-3 text-sm font-medium text-background transition-colors hover:bg-foreground/85"
                        >
                            Сохранить
                        </button>
                        {savedNotice && (
                            <p className="text-sm text-muted-foreground">
                                Черновик сохранён в форме. Запись в базу появится после подключения таблицы реквизитов.
                            </p>
                        )}
                    </div>

                    {/* Где используются реквизиты — карта зависимости для владельца */}
                    <div className="mt-10 border-t border-border pt-6">
                        <h2 className="mb-3 text-base font-semibold">Где эти данные показываются</h2>
                        <ul className="list-disc space-y-1 pl-5 text-sm leading-relaxed text-muted-foreground">
                            <li>нижняя строка футера — наименование, УНП, адрес, почта;</li>
                            <li>страница «Контакты и реквизиты» (/contacts);</li>
                            <li>
                                юридические документы: Политика (/privacy), Соглашение (/terms), Cookie-политика
                                (/cookies), Согласие (/consent).
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </AuthGuard>
    );
}
