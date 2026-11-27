// ============================================================
// GuestOwnerCard — карточка «второй стороны» брони.
//
// Владелец смотрит на заявку и видит гостя; гость — владельца.
// Один компонент для всех мест: страница деталей брони,
// в перспективе — чат, списки броней, админка.
//
// Пропсы:
//   side  — 'guest' (рисуем гостя) или 'owner' (рисуем владельца)
//   name  — имя
//   phone — телефон (если есть — кликабельная ссылка tel:)
//   extra — дополнительная строка (комментарий, число гостей…)
// ============================================================

type GuestOwnerCardProps = {
    side: 'guest' | 'owner';
    name: string;
    phone?: string | null;
    extra?: string | null;
};

export function GuestOwnerCard({ side, name, phone, extra }: GuestOwnerCardProps) {
    return (
        <div className="mt-4 rounded-2xl border border-border bg-card p-4">
            <h2 className="font-semibold text-foreground">{side === 'guest' ? 'Данные гостя' : 'Арендодатель'}</h2>
            <p className="mt-3 text-sm font-medium text-foreground">{name}</p>
            {phone && (
                <a
                    href={`tel:${phone}`}
                    className="mt-1 block text-sm text-primary underline hover:text-primary/80"
                >
                    {phone}
                </a>
            )}
            {extra && <p className="mt-2 text-sm break-words text-muted-foreground">{extra}</p>}
        </div>
    );
}
