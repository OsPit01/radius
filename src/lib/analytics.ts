// Отправка события конверсии в Google Ads.
// Функция window.gtag_report_conversion определяется скриптом GoogleAnalytics
// (см. src/components/analytics/GoogleAnalytics.tsx) после загрузки тега.

type GtagReportConversion = (url?: string) => void;

declare global {
    interface Window {
        gtag_report_conversion?: GtagReportConversion;
    }
}

export function reportConversion() {
    window.gtag_report_conversion?.();
}
