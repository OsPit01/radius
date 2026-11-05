import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import type { BehaviorType, LngLat, YMap, YMapTheme } from '@yandex/ymaps3-types';
import { useTheme } from 'next-themes';

import { MapPin, Minus, Plus, Route } from '@/components/icons';
import { loadYandexMaps, yandexRouteUrl } from '@/lib/yandex-maps';

const API_KEY = process.env.NEXT_PUBLIC_YANDEX_MAPS_API_KEY;

/** Масштаб «дом и соседние улицы». */
const ZOOM = 16;

// Без scrollZoom: колесо мыши над картой прокручивает страницу, а масштаб меняют кнопки +/− и двойной клик.
// Поворот и наклон карты здесь не нужны.
const BEHAVIORS: BehaviorType[] = ['drag', 'pinchZoom', 'dblClick'];

// Наши кнопки поверх карты. Hover и фокус — как у остальных кнопок сайта.
const OVERLAY_CONTROL =
    'border border-border bg-card text-foreground shadow-md transition-[color,background-color,border-color] hover:border-primary hover:bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring';

type Status = 'loading' | 'ready' | 'error';

/**
 * Карта с меткой квартиры (Яндекс Карты, JS API 3.0). Скрипт API грузится при первом показе карты,
 * то есть только когда открыли вкладку «Карта». «Маршрут» — обычная ссылка на Яндекс Карты, она работает и без карты.
 */
export function ApartmentMap({ lat, lon, address }: { lat: number; lon: number; address: string }) {
    const containerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<YMap | null>(null);
    // Элемент метки создаёт и двигает карта, а рисует в нём React (иконка MapPin) — через портал.
    const [pinElement, setPinElement] = useState<HTMLElement | null>(null);
    const [status, setStatus] = useState<Status>(API_KEY ? 'loading' : 'error');

    const { resolvedTheme } = useTheme();
    const theme: YMapTheme = resolvedTheme === 'dark' ? 'dark' : 'light';
    const themeRef = useRef(theme);

    useEffect(() => {
        themeRef.current = theme;
        mapRef.current?.update({ theme });
    }, [theme]);

    useEffect(() => {
        const container = containerRef.current;
        if (!API_KEY || !container) {
            return;
        }

        let cancelled = false;
        let map: YMap | null = null;

        loadYandexMaps(API_KEY)
            .then((ymaps) => {
                if (cancelled) {
                    return;
                }

                const center: LngLat = [lon, lat];
                const pin = document.createElement('div');

                map = new ymaps.YMap(container, {
                    location: { center, zoom: ZOOM },
                    behaviors: BEHAVIORS,
                    theme: themeRef.current,
                });

                map.addChild(new ymaps.YMapDefaultSchemeLayer({}));
                map.addChild(new ymaps.YMapDefaultFeaturesLayer({}));
                map.addChild(new ymaps.YMapMarker({ coordinates: center }, pin));

                mapRef.current = map;

                setPinElement(pin);
                setStatus('ready');
            })
            .catch(() => {
                if (!cancelled) {
                    setStatus('error');
                }
            });

        return () => {
            cancelled = true;
            map?.destroy();
            mapRef.current = null;
        };
    }, [lat, lon]);

    function zoomBy(step: number) {
        const map = mapRef.current;

        if (!map) {
            return;
        }

        const { min, max } = map.zoomRange;
        // Без анимации, если в системе включено «Уменьшить движение».
        const duration = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 200;
        map.setLocation({ zoom: Math.min(Math.max(Math.round(map.zoom) + step, min), max), duration });
    }

    return (
        <figure className="mx-auto max-w-2xl">
            <div className="relative isolate h-80 overflow-hidden rounded-2xl border border-border bg-muted sm:h-96">
                <div
                    ref={containerRef}
                    className="absolute inset-0 isolate"
                />

                {status !== 'ready' && (
                    <p className="absolute inset-0 grid place-items-center p-6 text-center text-sm text-muted-foreground">
                        {status === 'loading'
                            ? 'Загружаем карту…'
                            : 'Карта сейчас недоступна — маршрут можно построить в Яндекс Картах'}
                    </p>
                )}

                <a
                    href={yandexRouteUrl(lat, lon)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`absolute top-3 left-3 z-10 inline-flex min-h-10 items-center gap-2 rounded-xl px-3.5 text-sm font-medium pointer-coarse:min-h-11 ${OVERLAY_CONTROL}`}
                >
                    <Route className="size-5 text-primary" />
                    Маршрут
                    <span className="sr-only"> в Яндекс Картах (откроется в новой вкладке)</span>
                </a>

                {status === 'ready' && (
                    <div className="absolute top-1/2 right-3 z-10 flex -translate-y-1/2 flex-col gap-2">
                        <button
                            type="button"
                            aria-label="Приблизить"
                            onClick={() => zoomBy(1)}
                            className={`grid size-10 cursor-pointer place-items-center rounded-xl pointer-coarse:size-11 ${OVERLAY_CONTROL}`}
                        >
                            <Plus className="size-5" />
                        </button>
                        <button
                            type="button"
                            aria-label="Отдалить"
                            onClick={() => zoomBy(-1)}
                            className={`grid size-10 cursor-pointer place-items-center rounded-xl pointer-coarse:size-11 ${OVERLAY_CONTROL}`}
                        >
                            <Minus className="size-5" />
                        </button>
                    </div>
                )}
            </div>

            <figcaption className="mt-3 flex items-start gap-2 text-sm text-muted-foreground">
                <MapPin className="size-5" />
                {address}
            </figcaption>

            {pinElement &&
                createPortal(
                    // Карта ставит элемент метки левым верхним углом в точку; сдвигаем так, чтобы туда пришёлся кончик
                    // иглы (у MapPin он на высоте 22.2 из 24).
                    <MapPin
                        variant={1}
                        className="block size-10 -translate-x-1/2 -translate-y-[92.5%] text-primary drop-shadow-md"
                    />,
                    pinElement,
                )}
        </figure>
    );
}
