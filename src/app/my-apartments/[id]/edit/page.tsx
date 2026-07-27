"use client";

import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import { ClientHeader } from "@/app/_components/layout/ClientHeader";
import Image from "next/image";
import Link from "next/link";
import { AMENITIES, PARKING_TYPES, CURRENCIES } from "@/lib/constants";
import { useApartmentForm } from "./hooks/useApartmentForm";
import { useImageManager } from "./hooks/useImageManager";
import "./edit.css";

export default function EditApartmentPage() {
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : (params.id?.[0] ?? "");
  const { data: session } = useSession();

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

  if (!session) {
    return (
      <>
        <ClientHeader />
        <div className="edit-page">Пожалуйста, войдите в систему</div>
      </>
    );
  }

  if (isLoadingData) {
    return (
      <>
        <ClientHeader />
        <div className="edit-page">Загрузка...</div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <ClientHeader />
        <div className="edit-page">Ошибка: {error}</div>
      </>
    );
  }

  return (
    <>
      <ClientHeader />
      <div className="edit-page">
        <div className="edit-container">
          <h1 className="edit-title">Редактирование объекта</h1>

          <form onSubmit={handleSubmit} className="edit-form">
            {/* ФОТО */}
            <div
              className="edit-drop-zone"
              onDrop={handleDrop}
              onDragOver={(e) => e.preventDefault()}
            >
              <div className="edit-images-grid">
                {images.map((image, index) => {
                  const isMain = mainImage === image;
                  return (
                    <div
                      key={index}
                      className={`edit-image-item ${isMain ? "main" : ""}`}
                      draggable={!isMain}
                      onDragStart={() => !isMain && handleDragStart(index)}
                      onDragOver={(e) => !isMain && handleDragOver(e, index)}
                      onDragEnd={handleDragEnd}
                    >
                      <div className="edit-image-wrapper">
                        <Image
                          src={image}
                          alt={`Фото ${index + 1}`}
                          fill
                          className="edit-image-object"
                          unoptimized
                        />
                        {isMain && (
                          <div className="edit-main-bage">⭐ Заглавная</div>
                        )}
                      </div>
                      <div className="edit-image-actions">
                        <button
                          type="button"
                          className="edit-btn-main"
                          onClick={() => setMainImage(index)}
                          title={isMain ? "Заглавная" : "Сделать заглавной"}
                        >
                          ⭐
                        </button>
                        <button
                          type="button"
                          className="edit-btn-remove"
                          onClick={() => removeImage(index)}
                          title="Удалить"
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  );
                })}
                <div className="edit-image-add">
                  <button
                    type="button"
                    onClick={openFilePicker}
                    disabled={isUploading}
                  >
                    {isUploading ? "⏳" : "📸"}
                    <span>{isUploading ? "Загрузка..." : "Добавить фото"}</span>
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
            <section className="edit-section">
              <div className="edit-section-title">Информация</div>
              <div className="edit-row">
                <div className="edit-group">
                  <label>Заголовок*</label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => updateField("title", e.target.value)}
                    required
                  />
                </div>
                <div className="edit-group">
                  <label>Цена за сутки*</label>
                  <div className="price-group">
                    <input
                      type="number"
                      value={formData.price}
                      onChange={(e) =>
                        updateField("price", Number(e.target.value))
                      }
                      required
                      min="1"
                    />
                    <select
                      value={formData.currency}
                      onChange={(e) => updateField("currency", e.target.value)}
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
              <div className="edit-row">
                <div className="edit-group">
                  <label>Количество комнат*</label>
                  <input
                    type="number"
                    value={formData.rooms}
                    onChange={(e) =>
                      updateField("rooms", Number(e.target.value))
                    }
                    required
                    min="1"
                    max="20"
                  />
                </div>
                <div className="edit-group">
                  <label>Вместимость (человек)</label>
                  <input
                    type="number"
                    value={formData.capacity}
                    onChange={(e) =>
                      updateField("capacity", Number(e.target.value))
                    }
                    min="1"
                    max="30"
                  />
                </div>
              </div>
              <div className="edit-row">
                <div className="edit-group">
                  <label>Метро (мин пешком)</label>
                  <input
                    type="text"
                    value={formData.metro}
                    onChange={(e) => updateField("metro", e.target.value)}
                  />
                </div>
                <div className="edit-group">
                  <label>Описание</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => updateField("description", e.target.value)}
                    rows={4}
                  />
                </div>
              </div>
            </section>

            {/* АДРЕС */}
            <section className="edit-section">
              <div className="edit-section-title">Адрес</div>
              <div className="edit-row">
                <div className="edit-group">
                  <label>Город *</label>
                  <input
                    type="text"
                    value={formData.city}
                    onChange={(e) => updateField("city", e.target.value)}
                    required
                  />
                </div>
                <div className="edit-group">
                  <label>Район</label>
                  <input
                    type="text"
                    value={formData.district}
                    onChange={(e) => updateField("district", e.target.value)}
                  />
                </div>
              </div>
              <div className="edit-row">
                <div className="edit-group">
                  <label>Улица *</label>
                  <input
                    type="text"
                    value={formData.street}
                    onChange={(e) => updateField("street", e.target.value)}
                    required
                  />
                </div>
                <div className="edit-group">
                  <label>Номер дома *</label>
                  <input
                    type="text"
                    value={formData.numberHome}
                    onChange={(e) => updateField("numberHome", e.target.value)}
                    required
                  />
                </div>
              </div>
              <div className="edit-group">
                <label>Корпус</label>
                <input
                  type="text"
                  value={formData.building}
                  onChange={(e) => updateField("building", e.target.value)}
                />
              </div>
            </section>

            {/* УДОБСТВА */}
            <section className="edit-section">
              <div className="edit-section-title">Удобства</div>
              <div className="edit-checkboxes">
                {AMENITIES.map((amenity) => (
                  <label key={amenity.id} className="edit-checkbox">
                    <input
                      type="checkbox"
                      checked={formData.amenities.includes(amenity.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          updateField("amenities", [
                            ...formData.amenities,
                            amenity.id,
                          ]);
                        } else {
                          updateField(
                            "amenities",
                            formData.amenities.filter((a) => a !== amenity.id),
                          );
                        }
                      }}
                    />
                    {amenity.label}
                  </label>
                ))}
              </div>
              <div className="edit-group">
                <label>Парковка</label>
                <select
                  value={formData.parking}
                  onChange={(e) => updateField("parking", e.target.value)}
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
            <div className="edit-actions">
              <button
                type="submit"
                className="edit-btn-save"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Сохранение..." : "Сохранить"}
              </button>
              <Link href="/my-apartments" className="edit-btn-cancel">
                Отмена
              </Link>
            </div>
          </form>
        </div>
      </div>
    </>
  );
}
