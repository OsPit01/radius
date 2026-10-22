import 'swiper/css';
import 'yet-another-react-lightbox/styles.css';

import { useRef, useState } from 'react';

import type { Swiper as SwiperType } from 'swiper';
import { Swiper, SwiperSlide } from 'swiper/react';
import Lightbox from 'yet-another-react-lightbox';
import Counter from 'yet-another-react-lightbox/plugins/counter';
import Zoom from 'yet-another-react-lightbox/plugins/zoom';

import { ArrowLeft, ArrowRight, Maximize } from '@/components/icons';
import { ImageWithFallback } from '@/components/ui/ImageWithFallback';

function GalleryImage({ src, alt }: { src: string; alt: string }) {
    return (
        <div className="relative h-full w-full overflow-hidden">
            <ImageWithFallback
                src={src}
                alt={alt}
                fill
                draggable={false}
                className="object-cover"
            />
        </div>
    );
}

export function PhotoGallery({ photos, title }: { photos: string[]; title: string }) {
    const [activeIndex, setActiveIndex] = useState(0);
    const [lightboxOpen, setLightboxOpen] = useState(false);
    const swiperRef = useRef<SwiperType | null>(null);

    const slides = photos.map((src, i) => ({
        src,
        alt: `${title} — фото ${i + 1}`,
    }));

    const openLightbox = (index: number) => {
        setActiveIndex(index);
        setLightboxOpen(true);
    };

    return (
        <div>
            <div className="aspect-[16/9] w-full overflow-hidden rounded-lg bg-[black]">
                <Swiper
                    onSwiper={(s) => {
                        swiperRef.current = s;
                    }}
                    onSlideChange={(s) => setActiveIndex(s.activeIndex)}
                    className="h-full w-full"
                >
                    {photos.map((src, i) => (
                        <SwiperSlide key={i}>
                            <div
                                className="group relative h-full w-full cursor-zoom-in"
                                onClick={() => openLightbox(i)}
                            >
                                <GalleryImage
                                    src={src}
                                    alt={`${title} — фото ${i + 1}`}
                                />
                                <div className="pointer-events-none absolute right-3 bottom-3 flex h-9 w-9 items-center justify-center rounded-full bg-black/50 text-white opacity-0 transition-opacity group-hover:opacity-100">
                                    <Maximize className="h-5 w-5" />
                                </div>
                            </div>
                        </SwiperSlide>
                    ))}
                </Swiper>
            </div>

            <div className="mt-4 flex items-center justify-between">
                <button
                    className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-border bg-card text-xl shadow-sm transition-colors hover:bg-muted disabled:opacity-40"
                    onClick={() => swiperRef.current?.slidePrev()}
                    disabled={activeIndex === 0}
                >
                    <ArrowLeft className="h-5 w-5" />
                </button>
                <p className="text-sm text-muted-foreground">
                    {activeIndex + 1} из {photos.length}
                </p>
                <button
                    className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-border bg-card text-xl shadow-sm transition-colors hover:bg-muted disabled:opacity-40"
                    onClick={() => swiperRef.current?.slideNext()}
                    disabled={activeIndex === photos.length - 1}
                >
                    <ArrowRight className="h-5 w-5" />
                </button>
            </div>

            {photos.length > 1 && (
                <div className="mt-3 flex gap-2 overflow-x-auto">
                    {photos.map((src, i) => (
                        <button
                            key={i}
                            onClick={() => swiperRef.current?.slideTo(i)}
                            className={`relative h-16 w-24 flex-shrink-0 overflow-hidden rounded-lg border-2 transition-colors ${
                                i === activeIndex
                                    ? 'border-primary opacity-100'
                                    : 'border-transparent opacity-60 hover:opacity-100'
                            }`}
                        >
                            <ImageWithFallback
                                src={src}
                                alt={`${title} — фото ${i + 1}`}
                                fill
                                className="object-cover"
                            />
                        </button>
                    ))}
                </div>
            )}

            <Lightbox
                open={lightboxOpen}
                close={() => setLightboxOpen(false)}
                index={activeIndex}
                slides={slides}
                plugins={[Zoom, Counter]}
                zoom={{ maxZoomPixelRatio: 4 }}
            />
        </div>
    );
}
