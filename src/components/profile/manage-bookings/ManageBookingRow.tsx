import Image from 'next/image';
import Link from 'next/link';

import { CheckCircle, Close, Hourglass } from '@/components/icons';
import { formatFullDate, formatShortDate, statusColor } from '@/lib/booking-utils';
import { BOOKING_STATUS_LABELS } from '@/lib/constants/booking';
import { cancelledByLabel } from '@/lib/constants/cancel-reasons';
import { formatByn } from '@/lib/constants/currencies';
import type { RouterOutputs } from '@/trpc/react';

// «Элемент списка» — то, что возвращает listForOwner для ОДНОЙ заявки.
// [number] — «один элемент массива»: { booking, apartment, owner }.
type OwnerBooking = RouterOutputs['bookings']['listForOwner'][number];

type ManageBookingRowProps = {
    booking: OwnerBooking['booking'];
    apartment: OwnerBooking['apartment'];
    canDelete: boolean;
    onDelete: (bookingId: number) => void;
};

export function ManageBookingRow({ booking, apartment, canDelete, onDelete }: ManageBookingRowProps) {
    return (
        <div className="flex items-center border-b border-border">
            {/* ВСЯ строка (кроме крестика) — ссылка на детали заявки */}
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
                        <p className="truncate font-medium text-foreground">{apartment.title}</p>
                        <p className="text-sm text-muted-foreground">{formatByn(apartment.price)}/сутки</p>
                    </div>
                </div>

                {/* Проживание: даты заезда/выезда */}
                <span className="text-sm text-muted-foreground">
                    <span className="font-medium text-foreground md:hidden">Проживание: </span>
                    {formatShortDate(booking.checkInDate)} — {formatShortDate(booking.checkOutDate)}
                </span>

                {/* Статус + причина */}
                <div className="min-w-0">
                    {cancelledByLabel(booking.cancelledBy) ? (
                        <>
                            <p className={`text-sm font-bold ${statusColor(booking.status)}`}>
                                {cancelledByLabel(booking.cancelledBy)}
                            </p>
                            {booking.cancelReason && (
                                <p className="text-xs text-muted-foreground">
                                    Причина отмены: «{booking.cancelReason}»
                                </p>
                            )}
                        </>
                    ) : (
                        <p className={`flex items-center gap-1.5 text-sm font-bold ${statusColor(booking.status)}`}>
                            {booking.status === 'approved' && <CheckCircle className="h-4 w-4" />}
                            {booking.status === 'new' && <Hourglass className="h-4 w-4" />}
                            {BOOKING_STATUS_LABELS[booking.status] ?? booking.status}
                        </p>
                    )}
                </div>
            </Link>

            {/* Удалить — снаружи ссылки */}
            {canDelete && (
                <button
                    type="button"
                    onClick={() => onDelete(booking.id)}
                    aria-label="Удалить заявку"
                    className="shrink-0 rounded-full p-1.5 pr-3 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                >
                    <Close className="h-5 w-5" />
                </button>
            )}
        </div>
    );
}
