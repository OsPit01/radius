// src/hooks/useImageManager.ts

import { useRef, useState } from 'react';

import { readFileAsDataURL } from '@/lib/file';
import { api } from '@/trpc/react';

type ImageManagerProps = {
    images?: string[];
    mainImage?: string;
    onImagesChange?: (images: string[]) => void;
    onMainImageChange?: (image: string) => void;
};

type ImageManagerReturn = {
    images: string[];
    mainImage: string;
    isUploading: boolean;
    fileInputRef: React.RefObject<HTMLInputElement | null>;
    addImages: (files: FileList | null) => void;
    removeImage: (index: number) => void;

    openFilePicker: () => void;
    reorderImages: (from: number, to: number) => void;
};

export function useImageManager({
    images = [],
    mainImage = '',
    onImagesChange,
    onMainImageChange,
}: ImageManagerProps = {}): ImageManagerReturn {
    const [isUploading, setIsUploading] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const uploadImage = api.upload.image.useMutation();

    // ===== ДОБАВЛЕНИЕ ФОТО =====
    const addImages = (files: FileList | null) => {
        if (!files || files.length === 0) {
            return;
        }

        setIsUploading(true);
        const dataUrlPromises = Array.from(files).map((file) => readFileAsDataURL(file));

        Promise.all(dataUrlPromises)
            .then(async (dataUrls) => {
                const urls: string[] = [];
                for (const dataUrl of dataUrls) {
                    const res = await uploadImage.mutateAsync({ dataUrl });
                    urls.push(res.url);
                }

                const newImages = [...images, ...urls];
                onImagesChange?.(newImages);

                if (!mainImage && newImages.length > 0) {
                    onMainImageChange?.(newImages[0] ?? '');
                }
            })
            .catch((error) => {
                console.error('Ошибка загрузки изображений:', error);
                alert('Не удалось загрузить изображения');
            })
            .finally(() => {
                setIsUploading(false);
                if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                }
            });
    };

    // ===== УДАЛЕНИЕ ФОТО =====
    const removeImage = (index: number) => {
        const deletedImage = images[index];
        const newImages = images.filter((_, i) => i !== index);
        onImagesChange?.(newImages);

        if (mainImage === deletedImage) {
            onMainImageChange?.(newImages[0] ?? '');
        }
    };

    // Перестановка при drag-and-drop: элемент с позиции from встаёт на позицию to.
    const reorderImages = (from: number, to: number) => {
        const newImages = [...images];
        const [moved] = newImages.splice(from, 1);
        if (!moved) {
            return;
        }
        newImages.splice(to, 0, moved);
        onImagesChange?.(newImages);
        // если первое фото поменялось — обновляем заглавное
        if (newImages[0] && newImages[0] !== mainImage) {
            onMainImageChange?.(newImages[0]);
        }
    };

    // ===== ОТКРЫТЬ ПРОВОДНИК =====
    const openFilePicker = () => {
        fileInputRef.current?.click();
    };

    return {
        images,
        mainImage,
        isUploading,
        fileInputRef,
        reorderImages,
        addImages,
        removeImage,
        openFilePicker,
    };
}
