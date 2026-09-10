import { Suspense } from "react";
import type { Metadata } from "next";
import { ClientHeader } from "@/app/_components/layout/ClientHeader";
import { ClientSearchWrapper } from "./_components/ClientSearchWrapper";
import { caller } from "@/trpc/server";
import { getApartmentCardData } from "@/lib/apartment-format";
import { SITE_URL } from "@/lib/seo";
import {
  parseSearchParams,
  buildQueryString,
  buildSearchTitle,
  buildSearchDescription,
} from "@/lib/search-params";

type HomePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export async function generateMetadata({
  searchParams,
}: HomePageProps): Promise<Metadata> {
  const sp = await searchParams;
  const filters = parseSearchParams(sp);
  const qs = buildQueryString(filters);
  const canonicalUrl = qs ? `${SITE_URL}/?${qs}` : SITE_URL;

  return {
    title: buildSearchTitle(filters),
    description: buildSearchDescription(filters),
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title: buildSearchTitle(filters),
      description: buildSearchDescription(filters),
      url: canonicalUrl,
      siteName: "Radius",
      type: "website",
      locale: "ru_RU",
    },
  };
}

export default async function Home({ searchParams }: HomePageProps) {
  const sp = await searchParams;
  const filters = parseSearchParams(sp);
  const api = await caller();
  const data = await api.apartment.getAll({
    city: filters.city,
    guests: filters.guests,
    priceMin: filters.priceMin,
    priceMax: filters.priceMax,
    rooms: filters.rooms,
    beds: filters.beds,
    sofas: filters.sofas,
  });
  const apartments = data.map((item) => getApartmentCardData(item.apartment));
  const queryString = buildQueryString(filters);

  return (
    <>
      <ClientHeader />

      <main className="mx-auto min-h-screen max-w-[1400px] px-20 pt-5 pb-[60px] max-lg:px-10 max-lg:pb-10 max-md:px-5 max-md:py-[30px]">
        <div className="mx-auto max-w-[1400px] py-10 text-center">
          <h1 className="mb-5 text-[2rem] leading-[1.2] font-bold text-[#222] max-md:text-[2rem]">
            Посуточная аренда квартир
          </h1>

          <h2 className="text-[1.2rem] leading-[1.5] text-[#666] max-md:text-base">
            квартиры на сутки напрямую от собственников
          </h2>

          <Suspense fallback={null}>
            <ClientSearchWrapper
              key={queryString}
              initialFilters={filters}
              initialApartments={apartments}
            />
          </Suspense>
        </div>

        <section className="mx-auto mt-12 max-w-3xl text-center text-[0.95rem] leading-relaxed text-[#555] max-md:mt-8 max-md:text-sm">
          <p className="mb-4">
            Radius — удобный способ снять квартиру на сутки. У нас только
            проверенные объекты от собственников: актуальные фотографии, честные
            цены и бронирование за пару минут. Выберите город, район, даты и
            количество гостей — и забронируйте жильё онлайн без посредников и
            переплат.
          </p>
          <p>
            Посуточная аренда квартир на Radius — это комфорт, прозрачность и
            выгодные цены. Каждый объект проверен, у каждого есть подробное
            описание и рейтинг. Снимайте квартиру на сутки надёжно — напрямую от
            владельцев.
          </p>
        </section>
      </main>
    </>
  );
}