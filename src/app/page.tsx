import { ClientHeader } from "@/app/_components/layout/ClientHeader";
import { ClientSearchWrapper } from "./_components/ClientSearchWrapper";

export default async function Home() {
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
