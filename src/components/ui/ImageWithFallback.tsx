import { useState } from 'react';

import Image, { type ImageProps } from 'next/image';

import { DEFAULT_IMAGE_URL } from '@/lib/constants/images';

type ImageWithFallbackProps = Omit<ImageProps, 'src'> & {
    src: string;
    fallbackSrc?: string;
};

/**
 * next/image с обработкой ошибки загрузки: если картинка битая или
 * недоступна — подставляем дефолтное изображение вместо сломанной иконки.
 */
export function ImageWithFallback({ src, alt, fallbackSrc = DEFAULT_IMAGE_URL, ...rest }: ImageWithFallbackProps) {
    const [currentSrc, setCurrentSrc] = useState(src);

    return (
        <Image
            {...rest}
            src={currentSrc}
            alt={alt}
            onError={() => setCurrentSrc(fallbackSrc)}
        />
    );
}
