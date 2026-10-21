import { useEffect, useState } from 'react';

import { useSession } from 'next-auth/react';

import { AuthGuard } from '@/components/layout/AuthGuard';
import { ClientHeader } from '@/components/layout/ClientHeader';
import { ModeSwitch } from '@/components/profile/bookings/BookingModeSwitch';
import { Tabs } from '@/components/profile/bookings/BookingTabs';
import { Modal } from '@/components/ui/Modal';
import { formatPhoneForDisplay } from '@/lib/phone';
import { requireAuth } from '@/server/auth/require-auth';
import { api } from '@/trpc/react';

// Человекочитаемые подписи статусов брони.
const BOOKING_STATUS_LABELS: Record<string, string> = {
    new: 'Новая заявка',
    approved: 'Подтверждена',
    rejected: 'Отклонена',
    cancelled: 'Отменена',
    expired: 'Истекла',
};

// Форматирование даты в человекочитаемый вид (например «30 октября 2026 г.»).
function formatDate(date: Date) {
    return date.toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });
}

// Полное имя владельца из ФИО (или fallback на name).
function ownerDisplayName(owner: { name?: string | null; firstName?: string | null; lastName?: string | null }) {
    if (owner.firstName || owner.lastName) {
        return [owner.firstName, owner.lastName].filter(Boolean).join(' ');
    }
    return owner.name ?? '—';
}

// Неавторизованных отправляем на вход ещё на сервере
export const getServerSideProps = requireAuth;

