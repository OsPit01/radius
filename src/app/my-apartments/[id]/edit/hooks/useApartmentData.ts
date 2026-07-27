"use client";
import { useParams } from "next/navigation";
import { api } from "@/trpc/react";

export function useApartmentData() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : (params.id?.[0] ?? "");

  const {
    data: apartmentData,
    isLoading,
    error,
  } = api.apartment.getById.useQuery({
    id: Number(id),
  });
  return { id, apartmentData, isLoading, error };
}
