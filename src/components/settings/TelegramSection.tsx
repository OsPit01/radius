type TelegramSectionProps = {
    /** Привязан ли Telegram (true — показать «Подключено», false — кнопку). */
    connected: boolean;
    /** Идёт ли сейчас запрос подключения. */
    isConnecting: boolean;
    /** Подключить Telegram. */
    onConnect: () => void;
    /** Отвязать Telegram. */
    onDisconnect: () => void;
};
export function TelegramSection({ connected, isConnecting, onConnect, onDisconnect }: TelegramSectionProps) {
    return (
        <div className="mb-5">
            <p className="text-[17px]">Telegram-уведомления о бронированиях:</p>
            {connected ? (
                <div className="mt-2 flex items-center gap-3">
                    <span className="inline-flex items-center gap-1 rounded-full bg-success/20 px-3 py-1 text-[13px] text-success">
                        Подключено
                    </span>
                    <button
                        type="button"
                        onClick={onDisconnect}
                        className="cursor-pointer rounded-full border border-border px-4 py-1.5 text-[13px] text-foreground/80 hover:text-foreground"
                    >
                        Отвязать
                    </button>
                </div>
            ) : (
                <button
                    type="button"
                    onClick={onConnect}
                    disabled={isConnecting}
                    className="mt-2 cursor-pointer rounded-[30px] bg-muted px-6 py-2.5 text-base font-semibold text-foreground hover:bg-border disabled:opacity-60"
                >
                    {isConnecting ? 'Подключаем...' : 'Подключить Telegram'}
                </button>
            )}
            <p className="pt-2 text-[13px] text-foreground/60">
                Новые заявки с сайта будут приходить вам в Telegram бот{' '}
                <span className="text-foreground/80">@radius_booking_bot</span>
            </p>
        </div>
    );
}
