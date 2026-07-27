// src/hooks/useMyApartments.ts

"use client";

import { useSession } from "next-auth/react";
import { api } from "@/trpc/react";

export function useMyApartments() {
  const { data: session, status } = useSession();

  const {
    data: myApartments,
    isLoading,
    error,
    refetch,
  } = api.apartment.getMyApartments.useQuery(undefined, {
    enabled: !!session?.user,
    staleTime: 60_000,
  });

  const deleteApartment = api.apartment.delete.useMutation({
    onSuccess: async () => {
      await refetch();
    },
    onError: (err) => {
      console.error("Ошибка удаления:", err.message);
    },
  });

  const handleDelete = (id: number) => {
    if (window.confirm("Удалить объявление?")) {
      deleteApartment.mutate({ id });
    }
  };

  return {
    myApartments,
    isLoading: isLoading || status === "loading",
    error,
    count: myApartments?.length ?? 0,
    isAuthenticated: !!session?.user,
    handleDelete,
    isDeleting: deleteApartment.isPending, // ← isLoading → isPending
    deleteError: deleteApartment.error?.message,
  };
}
