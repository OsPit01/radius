import { useCallback, useMemo, useState } from 'react';

import Link from 'next/link';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';

import { AddressSearch, type AddressSuggestion } from '@/components/address/AddressSearch';
import { SortableImageGrid } from '@/components/apartments/SortableImageGrid';
import { Bed, Camera, Clock, Home, Hourglass, MapPin, Money, Sofa } from '@/components/icons';
import { AuthGuard } from '@/components/layout/AuthGuard';
import { ClientHeader } from '@/components/layout/ClientHeader';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useApartmentForm } from '@/hooks/useApartmentForm';
import { formatAddressLine } from '@/lib/address';
import { AMENITIES, PARKING_TYPES } from '@/lib/constants';
import { getUnpRule, PAYER_TYPE_OPTIONS } from '@/lib/constants/payer';
import { isAdminRole } from '@/lib/constants/roles';
import { TIME_OPTIONS } from '@/lib/constants/time';
import { findNearestMetro, isMetroRegion } from '@/lib/metro';
import { EDIT_INPUT_CLASS, sanitizeStreet, toggleAmenity } from '@/lib/utils';
import { requireAuth } from '@/server/auth/require-auth';
// Общие компоненты полей: все стили и стрелки ↑↓ для чисел встроены внутрь —
// EDIT_INPUT_CLASS полям больше не нужен (остался только у двух <select> ниже)
import { Input } from '@/shared/ui/input';
import { Textarea } from '@/shared/ui/textarea';
import { api } from '@/trpc/react';

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

// Форматы, которые умеет обрабатывать sharp на сервере. HEIC (iPhone) сюда НЕ входит —
// его браузер не может прочитать как обычное изображение, поэтому проверяем до загрузки.
const SUPPORTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/tiff', 'image/avif'];

// Неавторизованных отправляем на вход ещё на сервере
export const getServerSideProps = requireAuth;

