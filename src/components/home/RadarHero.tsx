import { type CSSProperties, useEffect, useRef } from 'react';

import { Home } from '@/components/icons';

import styles from './RadarHero.module.css';

/** Секунд на полный оборот луча. */
const PERIOD = 9;

type RadarHouse = {
    /** Угол от «12 часов» по часовой стрелке, градусы. */
    angle: number;
    /** Расстояние от центра, доля радиуса (0…1). */
    radius: number;
    /** Ширина дома, % от ширины радара. */
    size: number;
};

/** Главный дом — на том же месте, что и на фавиконе; луч в начальной позе смотрит прямо на него. */
const MAIN_HOUSE: RadarHouse = { angle: 44, radius: 0.76, size: 15 };

/** Остальные дома по кругу: чем дальше по списку, тем меньше. Радиусы совпадают с точечными кольцами. */
const HOUSES: readonly RadarHouse[] = [
    MAIN_HOUSE,
    { angle: 132, radius: 0.55, size: 11 },
    { angle: 198, radius: 0.76, size: 9 },
    { angle: 252, radius: 0.34, size: 7 },
    { angle: 292, radius: 0.76, size: 5.5 },
    { angle: 336, radius: 0.55, size: 4.5 },
];

/** Точечные кольца (в единицах viewBox 0…100, центр 50/50) и число точек на кольце. */
const RINGS = [
    { r: 38, dots: 120 },
    { r: 27.5, dots: 88 },
    { r: 17, dots: 56 },
] as const;

/**
 * Через сколько секунд после старта луч дойдёт до дома. Отрицательный animation-delay сдвигает
 * анимацию дома так, чтобы её «пик» (0% в keyframes) пришёлся ровно на этот момент.
 */
function houseDelay(house: RadarHouse): number {
    const turn = (((house.angle - MAIN_HOUSE.angle) % 360) + 360) % 360;
    return (turn / 360) * PERIOD - PERIOD;
}

function houseStyle(house: RadarHouse): CSSProperties {
    const rad = (house.angle * Math.PI) / 180;
    return {
        '--x': `${(50 + house.radius * 50 * Math.sin(rad)).toFixed(2)}%`,
        '--y': `${(50 - house.radius * 50 * Math.cos(rad)).toFixed(2)}%`,
        '--size': `${house.size}%`,
        '--delay': `${houseDelay(house).toFixed(3)}s`,
    } as CSSProperties;
}

const ROOT_STYLE = {
    '--period': `${PERIOD}s`,
    // в момент загрузки луч стоит на главном доме
    '--beam-delay': `${((-MAIN_HOUSE.angle / 360) * PERIOD).toFixed(3)}s`,
} as CSSProperties;

/**
 * Радар из фавикона: луч идёт по кругу и подсвечивает дома — чем ближе луч, тем ярче дом.
 * Чисто декоративный. Анимация целиком на CSS (см. RadarHero.module.css), здесь только раскладка
 * и пауза, когда радар ушёл за край экрана. Размер задаётся шириной: на телефоне компактнее.
 */
export function RadarHero() {
    const rootRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const root = rootRef.current;
        if (!root || typeof IntersectionObserver === 'undefined') {
            return;
        }
        // Пишем прямо в data-атрибут, а не в состояние: паузе не нужен ререндер React.
        const observer = new IntersectionObserver(([entry]) => {
            root.dataset.paused = String(!entry?.isIntersecting);
        });
        observer.observe(root);
        return () => observer.disconnect();
    }, []);

    return (
        <div
            ref={rootRef}
            aria-hidden="true"
            className={`${styles.root} mx-auto w-[min(70vw,16rem)] md:w-[min(26rem,50vh)] xl:w-[min(34rem,56vh)]`}
            style={ROOT_STYLE}
        >
            {/* Статичные кольца: рисуются один раз. */}
            <svg
                viewBox="0 0 100 100"
                className="absolute inset-0 h-full w-full text-foreground"
                fill="none"
                stroke="currentColor"
                strokeWidth={0.5}
            >
                <circle
                    cx={50}
                    cy={50}
                    r={49.4}
                    opacity={0.45}
                />
                {RINGS.map(({ r, dots }) => (
                    <circle
                        key={r}
                        cx={50}
                        cy={50}
                        r={r}
                        // pathLength = число точек → штрих «0 1» даёт ровно столько точек по кругу
                        pathLength={dots}
                        strokeDasharray="0 1"
                        strokeLinecap="round"
                        opacity={0.3}
                    />
                ))}
            </svg>

            <div className={styles.beam} />

            <span className="absolute top-1/2 left-1/2 h-[2.4%] w-[2.4%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary" />

            {HOUSES.map((house) => (
                <div
                    key={house.angle}
                    className={styles.house}
                    style={houseStyle(house)}
                >
                    <Home
                        variant={1}
                        className="block h-full w-full"
                    />
                </div>
            ))}
        </div>
    );
}
