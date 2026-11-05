// Яндекс Карты в браузере: загрузка JS API 3.0 (карта на странице квартиры) и ссылка «маршрут» на Яндекс Карты.
//
// Ключ — NEXT_PUBLIC_YANDEX_MAPS_API_KEY, продукт «JavaScript API» в кабинете разработчика Яндекса. Ключ JS API всегда
// виден в коде страницы, поэтому в кабинете у него заполнено «Ограничение по HTTP Referer» (naradare.by, localhost):
// без этого JS API 3.0 не работает вовсе, а с ним чужой сайт не сможет тратить наш лимит. Серверные ключи
// Геокодера и Геосаджеста (src/server/yandex-*.ts) для карты не подходят и в браузер не попадают.
//
// Условия бесплатного использования: логотип, копирайты и кнопку «Открыть в Картах» карта рисует сама —
// скрывать или перекрывать их своими элементами нельзя.

const API_URL = 'https://api-maps.yandex.ru/v3/';

let loading: Promise<typeof ymaps3> | null = null;

/**
 * Подключает JS API один раз на страницу (скрипт создаёт глобальный ymaps3) и ждёт его готовности.
 * Если загрузка сорвалась, следующий вызов попробует снова.
 */
export function loadYandexMaps(apiKey: string): Promise<typeof ymaps3> {
    loading ??= new Promise<void>((resolve, reject) => {
        const script = document.createElement('script');
        script.src = `${API_URL}?${new URLSearchParams({ apikey: apiKey, lang: 'ru_RU' }).toString()}`;
        // Яндекс сверяет ключ с сайтом по заголовку Referer, поэтому no-referrer тут нельзя;
        // при этой политике уходит только домен, без пути страницы.
        script.referrerPolicy = 'strict-origin-when-cross-origin';
        script.onload = () => resolve();
        script.onerror = () => {
            script.remove();
            reject(new Error('Скрипт Яндекс Карт не загрузился'));
        };
        document.head.append(script);
    })
        // С отклонённым ключом скрипт может загрузиться, а ymaps3 так и не появиться — это тоже ошибка загрузки.
        .then(() => ymaps3.ready)
        .then(() => ymaps3)
        .catch((error: unknown) => {
            loading = null;
            throw error;
        });

    return loading;
}

/**
 * Маршрут до точки в Яндекс Картах. Начало маршрута пустое — Карты сами подставят текущее местоположение,
 * спросив разрешение у посетителя (наш сайт его координаты не получает). В rtext порядок «широта,долгота» —
 * обратный JS API ([долгота, широта]). rtt=auto — на машине; способ передвижения меняется в Картах.
 */
export function yandexRouteUrl(lat: number, lon: number): string {
    return `https://yandex.ru/maps/?rtext=~${lat},${lon}&rtt=auto`;
}
