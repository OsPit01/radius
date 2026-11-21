import { useState } from 'react';

import Image from 'next/image';
import Link from 'next/link';
import { useSession } from 'next-auth/react';

import { CheckCircle, Close, Hourglass } from '@/components/icons';
import { AuthGuard } from '@/components/layout/AuthGuard';
import { ClientHeader } from '@/components/layout/ClientHeader';
import { FilterTabs } from '@/components/ui/FilterTabs';
import { Modal } from '@/components/ui/Modal';
import { SegmentedTabs } from '@/components/ui/SegmentedTabs';
import { BOOKING_STATUS_LABELS } from '@/lib/constants/booking';
import { cancelledByLabel } from '@/lib/constants/cancel-reasons';
import { formatByn } from '@/lib/constants/currencies';
import { isAdminRole } from '@/lib/constants/roles';
import { requireRole } from '@/server/auth/require-auth';
import { api } from '@/trpc/react';

// Страница доступна только арендодателю и выше (lessor+).
// Обычному пользователю (role "user") отдаётся 404 ещё на сервере.
export const getServerSideProps = requireRole('lessor');

// ===== ВСПОМОГАТЕЛЬНЫЕ ФУНКЦИИ (чистые: приняли данные → вернули строку/цвет) =====

// «21 ноября 2026 г., 09:45» — дата создания (день + месяц + год + время):
// время нужно, чтобы был виден порядок заявок, созданных в один день.
function formatFullDate(value: Date | string): string {
    return new Date(value).toLocaleString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    });
}

// «15 ноября» — даты проживания (день + полный месяц, без года).
function formatShortDate(value: Date | string): string {
    return new Date(value).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long' });
}

// Цвет статуса: подтверждена — зелёный, ждёт ответа — жёлтый, отменена — красный.
function statusColor(status: string): string {
    switch (status) {
        case 'approved':
            return 'text-success';
        case 'new':
            return 'text-warning';
        case 'cancelled':
        case 'rejected':
        case 'expired':
            return 'text-destructive';
        default:
            return 'text-foreground';
    }
}

// Подходит ли заявка под выбранный фильтр.
// Одна функция — и для счётчиков, и для списка: правило живёт в одном месте,
// счётчик и список физически не могут разъехаться.
function matchesFilter(status: string, checkInDate: Date, checkOutDate: Date, filter: string, now: Date): boolean {
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);
    const isPast = checkOut < now; // выезд уже был
    const isCancelled = status === 'cancelled' || status === 'rejected' || status === 'expired';

    switch (filter) {
        case 'pending': // ждёт ответа владельца
            return status === 'new';
        case 'upcoming': // подтверждена и ещё не началась
            return status === 'approved' && checkIn > now;
        case 'staying': // гости живут прямо сейчас
            return status === 'approved' && checkIn <= now && now <= checkOut;
        case 'past': // выезд был, заявка не отменена
            return isPast && !isCancelled;
        case 'cancelled': // отменена / отклонена / истекла
            return isCancelled;
        case 'all':
        default:
            return true;
    }
}

// Набор фильтров — один список: и для вкладок, и для счётчиков.
const FILTERS = [
    { id: 'all', label: 'Все' },
    { id: 'pending', label: 'Для подтверждения' },
    { id: 'upcoming', label: 'Предстоящие' },
    { id: 'staying', label: 'Проживают' },
    { id: 'past', label: 'Прошлые' },
    { id: 'cancelled', label: 'Отменённые' },
] as const;

