import type { Metadata } from "next";
import { caller } from "@/trpc/server";
import { getApartmentCardData } from "@/lib/apartment-format";
import { ApartmentsList } from "@/app/_components/apartments/ApartmentsList";
import { SITE_URL } from "@/lib/seo";
import { notFound } from "next/navigation";
import { pluralRu } from "@/lib/plural";
import { getCurrencySymbol } from "@/lib/constants/currencies";
type MicrodistrictPageProps = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({
  params,
}: MicrodistrictPageProps): Promise<Metadata> {
  const { slug } = await params;
  const name = decodeURIComponent(slug);
  return {
    title: `Квартиры на сутки — ${name} | Radius`,
    description: `Снять квартиру на сутки в микрорайоне ${name}. Актуальные фото, цены, бронирование онлайн напрямую от собственников.`,
    alternates: {
      canonical: `${SITE_URL}/microdistrict/${encodeURIComponent(slug)}`,
    },
    openGraph: {
      title: `Квартиры на сутки — ${name} | Radius`,
      description: `Снять квартиру на сутки в микрорайоне ${name}. Актуальные фото, цены, бронирование онлайн напрямую от собственников.`,
      type: "website",
    },
  };
}

export default async function MicrodistrictPage({
  params,
}: MicrodistrictPageProps) {
  const { slug } = await params;
  const microdistrict = decodeURIComponent(slug);

  const api = await caller();

  const data = await api.apartment.getAll({ microdistrict });
  if (data.length === 0) notFound();
  const apartments = data.map((apartment) => getApartmentCardData(apartment));

  // Самая дешёвая квартира ЦЕЛИКОМ (цена + валюта — пара, их нельзя разрывать).
  const cheapest = apartments.reduce((min, a) =>
    a.price < min.price ? a : min,
  );

  return (
    <main className="mx-auto min-h-screen max-w-[1400px] px-20 pt-5 pb-[60px] max-lg:px-10 max-md:px-5 max-md:py-[30px]">
      <div className="mb-6 text-center">
        <h1 className="text-[2rem] font-bold max-md:text-[1.5rem]">
          Квартиры на сутки в микрорайоне {microdistrict}
        </h1>
        <p className="mt-3 text-[1.1rem] text-[#666] max-md:text-base">
          Найдено {apartments.length}{" "}
          {pluralRu(apartments.length, "квартира", "квартиры", "квартир")}
        </p>
      </div>
      <ApartmentsList apartments={apartments} />

      <section className="mx-auto mt-12 max-w-3xl text-center text-[0.95rem] leading-relaxed text-[#555] max-md:mt-8 max-md:text-sm">
        <h2 className="mb-4 text-[1.4rem] font-semibold text-[#333]">
          Снять квартиру на сутки в микрорайоне {microdistrict}
        </h2>
        <p>
          В микрорайоне {microdistrict} доступно {apartments.length}{" "}
          {pluralRu(apartments.length, "квартира", "квартиры", "квартир")} на
          сутки — от {cheapest.price} {getCurrencySymbol(cheapest.currency)} за
          ночь. Все объекты сдаются напрямую от собственников: актуальные
          фотографии, честные цены, онлайн-бронирование без посредников и
          скрытых комиссий.
        </p>
      </section>
    </main>
  );
}
