import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';

import { AuthGuard } from '@/components/layout/AuthGuard';
import { ClientHeader } from '@/components/layout/ClientHeader';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useApartmentForm } from '@/hooks/useApartmentForm';
import { AMENITIES, CURRENCIES, PARKING_TYPES } from '@/lib/constants';
import { PAYERTYPE } from '@/lib/constants/info-company';
import { isAdminRole } from '@/lib/constants/roles';
import { EDIT_INPUT_CLASS, sanitizeStreet, toggleAmenity } from '@/lib/utils';
import { requireAuth } from '@/server/auth/require-auth';
import { api } from '@/trpc/react';

const TIME_OPTIONS = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`);

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

// Неавторизованных отправляем на вход ещё на сервере
export const getServerSideProps = requireAuth;

export default function EditApartmentPage() {
    const { query } = useRouter();
    const id = typeof query.id === 'string' ? query.id : (query.id?.[0] ?? '');

    const { formData, isSubmitting, isLoadingData, error, updateField, handleSubmit, apartmentData } =
        useApartmentForm(id);

    const { data: session } = useSession();
    // Адрес опубликованного объекта может менять только администратор.
    const isAdmin = isAdminRole(session?.user?.role);
    const isPublished = apartmentData?.apartment.status === 'active';
    const canEditAddress = !isPublished || isAdmin;

    const [isUploading, setIsUploading] = useState(false);
    const [dragIdx, setDragIdx] = useState<number | null>(null);
    const [streetSuggestions, setStreetSuggestions] = useState<string[]>([]);
    const [streetOpen, setStreetOpen] = useState(false);
    // Флаг «пользователь печатает улицу прямо сейчас».
    // Автодополнение не должно срабатывать при автоматической подгрузке адреса из БД.
    const streetUserTypedRef = useRef(false);

    const uploadImage = api.upload.image.useMutation();
    const utils = api.useUtils();

    const images = useMemo(() => formData.images ?? [], [formData.images]);
    const mainImage = useMemo(() => formData.image ?? '', [formData.image]);

    useEffect(() => {
        // Автодополнение срабатывает только когда поле активно И пользователь
        // сам печатает улицу (не при загрузке адреса из БД).
        if (!canEditAddress || !streetUserTypedRef.current) {
            setStreetSuggestions([]);
            setStreetOpen(false);
            return;
        }
        const query = formData.street.trim();
        if (query.length < 1) {
            setStreetSuggestions([]);
            setStreetOpen(false);
            return;
        }
        const timer = setTimeout(() => {
            void (async () => {
                try {
                    const results = await utils.geo.searchStreets.fetch({
                        query,
                        location: formData.city,
                    });
                    setStreetSuggestions(results);
                    setStreetOpen(results.length > 0);
                } catch {
                    setStreetSuggestions([]);
                    setStreetOpen(false);
                }
            })();
        }, 400);
        return () => clearTimeout(timer);
    }, [formData.street, formData.city, utils, canEditAddress]);

    const addImages = useCallback(
        async (files: FileList | null) => {
            if (!files || files.length === 0) {
                return;
            }
            setIsUploading(true);
            try {
                const dataUrls = await readFilesAsDataURL(files);
                const urls: string[] = [];
                for (const dataUrl of dataUrls) {
                    const res = await uploadImage.mutateAsync({ dataUrl });
                    urls.push(res.url);
                }
                const merged = [...images, ...urls];
                updateField('images', merged);
                if (!mainImage) {
                    updateField('image', urls[0] ?? '');
                }
            } catch {
                alert('Ошибка загрузки');
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
            updateField('images', next);
            if (mainImage === deleted) {
                updateField('image', next[0] ?? '');
            }
        },
        [images, mainImage, updateField],
    );

    const setMainImage = useCallback(
        (index: number) => {
            if (index === 0) {
                return;
            }
            const img = images[index];
            if (!img) {
                return;
            }
            const next = [img, ...images.filter((_, i) => i !== index)];
            updateField('images', next);
            updateField('image', img);
        },
        [images, updateField],
    );

    const handleDragStart = useCallback((index: number) => setDragIdx(index), []);
    const handleDragEnd = useCallback(() => setDragIdx(null), []);

    const handleDragOver = useCallback(
        (e: React.DragEvent, toIdx: number) => {
            e.preventDefault();
            if (dragIdx === null || dragIdx === toIdx) {
                return;
            }
            const next = [...images];
            const [item] = next.splice(dragIdx, 1);
            if (!item) {
                return;
            }
            next.splice(toIdx, 0, item);
            updateField('images', next);
            if (next[0] && next[0] !== mainImage) {
                updateField('image', next[0]);
            }
            setDragIdx(toIdx);
        },
        [images, dragIdx, updateField, mainImage],
    );

    const handleFileChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => addImages(e.target.files),
        [addImages],
    );

    if (isLoadingData) {
        return (
            <AuthGuard>
                <LoadingSpinner label="Загрузка..." />
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
            <AuthGuard>
                <ClientHeader />
                <div className="mx-auto max-w-[900px] px-5 py-10 max-[480px]:px-2.5 max-[480px]:py-5">
                    <div className="rounded-2xl bg-card p-10 shadow-[0_2px_8px_rgba(0,0,0,0.08)] max-[480px]:p-4 max-md:p-5">
                        <h1 className="mb-[30px] text-[28px] font-bold text-foreground max-md:text-[22px]">
                            Редактирование объекта
                        </h1>

                        <form
                            onSubmit={handleSubmit}
                            className="edit-form"
                        >
                            {/* ФОТО */}
                            <div className="edit-drop-zone">
                                <div className="grid grid-cols-4 gap-3 max-[480px]:grid-cols-2 max-lg:grid-cols-3 max-md:grid-cols-3">
                                    {images.map((src, index) => {
                                        const isMain = mainImage === src;
                                        return (
                                            <div
                                                key={index}
                                                className={`relative aspect-square cursor-grab overflow-hidden rounded-lg border-2 border-border bg-background transition-colors duration-200 hover:border-primary ${
                                                    isMain ? 'border-warning' : ''
                                                }`}
                                                draggable={!isMain}
                                                onDragStart={() => !isMain && handleDragStart(index)}
                                                onDragOver={(e) => handleDragOver(e, index)}
                                                onDragEnd={handleDragEnd}
                                            >
                                                <div className="relative h-full w-full">
                                                    <Image
                                                        src={src}
                                                        alt={`Фото ${index + 1}`}
                                                        fill
                                                        className="object-cover"
                                                    />
                                                    {isMain && (
                                                        <div className="absolute top-1 left-1 z-[5] rounded bg-warning px-2 py-0.5 text-[10px] font-semibold text-warning-foreground max-[480px]:px-1.5 max-[480px]:py-0.5 max-[480px]:text-[8px]">
                                                            ⭐ Заглавная
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="absolute top-1 right-1 z-10 flex flex-col gap-1">
                                                    <button
                                                        type="button"
                                                        className={`flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border-none p-0 text-[13px] leading-none transition-all duration-200 hover:scale-110 max-[480px]:h-[22px] max-[480px]:w-[22px] max-[480px]:text-[10px] ${
                                                            isMain
                                                                ? 'bg-warning/20 text-warning shadow-[0_0_12px_color-mix(in_oklab,var(--warning)_30%,transparent)] hover:bg-warning/30'
                                                                : 'bg-black/60 text-white/30 hover:bg-black/80 hover:text-white/80'
                                                        }`}
                                                        onClick={() => setMainImage(index)}
                                                        title={isMain ? 'Заглавная' : 'Сделать заглавной'}
                                                    >
                                                        ⭐
                                                    </button>
                                                    <button
                                                        type="button"
                                                        className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border-none bg-black/60 p-0 text-[13px] leading-none text-white/50 transition-all duration-200 hover:scale-110 hover:bg-destructive/90 hover:text-destructive-foreground max-[480px]:h-[22px] max-[480px]:w-[22px] max-[480px]:text-[10px]"
                                                        onClick={() => removeImage(index)}
                                                        title="Удалить"
                                                    >
                                                        ✕
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    <label className="flex aspect-square cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-border bg-background transition-all duration-200 hover:border-primary hover:bg-primary/5">
                                        <span className="flex cursor-pointer flex-col items-center gap-1 border-none bg-transparent text-[13px] text-muted-foreground">
                                            {isUploading ? '⏳' : '📸'}
                                            <span className="text-[28px]">{isUploading ? 'Загрузка...' : '+'}</span>
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
                            <section className="mb-10 text-muted-foreground">
                                <div className="mt-[35px] mb-[15px] border-b border-border pb-2 text-xl font-semibold text-foreground">
                                    🏠 Информация
                                </div>

                                {/* Подраздел: Название и цена */}
                                <div className="mt-[30px] mb-7 border-b border-border pb-2 text-lg font-semibold text-primary">
                                    💰 Название и цена
                                </div>
                                <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
                                    <div className="mb-4 flex flex-col gap-1.5">
                                        <label className="text-sm font-medium text-foreground">Заголовок*</label>
                                        <input
                                            type="text"
                                            value={formData.title}
                                            onChange={(e) => updateField('title', e.target.value)}
                                            required
                                            className={EDIT_INPUT_CLASS}
                                        />
                                    </div>
                                    <div className="mb-4 flex flex-col gap-1.5">
                                        <label className="text-sm font-medium text-foreground">Цена за сутки*</label>
                                        <div className="flex items-center gap-2">
                                            <input
                                                type="number"
                                                value={formData.price}
                                                onChange={(e) => updateField('price', Number(e.target.value))}
                                                required
                                                min="1"
                                                className={`${EDIT_INPUT_CLASS} flex-1`}
                                            />
                                            <select
                                                value={formData.currency}
                                                onChange={(e) => updateField('currency', e.target.value)}
                                                className="h-[42px] cursor-pointer rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none"
                                            >
                                                {CURRENCIES.map((c) => (
                                                    <option
                                                        key={c.value}
                                                        value={c.value}
                                                    >
                                                        {c.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* Подраздел: Вместимость */}
                                <div className="mt-[30px] mb-7 border-b border-border pb-2 text-lg font-semibold text-primary">
                                    🛋️ Вместимость
                                </div>
                                <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
                                    <div className="mb-4 flex flex-col gap-1.5">
                                        <label className="text-sm font-medium text-foreground">
                                            Количество комнат*
                                        </label>
                                        <input
                                            type="number"
                                            value={formData.rooms}
                                            onChange={(e) => updateField('rooms', Number(e.target.value))}
                                            required
                                            min="1"
                                            max="20"
                                            className={EDIT_INPUT_CLASS}
                                        />
                                    </div>
                                    <div className="mb-4 flex flex-col gap-1.5">
                                        <label className="text-sm font-medium text-foreground">
                                            Вместимость (человек)
                                        </label>
                                        <input
                                            type="number"
                                            value={formData.capacity}
                                            onChange={(e) => updateField('capacity', Number(e.target.value))}
                                            min="1"
                                            max="30"
                                            className={EDIT_INPUT_CLASS}
                                        />
                                    </div>
                                </div>

                                {/* Подраздел: Места для сна (2 сверху, 2 снизу) */}
                                <div className="mt-[30px] mb-7 border-b border-border pb-2 text-lg font-semibold text-primary">
                                    🛏️ Места для сна
                                </div>
                                <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
                                    <div className="mb-4 flex flex-col gap-1.5">
                                        <label className="text-sm font-medium text-foreground">
                                            Двуспальные кровати
                                        </label>
                                        <input
                                            type="number"
                                            value={formData.beds}
                                            onChange={(e) => updateField('beds', Number(e.target.value))}
                                            min="0"
                                            max="20"
                                            className={EDIT_INPUT_CLASS}
                                        />
                                    </div>
                                    <div className="mb-4 flex flex-col gap-1.5">
                                        <label className="text-sm font-medium text-foreground">
                                            Односпальные кровати
                                        </label>
                                        <input
                                            type="number"
                                            value={formData.singleBeds}
                                            onChange={(e) => updateField('singleBeds', Number(e.target.value))}
                                            min="0"
                                            max="20"
                                            className={EDIT_INPUT_CLASS}
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
                                    <div className="mb-4 flex flex-col gap-1.5">
                                        <label className="text-sm font-medium text-foreground">
                                            Двуспальные диваны
                                        </label>
                                        <input
                                            type="number"
                                            value={formData.doubleSofas}
                                            onChange={(e) => updateField('doubleSofas', Number(e.target.value))}
                                            min="0"
                                            max="20"
                                            className={EDIT_INPUT_CLASS}
                                        />
                                    </div>
                                    <div className="mb-4 flex flex-col gap-1.5">
                                        <label className="text-sm font-medium text-foreground">
                                            Односпальные диваны
                                        </label>
                                        <input
                                            type="number"
                                            value={formData.singleSofas}
                                            onChange={(e) => updateField('singleSofas', Number(e.target.value))}
                                            min="0"
                                            max="20"
                                            className={EDIT_INPUT_CLASS}
                                        />
                                    </div>
                                </div>

                                {/* Подраздел: Время заезда и выезда */}
                                <div className="mt-[30px] mb-7 border-b border-border pb-2 text-lg font-semibold text-primary">
                                    🕒 Время заезда и выезда
                                </div>
                                <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
                                    <div className="mb-4 flex flex-col gap-1.5">
                                        <label className="text-sm font-medium text-foreground">Заселение</label>
                                        <select
                                            value={formData.checkInTime}
                                            onChange={(e) => updateField('checkInTime', e.target.value)}
                                            className="h-[42px] cursor-pointer rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none"
                                        >
                                            {TIME_OPTIONS.map((t) => (
                                                <option
                                                    key={t}
                                                    value={t}
                                                >
                                                    {t}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="mb-4 flex flex-col gap-1.5">
                                        <label className="text-sm font-medium text-foreground">Выезд</label>
                                        <select
                                            value={formData.checkOutTime}
                                            onChange={(e) => updateField('checkOutTime', e.target.value)}
                                            className="h-[42px] cursor-pointer rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none"
                                        >
                                            {TIME_OPTIONS.map((t) => (
                                                <option
                                                    key={t}
                                                    value={t}
                                                >
                                                    {t}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Подраздел: Расположение, описание, правила */}
                                <div className="mt-[30px] mb-7 border-b border-border pb-2 text-lg font-semibold text-primary">
                                    📍 Расположение и описание
                                </div>
                                <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
                                    <div className="mb-4 flex flex-col gap-1.5">
                                        <label className="text-sm font-medium text-foreground">
                                            Метро (мин пешком)
                                        </label>
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            value={formData.metro}
                                            onChange={(e) => updateField('metro', e.target.value.replace(/\D/g, ''))}
                                            className={EDIT_INPUT_CLASS}
                                        />
                                    </div>
                                    <div className="mb-4 flex flex-col gap-1.5">
                                        <label className="text-sm font-medium text-foreground">Описание</label>
                                        <textarea
                                            value={formData.description}
                                            onChange={(e) => updateField('description', e.target.value)}
                                            rows={4}
                                            className={`${EDIT_INPUT_CLASS} min-h-[100px] resize-y`}
                                        />
                                    </div>
                                    <div className="mb-4 flex flex-col gap-1.5">
                                        <label className="text-sm font-medium text-foreground">
                                            Правила проживания{' '}
                                            <span className="text-muted-foreground">(необязательно)</span>
                                        </label>
                                        <textarea
                                            value={formData.rules}
                                            onChange={(e) => updateField('rules', e.target.value)}
                                            rows={4}
                                            className={`${EDIT_INPUT_CLASS} min-h-[100px] resize-y`}
                                            placeholder="Например: без вечеринок, без животных, заезд после 14:00..."
                                        />
                                    </div>
                                </div>

                                {/* Площадь / этаж / санузлы */}
                                <div className="grid grid-cols-3 gap-4 max-md:grid-cols-1">
                                    <div className="mb-4 flex flex-col gap-1.5">
                                        <label className="text-sm font-medium text-foreground">Площадь, м²</label>
                                        <input
                                            type="number"
                                            min={0}
                                            value={formData.area || ''}
                                            onChange={(e) => updateField('area', Number(e.target.value))}
                                            className={EDIT_INPUT_CLASS}
                                        />
                                    </div>
                                    <div className="mb-4 flex flex-col gap-1.5">
                                        <label className="text-sm font-medium text-foreground">Этаж</label>
                                        <input
                                            type="number"
                                            value={formData.floor || ''}
                                            onChange={(e) => updateField('floor', Number(e.target.value))}
                                            className={EDIT_INPUT_CLASS}
                                        />
                                    </div>
                                    <div className="mb-4 flex flex-col gap-1.5">
                                        <label className="text-sm font-medium text-foreground">Санузлы</label>
                                        <input
                                            type="number"
                                            min={0}
                                            value={formData.bathrooms || ''}
                                            onChange={(e) => updateField('bathrooms', Number(e.target.value))}
                                            className={EDIT_INPUT_CLASS}
                                        />
                                    </div>
                                </div>
                            </section>

                            {/* АДРЕС */}
                            <section className="mb-10 text-muted-foreground">
                                <div className="mt-[35px] mb-[15px] border-b border-border pb-2 text-xl font-semibold text-foreground">
                                    Адрес
                                </div>
                                {!canEditAddress && (
                                    <p className="mb-4 rounded-lg border border-border bg-background px-4 py-3 text-sm text-muted-foreground">
                                        Адрес опубликованного объекта может изменить только администратор.
                                    </p>
                                )}
                                <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
                                    <div className="mb-4 flex flex-col gap-1.5">
                                        <label className="text-sm font-medium text-foreground">Город *</label>
                                        <input
                                            type="text"
                                            value={formData.city}
                                            onChange={(e) => updateField('city', e.target.value)}
                                            required
                                            disabled={!canEditAddress}
                                            className={`${EDIT_INPUT_CLASS} disabled:cursor-not-allowed disabled:opacity-50`}
                                        />
                                    </div>
                                    <div className="mb-4 flex flex-col gap-1.5">
                                        <label className="text-sm font-medium text-foreground">Район</label>
                                        <input
                                            type="text"
                                            value={formData.district}
                                            onChange={(e) => updateField('district', e.target.value)}
                                            disabled={!canEditAddress}
                                            className={`${EDIT_INPUT_CLASS} disabled:cursor-not-allowed disabled:opacity-50`}
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
                                    <div className="relative mb-4 flex flex-col gap-1.5">
                                        <label className="text-sm font-medium text-foreground">Улица *</label>
                                        <input
                                            type="text"
                                            value={formData.street}
                                            onChange={(e) => {
                                                streetUserTypedRef.current = true;
                                                updateField('street', sanitizeStreet(e.target.value));
                                            }}
                                            onBlur={() => setStreetOpen(false)}
                                            placeholder="Начните вводить название улицы"
                                            autoComplete="off"
                                            required
                                            disabled={!canEditAddress}
                                            className={`${EDIT_INPUT_CLASS} disabled:cursor-not-allowed disabled:opacity-50`}
                                        />
                                        {streetOpen && streetSuggestions.length > 0 && (
                                            <ul className="absolute top-full right-0 left-0 z-50 mt-1 max-h-[240px] overflow-y-auto rounded-xl border-2 border-border bg-card shadow-[0_8px_30px_rgba(0,0,0,0.25)]">
                                                {streetSuggestions.map((s) => (
                                                    <li key={s}>
                                                        <button
                                                            type="button"
                                                            onMouseDown={(e) => {
                                                                e.preventDefault();
                                                                streetUserTypedRef.current = false;
                                                                updateField('street', s);
                                                                setStreetOpen(false);
                                                            }}
                                                            className="block w-full cursor-pointer px-4 py-3 text-left text-sm text-foreground transition-colors hover:bg-primary/20"
                                                        >
                                                            {s}
                                                        </button>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                    <div className="mb-4 flex flex-col gap-1.5">
                                        <label className="text-sm font-medium text-foreground">Номер дома *</label>
                                        <input
                                            type="text"
                                            value={formData.numberHome}
                                            onChange={(e) => updateField('numberHome', e.target.value)}
                                            required
                                            disabled={!canEditAddress}
                                            className={`${EDIT_INPUT_CLASS} disabled:cursor-not-allowed disabled:opacity-50`}
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
                                    <div className="mb-4 flex flex-col gap-1.5">
                                        <label className="text-sm font-medium text-foreground">Корпус</label>
                                        <input
                                            type="text"
                                            value={formData.building}
                                            onChange={(e) => updateField('building', e.target.value)}
                                            disabled={!canEditAddress}
                                            className={`${EDIT_INPUT_CLASS} disabled:cursor-not-allowed disabled:opacity-50`}
                                        />
                                    </div>
                                    <div className="mb-4 flex flex-col gap-1.5">
                                        <label className="text-sm font-medium text-foreground">
                                            Микрорайон <span className="text-muted-foreground">(необязательно)</span>
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.microdistrict}
                                            onChange={(e) => updateField('microdistrict', e.target.value)}
                                            disabled={!canEditAddress}
                                            placeholder="Например: Уручье, Новая Боровая"
                                            className={`${EDIT_INPUT_CLASS} disabled:cursor-not-allowed disabled:opacity-50`}
                                        />
                                    </div>
                                </div>
                            </section>
                            {/*ЮРИДИЧЕСКАЯ ИНФОРМАЦИЯ/РЕКВИЗИТЫ ПЛАТЕЛЬЩИКА*/}
                            <section className="mb-10 text-muted-foreground">
                                <div className="mt-[35px] mb-[15px] border-b border-border pb-2 text-xl font-semibold text-foreground">
                                    Реквизиты плательщика
                                </div>
                                <div className="flex flex-col gap-4">
                                    <label className="text-medium text-sm text-foreground">Плательщик</label>
                                    <select
                                        value={formData.payerType}
                                        onChange={(e) => updateField('payerType', e.target.value)}
                                        className={EDIT_INPUT_CLASS}
                                    >
                                        {PAYERTYPE.map((i) => (
                                            <option
                                                key={i.value}
                                                value={i.value}
                                            >
                                                {i.label}
                                            </option>
                                        ))}
                                    </select>
                                    <label className="text-medium text-sm text-foreground">
                                        Учетный номер плательщика
                                    </label>

                                    <input
                                        type="text"
                                        value={formData.unp ?? ''}
                                        onChange={(e) =>
                                            updateField('unp', e.target.value.replace(/\D/g, '').slice(0, 9))
                                        }
                                        placeholder="Введите УНП"
                                        className={`${EDIT_INPUT_CLASS} w-full max-w-[300px]`}
                                        maxLength={9}
                                    />
                                    <label className="text-medium text-sm text-foreground">
                                        Наименование организации
                                    </label>
                                    <input
                                        type="text"
                                        value={formData.payerName ?? ''}
                                        onChange={(e) => updateField('payerName', e.target.value)}
                                        placeholder="Название вашей организации"
                                        className={EDIT_INPUT_CLASS}
                                    />
                                </div>
                            </section>

                            {/* УДОБСТВА */}
                            <section className="mb-10 text-muted-foreground">
                                <div className="mt-[35px] mb-[15px] border-b border-border pb-2 text-xl font-semibold text-foreground">
                                    Удобства
                                </div>
                                <div className="mb-4 grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-2 max-[480px]:grid-cols-1 max-md:grid-cols-2">
                                    {AMENITIES.map((amenity) => (
                                        <label
                                            key={amenity.id}
                                            className="flex cursor-pointer items-center gap-2 text-xs text-foreground"
                                        >
                                            <input
                                                type="checkbox"
                                                checked={formData.amenities.includes(amenity.id)}
                                                onChange={(e) =>
                                                    updateField(
                                                        'amenities',
                                                        toggleAmenity(formData.amenities, amenity.id, e.target.checked),
                                                    )
                                                }
                                                className="h-[18px] min-h-[18px] w-[18px] min-w-[18px] shrink-0 cursor-pointer accent-primary"
                                            />
                                            {amenity.label}
                                        </label>
                                    ))}
                                </div>
                                <div className="mb-4 flex flex-col gap-1.5">
                                    <label className="text-sm font-medium text-foreground">Парковка</label>
                                    <select
                                        value={formData.parking}
                                        onChange={(e) => updateField('parking', e.target.value)}
                                        className={EDIT_INPUT_CLASS}
                                    >
                                        {PARKING_TYPES.map((p) => (
                                            <option
                                                key={p.id}
                                                value={p.id}
                                            >
                                                {p.label}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </section>

                            {/* КНОПКИ */}
                            <div className="mt-[30px] flex gap-4 border-t border-border pt-5 max-md:flex-col">
                                <button
                                    type="submit"
                                    className="cursor-pointer rounded-[30px] bg-primary px-8 py-3 text-base font-semibold text-primary-foreground transition-colors duration-200 hover:bg-primary/90 max-md:w-full max-md:text-center"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting ? 'Сохранение...' : 'Сохранить'}
                                </button>
                                <Link
                                    href="/my-apartments"
                                    className="cursor-pointer rounded-[30px] bg-muted px-8 py-3 text-center text-base font-semibold text-foreground no-underline transition-colors duration-200 hover:bg-border max-md:w-full"
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
