import type { ApartmentCardData } from '@/lib/apartment-format';
import { CITIES, MICRODISTRICTS, type MicrodistrictSlug } from '@/lib/constants/catalog';
import { getCurrencySymbol } from '@/lib/constants/currencies';
import { pluralRu } from '@/lib/plural';
import { SITE_NAME } from '@/lib/seo';

// ===== SEO-ТЕКСТЫ СТРАНИЦЫ МИКРОРАЙОНА =====
// Пишем «в микрорайоне Грушевка» без склонения названия: так не нужно вручную
// подбирать падежи для каждого нового микрорайона, а слово «микрорайон» остаётся в запросе.
export function getMicrodistrictSeo(slug: MicrodistrictSlug, apartments: ApartmentCardData[]) {
    const { label, city } = MICRODISTRICTS[slug];
    const cityLabel = CITIES[city].label;
    // «Маяк Минск» уже содержит город — не пишем «Маяк Минск, Минск».
    const place = label.includes(cityLabel) ? `в микрорайоне ${label}` : `в микрорайоне ${label}, ${cityLabel}`;
    const count = apartments.length;
    const countText = `${count} ${pluralRu(count, 'квартира', 'квартиры', 'квартир')}`;
    // Глагол согласуется с числом: «Найдена 1 квартира», «Найдено 2 квартиры», «Найдено 5 квартир».
    const foundText = `${pluralRu(count, 'Найдена', 'Найдено', 'Найдено')} ${countText}`;
    const availableText = `${pluralRu(count, 'доступна', 'доступно', 'доступно')} ${countText}`;

    // Самая дешёвая квартира ЦЕЛИКОМ (цена + валюта — пара, их нельзя разрывать).
    const cheapest = apartments.reduce<ApartmentCardData | undefined>(
        (min, a) => (min === undefined || a.price < min.price ? a : min),
        undefined,
    );
    const priceText = cheapest ? `от ${cheapest.price} ${getCurrencySymbol(cheapest.currency)} за ночь` : '';

    return {
        title: `Квартиры на сутки ${place} | ${SITE_NAME}`,
        heading: `Квартиры на сутки ${place}`,
        // h2 над карточками: счётчик и цена «от» — короткий заголовок раздела с выдачей.
        listHeading: `${foundText}${priceText ? ` ${priceText}` : ''}`,
        // h2 над SEO-текстом: другая формулировка, чем в h1 («посуточная аренда» вместо «на сутки»),
        // чтобы не повторять один и тот же заголовок дважды на странице.
        aboutHeading: `Посуточная аренда квартир ${place}`,
        description: cheapest
            ? `Снять квартиру на сутки ${place}: ${countText} ${priceText}. Актуальные фото, честные цены, бронирование онлайн напрямую от собственников.`
            : `Снять квартиру на сутки ${place}. Актуальные фото, честные цены, бронирование онлайн напрямую от собственников.`,
        countText,
        availableText,
        priceText,
    };
}
