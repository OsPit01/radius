"use client";

import type { FormData, StepProps } from "@/lib/utils";
import Image from "next/image";
import { useImageManager } from "@/app/my-apartments/[id]/edit/hooks/useImageManager";

export function Step5_Images({
  formData,
  updateField,
  error,
  errorFields,
}: StepProps) {
  const {
    images,
    mainImage,
    isUploading,
    fileInputRef,
    addImages,
    removeImage,
    setMainImage,
    handleDragStart,
    handleDragOver,
    handleDragEnd,
    handleDrop,
    openFilePicker,
  } = useImageManager({
    images: formData.images || [],
    mainImage: formData.image || "",
    onImagesChange: (newImages) => updateField("images", newImages),
    onMainImageChange: (newMain) => updateField("image", newMain),
  });

  const hasError = (field: keyof FormData) => errorFields.includes(field);

  return (
    <fieldset className="animate-[fadeIn_0.3s_ease] text-white">
      <legend className="mb-2.5 text-[17px] text-white">
        Шаг 5: Фотографии объекта
      </legend>

      {error && (
        <div
          className="rounded-xl bg-[rgba(239,68,68,0.1)] p-3 text-center text-[#ef4444]"
          role="alert"
        >
          {error}
        </div>
      )}

      <div className="mt-2.5 flex flex-col gap-2">
        <label className="pt-[5px] text-sm font-semibold text-white">
          Загрузите фотографии
          <span className="required">*</span>
          <span className="mt-[-8px] mb-3 block text-sm text-[#b0a0b0]">
            (минимум 1 фото)
          </span>
        </label>

        <div
          className={`flex aspect-[4/1] w-full cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-[#2a1a3a] bg-[#1a0a2a] transition-all duration-200 hover:border-[#6b21a8] hover:bg-[rgba(107,33,168,0.05)] max-[480px]:aspect-[2/1] ${
            isUploading ? "opacity-60" : ""
          }`}
          onClick={openFilePicker}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => addImages(e.target.files)}
            className="hidden"
            disabled={isUploading}
          />

          <div className="flex flex-col items-center">
            {isUploading ? (
              <>
                <span className="text-3xl">⏳</span>
                <p>Загрузка...</p>
              </>
            ) : (
              <>
                <span className="text-3xl">📸</span>
                <p>Нажмите или перетащите фотографии</p>
                <small className="text-xs text-[#b0a0b0]">
                  Можно выбрать несколько файлов
                </small>
              </>
            )}
          </div>
        </div>

        {hasError("images") && (
          <div className="mt-1 text-[13px] text-[#ee7272]">
            Добавьте хотя бы одну фотографию
          </div>
        )}
      </div>

      {images.length > 0 && (
        <div className="mt-2.5 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <label className="pt-[5px] text-sm font-semibold text-white">
              Фотографии ({images.length})
              {mainImage && (
                <span className="ml-2 rounded bg-[rgba(251,191,36,0.9)] px-2 py-0.5 text-[10px] font-semibold text-black">
                  ⭐ Заглавная выбрана
                </span>
              )}
            </label>
            <span className="text-sm text-[#b0a0b0]">
              Перетаскивайте для изменения порядка
            </span>
          </div>

          <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-4 py-[11px]">
            {images.map((image, index) => {
              const isMain = mainImage === image;
              return (
                <div
                  key={index}
                  className={`relative aspect-square cursor-grab rounded-xl border-2 border-[#2a1a3a] bg-[#1a0a2a] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#6b21a8] hover:shadow-[0_4px_12px_rgba(107,33,168,0.3)] ${
                    isMain
                      ? "border-[#fbbf24] shadow-[0_0_0_2px_#fbbf24,0_4px_12px_rgba(251,191,36,0.3)]"
                      : ""
                  }`}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                >
                  <div className="relative aspect-square w-full overflow-hidden rounded-t-xl">
                    <Image
                      src={image}
                      alt={`фото ${index + 1}`}
                      width={200}
                      height={200}
                      className="h-full w-full object-cover"
                      unoptimized
                      priority={index === 0}
                    />
                    {isMain && (
                      <div className="pointer-events-none absolute left-2 top-2 z-[5] rounded bg-[rgba(251,191,36,0.9)] px-2 py-0.5 text-[10px] font-semibold text-black">
                        ⭐ Заглавная
                      </div>
                    )}
                  </div>

                  <div className="absolute right-2 top-2 z-10 flex flex-col gap-1.5">
                    {/* КРЕСТИК - ПЕРВЫЙ (СВЕРХУ) */}
                    <button
                      type="button"
                      className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border-none bg-black/70 text-xs text-white shadow-[0_2px_8px_rgba(0,0,0,0.3)] transition-all duration-200 hover:scale-110 hover:bg-[#ef4444]"
                      onClick={() => removeImage(index)}
                      title="Удалить"
                    >
                      ✕
                    </button>

                    {/* ЗВЁЗДОЧКА - ВТОРАЯ (СНИЗУ) */}
                    {!isMain && (
                      <button
                        type="button"
                        className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border-none bg-black/70 text-xs text-white shadow-[0_2px_8px_rgba(0,0,0,0.3)] transition-all duration-200 hover:scale-110 hover:bg-[#fbbf24] hover:text-black"
                        onClick={() => setMainImage(index)}
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

      <div className="mt-5 p-[5px] text-[13px] text-[rgba(216,214,214,0.911)]">
        <p>📸 Загружено: {images.length} фото</p>
        {mainImage && <p>⭐ Заглавное фото: выбрано</p>}
        {!mainImage && images.length > 0 && (
          <p className="text-[13px] text-[#ee7272]">
            ⚠️ Выберите заглавное фото (⭐)
          </p>
        )}
      </div>
    </fieldset>
  );
}
