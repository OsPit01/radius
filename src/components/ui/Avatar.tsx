import { useState } from 'react';

import Image from 'next/image';

type AvatarProps = {
    src: string | null | undefined;
    name?: string | null;
    // Буква для кружка, если фото нет или оно не загрузилось.
    fallbackText?: string | null;
    size?: number;
};

/**
 * Аватар с запасным вариантом: если фото отсутствует или битое —
 * показываем кружок с первой буквой имени вместо сломанной картинки.
 */
export function Avatar({ src, name, fallbackText, size = 44 }: AvatarProps) {
    const [failed, setFailed] = useState(false);
    const initial = (fallbackText ?? name?.[0] ?? 'В').toUpperCase();

    if (!src || failed) {
        return (
            <div
                className="flex shrink-0 items-center justify-center rounded-full bg-muted text-foreground"
                style={{ width: size, height: size, fontSize: size * 0.4 }}
            >
                {initial}
            </div>
        );
    }

    return (
        <Image
            src={src}
            alt={name ?? 'Аватар'}
            width={size}
            height={size}
            onError={() => setFailed(true)}
            className="shrink-0 rounded-full object-cover"
            style={{ width: size, height: size }}
        />
    );
}