export default function ManageBookingsPage() {
    // ===== СОСТОЯНИЕ СТРАНИЦЫ (useState) =====
    // useState('значение') возвращает ПАРУ: [текущее значение, функция-сменщик].
    // Пока значение меняется через функцию — React автоматически перерисовывает страницу.

    // tab — какая из ВЕРХНИХ вкладок открыта (Информация / Мои заявки / Календарь / Настройки).
    // По умолчанию 'requests' — «Мои заявки».
    const [tab, setTab] = useState('requests');

    // underTab — какой ФИЛЬТР выбран внутри «Моих заявок» (Все / Для подтверждения / …).
    // По умолчанию 'all' — «Все».
    const [underTab, setUnderTab] = useState('all');
    const { data: session } = useSession();
    // Удалять может только админ и выше — крестик виден только ему.
    const canDelete = isAdminRole(session?.user?.role);
    // Какую заявку подтверждаем удалить (null = модалка закрыта).
    const [confirmDeleteId, setConfirmDeleteId] = useState<number | null>(null);

    // ===== ДАННЫЕ С СЕРВЕРА =====
    // useQuery — «сходи на сервер и верни данные»: пока сервер отвечает, isPending = true.
    // listForOwner возвращает заявки НА МОИ КВАРТИРЫ (я — владелец).
    // Кнопки одобрить/отклонить на этой странице НЕ нужны: их заменила кнопка
    // «Подтвердить бронирование» на странице деталей /profile/bookings/[id].
    const { data: bookings, isPending } = api.bookings.listForOwner.useQuery();

    // ===== УДАЛЕНИЕ ЗАЯВКИ =====
    // useMutation — «выполни действие на сервере» (в отличие от useQuery, который только читает).
    // deleteBooking.mutate({ bookingId }) — САМ ВЫЗОВ удаления (срабатывает по клику на крестик ниже).
    // onSuccess — что сделать ПОСЛЕ успешного удаления: invalidate («сбрось кэш и перечитай
    // список заново»), иначе список в кэше останется старым, и удалённая заявка «не исчезнет».
    const utils = api.useUtils();
    const deleteBooking = api.bookings.delete.useMutation({
        onSuccess: () => {
            void utils.bookings.listForOwner.invalidate();
        },
    });

    // «Сейчас» — одна дата для всей страницы (фильтры сравнивают с ней заезд/выезд).
    const now = new Date();

    // ===== СЧЁТЧИКИ =====
    // Для КАЖДОГО фильтра считаем, сколько заявок под него подходит.
    // FILTERS.map — «пройдись по всем фильтрам», для каждого:
    //   filter(...).length — посчитай подходящие заявки.
    // На выходе — массив { id, label, count }, его мы отдаём в FilterTabs (числа в скобках).
    const counts = FILTERS.map((f) => {
        const count = (bookings ?? []).filter(({ booking }) =>
            matchesFilter(booking.status, booking.checkInDate, booking.checkOutDate, f.id, now),
        ).length;
        return { id: f.id, label: f.label, count };
    });

    // ===== ОТФИЛЬТРОВАННЫЙ СПИСОК =====
    // То же правило matchesFilter, но с ВЫБРАННЫМ фильтром (underTab):
    // кликнули «Отменённые» → underTab стал 'cancelled' → здесь остаются только отменённые.
    const filtered = (bookings ?? []).filter(({ booking }) =>
        matchesFilter(booking.status, booking.checkInDate, booking.checkOutDate, underTab, now),
    );

    return (
        <AuthGuard>
            <ClientHeader />
            <div className="mx-auto max-w-[1400px] px-6 py-4 max-md:px-5">
                {/* ===== ВЕРХНИЕ ВКЛАДКИ =====
                    SegmentedTabs рисует кнопки из массива tabs.
                    active={tab} — «какая кнопка подсвечена» (текущее значение state).
                    onChange={setTab} — «при клике по кнопке вызови setTab с её id».
                    Цепочка: клик → SegmentedTabs вызывает onChange(id) → setTab(id)
                    → tab сменился → React перерисовал → вкладка подсветилась
                    и внизу (условный рендер) показался нужный блок. */}
                <SegmentedTabs
                    tabs={[
                        { id: 'info', label: 'Информация' },
                        { id: 'requests', label: 'Мои заявки' },
                        { id: 'calendar', label: 'Календарь' },
                        { id: 'settings', label: 'Настройки' },
                    ]}
                    active={tab}
                    onChange={setTab}
                />

                {/* ===== КОНТЕНТ ВКЛАДКИ «МОИ ЗАЯВКИ» =====
                    Условный рендер: `tab === 'requests' && (...)` —
                    «если открыта вкладка "Мои заявки", покажи блок; иначе ничего». */}
                {tab === 'requests' && (
                    <>
                        {/* ===== ФИЛЬТРЫ-ТАБЛЕТКИ =====
                            FilterTabs — тот же механизм, что SegmentedTabs, но другой вид.
                            tabs={counts} — наши фильтры СО СЧЁТЧИКАМИ (числа в скобках).
                            active={underTab} / onChange={setUnderTab} — связка та же:
                            клик по «Отменённые» → setUnderTab('cancelled') → фильтр применился. */}
                        <FilterTabs
                            tabs={counts}
                            active={underTab}
                            onChange={setUnderTab}
                        />

                        {/* ===== ТРИ СОСТОЯНИЯ СПИСКА =====
                            1) сервер ещё отвечает → «Загрузка…»;
                            2) после фильтра пусто → «По заданным фильтрам ничего не найдено»;
                            3) есть что показать → таблица. */}
                        {isPending ? (
                            <p className="py-8 text-center text-muted-foreground">Загрузка…</p>
                        ) : filtered.length === 0 ? (
                            <p className="py-8 text-center text-muted-foreground">
                                По заданным фильтрам ничего не найдено.
                            </p>
                        ) : (
                            <div className="mt-4">
                                {/* Шапка таблицы. hidden md:grid — на мобилке скрыта (подписи
                                    у значений рисуются отдельно, классом md:hidden ниже). */}
                                <div className="hidden border-b border-border px-2 pb-2 text-sm font-medium text-muted-foreground md:grid md:grid-cols-[150px_1fr_180px_200px] md:gap-4">
                                    <span>Дата</span>
                                    <span>Объект</span>
                                    <span>Проживание</span>
                                    <span>Статус</span>
                                </div>

                                {/* ===== СТРОКИ ТАБЛИЦЫ =====
                                    filtered.map(({ booking, apartment }) => ...) —
                                    «для каждой заявки нарисуй строку». Деструктуризация
                                    { booking, apartment } достаёт два вложенных объекта ответа. */}
                                {filtered.map(({ booking, apartment }) => (
                                    <div
                                        key={booking.id}
                                        className="flex items-center border-b border-border"
                                    >
                                        {/* ВСЯ строка (кроме кнопки удаления) — ссылка на детали
                                            заявки: клик по любому месту открывает /profile/bookings/{id}. */}
                                        <Link
                                            href={`/profile/bookings/${booking.id}`}
                                            className="grid min-w-0 flex-1 grid-cols-1 gap-3 px-3 py-4 no-underline md:grid-cols-[150px_1fr_180px_200px] md:items-center md:gap-4 md:px-2 md:py-3"
                                        >
                                            {/* Дата заявки (подпись — на мобилке) */}
                                            <span className="text-sm text-muted-foreground">
                                                <span className="font-medium text-foreground md:hidden">Дата: </span>
                                                {formatFullDate(booking.createdAt)}
                                            </span>

                                            {/* Объект: фото + заголовок + цена */}
                                            <div className="flex min-w-0 items-center gap-3">
                                                {apartment.images?.[0] && (
                                                    <Image
                                                        src={apartment.images[0]}
                                                        alt=""
                                                        width={48}
                                                        height={48}
                                                        className="h-12 w-12 shrink-0 rounded-lg object-cover"
                                                    />
                                                )}
                                                <div className="min-w-0">
                                                    <p className="truncate font-medium text-foreground">
                                                        {apartment.title}
                                                    </p>
                                                    <p className="text-sm text-muted-foreground">
                                                        {formatByn(apartment.price)}/сутки
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Проживание: даты заезда/выезда (подпись — на мобилке) */}
                                            <span className="text-sm text-muted-foreground">
                                                <span className="font-medium text-foreground md:hidden">
                                                    Проживание:{' '}
                                                </span>
                                                {formatShortDate(booking.checkInDate)} —{' '}
                                                {formatShortDate(booking.checkOutDate)}
                                            </span>

                                            {/* Статус + причина */}
                                            <div className="min-w-0">
                                                {cancelledByLabel(booking.cancelledBy) ? (
                                                    <>
                                                        <p
                                                            className={`text-sm font-bold ${statusColor(booking.status)}`}
                                                        >
                                                            {cancelledByLabel(booking.cancelledBy)}
                                                        </p>
                                                        {booking.cancelReason && (
                                                            <p className="text-xs text-muted-foreground">
                                                                Причина отмены: «{booking.cancelReason}»
                                                            </p>
                                                        )}
                                                    </>
                                                ) : (
                                                    <p
                                                        className={`flex items-center gap-1.5 text-sm font-bold ${statusColor(booking.status)}`}
                                                    >
                                                        {booking.status === 'approved' && (
                                                            <CheckCircle className="h-4 w-4" />
                                                        )}
                                                        {booking.status === 'new' && <Hourglass className="h-4 w-4" />}
                                                        {BOOKING_STATUS_LABELS[booking.status] ?? booking.status}
                                                    </p>
                                                )}
                                            </div>
                                        </Link>

                                        {/* Кнопка удаления — СНАРУЖИ ссылки, чтобы клик по крестику
                                            не переходил на страницу деталей. */}
                                        {canDelete && (
                                            <button
                                                type="button"
                                                onClick={() => setConfirmDeleteId(booking.id)}
                                                aria-label="Удалить заявку"
                                                className="shrink-0 rounded-full p-1.5 pr-3 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                                            >
                                                <Close className="h-5 w-5" />
                                            </button>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </>
                )}

                {/* Остальные вкладки — заглушки «в разработке» */}
                {tab === 'calendar' && <p>Календарь — в разработке</p>}
                {tab === 'info' && <p>Информация — в разработке</p>}
                {tab === 'settings' && <p>Настройки — в разработке</p>}
            </div>

            {/* Модалка подтверждения удаления */}
            <Modal
                open={confirmDeleteId !== null}
                onClose={() => setConfirmDeleteId(null)}
                title="Удалить заявку?"
            >
                <p>Вы уверены, что хотите удалить эту заявку? Действие необратимо.</p>
                <div className="mt-6 flex justify-center gap-3">
                    <button
                        type="button"
                        onClick={() => {
                            if (confirmDeleteId !== null) {
                                deleteBooking.mutate({ bookingId: confirmDeleteId });
                            }
                            setConfirmDeleteId(null);
                        }}
                        className="cursor-pointer rounded-[25px] border border-destructive px-10 py-2.5 text-foreground transition-all duration-300 hover:bg-destructive/90 hover:text-destructive-foreground"
                    >
                        Удалить
                    </button>
                    <button
                        type="button"
                        onClick={() => setConfirmDeleteId(null)}
                        className="cursor-pointer rounded-[25px] border border-border px-10 py-2.5 text-foreground transition-all duration-300 hover:bg-muted"
                    >
                        Отмена
                    </button>
                </div>
            </Modal>
        </AuthGuard>
    );
}
