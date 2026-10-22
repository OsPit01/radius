import Link from 'next/link';
import { useSession } from 'next-auth/react';

import { Heart } from '@/components/icons';
import { ImageWithFallback } from '@/components/ui/ImageWithFallback';
import type { ApartmentCardData } from '@/lib/apartment-format';
import { DEFAULT_BOOKING_GUESTS } from '@/lib/constants/booking';
import { getCurrencySymbol } from '@/lib/constants/currencies';
import { pluralRu } from '@/lib/plural';
import { api } from '@/trpc/react';

export function ApartmentCard({
    apartment,
    isFavorite,
    guests,
    childrenCount,
}: {
    apartment: ApartmentCardData;
    isFavorite: boolean;
    guests?: number;
    childrenCount?: number;
}) {
    //Сессия
    const { data: session } = useSession();
    // вызов хука api.useUtils()
    const utils = api.useUtils();
    // Мутация «переключить» с оптимистичным обновлением
    const toggleFavorite = api.favorites.toggle.useMutation({
        onMutate: async ({ apartmentId }) => {
            // Отменяем входящие запросы, чтобы они не перезаписали наш оптимизм
            await utils.favorites.listIds.cancel();
            // Сохраняем текущее значение (для отката в случае ошибки)
            const prev = utils.favorites.listIds.getData();
            // Оптимистично меняем список прямо сейчас, не дожидаясь сервера
            utils.favorites.listIds.setData(undefined, (old = []) =>
                old.includes(apartmentId) ? old.filter((id) => id !== apartmentId) : [...old, apartmentId],
            );
            return { prev };
        },
        onError: (_err, _vars, context) => {
            // Если сервер ответил ошибкой — откатываемся к сохранённому значению
            if (context?.prev !== undefined) {
                utils.favorites.listIds.setData(undefined, context.prev);
            }
        },
        onSettled: () => {
            // В фоне пересинхронизируем с сервером (чтобы данные не разошлись)
            void utils.favorites.listIds.invalidate();
            void utils.favorites.list.invalidate();
        },
    });
    //Обработчик клика
    const handleToggle = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!session?.user) {
            window.location.href = '/auth/signin';
            return;
        }
        toggleFavorite.mutate({ apartmentId: apartment.id });
    };

    // Ссылка на квартиру с параметрами поиска (?guests=3&children=1),
    // чтобы форма бронирования сразу подхватила выбранных гостей и детей.
    const searchParams = new URLSearchParams();
    if (guests && guests !== DEFAULT_BOOKING_GUESTS) {
        searchParams.set('guests', String(guests));
    }
    if (childrenCount && childrenCount > 0) {
        searchParams.set('children', String(childrenCount));
    }
    const href = `/apartments/${apartment.id}${searchParams.toString() ? `?${searchParams.toString()}` : ''}`;

    return (
        <>
            <Link
                href={href}
                className="overflow-hidden rounded-2xl border border-border bg-card p-0.5"
            >
                <div className="relative h-[350px] w-full overflow-hidden max-md:h-[250px]">
                    <ImageWithFallback
                        src={apartment.image}
                        alt={apartment.title}
                        fill
                        className="rounded-[15px] object-cover"
                    />
                    <button
                        type="button"
                        onClick={handleToggle}
                        aria-label={isFavorite ? 'Убрать из избранного' : 'Добавить в избранное'}
                        className="group absolute top-3 right-3 z-10 flex h-10 w-10 cursor-pointer items-center justify-center"
                    >
                        <div className="relative h-7 w-7">
                            {/* контурное — видно когда НЕ в избранном */}
                            <Heart
                                muted
                                className={`absolute top-0 left-0 h-7 w-7 text-card drop-shadow-[0_0_2px_color-mix(in_oklab,var(--foreground)_55%,transparent)] transition-all duration-300 group-hover:text-primary/60 ${
                                    isFavorite ? 'scale-0 opacity-0' : 'scale-100 opacity-100'
                                }`}
                            />
                            {/* залитое — видно когда В избранном */}
                            <Heart
                                className={`absolute top-0 left-0 h-7 w-7 text-primary drop-shadow-[0_0_2px_color-mix(in_oklab,var(--foreground)_35%,transparent)] transition-all duration-300 ${
                                    isFavorite ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
                                }`}
                            />
                        </div>
                    </button>
                    <span className="absolute right-3 bottom-3 z-10 rounded-lg bg-card px-3 py-1.5 text-base font-bold text-foreground shadow-sm">
                        {apartment.price} {getCurrencySymbol(apartment.currency)}
                    </span>
                </div>
                <div className="px-2.5 pt-3 pb-1">
                    <span className="text-[18px] font-semibold break-words max-md:text-base">{apartment.title}</span>
                </div>
                <div className="flex px-3.5 pt-1 pt-4 pb-2 text-sm font-normal break-words">
                    {apartment.city}
                    {apartment.district ? `, ${apartment.district}` : ''}
                </div>
                <div className="flex flex-wrap gap-1.5 px-2.5 pt-2">
                    <span className="rounded-[15px] border border-border bg-muted px-2.5 py-1 text-sm font-normal">
                        {' '}
                        количество комнат: {apartment.rooms}
                    </span>
                    <span className="rounded-[15px] border border-border bg-muted px-2.5 py-1 text-sm font-normal">
                        {apartment.capacity} {pluralRu(apartment.capacity, 'гость', 'гостя', 'гостей')}
                    </span>
                </div>
                <div className="flex flex-wrap gap-1.5 px-2.5 pt-1.5">
                    {apartment.beds > 0 && (
                        <span className="rounded-[15px] border border-border bg-muted px-2.5 py-1 text-sm font-normal">
                            Кровать: {apartment.beds}
                        </span>
                    )}
                    {apartment.singleBeds > 0 && (
                        <span className="rounded-[15px] border border-border bg-muted px-2.5 py-1 text-sm font-normal">
                            Односпальная: {apartment.singleBeds}
                        </span>
                    )}
                    {apartment.doubleSofas > 0 && (
                        <span className="rounded-[15px] border border-border bg-muted px-2.5 py-1 text-sm font-normal">
                            Дв. диван: {apartment.doubleSofas}
                        </span>
                    )}
                    {apartment.singleSofas > 0 && (
                        <span className="rounded-[15px] border border-border bg-muted px-2.5 py-1 text-sm font-normal">
                            Одн. диван: {apartment.singleSofas}
                        </span>
                    )}
                </div>
                {apartment.metro && (
                    <div className="flex flex-wrap gap-1.5 px-2.5 pt-1.5 pb-1">
                        <p className="rounded-[15px] border border-border bg-muted px-2.5 py-1 text-sm font-normal">
                            метро: в {apartment.metro} минутах
                        </p>
                        {apartment.amenities.includes('gameConsole') && (
                            <p className="rounded-[15px] border border-border bg-muted px-2.5 py-1 text-sm font-normal">
                                Игровая консоль
                            </p>
                        )}
                    </div>
                )}
                {/* Кнопка бронирования на карточке. stopPropagation — чтобы клик
            не переходил по ссылке на страницу квартиры, а открывал модалку. */}
                <div
                    onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                    }}
                    className="px-2.5 pt-2 pb-2"
                ></div>
            </Link>
        </>
    );
}
