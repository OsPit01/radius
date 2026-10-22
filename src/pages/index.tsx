import { MicrodistrictTiles } from '@/components/catalog/MicrodistrictTiles';
import { JsonLd } from '@/components/JsonLd';
import { ClientHeader } from '@/components/layout/ClientHeader';
import { Seo } from '@/components/Seo';
import { CitySlug } from '@/lib/constants/catalog';
import { HOME_DESCRIPTION, HOME_TITLE, SITE_NAME, SITE_URL } from '@/lib/seo';

// Структурированные данные: сайт. Поля поиска на главной больше нет,
// поэтому SearchAction («поиск по сайту» в выдаче Google) не объявляем.
const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
};

export default function Home() {
    return (
        <>
            <Seo
                absoluteTitle={HOME_TITLE}
                description={HOME_DESCRIPTION}
                canonical={SITE_URL}
            />
            <JsonLd data={websiteSchema} />
            <ClientHeader />

            <main className="mx-auto min-h-screen max-w-[1400px] px-20 pt-5 pb-[60px] max-lg:px-10 max-lg:pb-10 max-md:px-5 max-md:py-[30px]">
                <div className="mx-auto max-w-[1400px] py-10 text-center">
                    <h1 className="text-[2rem] leading-[1.2] font-bold text-foreground max-md:text-[2rem]">
                        Посуточная аренда квартир
                    </h1>

                    <h2 className="text-[1.2rem] leading-[1.5] text-muted-foreground max-md:text-base">
                        квартиры на сутки напрямую от собственников
                    </h2>
                </div>

                <MicrodistrictTiles city={CitySlug.Minsk} />

                <section className="mx-auto mt-12 max-w-3xl text-center text-[0.95rem] leading-relaxed text-muted-foreground max-md:mt-8 max-md:text-sm">
                    <p className="mb-4">
                        Radius — удобный способ снять квартиру на сутки. У нас только проверенные объекты от
                        собственников: актуальные фотографии, честные цены и бронирование за пару минут. Выберите район,
                        подберите квартиру и забронируйте жильё онлайн без посредников и переплат.
                    </p>
                    <p>
                        Посуточная аренда квартир на Radius — это комфорт, прозрачность и выгодные цены. Каждый объект
                        проверен, у каждого есть подробное описание и рейтинг. Снимайте квартиру на сутки надёжно —
                        напрямую от владельцев.
                    </p>
                </section>
            </main>
        </>
    );
}
