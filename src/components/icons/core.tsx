import { type JSX, type SVGProps, useId } from 'react';

import { ICON_VARIANTS, type IconName, type IconVariant } from './config';

/**
 * Иконки одноцветные: всё рисуется в currentColor, то есть берёт цвет текста там, где стоит.
 * Три варианта — это три «начертания» одной и той же иконки: заливка, контур и дуотон
 * (тот же контур + бледная заливка того же цвета).
 *
 * В SVG-строках можно использовать токены:
 *   $fg    currentColor
 *   $soft  бледная заливка (currentColor, 18%)
 *   $id    уникальный префикс id (для mask/clipPath: `url(#$id-m)`)
 */
type Paints = { fg: string; soft: string; id: string };

export type RenderOptions = {
    /** «Приглушённое» состояние (сердце не в избранном, звезда не выбрана): рисуется контуром. */
    muted: boolean;
};

export type VariantSpec = readonly [label: string, render: (p: Paints, o: RenderOptions) => string];

export type IconSpec = {
    name: IconName;
    /** Русское название — для галереи. */
    label: string;
    /** Где иконка используется на сайте — для галереи. */
    usage: string;
    /** Есть ли у иконки «приглушённое» состояние (проп `muted`) — только у сердца и звезды. */
    hasMuted?: boolean;
    /** Ровно три варианта: подпись + функция, возвращающая SVG-разметку (содержимое <svg viewBox="0 0 24 24">). */
    variants: readonly [VariantSpec, VariantSpec, VariantSpec];
};

export type IconProps = Omit<SVGProps<SVGSVGElement>, 'ref' | 'children' | 'dangerouslySetInnerHTML'> & {
    /** 1 — заливка, 2 — контур, 3 — дуотон. По умолчанию берётся из ICON_VARIANTS (config.ts). */
    variant?: IconVariant;
    /** Приглушённое состояние — работает у сердца и звезды. */
    muted?: boolean;
    /** Подпись для скринридеров. Без неё иконка считается декоративной. */
    title?: string;
};

export type IconMeta = Pick<IconSpec, 'name' | 'label' | 'usage'> & {
    hasMuted: boolean;
    variantLabels: readonly [string, string, string];
};

export type IconComponent = ((props: IconProps) => JSX.Element) & { meta: IconMeta };

