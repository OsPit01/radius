export type ApartmentCardData = {
  id: number;
  type: string;
  title: string;
  city: string;
  district: string;
  capacity: number;
  price: number;
  currency: string;
  image: string;
  description: string;
  rooms: number;
  beds: number;
  singleBeds: number;
  doubleSofas: number;
  singleSofas: number;
  metro: string;
  amenities: string[];
};

// Структура полей, которые возвращает selectApartmentLight
type ApartmentSource = {
  id: number;
  type: string | null;
  title: string;
  city: string;
  district: string | null;
  capacity: number;
  price: number;
  currency: string | null;
  image: string;
  description: string | null;
  rooms: number;
  beds: number | null;
  singleBeds: number | null;
  doubleSofas: number | null;
  singleSofas: number | null;
  metro: string | null;
  amenities: string[] | null;
};

export function getApartmentCardData(
  apartment: ApartmentSource,
): ApartmentCardData {
  return {
    id: apartment.id,
    type: apartment.type ?? "apartment",
    title: apartment.title,
    city: apartment.city,
    district: apartment.district ?? "",
    capacity: apartment.capacity,
    price: apartment.price,
    currency: apartment.currency ?? "BYN",
    image: apartment.image,
    description: apartment.description ?? "",
    rooms: apartment.rooms,
    beds: apartment.beds ?? 0,
    singleBeds: apartment.singleBeds ?? 0,
    doubleSofas: apartment.doubleSofas ?? 0,
    singleSofas: apartment.singleSofas ?? 0,
    metro: apartment.metro ?? "",
    amenities: apartment.amenities ?? [],
  };
}