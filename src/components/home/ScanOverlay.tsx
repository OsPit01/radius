import { RadarHero } from '@/components/home/RadarHero';

type ScanOverlayProps = {
    /** Название района, который «сканируется». */
    district: string;
};

/**
 * Полноэкранный оверлей на время перехода к списку квартир района: радар быстро
 * крутит лучом («сканирует»), под ним — название района. Показом/скрытием управляет
 * CityTiles через события роутера. Радар переиспользует RadarHero (период 2 с вместо 9 с).
 */
export function ScanOverlay({ district }: ScanOverlayProps) {
    return (
        <div className="fixed inset-0 z-[1001] flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
            <div
                role="status"
                aria-live="polite"
                className="flex w-full max-w-sm flex-col items-center gap-5 rounded-[20px] bg-card px-6 py-8 shadow-[0_20px_60px_rgba(0,0,0,0.4)]"
            >
                <RadarHero
                    period={2}
                    className="w-[min(56vw,11rem)]"
                />
                <div className="text-center">
                    <p className="text-lg font-semibold text-foreground">Сканируем район…</p>
                    <p className="mt-1 text-base font-medium text-foreground">{district}</p>
                    <p className="mt-2 text-sm text-muted-foreground">Ищем свободные квартиры на сутки</p>
                </div>
            </div>
        </div>
    );
}
