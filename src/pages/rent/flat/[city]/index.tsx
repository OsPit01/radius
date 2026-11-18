import type { GetServerSideProps } from 'next';

import { CityCatalogPage } from '@/components/catalog/CityCatalogPage';
import { RegionCatalogPage } from '@/components/catalog/RegionCatalogPage';
import { type ApartmentCardData, getApartmentCardData } from '@/lib/apartment-format';
import { getRegion } from '@/lib/constants/belarus-locations';
import { transliterate } from '@/lib/transliterate';
import { createServerCaller } from '@/trpc/server';

// Две разновидности страницы по одному адресу /rent/flat/{слаг}:
// 1) город: /rent/flat/minsk, /rent/flat/zamostochye — квартиры одного населённого пункта;
// 2) область: /rent/flat/vitebsk-region — все квартиры области + список её пунктов.
// Различаем по слагу: значения областей ('vitebsk-region') не пересекаются
// с транслитом названий городов ('vitebsk').
//
// Файл — только «маршрутизатор»: определить, что за слаг, собрать данные,
// позвать нужный компонент. Вся разметка — в компонентах каталога.
type CatalogPlacePageProps =
    | {
          mode: 'city';
          city: string;
          // Районы города с активными квартирами — блок «Квартиры по районам».
          microdistricts: string[];
          apartments: ApartmentCardData[];
      }
    | {
          mode: 'region';
          regionValue: string;
          regionLabel: string;
          // Населённые пункты области с активными квартирами (центр исключён —
          // он уже показан плиткой в первом ряду главной).
          localities: { city: string; count: number }[];
          apartments: ApartmentCardData[];
      };

export const getServerSideProps: GetServerSideProps<CatalogPlacePageProps> = async (ctx) => {
    const city = ctx.params?.city;
    if (typeof city !== 'string') {
        return { notFound: true };
    }
    const slug = transliterate(city);
    // Если пришёл кириллический город (или в другом регистре) — 301-редирект на канонический слаг.
    if (slug !== city) {
        return { redirect: { destination: `/rent/flat/${slug}`, permanent: true } };
    }
    const api = await createServerCaller(ctx);

    // ===== Режим ОБЛАСТЬ: слаг совпал со значением области ('vitebsk-region') =====
    const region = getRegion(slug);
    if (region) {
        const locations = await api.apartment.getCatalogLocations();
        // Пункты области КРОМЕ её центра: центру место в первом ряду главной,
        // повторять его внутри области — дубль.
        const regionLocalities = locations.filter(
            (l) => l.region?.value === region.value && l.city !== region.center.name,
        );
        // Пустых страниц не держим: область существует, только пока в ней есть
        // активные квартиры вне центра.
        if (regionLocalities.length === 0) {
            return { notFound: true };
        }
        const data = await api.apartment.getAll({ region: region.value });
        if (data.length === 0) {
            return { notFound: true };
        }
        return {
            props: {
                mode: 'region',
                regionValue: region.value,
                regionLabel: region.label,
                localities: regionLocalities.map((l) => ({ city: l.city, count: l.count })),
                apartments: data.map((apartment) => getApartmentCardData(apartment)),
            },
        };
    }

    // ===== Режим ГОРОД: слаг — транслит названия населённого пункта =====
    const locations = await api.apartment.getCatalogLocations();
    const match = locations.find((l) => transliterate(l.city) === slug);
    if (!match) {
        return { notFound: true }; // слаг не найден → 404
    }
    const decodedCity = match.city; // "Минск - настоящее имя для запроса"
    const data = await api.apartment.getAll({ exactCity: decodedCity });

    if (data.length === 0) {
        return { notFound: true };
    }

    return {
        props: {
            mode: 'city',
            city: decodedCity,
            // Районы города (из того же locations, что уже загружен выше) —
            // для блока «Квартиры по районам» и перелинковки на район-страницы.
            microdistricts: match.microdistricts,
            apartments: data.map((apartment) => getApartmentCardData(apartment)),
        },
    };
};

export default function CatalogPlacePage(props: CatalogPlacePageProps) {
    return props.mode === 'region' ? (
        <RegionCatalogPage
            regionValue={props.regionValue}
            regionLabel={props.regionLabel}
            localities={props.localities}
            apartments={props.apartments}
        />
    ) : (
        <CityCatalogPage
            city={props.city}
            microdistricts={props.microdistricts}
            apartments={props.apartments}
        />
    );
}
