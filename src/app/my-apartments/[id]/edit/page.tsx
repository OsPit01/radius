"use client";

import { useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { AuthGuard } from "@/app/_components/layout/AuthGuard";
import Image from "next/image";
import Link from "next/link";
import { AMENITIES, PARKING_TYPES, CURRENCIES } from "@/lib/constants";
import { EDIT_INPUT_CLASS, toggleAmenity } from "@/lib/utils";
import { useApartmentForm } from "./hooks/useApartmentForm";
import { ClientHeader } from "@/app/_components/layout/ClientHeader";
import { api } from "@/trpc/react";

function readFilesAsDataURL(files: FileList): Promise<string[]> {
  return Promise.all(
    Array.from(files).map((file) => {
      return new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
    }),
  );
}

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

  const [isUploading, setIsUploading] = useState(false);
  const [dragIdx, setDragIdx] = useState<number | null>(null);

  const uploadImage = api.upload.image.useMutation();

  const images = formData.images ?? [];
  const mainImage = formData.image ?? "";

  const addImages = useCallback(
    async (files: FileList | null) => {
      if (!files || files.length === 0) return;
      setIsUploading(true);
      try {
        const dataUrls = await readFilesAsDataURL(files);
        const urls: string[] = [];
        for (const dataUrl of dataUrls) {
          const res = await uploadImage.mutateAsync({ dataUrl });
          urls.push(res.url);
        }
        const merged = [...images, ...urls];
        updateField("images", merged);
        if (!mainImage) updateField("image", urls[0] ?? "");
      } catch {
        alert("Ошибка загрузки");
      } finally {
        setIsUploading(false);
      }
    },
    [images, mainImage, updateField, uploadImage],
  );

  const removeImage = useCallback(
    (index: number) => {
      const deleted = images[index];
      const next = images.filter((_, i) => i !== index);
      updateField("images", next);
      if (mainImage === deleted) updateField("image", next[0] ?? "");
    },
    [images, mainImage, updateField],
  );

  const setMainImage = useCallback(
    (index: number) => {
      if (index === 0) return;
      const img = images[index];
      if (!img) return;
      const next = [img, ...images.filter((_, i) => i !== index)];
      updateField("images", next);
      updateField("image", img);
    },
    [images, updateField],
  );

  const handleDragStart = useCallback((index: number) => setDragIdx(index), []);
  const handleDragEnd = useCallback(() => setDragIdx(null), []);

  const handleDragOver = useCallback(
    (e: React.DragEvent, toIdx: number) => {
      e.preventDefault();
      if (dragIdx === null || dragIdx === toIdx) return;
      const next = [...images];
      const [item] = next.splice(dragIdx, 1);
      if (!item) return;
      next.splice(toIdx, 0, item);
      updateField("images", next);
      setDragIdx(toIdx);
    },
    [images, dragIdx, updateField],
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => addImages(e.target.files),
    [addImages],
  );

  if (isLoadingData) {
    return (
      <AuthGuard>
        <div className="mx-auto max-w-[900px] px-5 py-10">Загрузка...</div>
      </AuthGuard>
    );
  }

  if (error) {
    return (
      <AuthGuard>
        <div className="mx-auto max-w-[900px] px-5 py-10">Ошибка: {error}</div>
      </AuthGuard>
    );
  }

  return (
    <>
      <ClientHeader />
      <AuthGuard>
        <div className="mx-auto max-w-[900px] px-5 py-10 max-[480px]:px-2.5 max-[480px]:py-5">
          <div className="rounded-2xl bg-[#0e081b] p-10 shadow-[0_2px_8px_rgba(0,0,0,0.08)] max-[480px]:p-4 max-md:p-5">
            <h1 className="mb-[30px] text-[28px] font-bold text-white max-md:text-[22px]">
              Редактирование объекта
            </h1>

            <form onSubmit={handleSubmit} className="edit-form">
              {/* ФОТО */}
              <div className="edit-drop-zone">
                <div className="grid grid-cols-4 gap-3 max-[480px]:grid-cols-2 max-lg:grid-cols-3 max-md:grid-cols-3">
                  {images.map((src, index) => {
                    const isMain = mainImage === src;
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
                            src={src}
                            alt={`Фото ${index + 1}`}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                          {isMain && (
                            <div className="absolute top-1 left-1 z-[5] rounded bg-[rgba(251,191,36,0.9)] px-2 py-0.5 text-[10px] font-semibold text-black max-[480px]:px-1.5 max-[480px]:py-0.5 max-[480px]:text-[8px]">
                              ⭐ Заглавная
                            </div>
                          )}
                        </div>
                        <div className="absolute top-1 right-1 z-10 flex flex-col gap-1">
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
                  <label className="flex aspect-square cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-[#3a2a4a] bg-[#2a1a3a] transition-all duration-200 hover:border-[#b552c7] hover:bg-[rgba(181,82,199,0.05)]">
                    <span className="flex cursor-pointer flex-col items-center gap-1 border-none bg-transparent text-[13px] text-[#b0a0b0]">
                      {isUploading ? "⏳" : "📸"}
                      <span className="text-[28px]">
                        {isUploading ? "Загрузка..." : "+"}
                      </span>
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>

              {/* ИНФОРМАЦИЯ */}
              <section className="mb-10 text-[#d0c0d0]">
                <div className="mt-[35px] mb-[15px] border-b border-[#3a2a4a] pb-2 text-xl font-semibold text-white">
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
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={formData.price}
                        onChange={(e) =>
                          updateField("price", Number(e.target.value))
                        }
                        required
                        min="1"
                        className={`${EDIT_INPUT_CLASS} flex-1`}
                      />
                      <select
                        value={formData.currency}
                        onChange={(e) =>
                          updateField("currency", e.target.value)
                        }
                        className="h-[42px] cursor-pointer rounded-lg border border-[#3a2a4a] bg-[#2a1a3a] px-3 text-sm text-white outline-none"
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
                      onChange={(e) =>
                        updateField("description", e.target.value)
                      }
                      rows={4}
                      className={`${EDIT_INPUT_CLASS} min-h-[100px] resize-y`}
                    />
                  </div>
                  <div className="mb-4 flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-white">
                      Правила проживания{" "}
                      <span className="text-[#888]">(необязательно)</span>
                    </label>
                    <textarea
                      value={formData.rules}
                      onChange={(e) => updateField("rules", e.target.value)}
                      rows={4}
                      className={`${EDIT_INPUT_CLASS} min-h-[100px] resize-y`}
                      placeholder="Например: без вечеринок, без животных, заезд после 14:00..."
                    />
                  </div>
                </div>
              </section>

              {/* АДРЕС */}
              <section className="mb-10 text-[#d0c0d0]">
                <div className="mt-[35px] mb-[15px] border-b border-[#3a2a4a] pb-2 text-xl font-semibold text-white">
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
                      onChange={(e) =>
                        updateField("numberHome", e.target.value)
                      }
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
                <div className="mt-[35px] mb-[15px] border-b border-[#3a2a4a] pb-2 text-xl font-semibold text-white">
                  Удобства
                </div>
                <div className="mb-4 grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-2 max-[480px]:grid-cols-1 max-md:grid-cols-2">
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
                        className="h-[18px] min-h-[18px] w-[18px] min-w-[18px] shrink-0 cursor-pointer accent-[#b552c7]"
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
    </>
  );
}
