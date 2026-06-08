"use client";
import "./ApartmentsList.css";

// Тип для квартиры (чтобы TypeScript не ругался)
type Apartment = {
  id: number;
  title: string;
};

export function ApartmentCard({ apartment }: { apartment: Apartment }) {
  return null;
}
