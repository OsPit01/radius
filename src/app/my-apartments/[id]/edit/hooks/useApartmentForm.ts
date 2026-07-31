// src/hooks/useApartmentForm.ts

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/trpc/react";

export type ApartmentFormData = {
  type: string;
  title: string;
  city: string;
  street: string;
  numberHome: string;
  building: string;
  district: string;
  capacity: number;
  price: number;
  currency: string;
  rooms: number;
  description: string;
  metro: string;
  amenities: string[];
  parking: string;
  image: string;
  images: string[];
};

const defaultFormData: ApartmentFormData = {
  type: "apartment",
  title: "",
  city: "",
  street: "",
  numberHome: "",
  building: "",
  district: "",
  capacity: 2,
  price: 0,
  currency: "BYN",
  rooms: 1,
  description: "",
  metro: "",
  amenities: [],
  parking: "",
  image: "",
  images: [],
};

export function useApartmentForm(apartmentId: string) {
  const router = useRouter();
  const utils = api.useUtils();

  const [formData, setFormData] = useState<ApartmentFormData>(defaultFormData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const updateField = (
    field: keyof ApartmentFormData,
    value: string | number | string[],
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // ===== ЗАГРУЗКА ДАННЫХ =====
  const { data: apartmentData, isPending: isLoadingData } =
    api.apartment.getById.useQuery(
      { id: Number(apartmentId) },
      {
        enabled: !!apartmentId && !isNaN(Number(apartmentId)),
      },
    );

  useEffect(() => {
    if (apartmentData) {
      const apt = apartmentData.apartment;
      setFormData({
        type: apt.type ?? "apartment",
        title: apt.title ?? "",
        city: apt.city ?? "",
        street: apt.street ?? "",
        numberHome: apt.numberHome ?? "",
        building: apt.building ?? "",
        district: apt.district ?? "",
        capacity: apt.capacity ?? 2,
        price: apt.price ?? 0,
        currency: apt.currency ?? "BYN",
        rooms: apt.rooms ?? 1,
        description: apt.description ?? "",
        metro: apt.metro ?? "",
        amenities: apt.amenities ?? [],
        parking: apt.parking ?? "",
        image: apt.image ?? "",
        images: apt.images ?? [],
      });
    }
  }, [apartmentData]);

  // ===== ОБНОВЛЕНИЕ =====
  const updateApartment = api.apartment.update.useMutation({
    onSuccess: async () => {
      await utils.apartment.getAll.invalidate(); // ← главная страница
      await utils.apartment.getMyApartments.invalidate(); // ← мои объекты
      await utils.apartment.getById.invalidate({ id: Number(apartmentId) }); // ← эта квартира
      router.push("/my-apartments");
    },
    onError: (err) => {
      setError(err.message ?? "Ошибка при обновлении");
      setIsSubmitting(false);
    },
  });

  // ===== ОТПРАВКА ФОРМЫ =====
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const data = {
        ...formData,
        price: Number(formData.price),
        capacity: Number(formData.capacity),
        rooms: Number(formData.rooms),
      };

      await updateApartment.mutateAsync({ id: Number(apartmentId), ...data });
    } catch (err) {
      const message = err instanceof Error ? err.message : "Произошла ошибка";
      setError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    formData,
    setFormData,
    isSubmitting,
    isLoadingData,
    error,
    apartmentData,
    updateField,
    handleSubmit,
    isUpdating: updateApartment.isPending, // ← isPending вместо isLoading
  };
}
