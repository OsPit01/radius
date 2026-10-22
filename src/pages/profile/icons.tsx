import { useEffect } from 'react';

import { useRouter } from 'next/router';
import { useTheme } from 'next-themes';

import { ICON_VARIANTS, type IconComponent, ICONS, type IconVariant } from '@/components/icons';
import { ClientHeader } from '@/components/layout/ClientHeader';
import { Seo } from '@/components/Seo';
import { requireRole } from '@/server/auth/require-auth';

// Каталог иконок — только для суперадмина (проверка на сервере, в том числе на проде).
// Страница лежит под /profile, а он закрыт от индексации (NOINDEX_PATHS: robots.txt + мета-тег noindex).
export const getServerSideProps = requireRole('superadmin');

const VARIANTS: readonly IconVariant[] = [1, 2, 3];

/** Один и тот же значок на трёх фонах: карточка, «чернила» темы и тёмная подложка поверх фото. */
function Backdrops({ Icon, variant, muted }: { Icon: IconComponent; variant: IconVariant; muted?: boolean }) {
    return (
        <div className="flex items-center gap-2">
            {[
                'bg-muted text-foreground',
                'bg-foreground text-background',
                'bg-black/65 text-white',
                'bg-primary text-primary-foreground',
            ].map((bg) => (
                <div
                    key={bg}
                    className={`flex h-9 w-9 items-center justify-center rounded-full ${bg}`}
                >
                    <Icon
                        variant={variant}
                        muted={muted}
                        className="h-5 w-5"
                    />
                </div>
            ))}
        </div>
    );
}

function IconCard({ Icon, dense }: { Icon: IconComponent; dense: boolean }) {
    const { meta } = Icon;
    const current = ICON_VARIANTS[meta.name];

    return (
        <section className="rounded-2xl border border-border bg-card p-5">
            <div className="mb-4">
                <h2 className="text-lg font-semibold text-foreground">
                    {meta.label}{' '}
                    <span className="font-mono text-xs font-normal text-muted-foreground">{meta.name}</span>
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">{meta.usage}</p>
            </div>
            <div className="grid grid-cols-3 gap-3 max-sm:grid-cols-1">
                {VARIANTS.map((variant) => (
                    <div
                        key={variant}
                        className={`flex flex-col items-center gap-3 rounded-xl border p-4 ${
                            variant === current ? 'border-primary bg-primary/5' : 'border-border bg-background'
                        }`}
                    >
                        <Icon
                            variant={variant}
                            className="h-16 w-16"
                        />
                        <div className="text-center">
                            <p className="text-sm font-medium text-foreground">
                                {variant} · {meta.variantLabels[variant - 1]}
                            </p>
                            {variant === current && (
                                <p className="text-xs font-semibold text-primary">сейчас на сайте</p>
                            )}
                        </div>
                        {!dense && (
                            <Backdrops
                                Icon={Icon}
                                variant={variant}
                            />
                        )}
                        {!dense && meta.hasMuted && (
                            <Backdrops
                                Icon={Icon}
                                variant={variant}
                                muted
                            />
                        )}
                    </div>
                ))}
            </div>
        </section>
    );
}

/** Компактный обзор: все иконки сеткой, три варианта в ряд. */
function IconGrid({ icons }: { icons: readonly IconComponent[] }) {
    return (
        <div className="grid grid-cols-4 gap-3 max-lg:grid-cols-2 max-sm:grid-cols-1">
            {icons.map((Icon) => (
                <div
                    key={Icon.meta.name}
                    className="rounded-xl border border-border bg-card p-3"
                >
                    <p className="mb-2 truncate text-xs font-medium text-muted-foreground">{Icon.meta.label}</p>
                    <div className="flex items-center justify-between">
                        {VARIANTS.map((variant) => (
                            <Icon
                                key={variant}
                                variant={variant}
                                className="h-10 w-10"
                            />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}

export default function IconsGallery() {
    const { theme, setTheme } = useTheme();
    const router = useRouter();

    // ?theme=dark — чтобы открыть галерею сразу в нужной теме.
    useEffect(() => {
        const wanted = router.query.theme;
        if (wanted === 'dark' || wanted === 'light') {
            setTheme(wanted);
        }
    }, [router.query.theme, setTheme]);

    // ?only=heart,star — показать только перечисленные иконки.
    const only = typeof router.query.only === 'string' ? router.query.only.split(',') : null;
    // ?grid — все иконки одной сеткой.
    const grid = router.query.grid !== undefined;
    // ?dense — без строк с разными фонами: компактный обзор.
    const dense = router.query.dense !== undefined;
    const list = only ? ICONS.filter((icon) => only.includes(icon.meta.name)) : ICONS;

    return (
        <>
            <ClientHeader />
            <div className="mx-auto max-w-6xl px-5 py-10">
                <Seo
                    title="Иконки"
                    noindex
                />
                <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-foreground">Иконки Radius</h1>
                        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
                            {ICONS.length} иконок × 3 варианта. Рамкой отмечен вариант, который сейчас стоит на сайте.
                            Чтобы заменить — поменяйте цифру в <code>src/components/icons/config.ts</code> или передайте{' '}
                            <code>variant</code> прямо в месте использования. Под каждым вариантом — как он выглядит на
                            разных фонах. Все иконки одной сеткой: <code>/profile/icons?grid</code>.
                        </p>
                    </div>
                    <div className="flex gap-2">
                        {(['light', 'dark'] as const).map((t) => (
                            <button
                                key={t}
                                type="button"
                                onClick={() => setTheme(t)}
                                className={`cursor-pointer rounded-full border px-4 py-2 text-sm font-medium ${
                                    theme === t
                                        ? 'border-primary bg-primary text-primary-foreground'
                                        : 'border-border bg-card text-foreground hover:bg-muted'
                                }`}
                            >
                                {t === 'light' ? 'Светлая' : 'Тёмная'}
                            </button>
                        ))}
                    </div>
                </div>
                {grid ? (
                    <IconGrid icons={list} />
                ) : (
                    <div className="flex flex-col gap-4">
                        {list.map((Icon) => (
                            <IconCard
                                key={Icon.meta.name}
                                Icon={Icon}
                                dense={dense}
                            />
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}
