"use client";

import Image from "next/image";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { api } from "@/trpc/react";
import { FaHeart, FaRegHeart } from "react-icons/fa";
import { getCurrencySymbol } from "@/lib/constants/currencies";

// Тип для квартиры (поля из базы могут быть null)
type Apartment = {
  id: number;
  title: string;
  city: string;
  district: string | null;
  capacity: number;
  price: number;
  currency: string;
  image: string;
  description: string | null;
  rooms: number;
  beds: number;
  singleBeds: number;
  doubleSofas: number;
  singleSofas: number;
  metro: string | null;
};

export function ApartmentCard({
  apartment,
  isFavorite,
}: {
  apartment: Apartment;
  isFavorite: boolean;
}) {
  //Сессия
  const { data: session } = useSession();
  // вызов хука api.useUtils()
  const utils = api.useUtils();
  // Мутация «переключить» с оптимистичным обновлением
  const toggleFavorite = api.favorites.toggle.useMutation({
    onMutate: async ({ apartmentId }) => {
      // Отменяем входящие запросы, чтобы они не перезаписали наш оптимизм
      await utils.favorites.listIds.cancel();
      // Сохраняем текущее значение (для отката в случае ошибки)
      const prev = utils.favorites.listIds.getData();
      // Оптимистично меняем список прямо сейчас, не дожидаясь сервера
      utils.favorites.listIds.setData(undefined, (old = []) =>
        old.includes(apartmentId)
          ? old.filter((id) => id !== apartmentId)
          : [...old, apartmentId],
      );
      return { prev };
    },
    onError: (_err, _vars, context) => {
      // Если сервер ответил ошибкой — откатываемся к сохранённому значению
      if (context?.prev !== undefined) {
        utils.favorites.listIds.setData(undefined, context.prev);
      }
    },
    onSettled: () => {
      // В фоне пересинхронизируем с сервером (чтобы данные не разошлись)
      void utils.favorites.listIds.invalidate();
      void utils.favorites.list.invalidate();
    },
  });
  //Обработчик клика
  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!session?.user) {
      window.location.href = "/auth/signin";
      return;
    }
    toggleFavorite.mutate({ apartmentId: apartment.id });
  };

  return (
    <>
      <Link
        href={`/apartments/${apartment.id}`}
        className="overflow-hidden rounded-2xl border border-[#ada3a3] bg-white p-0.5 transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_15px_24px_rgba(0,0,0,0.1)]"
      >
        <div className="relative h-[350px] w-full overflow-hidden max-md:h-[250px]">
          <Image
            src={apartment.image}
            alt={apartment.title}
            fill
            unoptimized
            className="rounded-[15px] object-cover"
          />
          <button
            type="button"
            onClick={handleToggle}
            className="group absolute top-3 right-3 z-10 flex h-10 w-10 items-center justify-center"
          >
            <div className="relative h-7 w-7 transition-transform duration-200 group-hover:scale-125">
              {/* контурное — видно когда НЕ в избранном */}
              <FaRegHeart
                className={`absolute top-0 left-0 h-7 w-7 text-gray-100 transition-all duration-300 group-hover:text-red-500 ${
                  isFavorite ? "scale-0 opacity-0" : "scale-100 opacity-100"
                }`}
              />
              {/* залитое — видно когда В избранном */}
              <FaHeart
                className={`absolute top-0 left-0 h-7 w-7 text-red-500 transition-all duration-300 ${
                  isFavorite ? "scale-100 opacity-100" : "scale-0 opacity-0"
                }`}
              />
            </div>
          </button>
          <span className="absolute right-3 bottom-3 z-10 rounded-lg bg-white px-2.5 py-1 text-sm font-bold text-[#222] shadow-sm">
            {apartment.price} {getCurrencySymbol(apartment.currency)}
          </span>
        </div>
        <div className="px-2.5 pt-3 pb-1">
          <span className="text-[18px] font-semibold break-words max-md:text-base">
            {apartment.title}
          </span>
        </div>
        <div className="flex px-2.5 pt-1 text-sm font-normal break-words">
          {apartment.city}
          {apartment.district ? `, ${apartment.district}` : ""}
        </div>
        <div className="flex flex-wrap gap-1.5 px-2.5 pt-2">
          <span className="rounded-[15px] border border-[#aca9a9] bg-[#efecf3] px-2.5 py-1 text-sm font-normal">
            {" "}
            количество комнат: {apartment.rooms}
          </span>
          <span className="rounded-[15px] border border-[#aca9a9] bg-[#efecf3] px-2.5 py-1 text-sm font-normal">
            до {apartment.capacity} {getCapacityText(apartment.capacity)}
          </span>
        </div>
        <div className="flex flex-wrap gap-1.5 px-2.5 pt-1.5">
          {apartment.beds > 0 && (
            <span className="rounded-[15px] border border-[#aca9a9] bg-[#efecf3] px-2.5 py-1 text-sm font-normal">
              Кровать: {apartment.beds}
            </span>
          )}
          {apartment.singleBeds > 0 && (
            <span className="rounded-[15px] border border-[#aca9a9] bg-[#efecf3] px-2.5 py-1 text-sm font-normal">
              Односпальная: {apartment.singleBeds}
            </span>
          )}
          {apartment.doubleSofas > 0 && (
            <span className="rounded-[15px] border border-[#aca9a9] bg-[#efecf3] px-2.5 py-1 text-sm font-normal">
              Дв. диван: {apartment.doubleSofas}
            </span>
          )}
          {apartment.singleSofas > 0 && (
            <span className="rounded-[15px] border border-[#aca9a9] bg-[#efecf3] px-2.5 py-1 text-sm font-normal">
              Одн. диван: {apartment.singleSofas}
            </span>
          )}
        </div>
        {apartment.metro && (
          <div className="flex flex-wrap gap-1.5 px-2.5 pt-1.5 pb-2">
            <p className="rounded-[15px] border border-[#aca9a9] bg-[#efecf3] px-2.5 py-1 text-sm font-normal">
              метро: в {apartment.metro} минутах
            </p>
          </div>
        )}
      </Link>
    </>
  );
}

function getCapacityText(capacity: number) {
  if (capacity > 1) return "человек";
  return "человека";
}