export default function EditApartmentPage() {
    const { query } = useRouter();
    const id = typeof query.id === 'string' ? query.id : (query.id?.[0] ?? '');
    const { formData, isSubmitting, isLoadingData, error, validationError, updateField, setFormData, handleSubmit } =
        useApartmentForm(id);

    const { data: session } = useSession();
    // Адрес объекта может менять только администратор и выше.
    const isAdmin = isAdminRole(session?.user?.role);
    const canEditAddress = isAdmin;
    const handleAddressResolved = (address: AddressSuggestion) => {
        const nearestMetro = isMetroRegion(address.region) ? findNearestMetro(address.lat, address.lon) : null;

        setFormData((prev) => ({
            ...prev,
            city: address.city,
            street: address.street,
            numberHome: address.house,
            building: '',
            district: address.district,
            region: address.region,
            lat: address.lat,
            lon: address.lon,
            metroStation: nearestMetro?.station?.id ?? '',
            minsToMetro: nearestMetro?.walkMinutes ?? 0,
        }));
    };

    const [isUploading, setIsUploading] = useState(false);

    const uploadImage = api.upload.image.useMutation();

    // Заглавное фото — images[0]: перетащили фото на первое место — оно и стало обложкой
    const images = useMemo(() => formData.images ?? [], [formData.images]);

    const addImages = useCallback(
        async (files: FileList | null) => {
            if (!files || files.length === 0) {
                return;
            }

            const fileList = Array.from(files);
            const unsupported = fileList.find((f) => !SUPPORTED_IMAGE_TYPES.includes(f.type));
            if (unsupported) {
                alert(`Формат файла «${unsupported.name}» не поддерживается. Загрузите JPEG, PNG или WebP.`);
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
                updateField('images', [...images, ...urls]);
            } catch (error) {
                alert(error instanceof Error ? error.message : 'Ошибка загрузки');
            } finally {
                setIsUploading(false);
            }
        },
        [images, updateField, uploadImage],
    );

    const removeImage = useCallback(
        (index: number) => {
            updateField(
                'images',
                images.filter((_, i) => i !== index),
            );
        },
        [images, updateField],
    );

    const reorderImages = useCallback(
        (from: number, to: number) => {
            const next = [...images];
            const [moved] = next.splice(from, 1);
            if (!moved) {
                return;
            }
            next.splice(to, 0, moved);
            updateField('images', next);
        },
        [images, updateField],
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
                                <SortableImageGrid
                                    images={images}
                                    onReorder={reorderImages}
                                    onRemove={removeImage}
                                >
                                    <label className="flex aspect-square cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-border bg-background hover:border-primary">
                                        <span className="flex cursor-pointer flex-col items-center gap-1 text-[13px] text-muted-foreground">
                                            {isUploading ? (
                                                <Hourglass className="h-8 w-8" />
                                            ) : (
                                                <Camera className="h-8 w-8" />
                                            )}
                                        </span>
                                        <input
                                            type="file"
                                            accept="image/*"
                                            multiple
                                            onChange={handleFileChange}
                                            className="hidden"
                                        />
                                    </label>
                                </SortableImageGrid>
                            </div>
                            {validationError && (
                                <p className="mt-2 text-sm font-medium text-destructive">{validationError}</p>
                            )}
                            {/* ИНФОРМАЦИЯ */}
                            <section className="mb-10 text-muted-foreground">
                                <div className="mt-[35px] mb-[15px] flex items-center gap-2 border-b border-border pb-2 text-xl font-semibold text-foreground">
                                    <Home className="h-6 w-6" />
                                    Информация
                                </div>

                                {/* Подраздел: Название и цена */}
                                <div className="mt-[30px] mb-7 flex items-center gap-2 border-b border-border pb-2 text-lg font-semibold text-primary">
                                    <Money className="h-6 w-6" />
                                    Название и цена
                                </div>
                                <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
                                    <div className="mb-4 flex flex-col gap-1.5">
                                        <label className="text-sm font-medium text-foreground">Заголовок*</label>
                                        <Input
                                            type="text"
                                            value={formData.title}
                                            onChange={(e) => updateField('title', e.target.value)}
                                            required
                                        />
                                    </div>
                                    <div className="mb-4 flex flex-col gap-1.5">
                                        <label className="text-sm font-medium text-foreground">Цена за сутки*</label>
                                        <div className="flex items-center gap-2">
                                            <Input
                                                type="number"
                                                value={formData.price}
                                                onChange={(e) => updateField('price', Number(e.target.value))}
                                                required
                                                min="1"
                                                className="flex-1"
                                            />
                                        </div>
                                    </div>
                                </div>

                                {/* Подраздел: Вместимость */}
                                <div className="mt-[30px] mb-7 flex items-center gap-2 border-b border-border pb-2 text-lg font-semibold text-primary">
                                    <Sofa className="h-6 w-6" />
                                    Вместимость
                                </div>
                                <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
                                    <div className="mb-4 flex flex-col gap-1.5">
                                        <label className="text-sm font-medium text-foreground">
                                            Количество комнат*
                                        </label>
                                        <Input
                                            type="number"
                                            value={formData.rooms}
                                            onChange={(e) => updateField('rooms', Number(e.target.value))}
                                            required
                                            min="1"
                                            max="20"
                                        />
                                    </div>
                                    <div className="mb-4 flex flex-col gap-1.5">
                                        <label className="text-sm font-medium text-foreground">
                                            Вместимость (человек)
                                        </label>
                                        <Input
                                            type="number"
                                            value={formData.capacity}
                                            onChange={(e) => updateField('capacity', Number(e.target.value))}
                                            min="1"
                                            max="30"
                                        />
                                    </div>
                                </div>

                                {/* Подраздел: Места для сна (2 сверху, 2 снизу) */}
                                <div className="mt-[30px] mb-7 flex items-center gap-2 border-b border-border pb-2 text-lg font-semibold text-primary">
                                    <Bed className="h-6 w-6" />
                                    Места для сна
                                </div>
                                <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
                                    <div className="mb-4 flex flex-col gap-1.5">
                                        <label className="text-sm font-medium text-foreground">
                                            Двуспальные кровати
                                        </label>
                                        <Input
                                            type="number"
                                            value={formData.beds}
                                            onChange={(e) => updateField('beds', Number(e.target.value))}
                                            min="0"
                                            max="20"
                                        />
                                    </div>
                                    <div className="mb-4 flex flex-col gap-1.5">
                                        <label className="text-sm font-medium text-foreground">
                                            Односпальные кровати
                                        </label>
                                        <Input
                                            type="number"
                                            value={formData.singleBeds}
                                            onChange={(e) => updateField('singleBeds', Number(e.target.value))}
                                            min="0"
                                            max="20"
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
                                    <div className="mb-4 flex flex-col gap-1.5">
                                        <label className="text-sm font-medium text-foreground">
                                            Двуспальные диваны
                                        </label>
                                        <Input
                                            type="number"
                                            value={formData.doubleSofas}
                                            onChange={(e) => updateField('doubleSofas', Number(e.target.value))}
                                            min="0"
                                            max="20"
                                        />
                                    </div>
                                    <div className="mb-4 flex flex-col gap-1.5">
                                        <label className="text-sm font-medium text-foreground">
                                            Односпальные диваны
                                        </label>
                                        <Input
                                            type="number"
                                            value={formData.singleSofas}
                                            onChange={(e) => updateField('singleSofas', Number(e.target.value))}
                                            min="0"
                                            max="20"
                                        />
                                    </div>
                                </div>

                                {/* Подраздел: Время заезда и выезда */}
                                <div className="mt-[30px] mb-7 flex items-center gap-2 border-b border-border pb-2 text-lg font-semibold text-primary">
                                    <Clock className="h-6 w-6" />
                                    Время заезда и выезда
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
                                                    key={t.value}
                                                    value={t.value}
                                                >
                                                    {t.label}
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
                                                    key={t.value}
                                                    value={t.value}
                                                >
                                                    {t.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                {/* Подраздел: Расположение, описание, правила */}
                                <div className="mt-[30px] mb-7 flex items-center gap-2 border-b border-border pb-2 text-lg font-semibold text-primary">
                                    <MapPin className="h-6 w-6" />
                                    Расположение и описание
                                </div>
                                <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
                                    <div className="mb-4 flex flex-col gap-1.5">
                                        <label className="text-sm font-medium text-foreground">
                                            Метро (мин пешком)
                                        </label>
                                        <Input
                                            type="text"
                                            inputMode="numeric"
                                            value={formData.minsToMetro || ''}
                                            onChange={(e) =>
                                                updateField('minsToMetro', Number(e.target.value.replace(/\D/g, '')))
                                            }
                                        />
                                    </div>
                                    <div className="mb-4 flex flex-col gap-1.5">
                                        <label className="text-sm font-medium text-foreground">Описание</label>
                                        <Textarea
                                            value={formData.description}
                                            onChange={(e) => updateField('description', e.target.value)}
                                            rows={4}
                                            className="min-h-[100px]"
                                        />
                                    </div>
                                    <div className="mb-4 flex flex-col gap-1.5">
                                        <label className="text-sm font-medium text-foreground">
                                            Правила проживания{' '}
                                            <span className="text-muted-foreground">(необязательно)</span>
                                        </label>
                                        <Textarea
                                            value={formData.rules}
                                            onChange={(e) => updateField('rules', e.target.value)}
                                            rows={4}
                                            className="min-h-[100px]"
                                            placeholder="Например: без вечеринок, без животных, заезд после 14:00..."
                                        />
                                    </div>
                                </div>

                                {/* Площадь / этаж / санузлы */}
                                <div className="grid grid-cols-3 gap-4 max-md:grid-cols-1">
                                    <div className="mb-4 flex flex-col gap-1.5">
                                        <label className="text-sm font-medium text-foreground">Площадь, м²</label>
                                        <Input
                                            type="number"
                                            min={0}
                                            value={formData.area || ''}
                                            onChange={(e) => updateField('area', Number(e.target.value))}
                                        />
                                    </div>
                                    <div className="mb-4 flex flex-col gap-1.5">
                                        <label className="text-sm font-medium text-foreground">Этаж</label>
                                        <Input
                                            type="number"
                                            value={formData.floor || ''}
                                            onChange={(e) => updateField('floor', Number(e.target.value))}
                                        />
                                    </div>
                                    <div className="mb-4 flex flex-col gap-1.5">
                                        <label className="text-sm font-medium text-foreground">Санузлы</label>
                                        <Input
                                            type="number"
                                            min={0}
                                            value={formData.bathrooms || ''}
                                            onChange={(e) => updateField('bathrooms', Number(e.target.value))}
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
                                        Адрес объекта может изменить только администратор.
                                    </p>
                                )}

                                {canEditAddress && (
                                    <div className="mb-4">
                                        <AddressSearch
                                            initialValue={formatAddressLine({
                                                city: formData.city,
                                                street: formData.street,
                                                numberHome: formData.numberHome,
                                                building: formData.building,
                                            })}
                                            onResolved={handleAddressResolved}
                                        />
                                    </div>
                                )}
                                <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
                                    <div className="mb-4 flex flex-col gap-1.5">
                                        <label className="text-sm font-medium text-foreground">Город *</label>
                                        <Input
                                            type="text"
                                            value={formData.city}
                                            onChange={(e) => updateField('city', e.target.value)}
                                            required
                                            disabled={!canEditAddress}
                                        />
                                    </div>
                                    <div className="mb-4 flex flex-col gap-1.5">
                                        <label className="text-sm font-medium text-foreground">Район</label>
                                        <Input
                                            type="text"
                                            value={formData.district}
                                            onChange={(e) => updateField('district', e.target.value)}
                                            disabled={!canEditAddress}
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
                                    <div className="relative mb-4 flex flex-col gap-1.5">
                                        <label className="text-sm font-medium text-foreground">Улица *</label>
                                        <Input
                                            type="text"
                                            value={formData.street}
                                            onChange={(e) => updateField('street', sanitizeStreet(e.target.value))}
                                            placeholder="Название улицы"
                                            autoComplete="off"
                                            required
                                            disabled={!canEditAddress}
                                        />
                                    </div>
                                    <div className="mb-4 flex flex-col gap-1.5">
                                        <label className="text-sm font-medium text-foreground">Номер дома *</label>
                                        <Input
                                            type="text"
                                            value={formData.numberHome}
                                            onChange={(e) => updateField('numberHome', e.target.value)}
                                            required
                                            disabled={!canEditAddress}
                                        />
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
                                    <div className="mb-4 flex flex-col gap-1.5">
                                        <label className="text-sm font-medium text-foreground">Корпус</label>
                                        <Input
                                            type="text"
                                            value={formData.building}
                                            onChange={(e) => updateField('building', e.target.value)}
                                            disabled={!canEditAddress}
                                        />
                                    </div>
                                    <div className="mb-4 flex flex-col gap-1.5">
                                        <label className="text-sm font-medium text-foreground">
                                            Микрорайон <span className="text-muted-foreground">(необязательно)</span>
                                        </label>
                                        <Input
                                            type="text"
                                            value={formData.microdistrict}
                                            onChange={(e) => updateField('microdistrict', e.target.value)}
                                            disabled={!canEditAddress}
                                            placeholder="Например: Уручье, Новая Боровая"
                                        />
                                    </div>
                                </div>
                                {/* Широта и долгота  */}
                                {canEditAddress && formData.lat > 0 && (
                                    <div className="mb-4 grid grid-cols-2 gap-4 max-md:grid-cols-1">
                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-sm font-medium text-foreground">Широта</label>
                                            <Input
                                                disabled
                                                value={formData.lat}
                                            />
                                        </div>
                                        <div className="flex flex-col gap-1.5">
                                            <label className="text-sm font-medium text-foreground">Долгота</label>
                                            <Input
                                                disabled
                                                value={formData.lon}
                                            />
                                        </div>
                                    </div>
                                )}
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
                                        {PAYER_TYPE_OPTIONS.map((i) => (
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

                                    <Input
                                        type="text"
                                        value={formData.unp ?? ''}
                                        onChange={(e) =>
                                            // Раньше слепо резали всё, кроме цифр — физлицо не могло
                                            // ввести УНП с буквами (у физлиц в РБ формат LLNNNNNNN).
                                            // Теперь: только латиница+цифры, АВТОМАТИЧЕСКИ заглавными
                                            // (МНС: «большими буквами на английской раскладке»), до 9 знаков.
                                            updateField(
                                                'unp',
                                                e.target.value
                                                    .toUpperCase()
                                                    .replace(/[^A-Z0-9]/g, '')
                                                    .slice(0, 9),
                                            )
                                        }
                                        placeholder={formData.payerType === 'individual' ? 'MA1953684' : '123456789'}
                                        className="max-w-[300px]"
                                        maxLength={9}
                                    />
                                    {/* Подсказка формата — из той же карты правил, что и серверная
                                        валидация (UNP_RULES в payer.ts): текст всегда совпадает */}
                                    <p className="text-xs text-muted-foreground">
                                        {getUnpRule(formData.payerType).message}
                                    </p>
                                    <label className="text-medium text-sm text-foreground">
                                        Наименование организации
                                    </label>
                                    <Input
                                        type="text"
                                        value={formData.payerName ?? ''}
                                        onChange={(e) => updateField('payerName', e.target.value)}
                                        placeholder="Название вашей организации"
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
