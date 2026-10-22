import type { GetServerSideProps } from 'next';
import Link from 'next/link';

import { ApartmentViewTracker } from '@/components/analytics/ApartmentViewTracker';
import { ApartmentTabs } from '@/components/apartments/ApartmentTabs';
import { BookingButton } from '@/components/apartments/BookingButton';
import { OwnerPhone } from '@/components/apartments/OwnerPhone';
import { PhotoGallery } from '@/components/apartments/PhotoGallery';
import { Bath, Bed, Building, Clock, MapPin, Metro, Ruler } from '@/components/icons';
import { JsonLd } from '@/components/JsonLd';
import { ClientHeader } from '@/components/layout/ClientHeader';
import { Seo } from '@/components/Seo';
import { Avatar } from '@/components/ui/Avatar';
import { parseApartmentId } from '@/lib/apartment-id';
import { getCurrencySymbol } from '@/lib/constants/currencies';
import { parseBookingChildren, parseBookingGuests } from '@/lib/search-params';
import { getApartmentOgImagePath, SITE_URL } from '@/lib/seo';
import type { RouterOutputs } from '@/trpc/react';
import { createServerCaller } from '@/trpc/server';

type ApartmentPageProps = {
    /** id из адреса как есть — для canonical */
    rawId: string;
    id: number;
    apartment: NonNullable<RouterOutputs['apartment']['getByIdPublic']>;
    initialGuests: number;
    initialChildren: number;
};

export const getServerSideProps: GetServerSideProps<ApartmentPageProps> = async (ctx) => {
    const rawId = ctx.params?.id;
    if (typeof rawId !== 'string') {
        return { notFound: true };
    }

    const id = parseApartmentId(rawId);
    if (id === null) {
        return { notFound: true };
    }

    const caller = await createServerCaller(ctx);
    const apartment = await caller.apartment.getByIdPublic({ id });
    if (!apartment) {
        return { notFound: true };
    }

    return {
        props: {
            rawId,
            id,
            apartment,
            // Гости из поиска (?guests=3&children=1) → стартовые значения в форме бронирования
            initialGuests: parseBookingGuests(ctx.query),
            initialChildren: parseBookingChildren(ctx.query),
        },
    };
};

