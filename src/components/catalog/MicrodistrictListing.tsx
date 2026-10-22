import { ApartmentsList } from '@/components/apartments/ApartmentsList';
import { MicrodistrictTiles } from '@/components/catalog/MicrodistrictTiles';
import { useShuffledApartments } from '@/hooks/useShuffledApartments';
import type { ApartmentCardData } from '@/lib/apartment-format';
import { getMicrodistrictSeo } from '@/lib/catalog-seo';
import { MICRODISTRICTS, type MicrodistrictSlug } from '@/lib/constants/catalog';

type MicrodistrictListingProps = {
    slug: MicrodistrictSlug;
    apartments: ApartmentCardData[];
};

/** Тело страницы микрорайона: заголовок, выдача только этого микрорайона, SEO-текст, соседние районы. */
export function MicrodistrictListing({ slug, apartments }: MicrodistrictListingProps) {
    const { city, label } = MICRODISTRICTS[slug];
    const seo = getMicrodistrictSeo(slug, apartments);
    const shuffledApartments = useShuffledApartments(apartments);

    return (
        <>
            <div className="mb-6 text-center">
                <h1 className="text-[2rem] font-bold max-md:text-[1.5rem]">{seo.heading}</h1>
                {apartments.length > 0 && (
                    <p className="text-[1.1rem] text-muted-foreground max-md:text-base">Найдено {seo.countText}</p>
                )}
            </div>

            {apartments.length > 0 ? (
                <ApartmentsList apartments={shuffledApartments} />
            ) : (
                <div className="my-[50px] w-full p-[60px_20px] text-center">
                    <p className="text-xl font-semibold text-foreground">
                        В микрорайоне {label} пока нет квартир на сутки
                    </p>
                    <p className="text-base text-muted-foreground">Загляните в соседние районы — они ниже.</p>
                </div>
            )}

            {apartments.length > 0 && (
                <section className="mx-auto mt-12 max-w-3xl text-center text-[0.95rem] leading-relaxed text-muted-foreground max-md:mt-8 max-md:text-sm">
                    <h2 className="mb-4 text-[1.4rem] font-semibold text-foreground">{seo.heading}</h2>
                    <p>
                        В микрорайоне {label} доступно {seo.countText} на сутки — {seo.priceText}. Все объекты сдаются
                        напрямую от собственников: актуальные фотографии, честные цены, онлайн-бронирование без
                        посредников и скрытых комиссий.
                    </p>
                </section>
            )}

            <div className="mt-12 max-md:mt-8">
                <MicrodistrictTiles
                    city={city}
                    activeSlug={slug}
                />
            </div>
        </>
    );
}
