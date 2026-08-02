"use client";

import { useParams } from "next/navigation";
import { AuthGuard } from "@/app/_components/layout/AuthGuard";
import Image from "next/image";
import Link from "next/link";
import { AMENITIES, PARKING_TYPES, CURRENCIES } from "@/lib/constants";
import { EDIT_INPUT_CLASS, toggleAmenity } from "@/lib/utils";
import { useApartmentForm } from "./hooks/useApartmentForm";
import { useImageManager } from "./hooks/useImageManager";

export default function EditApartmentPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : (params.id?.[0] ?? "");

  const {
    formData,
    isSubmitting,
    isLoadingData,
    error,
    updateField,
    handleSubmit,
  } = useApartmentForm(id);

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
    initialImages: formData.images || [],
    initialMainImage: formData.image || "",
    onImagesChange: (newImages) => updateField("images", newImages),
    onMainImageChange: (newMain) => updateField("image", newMain),
  });

  if (isLoadingData) {
    return (
      <AuthGuard>
        <div className="mx-auto max-w-[900px] px-5 py-10">
          Загрузка...
        </div>
      </AuthGuard>
    );
  }

  if (error) {
    return (
      <AuthGuard>
        <div className="mx-auto max-w-[900px] px-5 py-10">
          Ошибка: {error}
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="mx-auto max-w-[900px] px-5 py-10 max-[480px]:px-2.5 max-[480px]:py-5">
        <div className="rounded-2xl bg-[#0e081b] p-10 shadow-[0_2px_8px_rgba(0,0,0,0.08)] max-md:p-5 max-[480px]:p-4">
          <h1 className="mb-[30px] text-[28px] font-bold text-white max-md:text-[22px]">
            Редактирование объекта
          </h1>

          <form onSubmit={handleSubmit} className="edit-form">
            {/* ФОТО */}
            <div
              className="edit-drop-zone"
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
            >
              <div className="grid grid-cols-4 gap-3 max-lg:grid-cols-3 max-md:grid-cols-3 max-[480px]:grid-cols-2">
                {images.map((image, index) => {
                  const isMain = mainImage === image;
                  return (
                    <div
                      key={index}
                      className={`relative aspect-square cursor-grab overflow-hidden rounded-lg border-2 border-[#3a2a4a] bg-[#2a1a3a] transition-colors duration-200 hover:border-[#b552c7] ${
                        isMain ? "border-[#fbbf24]" : ""
                      }`}
                      draggable={!isMain}
                      onDragStart={() => !isMain && handleDragStart(index)}
                      onDragOver={(e) => !isMain && handleDragOver(e, index)}
                      onDragEnd={handleDragEnd}
                    >
                      <div className="relative h-full w-full">
                        <Image
                          src={image}
                          alt={`Фото ${index + 1}`}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                        {isMain && (
                          <div className="absolute left-1 top-1 z-[5] rounded bg-[rgba(251,191,36,0.9)] px-2 py-0.5 text-[10px] font-semibold text-black max-[480px]:px-1.5 max-[480px]:py-0.5 max-[480px]:text-[8px]">
                            ⭐ Заглавная
                          </div>
                        )}
                      </div>
                      <div className="absolute right-1 top-1 z-10 flex flex-col gap-1">
                        <button
                          type="button"
                          className={`flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border-none p-0 text-[13px] leading-none transition-all duration-200 hover:scale-110 max-[480px]:h-[22px] max-[480px]:w-[22px] max-[480px]:text-[10px] ${
                            isMain
                              ? "bg-[rgba(251,191,36,0.2)] text-[#fbbf24] shadow-[0_0_12px_rgba(251,191,36,0.3)] hover:bg-[rgba(251,191,36,0.3)]"
                              : "bg-black/60 text-white/30 hover:bg-black/80 hover:text-white/80"
                          }`}
                          onClick={() => setMainImage(index)}
                          title={isMain ? "Заглавная" : "Сделать заглавной"}
                        >
                          ⭐
                        </button>
                        <button
                          type="button"
                          className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border-none bg-black/60 p-0 text-[13px] leading-none text-white/50 transition-all duration-200 hover:scale-110 hover:bg-[#ef4444] hover:text-white max-[480px]:h-[22px] max-[480px]:w-[22px] max-[480px]:text-[10px]"
                          onClick={() => removeImage(index)}
                          title="Удалить"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  );
                })}
                <div className="flex aspect-square cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-[#3a2a4a] bg-[#2a1a3a] transition-all duration-200 hover:border-[#b552c7] hover:bg-[rgba(181,82,199,0.05)]">
                  <button
                    type="button"
                    onClick={openFilePicker}
                    disabled={isUploading}
                    className="flex cursor-pointer flex-col items-center gap-1 border-none bg-transparent text-[13px] text-[#b0a0b0] disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {isUploading ? "⏳" : "📸"}
                    <span className="text-[28px]">
                      {isUploading ? "Загрузка..." : "Добавить фото"}
                    </span>
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => addImages(e.target.files)}
                    style={{ display: "none" }}
                  />
                </div>
              </div>
            </div>

            {/* ИНФОРМАЦИЯ */}
            <section className="mb-10 text-[#d0c0d0]">
              <div className="mb-[15px] mt-[35px] border-b border-[#3a2a4a] pb-2 text-xl font-semibold text-white">
                Информация
              </div>
              <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
                <div className="mb-4 flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-white">
                    Заголовок*
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => updateField("title", e.target.value)}
                    required
                    className={EDIT_INPUT_CLASS}
                  />
                </div>
                <div className="mb-4 flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-white">
                    Цена за сутки*
                  </label>
                  <div className="price-group relative flex items-center">
                    <input
                      type="number"
                      value={formData.price}
                      onChange={(e) =>
                        updateField("price", Number(e.target.value))
                      }
                      required
                      min="1"
                      className={`${EDIT_INPUT_CLASS} w-full pr-[85px] max-[480px]:pr-[70px]`}
                    />
                    <select
                      value={formData.currency}
                      onChange={(e) => updateField("currency", e.target.value)}
                      className="absolute right-1 w-[70px] cursor-pointer border-none bg-transparent text-right text-sm font-semibold text-[#b552c7] outline-none transition-colors duration-200 hover:text-[#9a3fb0] max-[480px]:w-[55px] max-[480px]:px-1.5 max-[480px]:text-xs"
                    >
                      {CURRENCIES.map((c) => (
                        <option key={c.value} value={c.value}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
                <div className="mb-4 flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-white">
                    Количество комнат*
                  </label>
                  <input
                    type="number"
                    value={formData.rooms}
                    onChange={(e) =>
                      updateField("rooms", Number(e.target.value))
                    }
                    required
                    min="1"
                    max="20"
                    className={EDIT_INPUT_CLASS}
                  />
                </div>
                <div className="mb-4 flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-white">
                    Вместимость (человек)
                  </label>
                  <input
                    type="number"
                    value={formData.capacity}
                    onChange={(e) =>
                      updateField("capacity", Number(e.target.value))
                    }
                    min="1"
                    max="30"
                    className={EDIT_INPUT_CLASS}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
                <div className="mb-4 flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-white">
                    Метро (мин пешком)
                  </label>
                  <input
                    type="text"
                    value={formData.metro}
                    onChange={(e) => updateField("metro", e.target.value)}
                    className={EDIT_INPUT_CLASS}
                  />
                </div>
                <div className="mb-4 flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-white">
                    Описание
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => updateField("description", e.target.value)}
                    rows={4}
                    className={`${EDIT_INPUT_CLASS} min-h-[100px] resize-y`}
                  />
                </div>
              </div>
            </section>

            {/* АДРЕС */}
            <section className="mb-10 text-[#d0c0d0]">
              <div className="mb-[15px] mt-[35px] border-b border-[#3a2a4a] pb-2 text-xl font-semibold text-white">
                Адрес
              </div>
              <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
                <div className="mb-4 flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-white">
                    Город *
                  </label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => updateField("city", e.target.value)}
                    required
                    className={EDIT_INPUT_CLASS}
                  />
                </div>
                <div className="mb-4 flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-white">
                    Район
                  </label>
                  <input
                    type="text"
                    value={formData.district}
                    onChange={(e) => updateField("district", e.target.value)}
                    className={EDIT_INPUT_CLASS}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
                <div className="mb-4 flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-white">
                    Улица *
                  </label>
                  <input
                    type="text"
                    value={formData.street}
                    onChange={(e) => updateField("street", e.target.value)}
                    required
                    className={EDIT_INPUT_CLASS}
                  />
                </div>
                <div className="mb-4 flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-white">
                    Номер дома *
                  </label>
                  <input
                    type="text"
                    value={formData.numberHome}
                    onChange={(e) => updateField("numberHome", e.target.value)}
                    required
                    className={EDIT_INPUT_CLASS}
                  />
                </div>
              </div>
              <div className="mb-4 flex flex-col gap-1.5">
                <label className="text-sm font-medium text-white">
                  Корпус
                </label>
                <input
                  type="text"
                  value={formData.building}
                  onChange={(e) => updateField("building", e.target.value)}
                  className={EDIT_INPUT_CLASS}
                />
              </div>
            </section>

            {/* УДОБСТВА */}
            <section className="mb-10 text-[#d0c0d0]">
              <div className="mb-[15px] mt-[35px] border-b border-[#3a2a4a] pb-2 text-xl font-semibold text-white">
                Удобства
              </div>
              <div className="mb-4 grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-2 max-md:grid-cols-2 max-[480px]:grid-cols-1">
                {AMENITIES.map((amenity) => (
                  <label
                    key={amenity.id}
                    className="flex cursor-pointer items-center gap-2 text-xs text-white"
                  >
                    <input
                      type="checkbox"
                      checked={formData.amenities.includes(amenity.id)}
                      onChange={(e) =>
                        updateField(
                          "amenities",
                          toggleAmenity(
                            formData.amenities,
                            amenity.id,
                            e.target.checked,
                          ),
                        )
                      }
                      className="h-[18px] w-[18px] min-h-[18px] min-w-[18px] shrink-0 cursor-pointer accent-[#b552c7]"
                    />
                    {amenity.label}
                  </label>
                ))}
              </div>
              <div className="mb-4 flex flex-col gap-1.5">
                <label className="text-sm font-medium text-white">
                  Парковка
                </label>
                <select
                  value={formData.parking}
                  onChange={(e) => updateField("parking", e.target.value)}
                  className={EDIT_INPUT_CLASS}
                >
                  {PARKING_TYPES.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>
            </section>

            {/* КНОПКИ */}
            <div className="mt-[30px] flex gap-4 border-t border-[#3a2a4a] pt-5 max-md:flex-col">
              <button
                type="submit"
                className="cursor-pointer rounded-[30px] bg-[#5d2d66] px-8 py-3 text-base font-semibold text-white transition-colors duration-200 hover:bg-[#9a3fb0] max-md:w-full max-md:text-center"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Сохранение..." : "Сохранить"}
              </button>
              <Link
                href="/my-apartments"
                className="cursor-pointer rounded-[30px] bg-[#3a2a4a] px-8 py-3 text-center text-base font-semibold text-white no-underline transition-colors duration-200 hover:bg-[#4a3a5a] max-md:w-full"
              >
                Отмена
              </Link>
            </div>
          </form>
        </div>
      </div>
    </AuthGuard>
  );
}
