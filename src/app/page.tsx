import { type Metadata } from "next";
import { ClientHeader } from "@/app/_components/layout/ClientHeader";
import { ClientSearchWrapper } from "./_components/ClientSearchWrapper";
import { HOME_TITLE, HOME_DESCRIPTION, SITE_URL } from "@/lib/seo";

export const metadata: Metadata = {
  title: HOME_TITLE,
  description: HOME_DESCRIPTION,
  alternates: {
    canonical: SITE_URL,
  },
  openGraph: {
    title: HOME_TITLE,
    description: HOME_DESCRIPTION,
    url: SITE_URL,
    siteName: "Radius",
    type: "website",
    locale: "ru_RU",
  },
};

export default async function Home() {
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

          <ClientSearchWrapper />
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
