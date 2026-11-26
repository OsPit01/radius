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
