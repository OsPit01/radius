"use client";
import { useState, useRef } from "react";
import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import type { Swiper as SwiperType } from "swiper";
import "swiper/css";

function GalleryImage({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="relative h-full w-full overflow-hidden">
      <Image
        src={src}
        alt={alt}
        fill
        draggable={false}
        unoptimized
        className="object-cover"
      />
    </div>
  );
}

export function PhotoGallery({ photos }: { photos: string[] }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const swiperRef = useRef<SwiperType | null>(null);

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
              <GalleryImage src={src} alt={`фото ${i + 1}`} />
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      <div className="mt-4 flex items-center justify-between">
        <button
          className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-[#e0e0e0] bg-white text-xl shadow-sm transition-colors hover:bg-[#f5f5f5] disabled:opacity-40"
          onClick={() => swiperRef.current?.slidePrev()}
          disabled={activeIndex === 0}
        >
          ←
        </button>
        <p className="text-sm text-[#666]">
          {activeIndex + 1} из {photos.length}
        </p>
        <button
          className="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-[#e0e0e0] bg-white text-xl shadow-sm transition-colors hover:bg-[#f5f5f5] disabled:opacity-40"
          onClick={() => swiperRef.current?.slideNext()}
          disabled={activeIndex === photos.length - 1}
        >
          →
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
                  ? "border-[#ff5a5f] opacity-100"
                  : "border-transparent opacity-60 hover:opacity-100"
              }`}
            >
              <Image
                src={src}
                alt=""
                fill
                unoptimized
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
