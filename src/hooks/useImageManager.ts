// src/hooks/useImageManager.ts

import { useRef, useState } from 'react';

import { readFileAsDataURL } from '@/lib/file';
import { api } from '@/trpc/react';

type ImageManagerProps = {
    images?: string[];
    onImagesChange?: (images: string[]) => void;
};

type ImageManagerReturn = {
    images: string[];
    isUploading: boolean;
    fileInputRef: React.RefObject<HTMLInputElement | null>;
    addImages: (files: FileList | null) => void;
    removeImage: (index: number) => void;

    openFilePicker: () => void;
    reorderImages: (from: number, to: number) => void;
};

export function useImageManager({ images = [], onImagesChange }: ImageManagerProps = {}): ImageManagerReturn {
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

                onImagesChange?.([...images, ...urls]);
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
        onImagesChange?.(images.filter((_, i) => i !== index));
    };

    // Перестановка при drag-and-drop: элемент с позиции from встаёт на позицию to.
    const reorderImages = (from: number, to: number) => {
        const newImages = [...images];
        const [moved] = newImages.splice(from, 1);
        if (!moved) {
            return;
        }
        newImages.splice(to, 0, moved);
        // первое после перестановки фото и становится заглавным
        onImagesChange?.(newImages);
    };

    // ===== ОТКРЫТЬ ПРОВОДНИК =====
    const openFilePicker = () => {
        fileInputRef.current?.click();
    };

    return {
        images,
        isUploading,
        fileInputRef,
        reorderImages,
        addImages,
        removeImage,
        openFilePicker,
    };
}
