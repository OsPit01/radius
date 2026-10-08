declare module "*.css" {
  const classes: Record<string, string>; // ← Record
  export default classes;
}

// Глобальные переменные Google Analytics (gtag), чтобы TypeScript
// не ругался на window.gtag / window.dataLayer.
interface Window {
  dataLayer?: unknown[];
  gtag?: (...args: unknown[]) => void;
}
