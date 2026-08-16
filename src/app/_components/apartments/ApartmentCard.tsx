"use client";

import Image from "next/image";
import Link from "next/link";
// Тип для квартиры (чтобы TypeScript не ругался)
type Apartment = {
  id: number;
  title: string;
  city: string;
  district: string;
  capacity: number;
  price: number;
  image: string;
  description: string;
  rooms: number;
  metro: string;
};

export function ApartmentCard({ apartment }: { apartment: Apartment }) {
  return (
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
      </div>
      <div className="mt-2.5 flex justify-between p-2.5">
        <span className="text-[18px] font-semibold max-md:text-base">
          {apartment.title}
        </span>
        <span className="border-b border-black text-[13px] font-bold">
          {" "}
          BYN {apartment.price}
        </span>
      </div>
      <div className="flex p-2.5 text-sm font-normal break-words">
        {" "}
        {apartment.city}, {apartment.district}
      </div>
      <div className="flex flex-wrap gap-2 p-2.5 font-light">
        <span className="rounded-[15px] border border-[#aca9a9] bg-[#efecf3] px-2.5 py-1 text-sm font-normal">
          {" "}
          количество комнат: {apartment.rooms}
        </span>
        <span className="rounded-[15px] border border-[#aca9a9] bg-[#efecf3] px-2.5 py-1 text-sm font-normal">
          до {apartment.capacity} {getCapacityText(apartment.capacity)}
        </span>
      </div>
      <div className="flex flex-wrap gap-2 p-2.5 font-light">
        {apartment.metro && (
          <p className="rounded-[15px] border border-[#aca9a9] bg-[#efecf3] px-2.5 py-1 text-sm font-normal">
            метро: в {apartment.metro} минутах
          </p>
        )}
      </div>
    </Link>
  );
}

function getCapacityText(capacity: number) {
  if (capacity > 1) return "человек";
  return "человека";
}
