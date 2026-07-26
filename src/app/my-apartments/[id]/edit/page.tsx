"use client";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { api } from "@/trpc/react";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ClientHeader } from "@/app/_components/layout/ClientHeader";
import "./edit.css";

type FormData = {
  title: string;
  city: string;
  street: string;
  numberHome: string;
  building: string;
  district: string;
  capacity: number;
  price: number;
  currency: string;
  rooms: number;
  description: string;
  metro: string;
  amenities: string[];
  parking: string;
  image: string;
  images: string[];
};
export default function EditApartmentPage() {
  // Получаем ID из URL: /my-apartments/5/edit → id = 5
  const params = useParams();
  const id = typeof params.id === "string" ? params.id : (params.id?.[0] ?? "");
  // Для перенаправления после сохранения
  const router = useRouter();
  // Проверяем авторизацию
  const { data: session } = useSession();
  // !!!!! ИСПРАВЛЕНО: безопасное получение id !!!!!

  // ----- 3.2. ЗАПРОС НА СЕРВЕР -----
  // Получаем данные объекта по ID
  // useQuery автоматически: кеширует, перезапрашивает при изменении, показывает статус загрузки
  const {
    data: apartmentData,
    isLoading,
    error,
  } = api.apartment.getById.useQuery({
    id: Number(id), // Превращаем строку "5" в число 5
  });
  // ----- 3.3. СОСТОЯНИЕ ФОРМЫ -----
  // все данные формы
  const [formData, setFormData] = useState<FormData>({
    title: "",
    city: "",
    street: "",
    numberHome: "",
    building: "",
    district: "",
    capacity: 2,
    price: 0,
    currency: "BYN",
    rooms: 1,
    description: "",
    metro: "",
    amenities: [],
    parking: "",
    image: "",
    images: [],
  });
  // Флаг: идет загрузка фото
  const [isUploading, setIsUploading] = useState(false);
  // Для drag&drop: запоминаем индекс перетаскиваемого фото
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ----- 3.5. ЗАГРУЗКА ДАННЫХ В ФОРМУ -----

  useEffect(() => {
    if (apartmentData) {
      const apt = apartmentData.apartment;
      setFormData({
        title: apt.title || "",
        city: apt.city || "",
        street: apt.street || "",
        numberHome: apt.numberHome || "",
        building: apt.building ?? "",
        district: apt.district ?? "",
        capacity: apt.capacity || 2,
        price: apt.price || 0,
        currency: apt.currency || "BYN",
        rooms: apt.rooms || 1,
        description: apt.description ?? "",
        metro: apt.metro ?? "",
        amenities: apt.amenities ?? [],
        parking: apt.parking ?? "",
        image: apt.image || "",
        images: apt.images ?? [],
      });
    }
  }, [apartmentData]);
  // ----- 3.6. MUTATION (ОБНОВЛЕНИЕ) -----
  const updateApartment = api.apartment.update.useMutation({
    onSuccess: () => {
      router.push(`/apartments/${id}`);
    },
    onError: (err) => {
      alert("Ошибка: " + err.message);
    },
  });

  // ----- 3.7. ФУНКЦИЯ ОБНОВЛЕНИЯ ПОЛЯ -----

  const updateField = (
    field: keyof FormData,
    value: string | number | string[],
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // ----- 3.8. ФУНКЦИИ ДЛЯ ФОТО -----
  // ============================================================
  // 3.8. ДОБАВЛЕНИЕ ФОТО
  // ============================================================

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

    // !!!!! ДОБАВЛЕН .catch ДЛЯ ОБРАБОТКИ ОШИБОК !!!!!
    Promise.all(readers)
      .then((results) => {
        const currentImages = formData.images ?? [];
        const updatedImages = [...currentImages, ...results];
        updateField("images", updatedImages);

        // !!!!!  безопасная проверка на undefined !!!!!
        if (!formData.image && updatedImages.length > 0) {
          const firstImage = updatedImages[0];
          if (firstImage) {
            updateField("image", firstImage);
          }
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
  //удаление фото
  const handleRemoveImage = (index: number) => {
    const currentImages = formData.images ?? [];
    const updatedImages = currentImages.filter((_, i) => i !== index);
    updateField("images", updatedImages);
    if (formData.image === currentImages[index]) {
      updateField("image", updatedImages[0] ?? "");
    }
  };

  const handleSetMain = (index: number) => {
    const currentImages = formData.images ?? [];
    if (currentImages.length === 0 || index === 0) return;

    const image = currentImages[index];
    if (!image) return;

    const newImages = [image, ...currentImages.filter((_, i) => i !== index)];
    const filteredImages = newImages.filter(
      (img): img is string => img !== undefined,
    );
    updateField("images", filteredImages);
    updateField("image", image);
  };
  // ===== DRAG & DROP =====
  const handleDragStart = (index: number) => {
    setDragIndex(index);
  };
  const handleDragEnd = () => {
    setDragIndex(null);
  };
  const handleDragOver = (
    e: React.DragEvent<HTMLDivElement>,
    index: number,
  ) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) return;
    const currentImages = formData.images ?? [];
    const newImages = [...currentImages];
    const [draggedItem] = newImages.splice(dragIndex, 1);
    if (draggedItem === undefined) return;
    newImages.splice(index, 0, draggedItem);
    updateField("images", newImages);
    setDragIndex(index);
  };
  // ===== ОТКРЫТЬ ПРОВОДНИК =====
  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  // ----- 3.9. ОТПРАВКА ФОРМЫ -----
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    updateApartment.mutate({
      id: Number(id),
      ...formData,
      price: Number(formData.price),
      capacity: Number(formData.capacity),
      rooms: Number(formData.rooms),
    });
  };
  // ----- 3.10. УСЛОВНЫЙ РЕНДЕРИНГ -----
  if (!session) {
    return (
      <>
        <ClientHeader />
        <div className="edit-page">Пожалуйста, войдите в систему</div>
      </>
    );
  }

  if (isLoading) {
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
        <div className="edit-page">Ошибка: {error.message}</div>
      </>
    );
  }

  // ============================================================
  // 3.11. РЕНДЕР СТРАНИЦЫ
  // ============================================================

  return (
    <>
      <ClientHeader />
      <div className="edit-page">
        <div className="edit-container">
          <p className="edit-title"> Редактирование объекта</p>
          <form onSubmit={handleSubmit} className="edit-form">
            {/* ====
 БЛОК 1: ФОТОГРАФИИ
==== */}
            <div className="edit-images-grid">
              {formData.images.map((image, index) => {
                const isMain = formData.image === image;
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

                    {/* ===== КНОПКИ ===== */}
                    <div className="edit-image-actions">
                      {/* !!!!! ЗВЕЗДА ПОКАЗЫВАЕТСЯ ВСЕГДА !!!!! */}
                      <button
                        type="button"
                        className="edit-btn-main"
                        onClick={() => handleSetMain(index)}
                        title={isMain ? "Заглавная" : "Сделать заглавной"}
                      >
                        ⭐
                      </button>

                      <button
                        type="button"
                        className="edit-btn-remove"
                        onClick={() => handleRemoveImage(index)}
                        title="Удалить"
                      >
                        ✕
                      </button>
                    </div>
                  </div>
                );
              })}

              {/* Кнопка добавления фото */}
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
                  onChange={handleAddImages}
                  style={{ display: "none" }}
                />
              </div>
            </div>
            {/* ===== БЛОК 2: ИНФОРМАЦИЯ ===== */}
            <section className="edit-section">
              <div>Информация</div>
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
                  <div>
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
                      <option value="BYN">BYN</option>
                      <option value="USD">USD</option>
                      <option value="EUR">EUR</option>
                      <option value="RUB">RUB</option>
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
            {/* ===== БЛОК 3: АДРЕС ===== */}
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
            {/* ===== БЛОК 4: УДОБСТВА И ПАРКОВКА ===== */}
            <section className="edit-section">
              <div className="edit-section-title">Удобства</div>

              <div className="edit-checkboxes">
                {[
                  { id: "wifi", label: "Wi-Fi" },
                  { id: "tv", label: "Телевизор" },
                  { id: "cable", label: "Кабельное ТВ" },
                  { id: "airConditioning", label: "Кондиционер" },
                  { id: "heating", label: "Отопление" },
                  { id: "washingMachine", label: "Стиральная машина" },
                  { id: "dishwasher", label: "Посудомоечная машина" },
                  { id: "fridge", label: "Холодильник" },
                  { id: "microwave", label: "Микроволновая печь" },
                  { id: "oven", label: "Духовка" },
                  { id: "stove", label: "Плита" },
                  { id: "coffeeMachine", label: "Кофемашина" },
                  { id: "kettle", label: "Чайник" },
                  { id: "hairDryer", label: "Фен" },
                  { id: "iron", label: "Утюг" },
                  { id: "ironingBoard", label: "Гладильная доска" },
                  { id: "gameConsole", label: "Игровая консоль" },
                  { id: "babyBed", label: "Детская кроватка" },
                ].map((amenity) => (
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
                  <option value="">Нет</option>
                  <option value="free">Бесплатная</option>
                  <option value="paid">Платная</option>
                  <option value="underground">Подземная</option>
                  <option value="guarded">Охраняемая</option>
                </select>
              </div>
            </section>
            {/* ===== БЛОК 5: КНОПКИ ===== */}
            <div className="edit-actions">
              <button
                type="submit"
                className="edit-btn-save"
                onClick={() => router.push("/my-apartments")}
              >
                Сохранить
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
