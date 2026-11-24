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
        <div className="mx-auto max-w-3xl px-4 py-6">
            {/* Приветствие: десктоп — иконка слева, текст, кнопка справа (в строку).
                                Мобилка — столбик: иконка по центру, текст по центру, кнопка справа внизу. */}
            <div className="mb-6 flex items-center gap-4 max-md:flex-col max-md:items-center">
                <Sparkles className="h-12 w-12 shrink-0 text-primary max-md:h-8 max-md:w-8" />

                <div className="min-w-0 flex-1 max-md:w-full max-md:text-center">
                    <h1 className="text-3xl font-bold break-words text-foreground max-md:text-xl">
                        Добро пожаловать, {name}
                    </h1>
                    <p className="mt-1 text-muted-foreground max-md:text-sm">
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
