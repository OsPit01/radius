// ============================================================
// /admin/requisites — управление реквизитами
// ============================================================
//
// Страница для суперадмина и выше: реквизиты оператора (ФИО, УНП,
// адрес, почта, Telegram) редактируются и сохраняются В БД.
//
// Приоритет источников:
//   БД (radius_requisites) → если строки нет, OPERATOR из operator.ts.
// Значения из БД перекрывают константы — так задумано в operator.ts.
//
// Доступ: серверно — requireRole('superadmin') (остальные получают
// 404 ещё до рендера), на клиенте — дополнительная проверка роли.
// ============================================================

import { useState } from 'react';

import { useSession } from 'next-auth/react';

import { Settings } from '@/components/icons';
import { AuthGuard } from '@/components/layout/AuthGuard';
import { AccessDenied } from '@/components/ui/AccessDenied';
import { canManageRequisites } from '@/lib/constants/roles';
import { DEFAULT_REQUISITES } from '@/lib/legal/requisites';
import { requireCan } from '@/server/auth/require-auth';
import { Layout } from '@/shared/ui/layout';
import { api } from '@/trpc/react';

// Доступ: суперадмин+ и legalAdmin (точечная роль). Остальным — 404 на сервере.
export const getServerSideProps = requireCan(canManageRequisites);

type FieldKey =
    | 'legalName'
    | 'unp'
    | 'legalAddress'
    | 'supportEmail'
    | 'privacyEmail'
    | 'supportTelegram'
    | 'supportTelegramUrl'
    | 'footerPrivacyEmail'
    | 'footerSupportEmail';

type RequisitesFormState = Record<FieldKey, string>;

// Описание полей: и подпись, и подсказка — в одном месте.
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
        label: 'Telegram поддержки (имя)',
        hint: 'Например: @naradare_booking',
    },
    {
        key: 'supportTelegramUrl',
        label: 'Telegram поддержки (ссылка)',
        hint: 'Например: https://t.me/naradare_booking',
    },
    {
        key: 'footerPrivacyEmail',
        label: 'Email в футере (персональные данные)',
        hint: 'Публичный ящик нижней строки футера',
    },
    {
        key: 'footerSupportEmail',
        label: 'Email в футере (поддержка)',
        hint: 'Публичный ящик нижней строки футера',
    },
];

// Значения по умолчанию (когда строки в БД ещё нет) — из DEFAULT_REQUISITES.
const OPERATOR_DEFAULTS: RequisitesFormState = {
    legalName: DEFAULT_REQUISITES.legalName,
    unp: DEFAULT_REQUISITES.unp,
    legalAddress: DEFAULT_REQUISITES.legalAddress,
    supportEmail: DEFAULT_REQUISITES.supportEmail,
    privacyEmail: DEFAULT_REQUISITES.privacyEmail,
    supportTelegram: DEFAULT_REQUISITES.supportTelegram,
    supportTelegramUrl: DEFAULT_REQUISITES.supportTelegramUrl,
    footerPrivacyEmail: DEFAULT_REQUISITES.footerEmails.privacy,
    footerSupportEmail: DEFAULT_REQUISITES.footerEmails.support,
};

export default function RequisitesAdminPage() {
    const { data: session } = useSession();
    const role = session?.user?.role;

    // Реквизиты из БД (null — строка ещё не создана).
    const { data: requisites, isPending } = api.requisites.get.useQuery();

    const utils = api.useUtils();

    // Сохранение. После успеха — перечитать реквизиты (обновятся футер/контакты).
    const update = api.requisites.update.useMutation({
        onSuccess: () => {
            void utils.requisites.get.invalidate();
        },
    });

    // «Сохранено» — показывается после успешного сохранения.
    const [saved, setSaved] = useState(false);

    if (!canManageRequisites(role)) {
        return (
            <AuthGuard>
                <Layout>
                    <AccessDenied />
                </Layout>
            </AuthGuard>
        );
    }

    // Форма инициализируется данными из БД (или дефолтами).
    // key: пока нет строки — дефолты; появилась/обновилась — форма пересоздаётся
    // с новыми значениями (стандартный React-паттерн «сброс формы по key»).
    const initial = requisites ?? OPERATOR_DEFAULTS;

    return (
        <AuthGuard>
            <Layout>
                <div className="mx-auto max-w-[900px] rounded-[24px] bg-muted p-12 shadow-[0_20px_60px_rgba(0,0,0,0.08)] max-[480px]:rounded-2xl max-[480px]:p-4 max-md:rounded-[20px] max-md:p-6">
                    <h1 className="mb-6 flex items-center gap-3 text-3xl font-bold text-foreground max-md:text-2xl">
                        <Settings className="h-6 w-6" />
                        Реквизиты платформы
                    </h1>

                    {isPending ? (
                        <p className="text-muted-foreground">Загрузка…</p>
                    ) : (
                        <RequisitesForm
                            key={requisites ? requisites.updatedAt.getTime() : 'default'}
                            initial={initial}
                            onSave={(values) => {
                                update.mutate(values, {
                                    onSuccess: () => setSaved(true),
                                });
                            }}
                            saved={saved}
                        />
                    )}

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
            </Layout>
        </AuthGuard>
    );
}

// ============================================================
// Сама форма. Получает начальные значения и колбэк сохранения.
// ============================================================
type RequisitesFormProps = {
    initial: RequisitesFormState;
    onSave: (values: RequisitesFormState) => void;
    saved: boolean;
};

function RequisitesForm({ initial, onSave, saved }: RequisitesFormProps) {
    const [form, setForm] = useState<RequisitesFormState>(initial);

    // Простая валидация: ни одно поле не может быть пустым.
    const [error, setError] = useState<string | null>(null);

    function submit() {
        const emptyField = FIELDS.find((field) => form[field.key].trim().length === 0);
        if (emptyField) {
            setError(`Поле «${emptyField.label}» не может быть пустым`);
            return;
        }
        setError(null);
        onSave(form);
    }

    return (
        <>
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
                            className="min-h-11 w-full rounded-xl border border-border bg-card px-4 text-base text-foreground outline-none focus:border-primary"
                        />
                        <span className="text-xs text-muted-foreground">{field.hint}</span>
                    </label>
                ))}
            </div>

            {error && (
                <p className="mt-4 rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
                    {error}
                </p>
            )}

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <button
                    type="button"
                    onClick={submit}
                    className="min-h-11 cursor-pointer rounded-[30px] bg-foreground px-8 py-3 text-sm font-medium text-background transition-colors hover:bg-foreground/85"
                >
                    Сохранить
                </button>
                {saved && <p className="text-sm text-muted-foreground">Реквизиты сохранены.</p>}
            </div>
        </>
    );
}
