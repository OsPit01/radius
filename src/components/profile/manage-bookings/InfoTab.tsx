import { Sparkles } from '@/components/icons';
import { InfoBlockCard } from '@/components/profile/manage-bookings/InfoBlockCard';
import { api } from '@/trpc/react';

// ============================================================
// КОМПОНЕНТ вкладки «Информация».
//
// Читает блоки из БД (процедура infoBlock.list) — контент правит админка.
// Внешний вид каждого блока — общий компонент InfoBlockCard (тот же, что
// в превью админки), поэтому страница и админка не могут разъехаться.
// ============================================================
type InfoTabProps = {
    name: string; // имя арендодателя, приходит снаружи
};

export function InfoTab({ name }: InfoTabProps) {
    // Читаем блоки из БД. isPending = true, пока идёт запрос.
    const { data: blocks, isPending } = api.infoBlock.list.useQuery();

    return (
        <div className="mx-auto max-w-3xl py-6">
            {/* Приветствие: иконка слева, заголовок + подзаголовок справа. */}
            <div className="flex items-center gap-4">
                <Sparkles className="h-12 w-12 shrink-0 text-primary max-md:h-10 max-md:w-10" />
                <div className="min-w-0">
                    <h1 className="text-3xl font-bold break-words text-foreground max-md:text-2xl">
                        Добро пожаловать, {name}
                    </h1>
                    <p className="mt-1 text-muted-foreground">
                        Здесь собрано всё, что нужно знать для работы с заявками на бронирование.
                    </p>
                </div>
            </div>

            {/* Блоки из БД. Пока грузятся — «Загрузка…». */}
            <div className="mt-6 flex flex-col gap-3">
                {isPending ? (
                    <p className="text-muted-foreground">Загрузка…</p>
                ) : (
                    (blocks ?? []).map((block) => (
                        <InfoBlockCard
                            key={block.id}
                            icon={block.icon}
                            title={block.title}
                            items={block.items}
                        />
                    ))
                )}
            </div>
        </div>
    );
}
