import { api } from "@/trpc/server";
import { notFound } from "next/navigation";
import Image from "next/image";
import { ClientHeader } from "@/app/_components/layout/ClientHeader";
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

  return (
    <>
      <ClientHeader />

      <div className="rounded-2x1 border[#e0e0e] mx-auto mt-5.5 max-w-4xl overflow-hidden border bg-white shadow-lg">
        <div className="mx-auto min-h-screen max-w-[1400px] px-20 pt-5 pb-[60px] max-lg:px-10 max-md:px-5">
          <h1 className="mb-5 text-3xl font-bold text-[#222]">
            {apartment.apartment.title}
          </h1>
          <p className="relative h-[700px] w-full overflow-hidden bg-[#f0f0f0] max-[100px]:aspect-square max-md:aspect-[16/9] max-md:h-auto">
            <Image
              src={apartment.apartment.image}
              alt={apartment.apartment.title}
              fill
            ></Image>
          </p>
          <p className="text-[15px] font-bold">
            цена за сутки: {apartment.apartment.price}{" "}
            {apartment.apartment.currency ?? "BYN"}
          </p>
          <p>
            {apartment.apartment.city}, ул. {apartment.apartment.street}{" "}
            {apartment.apartment.numberHome} {apartment.apartment.building}
          </p>
        </div>
      </div>
    </>
  );
}
