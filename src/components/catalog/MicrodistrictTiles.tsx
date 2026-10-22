import Link from 'next/link';

import { MapPin } from '@/components/icons';
import {
    CITIES,
    type CitySlug,
    getMicrodistrictPath,
    getMicrodistrictSlugsByCity,
    MICRODISTRICTS,
    type MicrodistrictSlug,
} from '@/lib/constants/catalog';

type MicrodistrictTilesProps = {
    city: CitySlug;
    /** Микрорайон, страница которого открыта сейчас: подсвечивается в ряду. */
    activeSlug?: MicrodistrictSlug;
};

/**
 * «Районы Минска» — горизонтально прокручиваемый ряд плиток-ссылок на страницы микрорайонов.
 * Это обычные <a href>, поэтому поисковики идут по ним и видят внутренние ссылки на каталог.
 */
export function MicrodistrictTiles({ city, activeSlug }: MicrodistrictTilesProps) {
    const slugs = getMicrodistrictSlugsByCity(city);
    if (slugs.length === 0) {
        return null;
    }

    return (
        <section aria-labelledby={`microdistricts-${city}`}>
            <h2
                id={`microdistricts-${city}`}
                className="text-center text-[1.4rem] font-semibold text-foreground"
            >
                Районы {CITIES[city].genitive}
            </h2>
            <p className="mb-3 text-center text-base text-balance text-muted-foreground max-md:text-sm">
                Выберите район
            </p>

            {/* w-fit + mx-auto: пока плитки помещаются — стоят по центру, иначе ряд прокручивается.
                Полоса прокрутки скрыта, на телефоне ряд идёт «до края» экрана. */}
            <ul className="mx-auto flex w-fit max-w-full snap-x [scrollbar-width:none] gap-3 overflow-x-auto pb-1 max-md:-mx-5 max-md:w-auto max-md:max-w-none max-md:scroll-px-5 max-md:px-5 [&::-webkit-scrollbar]:hidden">
                {slugs.map((slug) => {
                    const isActive = slug === activeSlug;
                    return (
                        <li
                            key={slug}
                            className="flex shrink-0 snap-start"
                        >
                            <Link
                                href={getMicrodistrictPath(slug)}
                                aria-current={isActive ? 'page' : undefined}
                                className={`flex w-[230px] flex-col gap-1 rounded-2xl border bg-card px-3 py-3 text-left no-underline transition-colors duration-200 hover:border-primary focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none ${
                                    isActive ? 'border-primary' : 'border-border'
                                }`}
                            >
                                {/* Пин и название в одну строку — плитка ниже, чем с пином сверху. */}
                                <span className="flex items-center gap-2">
                                    <MapPin className="h-6 w-6 shrink-0 text-primary" />
                                    <span className="text-base font-semibold text-foreground">
                                        {MICRODISTRICTS[slug].label}
                                    </span>
                                </span>
                                <span className="block text-sm text-balance text-muted-foreground">
                                    Квартиры на сутки в {MICRODISTRICTS[slug].locative}
                                </span>
                            </Link>
                        </li>
                    );
                })}
            </ul>
        </section>
    );
}
