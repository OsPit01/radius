/** Небольшие помощники для контуров, которые удобнее посчитать, чем рисовать руками. */

const n = (value: number) => Number(value.toFixed(2));
const rad = (deg: number) => (deg * Math.PI) / 180;

/** Четырёхлучевая искра (вогнутые лучи) с центром (cx, cy) и «радиусом» r. */
export function spark(cx: number, cy: number, r: number): string {
    const s = r / 10;
    const pts = [
        [12, 2],
        [12.7, 7.6],
        [16.4, 11.3],
        [22, 12],
        [16.4, 12.7],
        [12.7, 16.4],
        [12, 22],
        [11.3, 16.4],
        [7.6, 12.7],
        [2, 12],
        [7.6, 11.3],
        [11.3, 7.6],
    ] as const;
    const p = pts.map(([x, y]) => `${n(cx + (x - 12) * s)} ${n(cy + (y - 12) * s)}`);
    return (
        `M${p[0]}C${p[1]} ${p[2]} ${p[3]}C${p[4]} ${p[5]} ${p[6]}` +
        `C${p[7]} ${p[8]} ${p[9]}C${p[10]} ${p[11]} ${p[0]}Z`
    );
}

/** Пятиконечная звезда: внешний радиус R, внутренний r. Скругляется штрихом с round-join. */
export function star5(cx: number, cy: number, R: number, r: number): string {
    const pts: string[] = [];
    for (let i = 0; i < 10; i++) {
        const radius = i % 2 === 0 ? R : r;
        const a = rad(-90 + i * 36);
        pts.push(`${n(cx + radius * Math.cos(a))} ${n(cy + radius * Math.sin(a))}`);
    }
    return `M${pts.join('L')}Z`;
}

/** Шестерёнка с `teeth` зубцами: зубец от радиуса base до outer, половинная ширина зубца — в градусах. */
export function gear(cx: number, cy: number, teeth: number, outer: number, base: number): string {
    const step = 360 / teeth;
    const wBase = step * 0.3;
    const wTop = step * 0.17;
    const pts: string[] = [];
    for (let i = 0; i < teeth; i++) {
        const c = -90 + i * step;
        const seq: [number, number][] = [
            [c - wBase, base],
            [c - wTop, outer],
            [c + wTop, outer],
            [c + wBase, base],
        ];
        for (const [deg, radius] of seq) {
            pts.push(`${n(cx + radius * Math.cos(rad(deg)))} ${n(cy + radius * Math.sin(rad(deg)))}`);
        }
    }
    return `M${pts.join('L')}Z`;
}

/** Дуга окружности от угла a0 до a1 (градусы, 0 — «на 3 часа», положительное направление — по часовой). */
export function arc(cx: number, cy: number, r: number, a0: number, a1: number): string {
    const x0 = n(cx + r * Math.cos(rad(a0)));
    const y0 = n(cy + r * Math.sin(rad(a0)));
    const x1 = n(cx + r * Math.cos(rad(a1)));
    const y1 = n(cy + r * Math.sin(rad(a1)));
    const large = Math.abs(a1 - a0) > 180 ? 1 : 0;
    const sweep = a1 > a0 ? 1 : 0;
    return `M${x0} ${y0}A${r} ${r} 0 ${large} ${sweep} ${x1} ${y1}`;
}

/** Силуэт сердца в сетке 24×24 — нужен и самой иконке сердца, и «домику с сердцем». */
export const HEART =
    'M12 21C5 15.6 2.5 12 2.5 8.5 2.5 5.5 4.8 3.3 7.6 3.3c1.9 0 3.5 1 4.4 2.6.9-1.6 2.5-2.6 4.4-2.6 2.8 0 5.1 2.2 5.1 5.2 0 3.5-2.5 7.1-9.5 12.5z';

/** Скруглённый прямоугольник. */
export function rrect(x: number, y: number, w: number, h: number, r: number): string {
    const iw = n(w - 2 * r);
    const ih = n(h - 2 * r);
    return (
        `M${n(x + r)} ${y}h${iw}a${r} ${r} 0 0 1 ${r} ${r}v${ih}a${r} ${r} 0 0 1-${r} ${r}` +
        `h-${iw}a${r} ${r} 0 0 1-${r}-${r}v-${ih}a${r} ${r} 0 0 1 ${r}-${r}z`
    );
}

/** Окружность одним замкнутым контуром. */
export function circle(cx: number, cy: number, r: number): string {
    return `M${n(cx - r)} ${cy}a${r} ${r} 0 1 0 ${n(2 * r)} 0a${r} ${r} 0 1 0-${n(2 * r)} 0z`;
}

/** Поворот точки (x, y) на `deg` градусов вокруг (cx, cy) и сдвиг. */
export function rotate(x: number, y: number, deg: number, cx = 0, cy = 0, dx = 0, dy = 0): [number, number] {
    const a = rad(deg);
    const px = x - cx;
    const py = y - cy;
    return [n(cx + px * Math.cos(a) - py * Math.sin(a) + dx), n(cy + px * Math.sin(a) + py * Math.cos(a) + dy)];
}

/** Многоугольник по точкам. */
export function polygon(points: readonly (readonly [number, number])[]): string {
    return `M${points.map(([x, y]) => `${x} ${y}`).join('L')}Z`;
}
