// src/hooks/useImageManager.ts

"use client";

import { useState, useRef } from "react";

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
  dragIndex: number | null;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  addImages: (files: FileList | null) => void;
  removeImage: (index: number) => void;
  setMainImage: (index: number) => void;
  handleDragStart: (index: number) => void;
  handleDragOver: (e: React.DragEvent<HTMLDivElement>, index: number) => void;
  handleDragEnd: () => void;
  handleDrop: (e: React.DragEvent<HTMLDivElement>) => void;
  openFilePicker: () => void;
};

export function useImageManager({
  images = [],
  mainImage = "",
  onImagesChange,
  onMainImageChange,
}: ImageManagerProps = {}): ImageManagerReturn {
  const [isUploading, setIsUploading] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ===== ДОБАВЛЕНИЕ ФОТО =====
  const addImages = (files: FileList | null) => {
    if (!files || files.length === 0) return;

    setIsUploading(true);
    const readers: Promise<string>[] = [];

    for (const file of files) {
      const reader = new FileReader();
      const promise = new Promise<string>((resolve) => {
        reader.onload = (event) => {
          resolve(event.target?.result as string);
        };
      });
      readers.push(promise);
      reader.readAsDataURL(file);
    }

    Promise.all(readers)
      .then((results) => {
        const newImages = [...images, ...results];
        onImagesChange?.(newImages);

        if (!mainImage && newImages.length > 0) {
          onMainImageChange?.(newImages[0] ?? "");
        }
      })
      .catch((error) => {
        console.error("Ошибка загрузки изображений:", error);
        alert("Не удалось загрузить изображения");
      })
      .finally(() => {
        setIsUploading(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      });
  };

  // ===== УДАЛЕНИЕ ФОТО =====
  const removeImage = (index: number) => {
    const deletedImage = images[index];
    const newImages = images.filter((_, i) => i !== index);
    onImagesChange?.(newImages);

    if (mainImage === deletedImage) {
      onMainImageChange?.(newImages[0] ?? "");
    }
  };

  // ===== СДЕЛАТЬ ЗАГЛАВНОЙ =====
  const setMainImage = (index: number) => {
    if (images.length === 0 || index === 0) return;
    const image = images[index];
    if (!image) return;

    const newImages = [image, ...images.filter((_, i) => i !== index)];
    onImagesChange?.(newImages);
    onMainImageChange?.(image);
  };

  // ===== DRAG & DROP =====
  const handleDragStart = (index: number) => {
    setDragIndex(index);
  };

  const handleDragOver = (
    e: React.DragEvent<HTMLDivElement>,
    index: number,
  ) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) return;
    if (images.length === 0) return;
    if (dragIndex < 0 || dragIndex >= images.length) return;
    if (index < 0 || index >= images.length) return;

    const newImages = [...images];
    const [draggedItem] = newImages.splice(dragIndex, 1);
    if (!draggedItem) return;

    newImages.splice(index, 0, draggedItem);
    onImagesChange?.(newImages);
    setDragIndex(index);
  };

  const handleDragEnd = () => {
    setDragIndex(null);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      const input = fileInputRef.current;
      if (input) {
        input.files = files;
        input.dispatchEvent(new Event("change", { bubbles: true }));
      }
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
    dragIndex,
    fileInputRef,
    addImages,
    removeImage,
    setMainImage,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    handleDrop,
    openFilePicker,
  };
}
