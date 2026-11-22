import Image from 'next/image';
import Link from 'next/link';

import { CheckCircle, Close, Hourglass } from '@/components/icons';
import { formatFullDate, formatShortDate, statusColor } from '@/lib/booking-utils';
import { GUEST_BOOKING_STATUS_LABELS } from '@/lib/constants/booking';
import { cancelledByLabel } from '@/lib/constants/cancel-reasons';
import { formatByn } from '@/lib/constants/currencies';
import type { RouterOutputs } from '@/trpc/react';

// «Элемент списка» — что возвращает listForUser для ОДНОЙ брони.
type UserBooking = RouterOutputs['bookings']['listForUser'][number];

type MyBookingCardProps = {
    booking: UserBooking['booking'];
    apartment: UserBooking['apartment'];
    canDelete: boolean;
    onDelete: (bookingId: number) => void;
};

export function MyBookingCard({ booking, apartment, canDelete, onDelete }: MyBookingCardProps) {
    return (
        <li className="flex items-start gap-4 rounded-2xl border border-border bg-card p-5 max-md:gap-3 max-md:p-4">
            {/* Фото + контент — ссылка на детали брони */}
            <Link
                href={`/profile/bookings/${booking.id}`}
                className="flex min-w-0 flex-1 items-start gap-4 no-underline max-md:gap-3"
            >
                {/* Фото */}
                {apartment.images?.[0] && (
                    <Image
                        src={apartment.images[0]}
                        alt=""
                        width={80}
                        height={80}
                        className="h-20 w-20 shrink-0 rounded-xl object-cover max-md:h-16 max-md:w-16"
                    />
                )}

                <div className="flex min-w-0 flex-1 flex-col gap-2.5">
                    {/* Дата заявки */}
                    <p className="text-xs text-muted-foreground">Дата: {formatFullDate(booking.createdAt)}</p>
                    {/* Адрес */}
                    <p className="truncate font-medium text-foreground">
                        {apartment.street}, {apartment.numberHome}
                    </p>
                    {/* Цена */}
                    <p className="text-sm text-muted-foreground">{formatByn(apartment.price)}</p>

                    {/* Заезд — Выезд */}
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                        <span className="text-muted-foreground">Заезд:</span>
                        <span className="text-foreground">{formatShortDate(booking.checkInDate)}</span>
                        <span className="text-muted-foreground">—</span>
                        <span className="text-muted-foreground">Выезд:</span>
                        <span className="text-foreground">{formatShortDate(booking.checkOutDate)}</span>
                    </div>

                    {/* Статус: отменена → кто и почему; иначе — статус с иконкой */}
                    {cancelledByLabel(booking.cancelledBy) ? (
                        <>
                            <p className={`font-bold ${statusColor(booking.status)}`}>
                                {cancelledByLabel(booking.cancelledBy)}
                            </p>
                            {booking.cancelReason && (
                                <p className="text-sm wrap-break-word text-muted-foreground">
                                    Причина отмены: «{booking.cancelReason}»
                                </p>
                            )}
                        </>
                    ) : (
                        <p className={`flex items-center gap-1.5 font-bold ${statusColor(booking.status)}`}>
                            {booking.status === 'approved' && <CheckCircle className="h-4 w-4" />}
                            {booking.status === 'new' && <Hourglass className="h-4 w-4" />}
                            {GUEST_BOOKING_STATUS_LABELS[booking.status] ?? booking.status}
                        </p>
                    )}
                </div>
            </Link>

            {/* Удалить — снаружи ссылки, видно только админу+ */}
            {canDelete && (
                <button
                    type="button"
                    onClick={() => onDelete(booking.id)}
                    aria-label="Удалить заявку"
                    className="shrink-0 rounded-full p-1.5 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                >
                    <Close className="h-5 w-5" />
                </button>
            )}
        </li>
    );
}
