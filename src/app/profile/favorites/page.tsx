"use client";
import { AuthGuard } from "@/app/_components/layout/AuthGuard";
import { ClientHeader } from "@/app/_components/layout/ClientHeader";
import { api } from "@/trpc/react";
import { ApartmentCard } from "@/app/_components/apartments/ApartmentCard";

export default function FavoritesPage() {
  const { data: favorites } = api.favorites.list.useQuery();

  return (
    <>
      <AuthGuard>
        <ClientHeader />
        <div className="mx-auto max-w-[1400px] px-5 py-10 max-md:px-4">
          <h1 className="mb-8 text-2xl font-bold text-[#222]">Избраное</h1>

          <div className="grid grid-cols-2 gap-[50px] max-md:grid-cols-1 max-md:gap-5">
            {favorites?.map((item) => (
              <ApartmentCard
                key={item.apartment.id}
                apartment={item.apartment}
                isFavorite={true}
              />
            ))}
          </div>
        </div>
      </AuthGuard>
    </>
  );
}
