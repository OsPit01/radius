import { type Metadata } from "next";
import { ClientHeader } from "@/app/_components/layout/ClientHeader";
import { ClientSearchWrapper } from "./_components/ClientSearchWrapper";
import { SITE_DESCRIPTION } from "@/lib/seo";

export const metadata: Metadata = {
  title: "Radius — аренда квартир посуточно напрямую от собственников",
  description: SITE_DESCRIPTION,
};

export default async function Home() {
  // ===== ПОЛУЧАЕМ КВАРТИРЫ ИЗ БД =====

  return (
    <>
      <ClientHeader />

      <main className="mx-auto min-h-screen max-w-[1400px] px-20 pt-5 pb-[60px] max-lg:px-10 max-lg:pb-10 max-md:px-5 max-md:py-[30px]">
        <div className="mx-auto max-w-[1400px] py-10 text-center">
          <h1 className="mb-5 text-[2rem] leading-[1.2] font-bold text-[#222] max-md:text-[2rem]">
            Твой дом. В любом городе!
          </h1>

          <h2 className="text-[1.2rem] leading-[1.5] text-[#666] max-md:text-base">
            Квартиры, отели, гостевые дома
          </h2>

          <ClientSearchWrapper />
        </div>
      </main>
    </>
  );
}
