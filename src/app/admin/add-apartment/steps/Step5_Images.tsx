"use client";

import type { FormData } from "../page";
import { useState, useRef } from "react";
import Image from "next/image";

type Step5_ImagesProps = {
  formData: FormData;
  updateField: (
    field: keyof FormData,
    value: string | number | string[],
  ) => void;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  error?: string | null;
  errorFields: (keyof FormData)[];
};

export function Step5_Images({
  formData,
  updateField,
  error,
  errorFields,
}: Step5_ImagesProps) {
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleAddImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
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
        const currentImages = formData.images || [];
        const updatedImages = [...currentImages, ...results];
        updateField("images", updatedImages);
        if (!formData.image && updatedImages.length > 0) {
          updateField("image", updatedImages[0] ?? "");
        }
      })
      .catch((err) => {
        console.error("Ошибка загрузки изображений", err);
      })
      .finally(() => {
        setIsUploading(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      });
  };

  const handleRemoveImage = (index: number) => {
    const currentImages = formData.images || [];
    const updatedImages = currentImages.filter((_, i) => i !== index);
    updateField("images", updatedImages);

    const deletedImage = currentImages[index];
    const isMainDeleted = formData.image === deletedImage;

    if (isMainDeleted) {
      if (updatedImages.length > 0) {
        updateField("image", updatedImages[0] ?? "");
      } else {
        updateField("image", "");
      }
    }
  };

  const handleSetMain = (index: number) => {
    const currentImages = formData.images || [];
    if (currentImages.length === 0 || index === 0) return;
    const image = currentImages[index];
    if (!image) return;
    const newImages = [image, ...currentImages.filter((_, i) => i !== index)];
    updateField("images", newImages);
    updateField("image", image);
  };

  const handleDragStart = (index: number) => {
    setDragIndex(index);
  };

  const handleDragOver = (
    e: React.DragEvent<HTMLDivElement>,
    index: number,
  ) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) return;

    const currentImages = formData.images || [];
    if (currentImages.length === 0) return;
    if (dragIndex < 0 || dragIndex >= currentImages.length) return;
    if (index < 0 || index >= currentImages.length) return;

    const newImages = [...currentImages];
    const [draggedItem] = newImages.splice(dragIndex, 1);
    if (!draggedItem) return;

    newImages.splice(index, 0, draggedItem);
    updateField("images", newImages);
    setDragIndex(index);
  };

  const handleDragEnd = () => {
    setDragIndex(null);
  };

  const openFilePicker = () => {
    fileInputRef.current?.click();
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

  const hasError = (field: keyof FormData) => errorFields.includes(field);
  const images = formData.images || [];

  return (
    <fieldset className="step">
      <legend className="step-title">Шаг 5: Фотографии объекта</legend>

      {error && (
        <div className="error-message" role="alert">
          {error}
        </div>
      )}

      <div className="form-group">
        <label>
          Загрузите фотографии
          <span className="required">*</span>
          <span className="hint-text">(минимум 1 фото)</span>
        </label>

        <div
          className={`upload-zone ${isUploading ? "uploading" : ""}`}
          onClick={openFilePicker}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleAddImages}
            className="hidden-input"
            disabled={isUploading}
          />

          <div className="upload-content">
            {isUploading ? (
              <>
                <span className="upload-icon">⏳</span>
                <p>Загрузка...</p>
              </>
            ) : (
              <>
                <span className="upload-icon">📸</span>
                <p>Нажмите или перетащите фотографии</p>
                <small>Можно выбрать несколько файлов</small>
              </>
            )}
          </div>
        </div>

        {hasError("images") && (
          <div className="error-text">Добавьте хотя бы одну фотографию</div>
        )}
      </div>

      {images.length > 0 && (
        <div className="form-group">
          <div className="images-header">
            <label>
              Фотографии ({images.length})
              {formData.image && (
                <span className="main-badge">⭐ Заглавная выбрана</span>
              )}
            </label>
            <span className="hint-text">
              Перетаскивайте для изменения порядка
            </span>
          </div>

          <div className="images-grid">
            {images.map((image, index) => {
              const isMain = formData.image === image;
              return (
                <div
                  key={index}
                  className={`image-item ${isMain ? "main" : ""}`}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                >
                  <div className="image-wrapper">
                    <Image
                      src={image}
                      alt={`фото ${index + 1}`}
                      width={200}
                      height={200}
                      className="image-object"
                      unoptimized
                      priority={index === 0}
                    />
                    {isMain && (
                      <div className="main-badge-overlay">⭐ Заглавная</div>
                    )}
                  </div>

                  <div className="image-actions">
                    {/* КРЕСТИК - ПЕРВЫЙ (СВЕРХУ) */}
                    <button
                      type="button"
                      className="btn-remove"
                      onClick={() => handleRemoveImage(index)}
                      title="Удалить"
                    >
                      ✕
                    </button>

                    {/* ЗВЁЗДОЧКА - ВТОРАЯ (СНИЗУ) */}
                    {!isMain && (
                      <button
                        type="button"
                        className="btn-main"
                        onClick={() => handleSetMain(index)}
                        title="Сделать заглавной"
                      >
                        ⭐
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="summary-panel">
        <p>📸 Загружено: {images.length} фото</p>
        {formData.image && <p>⭐ Заглавное фото: выбрано</p>}
        {!formData.image && images.length > 0 && (
          <p className="warning-text">⚠️ Выберите заглавное фото (⭐)</p>
        )}
      </div>
    </fieldset>
  );
}