function escapeAttr(value: string): string {
    return value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function fill(template: string, paints: Paints): string {
    return template.replace(/\$([a-z]+)/g, (_, key: string) => (paints as Record<string, string>)[key] ?? 'magenta');
}

/**
 * Собирает компонент иконки из трёх готовых SVG-вариантов.
 *
 * Разметка вариантов — статичные строки из этого же репозитория (пользовательских данных
 * в них нет), поэтому вставляем их через innerHTML: так файлы с иконками остаются
 * компактными и читаются как обычный SVG.
 */
export function createRawIcon(spec: IconSpec): IconComponent {
    const { name, variants } = spec;

    function Icon({ variant, muted = false, title, className, ...rest }: IconProps) {
        const uid = `ic${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
        const paints: Paints = {
            fg: 'currentColor',
            soft: 'color-mix(in srgb, currentColor 18%, transparent)',
            id: uid,
        };
        const picked = variants[(variant ?? ICON_VARIANTS[name]) - 1] ?? variants[0];

        const markup =
            (title ? `<title>${escapeAttr(title)}</title>` : '') + fill(picked[1](paints, { muted }), paints);

        return (
            <svg
                viewBox="0 0 24 24"
                width="1em"
                height="1em"
                fill="none"
                focusable="false"
                role={title ? 'img' : undefined}
                aria-label={title}
                aria-hidden={title ? undefined : true}
                className={`shrink-0 ${className ?? ''}`}
                {...rest}
                dangerouslySetInnerHTML={{ __html: markup }}
            />
        );
    }

    Icon.meta = {
        name: spec.name,
        label: spec.label,
        usage: spec.usage,
        hasMuted: spec.hasMuted ?? false,
        variantLabels: [variants[0][0], variants[1][0], variants[2][0]],
    } satisfies IconMeta;
    Icon.displayName = `Icon(${name})`;

    return Icon;
}

/** Из чего состоит рисунок «объектной» иконки (всё в сетке 24×24). */
export type Parts = {
    /** Замкнутые контуры — основной силуэт. */
    shapes: string[];
    /** Замкнутые контуры поверх «выреза» (например, второй человек на иконке «Пользователи»). */
    front?: string[];
    /** Незамкнутые линии внутри силуэта: в заливке — вырез, в контуре — линия. */
    strokes?: string[];
    /** Отверстия-контуры (окошко, втулка): в заливке — дырка, в контуре — кольцо. */
    holes?: string[];
    /** Мелкие детали (точки, окна): в заливке — дырка, в контуре — закрашенная точка. Путь или шаблон `<… $paint …/>`. */
    marks?: string[];
    /** Контуры, вокруг которых силуэт «вырезается» (например, карандаш поверх листа). */
    halo?: string[];
    /** Всё, что рисуется поверх без изменений во всех вариантах: ножки, лучи, искры (в $fg). */
    extras?: string;
    /** Толщина линий-деталей. */
    cut?: number;
};

const OUTLINE_WIDTH = 1.8;
const LINE = 'fill="none" stroke-linecap="round" stroke-linejoin="round"';

/** Рисует части иконки в одном из трёх начертаний. */
export function renderParts(kind: IconVariant, parts: Parts): string {
    const { shapes, front = [], strokes = [], holes = [], marks = [], halo = [], extras = '', cut = 1.7 } = parts;

    const shape = (d: string) =>
        kind === 1
            ? `<path d="${d}" fill="$fg" stroke="$fg" stroke-width="${OUTLINE_WIDTH}" stroke-linejoin="round"/>`
            : `<path d="${d}" fill="${kind === 3 ? '$soft' : 'none'}" stroke="$fg" stroke-width="${OUTLINE_WIDTH}" stroke-linejoin="round"/>`;
    const line = (d: string, color: string) => `<path d="${d}" ${LINE} stroke="${color}" stroke-width="${cut}"/>`;
    const mark = (m: string, paint: string) =>
        m.startsWith('<') ? m.replace(/\$paint/g, paint) : `<path d="${m}" fill="${paint}"/>`;

    // В заливке детали вырезаются из силуэта маской; в контуре рисуются поверх.
    const carved = kind === 1;
    const needsMask = halo.length > 0 || (carved && (strokes.length > 0 || holes.length > 0 || marks.length > 0));

    let body = shapes.map(shape).join('');
    if (!carved) {
        body +=
            strokes.map((d) => line(d, '$fg')).join('') +
            holes
                .map((d) => `<path d="${d}" fill="none" stroke="$fg" stroke-width="${cut}" stroke-linejoin="round"/>`)
                .join('') +
            marks.map((m) => mark(m, '$fg')).join('');
    }

    if (needsMask) {
        const cuts =
            halo
                .map((d) => `<path d="${d}" fill="#000" stroke="#000" stroke-width="2.6" stroke-linejoin="round"/>`)
                .join('') +
            (carved
                ? strokes.map((d) => line(d, '#000')).join('') +
                  holes.map((d) => `<path d="${d}" fill="#000"/>`).join('') +
                  marks.map((m) => mark(m, '#000')).join('')
                : '');
        body =
            `<mask id="$id-m" maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24">` +
            `<rect width="24" height="24" fill="#fff"/>${cuts}</mask><g mask="url(#$id-m)">${body}</g>`;
    }

    return body + front.map(shape).join('') + extras;
}

export type ShapeSpec = Omit<IconSpec, 'variants'> &
    Parts & {
        /** Подписи вариантов. */
        labels?: readonly [string, string, string];
        /** Свой набор частей для отдельного варианта — когда идея иконки меняется (знак парковки вместо машины). */
        alt?: Partial<Record<IconVariant, Parts>>;
    };

/**
 * Иконка из силуэта и деталей: заливка / контур / дуотон получаются автоматически.
 * Для отдельного варианта можно подменить части через `alt`.
 */
export function createIcon(spec: ShapeSpec): IconComponent {
    const { labels = ['Заливка', 'Контур', 'Дуотон'], alt = {}, ...rest } = spec;
    const { name, label, usage, hasMuted, ...base } = rest;
    const partsFor = (kind: IconVariant): Parts => alt[kind] ?? base;

    return createRawIcon({
        name,
        label,
        usage,
        hasMuted,
        variants: [
            [labels[0], () => renderParts(1, partsFor(1))],
            [labels[1], () => renderParts(2, partsFor(2))],
            [labels[2], () => renderParts(3, partsFor(3))],
        ],
    });
}

/**
 * Иконка-«глиф»: один штриховой путь `d` (стрелка, крестик, плюс…).
 * Варианты: штрих, глиф в кольце, глиф, вырезанный из круглой плашки.
 */
export function createGlyphIcon(
    spec: Omit<IconSpec, 'variants'> & {
        /** Контур глифа в сетке 24×24 с центром (12, 12). */
        d: string;
        /** Толщина штриха у голого варианта. */
        w?: number;
        labels?: readonly [string, string, string];
    },
): IconComponent {
    const { d, w = 3, labels = ['Штрих', 'В кольце', 'Плашка'], ...rest } = spec;
    const stroke = (color: string, width: number) =>
        `<path d="${d}" ${LINE} stroke="${color}" stroke-width="${width}"/>`;

    return createRawIcon({
        ...rest,
        variants: [
            [labels[0], () => stroke('$fg', w)],
            [
                labels[1],
                () =>
                    `<circle cx="12" cy="12" r="9.1" fill="$soft" stroke="$fg" stroke-width="${OUTLINE_WIDTH}"/>` +
                    `<g transform="translate(12 12) scale(.56) translate(-12 -12)">${stroke('$fg', w * 1.1)}</g>`,
            ],
            [
                labels[2],
                () =>
                    `<mask id="$id-m" maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24"><rect width="24" height="24" fill="#fff"/>` +
                    `<g transform="translate(12 12) scale(.56) translate(-12 -12)">${stroke('#000', w * 1.25)}</g></mask>` +
                    `<circle cx="12" cy="12" r="10" fill="$fg" mask="url(#$id-m)"/>`,
            ],
        ],
    });
}
