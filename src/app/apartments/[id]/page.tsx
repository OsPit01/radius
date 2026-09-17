import { type Metadata } from "next";
import Image from "next/image";
import { api } from "@/trpc/server";
import { notFound } from "next/navigation";
import { ClientHeader } from "@/app/_components/layout/ClientHeader";
import { PhotoGallery } from "@/app/_components/apartments/PhotoGallery";
import { ApartmentTabs } from "@/app/_components/apartments/ApartmentTabs";
import { formatPhoneForDisplay } from "@/lib/phone";
import { BookingButton } from "@/app/_components/apartments/BookingButton";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const caller = await api();
  const apartment = await caller.apartment.getByIdPublic({ id: Number(id) });

  if (!apartment) return {};

  const { title, description, city, image, district } = apartment.apartment;
  const metaDescription =
    description?.slice(0, 160) ??
    `${title} — посуточная аренда${district ? ` в р-не ${district}` : ""} в г. ${city}. Снять квартиру на сутки недорого.`;

  return {
    title: `${title} — снять на сутки в ${city ?? "Минске"}`,
    description: metaDescription,
    alternates: { canonical: `/apartments/${id}` },
    openGraph: {
      title: `${title} — снять на сутки в ${city ?? "Минске"}`,
      description: metaDescription,
      images: image?.startsWith("http") ? [image] : undefined,
    },
  };
}

export default async function ApartmentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const caller = await api();

  const apartment = await caller.apartment.getByIdPublic({ id: Number(id) });

  if (!apartment) {
    notFound();
  }

  const photos = apartment.apartment.images?.length
    ? apartment.apartment.images
    : [apartment.apartment.image];

  const a = apartment.apartment;
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
              <span className="text-[10px] font-medium text-gray-900">
                {apartment.apartment.currency ?? "BYN"}
              </span>
              <span className="text-[15px] text-gray-900">/ сутки</span>
            </div>

            {/* Арендодатель */}
            {apartment.user && (
              <div className="mt-auto border-t border-[#eee5f4] pt-4">
                <div className="mt-5 flex items-center gap-3">
                  {apartment.user.image ? (
                    // Фото арендодателя, если оно есть
                    <Image
                      src={apartment.user.image}
                      alt={apartment.user.name ?? "Арендодатель"}
                      width={44}
                      height={44}
                      unoptimized
                      className="h-11 w-11 shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    // Нет фото → кружок с первой буквой имени
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gray-100 text-lg text-gray-800">
                      {(
                        apartment.user.firstName?.[0] ??
                        apartment.user.name?.[0] ??
                        "В"
                      ).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="truncate text-base font-medium text-[#222]">
                      {apartment.user.firstName
                        ? `${apartment.user.firstName} `
                        : (apartment.user.name ?? "Владелец")}
                    </p>
                    <p className="text-sm text-gray-500">Арендодатель</p>
                  </div>
                </div>
                {apartment.user.phone && (
                  <a
                    href={`tel:${apartment.user.phone}`}
                    className="mt-3 flex items-center gap-2 rounded-xl bg-gray-800 px-4 py-3 text-center text-sm font-medium text-white transition-colors hover:bg-gray-700"
                  >
                    <span>📞</span>
                    {formatPhoneForDisplay(apartment.user.phone)}
                  </a>
                )}
                <BookingButton
                  apartmentId={apartment.apartment.id}
                  apartmentTitle={apartment.apartment.title}
                />
              </div>
            )}
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