export default function BookingsPage() {
    const utils = api.useUtils();
    const { data: session } = useSession();
    // Обычный пользователь (role "user") может только снимать жильё —
    // переключатель «Сдаю / Снимаю» ему не нужен, показываем только «Снимаю».
    const canHost = session?.user?.role !== 'user';

    // Заявки на мои квартиры (я — владелец).
    const { data: bookings, isPending, isError } = api.bookings.listForOwner.useQuery();

    // Мои брони как гостя (я — арендатор).
    const { data: myBookings, isPending: isMyPending, isError: isMyError } = api.bookings.listForUser.useQuery();

    // Одобрить / отклонить заявку (действие владельца).
    const setStatus = api.bookings.setStatus.useMutation({
        onSuccess: () => {
            void utils.bookings.listForOwner.invalidate();
        },
    });

    // Отменить бронь (действие гостя).
    const cancelBooking = api.bookings.cancel.useMutation({
        onSuccess: () => {
            void utils.bookings.listForUser.invalidate();
        },
    });

    // Автоотмена просроченных заявок (таймер 12ч) — ленивая проверка при загрузке.
    const expireBookings = api.bookings.expireBookings.useMutation({
        onSuccess: () => {
            void utils.bookings.listForOwner.invalidate();
            void utils.bookings.listForUser.invalidate();
        },
    });

    // При открытии страницы запускаем автоотмену просроченных заявок.
    useEffect(() => {
        expireBookings.mutate();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Подтверждение перед одобрением/отклонением.
    const [confirm, setConfirm] = useState<{
        bookingId: number;
        status: 'approved' | 'rejected';
    } | null>(null);

    // Режим: «Сдаю» (владелец) или «Снимаю» (гость).
    const [mode, setMode] = useState<'owner' | 'guest'>('owner');
    // Активная вкладка внутри режима.
    const [tab, setTab] = useState('new');

    // Для обычного пользователя режим принудительно «Снимаю»,
    // а вкладка по умолчанию — «Активные» (вкладки «Новые» у гостя нет).
    const currentMode: 'owner' | 'guest' = canHost ? mode : 'guest';
    const currentTab = currentMode === 'guest' && tab === 'new' ? 'approved' : tab;

    // Выбираем данные текущего режима.
    const currentData = currentMode === 'owner' ? bookings : myBookings;
    const currentPending = currentMode === 'owner' ? isPending : isMyPending;
    const currentError = currentMode === 'owner' ? isError : isMyError;

    // Вкладки статусов зависят от режима. У обеих сторон есть «Прошедшие».
    const statusTabs: { id: string; label: string }[] =
        currentMode === 'owner'
            ? [
                  { id: 'new', label: 'Новые' },
                  { id: 'approved', label: 'Активные' },
                  { id: 'past', label: 'Прошедшие' },
                  { id: 'rejected', label: 'Отклонённые' },
              ]
            : [
                  { id: 'approved', label: 'Активные' },
                  { id: 'past', label: 'Прошедшие' },
                  { id: 'cancelled', label: 'Отменённые' },
              ];

    // Фильтрация списка под выбранный режим и вкладку.
    const filtered = (currentData ?? []).filter(({ booking }) => {
        // Прошла ли дата выезда (одна и та же логика для обеих сторон).
        const isPast = new Date(booking.checkOutDate) < new Date();

        if (currentTab === 'past') {
            // «Прошедшие» — гость реально прожил: дата выезда в прошлом,
            // и заявка НЕ отменена / НЕ отклонена / НЕ истекла.
            return (
                isPast &&
                booking.status !== 'cancelled' &&
                booking.status !== 'rejected' &&
                booking.status !== 'expired'
            );
        }
        if (currentTab === 'approved') {
            // «Активные» — предстоящие. У гостя сюда же попадают заявки,
            // ожидающие подтверждения (status "new"), чтобы они не «терялись».
            if (currentMode === 'guest') {
                return (booking.status === 'new' || booking.status === 'approved') && !isPast;
            }
            return booking.status === 'approved' && !isPast;
        }
        // «Отклонённые» / «Отменённые» — туда же показываем автоотменённые (expired),
        // чтобы заявка не «исчезала» после срабатывания таймера.
        if (currentTab === 'rejected' || currentTab === 'cancelled') {
            return booking.status === currentTab || booking.status === 'expired';
        }
        // «Новые» — просто по статусу.
        return booking.status === currentTab;
    });

    return (
        <AuthGuard>
            <ClientHeader />
            {/* Переключатель «Сдаю / Снимаю» — только для владельца/админа */}
            {canHost && (
                <div className="mx-auto max-w-full px-4 pt-2">
                    <ModeSwitch
                        tabs={[
                            { id: 'owner', label: 'Сдаю' },
                            { id: 'guest', label: 'Снимаю' },
                        ]}
                        active={currentMode}
                        onChange={(id) => {
                            setMode(id);
                            // При смене режима сбрасываем вкладку на дефолтную,
                            // иначе старый tab может не существовать в новом режиме.
                            setTab(id === 'owner' ? 'new' : 'approved');
                        }}
                    />
                </div>
            )}

            <div className="mx-auto max-w-3xl px-4 pt-5">
                {/* Вкладки статусов текущего режима */}
                <Tabs
                    tabs={statusTabs}
                    active={currentTab}
                    onChange={setTab}
                />

                <h1 className="mb-1 pt-10 text-2xl font-bold text-foreground">Мои брони</h1>
                <p className="mb-6 text-sm text-muted-foreground">Заявки, которые оставляют гости на ваших квартирах</p>

                {currentPending && <p className="py-8 text-center text-muted-foreground">Загрузка заявок...</p>}

                {currentError && (
                    <p className="py-8 text-center text-destructive">Не удалось загрузить заявки. Попробуйте позже.</p>
                )}

                {!currentPending && !currentError && currentData?.length === 0 && (
                    <p className="py-8 text-center text-muted-foreground">Пока нет ни одной заявки на бронирование.</p>
                )}

                {!currentPending && !currentError && (currentData?.length ?? 0) > 0 && (
                    <>
                        {filtered.length === 0 ? (
                            <p className="py-8 text-center text-muted-foreground">В этом разделе пока нет заявок</p>
                        ) : (
                            <ul className="flex flex-col gap-4">
                                {filtered.map(({ booking, apartment, owner }) => (
                                    <li
                                        key={booking.id}
                                        className="rounded-2xl border border-border bg-card p-5 shadow-sm"
                                    >
                                        <div className="mb-3 flex items-start justify-between gap-3">
                                            <p className="font-semibold text-foreground">{apartment.title}</p>
                                            <span className="shrink-0 rounded-full bg-muted px-3 py-1 text-xs font-medium text-primary">
                                                {BOOKING_STATUS_LABELS[booking.status] ?? booking.status}
                                            </span>
                                        </div>

                                        <div className="grid grid-cols-1 gap-1 text-sm text-muted-foreground">
                                            {/* Данные различаются: владелец видит гостя, гость — собственника */}
                                            {currentMode === 'owner' ? (
                                                <>
                                                    <p>
                                                        Гость:{' '}
                                                        <span className="font-medium text-foreground">
                                                            {booking.guestName}
                                                        </span>
                                                    </p>
                                                    <p>
                                                        Телефон:{' '}
                                                        <a
                                                            href={`tel:${booking.guestPhone}`}
                                                            className="font-medium text-primary"
                                                        >
                                                            {formatPhoneForDisplay(booking.guestPhone)}
                                                        </a>
                                                    </p>
                                                </>
                                            ) : (
                                                <>
                                                    <p>
                                                        Собственник:{' '}
                                                        <span className="font-medium text-foreground">
                                                            {ownerDisplayName(owner)}
                                                        </span>
                                                    </p>
                                                    {owner.phone && (
                                                        <p>
                                                            Телефон:{' '}
                                                            <a
                                                                href={`tel:${owner.phone}`}
                                                                className="font-medium text-primary"
                                                            >
                                                                {formatPhoneForDisplay(owner.phone)}
                                                            </a>
                                                        </p>
                                                    )}
                                                </>
                                            )}
                                            <p>
                                                Гостей: {booking.guests}
                                                {booking.children > 0 && ` (детей: ${booking.children})`}
                                            </p>
                                            <p>
                                                Заезд: {formatDate(booking.checkInDate)} — выезд:{' '}
                                                {formatDate(booking.checkOutDate)}
                                            </p>
                                            {booking.message && (
                                                <p className="pt-1 text-muted-foreground">«{booking.message}»</p>
                                            )}
                                        </div>

                                        <p className="mt-3 text-xs text-muted-foreground">
                                            Создана {formatDate(booking.createdAt)}
                                        </p>

                                        {/* Кнопки действия зависят от режима */}
                                        {currentMode === 'owner' && booking.status === 'new' && (
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() =>
                                                        setConfirm({
                                                            bookingId: booking.id,
                                                            status: 'approved',
                                                        })
                                                    }
                                                    className="mt-5 cursor-pointer rounded-[25px] border border-success px-4 py-2 text-foreground transition-all duration-300 hover:bg-success/90 hover:text-success-foreground"
                                                >
                                                    Одобрить
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        setConfirm({
                                                            bookingId: booking.id,
                                                            status: 'rejected',
                                                        })
                                                    }
                                                    className="mt-5 cursor-pointer rounded-[25px] border border-destructive px-4 py-2 text-foreground transition-all duration-300 hover:bg-destructive/90 hover:text-destructive-foreground"
                                                >
                                                    Отклонить
                                                </button>
                                            </div>
                                        )}
                                        {currentMode === 'guest' &&
                                            (booking.status === 'new' || booking.status === 'approved') && (
                                                <button
                                                    onClick={() => cancelBooking.mutate({ bookingId: booking.id })}
                                                    className="mt-5 cursor-pointer rounded-[25px] border border-destructive px-4 py-2 text-foreground transition-all duration-300 hover:bg-destructive/90 hover:text-destructive-foreground"
                                                >
                                                    Отменить бронирование
                                                </button>
                                            )}
                                    </li>
                                ))}
                            </ul>
                        )}
                    </>
                )}
            </div>

            {/* Модалка подтверждения одобрения/отклонения */}
            <Modal
                open={confirm !== null}
                onClose={() => setConfirm(null)}
                title="Подтвердите действие"
            >
                <p>Вы уверены, что хотите {confirm?.status === 'approved' ? 'одобрить' : 'отклонить'} заявку?</p>
                <div className="mt-6 flex justify-center gap-3">
                    <button
                        onClick={() => {
                            if (confirm) {
                                setStatus.mutate(confirm);
                                setConfirm(null);
                            }
                        }}
                        className="cursor-pointer rounded-[25px] border border-success px-10 py-2.5 text-foreground transition-all duration-300 hover:bg-success/90 hover:text-success-foreground"
                    >
                        Да
                    </button>
                    <button
                        onClick={() => setConfirm(null)}
                        className="cursor-pointer rounded-[25px] border border-destructive px-10 py-2.5 text-foreground transition-all duration-300 hover:bg-destructive/90 hover:text-destructive-foreground"
                    >
                        Отмена
                    </button>
                </div>
            </Modal>
        </AuthGuard>
    );
}
