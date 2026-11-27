// Цвет статуса: подтверждена — зелёный, ждёт ответа — жёлтый, отменена — красный.
export function statusColor(status: string): string {
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

// Сколько ночей между заездом и выездом.
export function nightsBetween(checkInDate: Date, checkOutDate: Date): number {
    return Math.round((new Date(checkOutDate).getTime() - new Date(checkInDate).getTime()) / 86_400_000);
}