export default function ApartmentPage({ rawId, id, apartment, initialGuests, initialChildren }: ApartmentPageProps) {
    const a = apartment.apartment;
    const metaDescription =
        a.description?.slice(0, 160) ??
        `${a.title} — посуточная аренда${a.district ? ` в р-не ${a.district}` : ''} в г. ${a.city}. Снять квартиру на сутки недорого.`;

    const photos = a.images?.length ? a.images : [a.image];
    // Превью ссылки — первое фото галереи. Заглушку (не http) в превью не показываем — там будет логотип сайта.
    const cover = photos[0];

    const hasExtras = (a.area ?? 0) > 0 || (a.floor ?? 0) > 0 || (a.bathrooms ?? 0) > 0;
    const sleepParts = [
        a.beds ? `${a.beds} двусп. кровать` : '',
        a.singleBeds ? `${a.singleBeds} односп. кровать` : '',
        a.doubleSofas ? `${a.doubleSofas} двусп. диван` : '',
        a.singleSofas ? `${a.singleSofas} односп. диван` : '',
    ].filter(Boolean);
    const sleepText = sleepParts.join(', ');

    // Структурированные данные: объект размещения (LodgingBusiness).
    // Помогает Google показывать расширенный сниппет (цена, адрес, фото).
    const lodgingSchema = {
        '@context': 'https://schema.org',
        '@type': 'LodgingBusiness',
        name: a.title,
        description: a.description ?? '',
        image: cover,
        url: `${SITE_URL}/apartments/${id}`,
        address: {
            '@type': 'PostalAddress',
            streetAddress: `${a.street} ${a.numberHome}`,
            addressLocality: a.city,
            addressCountry: 'BY',
        },
        priceRange: `${a.price} ${getCurrencySymbol(a.currency)}`,
    };

    return (
        <>
            <Seo
                title={`${a.title} — снять на сутки в ${a.city ?? 'Минске'}`}
                description={metaDescription}
                canonical={`/apartments/${rawId}`}
                image={cover?.startsWith('http') ? getApartmentOgImagePath(a.id, cover) : undefined}
            />
            <JsonLd data={lodgingSchema} />
            <ClientHeader />

            <ApartmentViewTracker apartmentId={apartment.apartment.id} />

            <div className="mx-auto mt-5.5 max-w-5xl px-4 pb-[60px]">
                <h1 className="mb-6 text-3xl font-bold text-foreground">{apartment.apartment.title}</h1>
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <PhotoGallery
                        photos={photos}
                        title={apartment.apartment.title}
                    />

                    <div className="flex flex-col rounded-2xl border border-border bg-card p-6 shadow-sm">
                        {/* Адрес + метро (одной строкой с иконками) */}
                        <div className="flex flex-wrap items-start gap-x-2 gap-y-1">
                            <MapPin className="h-5 w-5" />
                            <p className="flex-1 text-base text-foreground">
                                г. {apartment.apartment.city}
                                {apartment.apartment.microdistrict && (
                                    <>
                                        {', '}
                                        <Link
                                            href={`/microdistrict/${encodeURIComponent(apartment.apartment.microdistrict)}`}
                                            className="text-foreground underline underline-offset-2 transition-colors hover:text-primary"
                                        >
                                            {apartment.apartment.microdistrict}
                                        </Link>
                                    </>
                                )}
                                {', '}
                                {apartment.apartment.street}, {apartment.apartment.numberHome}
                                {apartment.apartment.building ? `, к. ${apartment.apartment.building}` : ''}
                            </p>
                        </div>

                        <div className="mt-2 flex flex-wrap items-center gap-x-2">
                            <Metro className="h-5 w-5" />
                            <p className="text-sm text-foreground">
                                {apartment.apartment.metro
                                    ? `${apartment.apartment.metro} минут до метро`
                                    : 'Метро нет в шаговой доступности'}
                            </p>
                        </div>
                        {sleepText && (
                            <div className="mt-2 flex flex-wrap items-center gap-x-2">
                                <Bed className="h-5 w-5" />
                                <p className="text-sm text-foreground">{sleepText}</p>
                            </div>
                        )}

                        {/* Доп. характеристики: площадь, этаж, санузлы */}
                        {hasExtras && (
                            <div className="mt-2 flex flex-wrap items-center gap-x-3 text-sm text-foreground">
                                {a.area ? (
                                    <span className="inline-flex items-center gap-1.5">
                                        <Ruler className="h-5 w-5" />
                                        {a.area} м²
                                    </span>
                                ) : null}
                                {a.floor ? (
                                    <span className="inline-flex items-center gap-1.5">
                                        <Building className="h-5 w-5" />
                                        {a.floor} этаж
                                    </span>
                                ) : null}
                                {a.bathrooms ? (
                                    <span className="inline-flex items-center gap-1.5">
                                        <Bath className="h-5 w-5" />
                                        {a.bathrooms} санузел(а)
                                    </span>
                                ) : null}
                            </div>
                        )}

                        {/* Время заезда/выезда */}
                        <div className="mt-2 flex flex-wrap items-center gap-x-2">
                            <Clock className="h-5 w-5" />
                            <p className="text-sm text-foreground">
                                Заселение после{' '}
                                <span className="border-b-[1px] px-2 py-0.5 text-[13px] font-medium text-foreground">
                                    {apartment.apartment.checkInTime ?? '14:00'}
                                </span>{' '}
                                выезд до{' '}
                                <span className="border-b-[1px] px-2 py-0.5 text-[13px] font-medium text-foreground">
                                    {apartment.apartment.checkOutTime ?? '12:00'}
                                </span>
                            </p>
                        </div>

                        {/* Цена */}
                        <div className="mt-6 flex flex-wrap items-baseline gap-x-1.5">
                            <span className="text-[20px] font-bold text-foreground">{apartment.apartment.price}</span>
                            <span className="text-[13px] font-medium text-foreground">
                                {getCurrencySymbol(apartment.apartment.currency)}
                            </span>
                            <span className="text-[15px] text-foreground">/ сутки</span>
                        </div>

                        {/* Арендодатель */}
                        {apartment.user && (
                            <div className="mt-auto border-t border-border pt-4">
                                <div className="mt-5 flex items-center gap-3">
                                    <Avatar
                                        src={apartment.user.image}
                                        name={apartment.user.name}
                                        fallbackText={apartment.user.firstName?.[0] ?? apartment.user.name?.[0]}
                                    />
                                    <div className="min-w-0">
                                        <p className="truncate text-base font-medium text-foreground">
                                            {apartment.user.firstName
                                                ? `${apartment.user.firstName} `
                                                : (apartment.user.name ?? 'Владелец')}
                                        </p>
                                        <p className="text-sm text-muted-foreground">Арендодатель</p>
                                    </div>
                                </div>
                                <OwnerPhone
                                    phone={apartment.user.phone}
                                    canViewPhone={apartment.canViewPhone}
                                />
                            </div>
                        )}

                        {/* Бронирование доступно всегда: заявка сохраняется в БД,
                а Telegram-уведомление владельцу — дополнительный канал. */}
                        <BookingButton
                            apartmentId={apartment.apartment.id}
                            apartmentTitle={apartment.apartment.title}
                            initialGuests={initialGuests}
                            initialChildren={initialChildren}
                            apartmentCapacity={apartment.apartment.capacity}
                        />
                    </div>
                </div>
                <ApartmentTabs
                    description={apartment.apartment.description ?? ''}
                    amenities={apartment.apartment.amenities ?? []}
                    rules={apartment.apartment.rules ?? ''}
                    checkInTime={apartment.apartment.checkInTime ?? null}
                    checkOutTime={apartment.apartment.checkOutTime ?? null}
                />
            </div>
        </>
    );
}
