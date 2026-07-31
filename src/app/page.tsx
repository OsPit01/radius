import { ClientHeader } from "@/app/_components/layout/ClientHeader";
import { ClientSearchWrapper } from "./_components/ClientSearchWrapper";
import { ApartmentsList } from "@/app/_components/apartments/ApartmentsList";
import { api } from "@/trpc/server";
export default async function Home() {
  // ===== ПОЛУЧАЕМ КВАРТИРЫ ИЗ БД =====

  return (
    <>
      <ClientHeader />
      <main className="main-content">
        <div className="hero-section">
          <h1 className="hero-title">Найдём, где остановиться!</h1>
          <p className="hero-description">Квартиры, отели, гостевые дома</p>
          <ClientSearchWrapper />
        </div>
      </main>
    </>
  );
}
