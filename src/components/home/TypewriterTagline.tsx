import { useEffect, useRef } from 'react';

type TypewriterTaglineProps = {
    /** Настоящий текст заголовка: он лежит в разметке для роботов и скринридеров. */
    seoText: string;
    /** Фразы, которые печатаются на экране по кругу. Первая видна сразу, без анимации. */
    phrases: readonly string[];
    className?: string;
};

const TYPE_MS = 50;
const TYPE_JITTER_MS = 45; // небольшой разброс — печать выглядит живой, а не метрономом
const ERASE_MS = 25;
const HOLD_MS = 2800; // сколько фраза стоит целиком
const GAP_MS = 350; // пауза между «стёрли» и «печатаем»

/**
 * Подзаголовок с печатающимся текстом.
 *
 * Для роботов это обычный статичный <h2> с `seoText`. То, что печатается на экране, рисуется
 * CSS-ом из атрибутов data-typed / data-rest (`content: attr(...)`), поэтому в DOM как текст
 * его нет: ни поисковики, ни скринридеры его не видят — только `seoText`.
 *
 * Фраза всегда выложена целиком (напечатанная часть видна, остаток прозрачный) — поэтому текст
 * стоит по центру на своём финальном месте и не «ездит» при печати, в том числе в две строки.
 *
 * Производительность: React не перерисовывается (пишем прямо в атрибуты), анимация стоит,
 * пока вкладка скрыта или блок за экраном, и не запускается при `prefers-reduced-motion`.
 */
export function TypewriterTagline({ seoText, phrases, className }: TypewriterTaglineProps) {
    const rootRef = useRef<HTMLHeadingElement>(null);
    const typedRef = useRef<HTMLSpanElement>(null);

    const firstPhrase = phrases[0] ?? seoText;

    useEffect(() => {
        const root = rootRef.current;
        const el = typedRef.current;
        if (!root || !el || phrases.length < 2) {
            return;
        }
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            return;
        }

        let cancelled = false;
        // false до первого отчёта IntersectionObserver: если блок ниже первого экрана,
        // анимация не стартует впустую, а ждёт, пока его прокрутят в зону видимости.
        let inView = false;
        let wakeUp: (() => void) | undefined;
        const timers = new Set<ReturnType<typeof setTimeout>>();

        const canRun = () => inView && document.visibilityState === 'visible';
        const sleep = (ms: number) =>
            new Promise<void>((resolve) => {
                const id = setTimeout(() => {
                    timers.delete(id);
                    resolve();
                }, ms);
                timers.add(id);
            });
        // Пока вкладка скрыта или блок за экраном — не крутим таймеры впустую, а ждём события.
        const untilVisible = () =>
            canRun()
                ? Promise.resolve()
                : new Promise<void>((resolve) => {
                      wakeUp = resolve;
                  });
        const onVisibilityChange = () => {
            if (canRun() && wakeUp) {
                const resolve = wakeUp;
                wakeUp = undefined;
                resolve();
            }
        };

        const observer = new IntersectionObserver(([entry]) => {
            inView = entry?.isIntersecting ?? true;
            onVisibilityChange();
        });
        observer.observe(root);
        document.addEventListener('visibilitychange', onVisibilityChange);

        // Первые `count` символов фразы видны, остальные — прозрачны, но занимают своё место.
        const show = (phrase: string, count: number) => {
            el.dataset.typed = phrase.slice(0, count);
            el.dataset.rest = phrase.slice(count);
        };

        // Старт с первой фразы — и при повторном запуске эффекта (StrictMode, HMR).
        show(firstPhrase, firstPhrase.length);
        el.dataset.active = 'true';

        const run = async () => {
            let index = 0;
            while (!cancelled) {
                await untilVisible();
                await sleep(HOLD_MS);

                const current = phrases[index] ?? '';
                for (let n = current.length - 1; n >= 0; n--) {
                    show(current, n);
                    await sleep(ERASE_MS);
                }

                // Новую фразу выкладываем, пока на экране пусто: она встаёт на своё место незаметно.
                index = (index + 1) % phrases.length;
                const next = phrases[index] ?? '';
                show(next, 0);
                await sleep(GAP_MS);

                for (let n = 1; n <= next.length; n++) {
                    show(next, n);
                    await sleep(TYPE_MS + Math.random() * TYPE_JITTER_MS);
                }
            }
        };
        void run();

        return () => {
            cancelled = true;
            timers.forEach(clearTimeout);
            observer.disconnect();
            document.removeEventListener('visibilitychange', onVisibilityChange);
            delete el.dataset.active;
        };
    }, [phrases, firstPhrase]);

    return (
        <h2
            ref={rootRef}
            className={className}
        >
            <span className="sr-only">{seoText}</span>
            {/* aria-hidden + текст из data-*: для роботов и скринридеров здесь пусто. */}
            <span
                ref={typedRef}
                aria-hidden="true"
                data-typed={firstPhrase}
                data-rest=""
                className="typewriter"
            />
        </h2>
    );
}
