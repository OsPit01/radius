import { useState } from 'react';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';

import { CheckCircle, Hourglass } from '@/components/icons';
import { AuthGuard } from '@/components/layout/AuthGuard';
import { BOOKING_STATUS_LABELS, GUEST_BOOKING_STATUS_LABELS } from '@/lib/constants/booking';
import { cancelledByLabel } from '@/lib/constants/cancel-reasons';
import { requireAuth } from '@/server/auth/require-auth';
import { Layout } from '@/shared/ui/layout';
import { api } from '@/trpc/react';
import { plural } from '@/utils/plural';
export const getServerSideProps = requireAuth;

// «26 окт., пн» — дата + день недели.
function formatDateWithWeekday(value: Date | string): string {
    return new Date(value).toLocaleDateString('ru-RU', {
        day: 'numeric',
        month: 'short',
        weekday: 'short',
    });
}

// Сколько ночей между заездом и выездом.
function nightsBetween(checkInDate: Date, checkOutDate: Date): number {
    return Math.round((new Date(checkOutDate).getTime() - new Date(checkInDate).getTime()) / 86_400_000);
}

// Цвет статуса: подтверждена — зелёный, ждёт — жёлтый, отменена — красный.
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

export default function BookingDetailPage() {
    const router = useRouter();
    const utils = api.useUtils();
    const { data: session } = useSession();
    const userId = session?.user?.id ?? '';
    // Какое действие ждёт подтверждения: null = модалка закрыта.
    const [confirmAction, setConfirmAction] = useState<'approve' | 'reject' | 'cancel' | null>(null);
    // id из адреса → число. Мусор в URL → страница покажет «не найдено».
    const rawId = typeof router.query.id === 'string' ? router.query.id : '';
    const bookingId = Number(rawId);
    const isValidId = Number.isInteger(bookingId) && bookingId > 0;

    const { data, isPending } = api.bookings.getById.useQuery({ bookingId }, { enabled: isValidId });

    // Владелец: подтвердить или отклонить (один хук на оба действия — разный status).
    const setStatus = api.bookings.setStatus.useMutation({
        onSuccess: () => {
            void utils.bookings.getById.invalidate({ bookingId });
        },
    });

    // Гость: отменить бронь.
    const cancelBooking = api.bookings.cancel.useMutation({
        onSuccess: () => {
            void utils.bookings.getById.invalidate({ bookingId });
        },
    });
    if (!isValidId || (!isPending && !data)) {
        return (
            <AuthGuard>
                <Layout className="w-auto! px-6! py-10! max-md:px-5!">
                    <p className="text-center text-muted-foreground">Заявка не найдена.</p>
                </Layout>
            </AuthGuard>
        );
    }

    const { booking, apartment } = data ?? {};
    const isOwner = apartment?.createdById === userId;
    const nights = booking ? nightsBetween(booking.checkInDate, booking.checkOutDate) : 0;

    return (
        <AuthGuard>
            <Layout className="max-w-3xl! px-6! py-6! max-md:px-5!">
                {isPending || !booking || !apartment ? (
                    <p className="py-8 text-center text-muted-foreground">Загрузка…</p>
                ) : (
                    <>
                        {/* Заголовок-статус: отменена → кто отменил; иначе — статус */}
                        {cancelledByLabel(booking.cancelledBy) ? (
                            <h1 className={`text-xl font-bold ${statusColor(booking.status)}`}>
                                {cancelledByLabel(booking.cancelledBy)}
                            </h1>
                        ) : (
                            <h1 className={`flex items-center gap-2 text-xl font-bold ${statusColor(booking.status)}`}>
                                {booking.status === 'approved' && <CheckCircle className="h-5 w-5" />}
                                {booking.status === 'new' && <Hourglass className="h-5 w-5" />}
                                {(isOwner ? BOOKING_STATUS_LABELS : GUEST_BOOKING_STATUS_LABELS)[booking.status] ??
                                    booking.status}
                            </h1>
                        )}

                        {/* Оплата при заселении */}
                        <p className="mt-1 text-sm text-muted-foreground">Оплата при заселении</p>

                        {/* Причина отмены */}
                        {booking.cancelReason && (
                            <p className="mt-2 text-sm wrap-break-word text-muted-foreground">
                                Причина отмены: «{booking.cancelReason}»
                            </p>
                        )}

                        {/* Квартира: фото + название + адрес + рейтинг */}
                        <div className="mt-5 flex gap-4 rounded-2xl border border-border bg-card p-4">
                            {apartment.images?.[0] && (
                                <Image
                                    src={apartment.images[0]}
                                    alt=""
                                    width={96}
                                    height={96}
                                    className="h-24 w-24 shrink-0 rounded-xl object-cover max-md:h-20 max-md:w-20"
                                />
                            )}
                            <div className="min-w-0">
                                <Link
                                    href={`/apartments/${apartment.id}`}
                                    className="font-semibold wrap-break-word text-foreground no-underline hover:text-primary"
                                >
                                    {apartment.title}
                                </Link>
                                <p className="mt-1 text-sm break-words text-muted-foreground">
                                    {apartment.formattedAddress ?? 'Адрес не указан'}
                                </p>
                                {(apartment.rating ?? 0) > 0 && (
                                    <p className="mt-1 text-sm text-muted-foreground">
                                        {(apartment.rating ?? 0).toFixed(1).replace('.', ',')} · Оценка
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Заезд / ночи / Выезд */}
                        <div className="mt-4 flex items-center gap-4 rounded-2xl border border-border bg-card p-4">
                            <div className="flex-1">
                                <p className="text-sm text-muted-foreground">Заезд</p>
                                <p className="font-medium text-foreground">
                                    {formatDateWithWeekday(booking.checkInDate)}
                                </p>
                                <p className="text-sm text-foreground">{apartment.checkInTime ?? '—'}</p>
                            </div>
                            <div className="text-center">
                                <p className="text-sm text-muted-foreground">
                                    {nights} {plural(nights, 'ночь', 'ночи', 'ночей')}
                                </p>
                            </div>
                            <div className="flex-1 text-right">
                                <p className="text-sm text-muted-foreground">Выезд</p>
                                <p className="font-medium text-foreground">
                                    {formatDateWithWeekday(booking.checkOutDate)}
                                </p>
                                <p className="text-sm text-foreground">{apartment.checkOutTime ?? '—'}</p>
                            </div>
                        </div>

                        {/* Детали бронирования */}
                        <div className="mt-4 rounded-2xl border border-border bg-card p-4">
                            <h2 className="font-semibold text-foreground">Детали бронирования</h2>

                            <p className="mt-3 text-sm font-medium text-foreground">
                                Предполагаемое время заезда и выезда
                            </p>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Заезд: {apartment.checkInTime ?? '—'} (Стандартное время)
                            </p>
                            <p className="text-sm text-muted-foreground">
                                Выезд: {apartment.checkOutTime ?? '—'} (Стандартное время)
                            </p>

                            <p className="mt-3 text-sm font-medium text-foreground">Цель поездки</p>
                            <p className="mt-1 text-sm wrap-break-word text-muted-foreground">
                                {booking.tripPurpose ?? 'Не указана'}
                            </p>

                            <p className="mt-3 text-sm font-medium text-foreground">Правила отмены</p>
                            <p className="mt-1 text-sm text-muted-foreground">
                                Бесплатная отмена — до заезда. После заезда возврат не производится.
                            </p>
                        </div>

                        {/* Действия доступны только когда заявка ждёт решения (status === 'new') */}
                        {booking.status === 'new' && (
                            <div className="mt-5 flex flex-col gap-2">
                                {isOwner ? (
                                    <>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (confirmAction === 'approve') {
                                                    setStatus.mutate({ bookingId: booking.id, status: 'approved' });
                                                    setConfirmAction(null);
                                                } else {
                                                    setConfirmAction('approve');
                                                }
                                            }}
                                            disabled={setStatus.isPending}
                                            className="w-full cursor-pointer rounded-2xl border border-black px-6 py-3 font-semibold text-black transition-colors hover:bg-green-900 hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
                                        >
                                            {confirmAction === 'approve'
                                                ? 'Точно подтвердить?'
                                                : 'Подтвердить бронирование'}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                if (confirmAction === 'reject') {
                                                    setStatus.mutate({ bookingId: booking.id, status: 'rejected' });
                                                    setConfirmAction(null);
                                                } else {
                                                    setConfirmAction('reject');
                                                }
                                            }}
                                            className="rounded-2xl border border-destructive px-6 py-3 font-semibold text-destructive transition-colors hover:bg-red-900 hover:text-white"
                                        >
                                            {confirmAction === 'reject' ? 'Точно отклонить?' : 'Отклонить заявку'}
                                        </button>
                                    </>
                                ) : (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            if (confirmAction === 'cancel') {
                                                cancelBooking.mutate({ bookingId: booking.id });
                                                setConfirmAction(null);
                                            } else {
                                                setConfirmAction('cancel');
                                            }
                                        }}
                                        className="rounded-2xl border border-destructive px-6 py-3 font-semibold text-destructive transition-colors hover:bg-destructive/10"
                                    >
                                        {confirmAction === 'cancel' ? 'Точно отменить?' : 'Отменить бронирование'}
                                    </button>
                                )}
                            </div>
                        )}
                    </>
                )}
            </Layout>
        </AuthGuard>
    );
}
