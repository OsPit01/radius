import { ChevronDown } from '@/components/icons';
import { getInfoBlockIcon } from '@/lib/constants/info-block';

// ============================================================
// КАРТОЧКА БЛОКА ИНФОРМАЦИИ — единый вид блока в обоих местах:
//   - вкладка «Информация» (InfoTab) показывает блок так;
//   - админка (/admin/info-blocks) показывает превью так же.
// Один компонент = один источник правды внешнего вида, разъехаться не может.
// ============================================================

// Форма блока, которую возвращает БД (совпадает с InfoItemData из схемы).
export type InfoBlockCardProps = {
    icon: string; // строка-имя иконки из БД ('home', 'route'...)
    title: string;
    items: { text: string; href: string | null }[];
};

export function InfoBlockCard({ icon, title, items }: InfoBlockCardProps) {
    // Строку иконки из БД превращаем в компонент.
    const BlockIcon = getInfoBlockIcon(icon);

    return (
        <details className="group rounded-2xl border border-border bg-card p-5">
            <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 text-base font-semibold">
                <span className="flex min-w-0 items-center gap-2">
                    <BlockIcon className="h-5 w-5 shrink-0 text-primary" />
                    <span className="break-words">{title}</span>
                </span>
                <ChevronDown className="h-5 w-5 shrink-0 text-muted-foreground transition-transform group-open:rotate-180" />
            </summary>
            <ul className="mt-3 flex flex-col gap-2">
                {items.map((item, index) => (
                    <li key={index}>
                        {item.href ? (
                            <a
                                href={item.href}
                                className="text-sm break-words text-primary underline hover:text-primary/80"
                            >
                                {item.text}
                            </a>
                        ) : (
                            <span className="text-sm break-words text-muted-foreground">{item.text}</span>
                        )}
                    </li>
                ))}
            </ul>
        </details>
    );
}
