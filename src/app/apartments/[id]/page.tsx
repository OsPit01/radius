import { type Metadata } from "next";
import { api } from "@/trpc/server";
import { notFound } from "next/navigation";
import { ClientHeader } from "@/app/_components/layout/ClientHeader";
import { PhotoGallery } from "@/app/_components/apartments/PhotoGallery";
import { ApartmentTabs } from "@/app/_components/apartments/ApartmentTabs";
import { BookingButton } from "@/app/_components/apartments/BookingButton";
import { OwnerPhone } from "@/app/_components/apartments/OwnerPhone";
import { getCurrencySymbol } from "@/lib/constants/currencies";
import { parseBookingGuests } from "@/lib/search-params";
import { parseApartmentId } from "@/lib/apartment-id";
import { Avatar } from "@/app/_components/ui/Avatar";

type ApartmentPageProps = {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id: rawId } = await params;
  const id = parseApartmentId(rawId);
  if (id === null) return {};

  const caller = await api();
  const apartment = await caller.apartment.getByIdPublic({ id });

  if (!apartment) return {};

  const { title, description, city, image, district } = apartment.apartment;
  const metaDescription =
    description?.slice(0, 160) ??
    `${title} — посуточная аренда${district ? ` в р-не ${district}` : ""} в г. ${city}. Снять квартиру на сутки недорого.`;

  return {
    title: `${title} — снять на сутки в ${city ?? "Минске"}`,
    description: metaDescription,
    alternates: { canonical: `/apartments/${rawId}` },
    openGraph: {
      title: `${title} — снять на сутки в ${city ?? "Минске"}`,
      description: metaDescription,
      images: image?.startsWith("http") ? [image] : undefined,
    },
  };
}

export default async function ApartmentPage({
  params,
  searchParams,
}: ApartmentPageProps) {
  const { id: rawId } = await params;
  const sp = await searchParams;
  // Гости из поиска (?guests=3) → стартовое значение в форме бронирования
  const initialGuests = parseBookingGuests(sp);
  const id = parseApartmentId(rawId);
  if (id === null) notFound();

  const caller = await api();
  const apartment = await caller.apartment.getByIdPublic({ id });

  if (!apartment) {
    notFound();
  }

  const photos = apartment.apartment.images?.length
    ? apartment.apartment.images
    : [apartment.apartment.image];

  const a = apartment.apartment;
  const hasExtras =
    (a.area ?? 0) > 0 || (a.floor ?? 0) > 0 || (a.bathrooms ?? 0) > 0;
  const sleepParts = [
    a.beds ? `${a.beds} двусп. кровать` : "",
    a.singleBeds ? `${a.singleBeds} односп. кровать` : "",
    a.doubleSofas ? `${a.doubleSofas} двусп. диван` : "",
    a.singleSofas ? `${a.singleSofas} односп. диван` : "",
  ].filter(Boolean);
  const sleepText = sleepParts.join(", ");

  return (
    <>
      <ClientHeader />

      <div className="mx-auto mt-5.5 max-w-5xl px-4 pb-[60px]">
        <h1 className="mb-6 text-3xl font-bold text-[#222]">
          {apartment.apartment.title}
        </h1>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <PhotoGallery photos={photos} title={apartment.apartment.title} />

          <div className="flex flex-col rounded-2xl border border-[#e0e0e0] bg-white p-6 shadow-sm">
            {/* Адрес + метро (одной строкой с иконками) */}
            <div className="flex flex-wrap items-start gap-x-2 gap-y-1">
              <span>📍</span>
              <p className="flex-1 text-base text-[#222]">
                г. {apartment.apartment.city}, {apartment.apartment.street},{" "}
                {apartment.apartment.numberHome}
                {apartment.apartment.building
                  ? `, к. ${apartment.apartment.building}`
                  : ""}
              </p>
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-x-2">
              <span>🚇</span>
              <p className="text-sm text-gray-800">
                {apartment.apartment.metro
                  ? `${apartment.apartment.metro} минут до метро`
                  : "Метро нет в шаговой доступности"}
              </p>
            </div>
            {sleepText && (
              <div className="mt-2 flex flex-wrap items-center gap-x-2">
                <span>🛏️</span>
                <p className="text-sm text-gray-800">{sleepText}</p>
              </div>
            )}

            {/* Доп. характеристики: площадь, этаж, санузлы */}
            {hasExtras && (
              <div className="mt-2 flex flex-wrap items-center gap-x-3 text-sm text-gray-800">
                {a.area ? <span>📐 {a.area} м²</span> : null}
                {a.floor ? <span>🏢 {a.floor} этаж</span> : null}
                {a.bathrooms ? <span>🛁 {a.bathrooms} санузел(а)</span> : null}
              </div>
            )}

            {/* Время заезда/выезда */}
            <div className="mt-2 flex flex-wrap items-center gap-x-2">
              <span>🕒</span>
              <p className="text-sm text-gray-800">
                Заселение после{" "}
                <span className="border-b-[1px] px-2 py-0.5 text-[13px] font-medium text-gray-800">
                  {apartment.apartment.checkInTime ?? "14:00"}
                </span>{" "}
                выезд до{" "}
                <span className="border-b-[1px] px-2 py-0.5 text-[13px] font-medium text-gray-800">
                  {apartment.apartment.checkOutTime ?? "12:00"}
                </span>
              </p>
            </div>

            {/* Цена */}
            <div className="mt-6 flex flex-wrap items-baseline gap-x-1.5">
              <span className="text-[20px] font-bold text-gray-800">
                {apartment.apartment.price}
              </span>
              <span className="text-[13px] font-medium text-gray-900">
                {getCurrencySymbol(apartment.apartment.currency)}
              </span>
              <span className="text-[15px] text-gray-900">/ сутки</span>
            </div>

            {/* Арендодатель */}
            {apartment.user && (
              <div className="mt-auto border-t border-[#eee5f4] pt-4">
                <div className="mt-5 flex items-center gap-3">
                  <Avatar
                    src={apartment.user.image}
                    name={apartment.user.name}
                    fallbackText={
                      apartment.user.firstName?.[0] ?? apartment.user.name?.[0]
                    }
                  />
                  <div className="min-w-0">
                    <p className="truncate text-base font-medium text-[#222]">
                      {apartment.user.firstName
                        ? `${apartment.user.firstName} `
                        : (apartment.user.name ?? "Владелец")}
                    </p>
                    <p className="text-sm text-gray-500">Арендодатель</p>
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
              apartmentCapacity={apartment.apartment.capacity}
            />
          </div>
        </div>
        <ApartmentTabs
          description={apartment.apartment.description ?? ""}
          amenities={apartment.apartment.amenities ?? []}
          rules={apartment.apartment.rules ?? ""}
          checkInTime={apartment.apartment.checkInTime ?? null}
          checkOutTime={apartment.apartment.checkOutTime ?? null}
        />
      </div>
    </>
  );
}
