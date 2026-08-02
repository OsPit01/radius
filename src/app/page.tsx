import { ClientHeader } from "@/app/_components/layout/ClientHeader";
import { ClientSearchWrapper } from "./_components/ClientSearchWrapper";
export default async function Home() {
  // ===== ПОЛУЧАЕМ КВАРТИРЫ ИЗ БД =====

  return (
    <>
      <ClientHeader />
      <main className="mx-auto min-h-screen max-w-[1400px] px-20 pb-[60px] pt-5 max-lg:px-10 max-lg:pb-10 max-md:px-5 max-md:py-[30px]">
        <div className="mx-auto max-w-[1400px] py-10 text-center">
          <h1 className="mb-5 text-[3rem] font-bold leading-[1.2] text-[#222] max-md:text-[2rem]">
            Найдём, где остановиться!
          </h1>
          <p className="text-[1.2rem] leading-[1.5] text-[#666] max-md:text-base">
            Квартиры, отели, гостевые дома
          </p>
          <ClientSearchWrapper />
        </div>
      </main>
    </>
  );
}
