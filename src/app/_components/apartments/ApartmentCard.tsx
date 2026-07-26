"use client";
import "./ApartmentsList.css";
import Image from "next/image";
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
    <div className="apartment-card">
      <div className="apartment-image-div">
        <Image
          src={apartment.image}
          alt={apartment.title}
          fill
          className="apartment-image"
        />
      </div>
      <div className="apartmnet-section-title">
        <span className="apartment-text-title">{apartment.title}</span>
        <span className="apartment-text-price"> BYN {apartment.price}</span>
      </div>
      <div className="apartment-section-street">
        {" "}
        {apartment.city}, {apartment.district}
      </div>
      <div className="apartment-section-capacity">
        <span className="number-of-rooms">
          {" "}
          количество комнат: {apartment.rooms}
        </span>
        <span className="number-of-persons">
          до {apartment.capacity} {getCapacityText(apartment.capacity)}
        </span>
      </div>
    </div>
  );
}

function getCapacityText(capacity: number) {
  if (capacity > 1) return "человек";
  return "человека";
}
