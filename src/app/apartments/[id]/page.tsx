import { type Metadata } from "next";
import { api } from "@/trpc/server";
import { notFound } from "next/navigation";
import { ClientHeader } from "@/app/_components/layout/ClientHeader";
import { PhotoGallery } from "@/app/_components/apartments/PhotoGallery";
import { ApartmentTabs } from "@/app/_components/apartments/ApartmentTabs";
import { formatPhoneForDisplay } from "@/lib/phone";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const caller = await api();
  const apartment = await caller.apartment.getByIdPublic({ id: Number(id) });

  if (!apartment) return {};

  const { title, description, city, image } = apartment.apartment;
  const metaDescription =
    description?.slice(0, 160) ?? `${title} — посуточная аренда в г. ${city}`;

  return {
    title,
    description: metaDescription,
    alternates: { canonical: `/apartments/${id}` },
    openGraph: {
      title,
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

  return (
    <>
      <ClientHeader />

      <div className="mx-auto mt-5.5 max-w-5xl px-4 pb-[60px]">
        <h1 className="mb-6 text-3xl font-bold text-[#222]">
          {apartment.apartment.title}
        </h1>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <PhotoGallery photos={photos} />

          <div className="rounded-2xl border border-[#e0e0e0] bg-white p-6 shadow-sm">
            {/* Адрес */}
            <p className="text-base text-[#222]">
              г. {apartment.apartment.city}, ул. {apartment.apartment.street},{" "}
              {apartment.apartment.numberHome}
              {apartment.apartment.building
                ? `, к. ${apartment.apartment.building}`
                : ""}
            </p>

            {/* Метро */}
            <p className="mt-3 text-sm text-[#888]">
              {apartment.apartment.metro
                ? `${apartment.apartment.metro} минут до метро`
                : "метро нет"}
            </p>

            {/* Цена */}
            <div className="mt-6 inline-block rounded-xl bg-gray-100 px-5 py-2">
              <span className="text-2xl font-bold text-[#00000]">
                {apartment.apartment.price}{" "}
                {apartment.apartment.currency ?? "BYN"}
              </span>
              <span className="text-sm text-[#00000]"> / сутки</span>
            </div>

            {/* Арендодатель */}
            {apartment.user && (
              <div className="mt-4 border-t border-[#e0e0e0] pt-4">
                <p className="text-sm text-[#888]">Арендодатель:</p>
                <p className="text-base font-medium text-[#222]">
                  {apartment.user.firstName
                    ? `${apartment.user.firstName} `
                    : (apartment.user.name ?? "Владелец")}
                </p>
                <p className="text-sm text-[#888]">Номер телефона:</p>
                {apartment.user.phone && (
                  <p className="text-base text-[#222]">
                    {formatPhoneForDisplay(apartment.user.phone)}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>
        <ApartmentTabs
          description={apartment.apartment.description ?? ""}
          amenities={apartment.apartment.amenities ?? []}
          rooms={apartment.apartment.rooms}
          capacity={apartment.apartment.capacity}
        />
      </div>
    </>
  );
}
