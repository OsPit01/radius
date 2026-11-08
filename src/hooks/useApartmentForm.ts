// src/hooks/useApartmentForm.ts
import { useEffect, useRef, useState } from 'react';

import { useRouter } from 'next/router';

import { isAmenity } from '@/lib/constants';
import { isParkingType } from '@/lib/constants/parking';
import { type PayerType } from '@/lib/constants/payer';
import type { ApartmentType } from '@/lib/constants/property';
import { api } from '@/trpc/react';

export type ApartmentFormData = {
    type: ApartmentType;
    title: string;
    city: string;
    street: string;
    numberHome: string;
    building: string;
    district: string;
    microdistrict: string;
    region: string;
    lat: number;
    lon: number;
    metroStation: string;
    capacity: number;
    price: number;
    rooms: number;
    beds: number;
    singleBeds: number;
    doubleSofas: number;
    singleSofas: number;
    description: string;
    rules: string;
    minsToMetro: number;
    area: number;
    floor: number;
    bathrooms: number;
    amenities: string[];
    parking: string;
    images: string[];
    checkInTime: string;
    checkOutTime: string;
    payerType: PayerType;
    payerName: string;
    unp: string;
};

const defaultFormData: ApartmentFormData = {
    type: 'apartment',
    title: '',
    city: '',
    street: '',
    numberHome: '',
    building: '',
    district: '',
    microdistrict: '',
    region: '',
    lat: 0,
    lon: 0,
    metroStation: '',
    capacity: 2,
    price: 0,
    rooms: 1,
    beds: 0,
    singleBeds: 0,
    doubleSofas: 0,
    singleSofas: 0,
    description: '',
    rules: '',
    minsToMetro: 0,
    area: 0,
    floor: 0,
    bathrooms: 0,
    amenities: [],
    parking: '',
    images: [],
    checkInTime: '14:00',
    checkOutTime: '12:00',
    payerType: 'individual',
    payerName: '',
    unp: '',
};

export function useApartmentForm(apartmentId: string) {
    const router = useRouter();
    const utils = api.useUtils();

    const [formData, setFormData] = useState<ApartmentFormData>(defaultFormData);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    // id квартиры, данные которой уже подгружены в форму. Нужен, чтобы при
    // повторном рефетче (например, возврат на вкладку) НЕ затирать правки пользователя.

    const initializedIdRef = useRef<string | null>(null);
    // Ошибка ДО отправки (нет фото). Отдельна от `error`: тот заменяет всю
    // страницу заглушкой «Ошибка», а эта должна показаться поверх живой формы,
    // чтобы человек не потерял введённые данные.
    const [validationError, setValidationError] = useState<string | null>(null);
    const updateField = (field: keyof ApartmentFormData, value: string | number | string[]) => {
        setFormData((prev) => ({ ...prev, [field]: value }));
    };

    // ===== ЗАГРУЗКА ДАННЫХ =====
    const { data: apartmentData, isPending: isLoadingData } = api.apartment.getById.useQuery(
        { id: Number(apartmentId) },
        {
            enabled: !!apartmentId && !isNaN(Number(apartmentId)),
        },
    );

    useEffect(() => {
        if (apartmentData && initializedIdRef.current !== apartmentId) {
            initializedIdRef.current = apartmentId;
            const apt = apartmentData.apartment;
            setFormData({
                type: apt.type ?? 'apartment',
                title: apt.title ?? '',
                city: apt.city ?? '',
                street: apt.street ?? '',
                numberHome: apt.numberHome ?? '',
                building: apt.building ?? '',
                district: apt.district ?? '',
                microdistrict: apt.microdistrict ?? '',
                region: apt.region ?? '',
                lat: apt.lat ?? 0,
                lon: apt.lon ?? 0,
                metroStation: apt.metroStation ?? '',
                capacity: apt.capacity ?? 2,
                price: apt.price ?? 0,
                rooms: apt.rooms ?? 1,
                beds: apt.beds ?? 0,
                singleBeds: apt.singleBeds ?? 0,
                doubleSofas: apt.doubleSofas ?? 0,
                singleSofas: apt.singleSofas ?? 0,
                description: apt.description ?? '',
                rules: apt.rules ?? '',
                minsToMetro: apt.minsToMetro ?? 0,
                area: apt.area ?? 0,
                floor: apt.floor ?? 0,
                bathrooms: apt.bathrooms ?? 0,
                amenities: apt.amenities ?? [],
                parking: apt.parking ?? '',
                images: apt.images ?? [],
                checkInTime: apt.checkInTime ?? '14:00',
                checkOutTime: apt.checkOutTime ?? '12:00',
                payerType: apt.payerType ?? 'individual',
                payerName: apt.payerName ?? '',
                unp: apt.unp ?? '',
            });
        }
    }, [apartmentData, apartmentId]);

    // ===== ОБНОВЛЕНИЕ =====
    const updateApartment = api.apartment.update.useMutation({
        onSuccess: async () => {
            await utils.apartment.getAll.invalidate(); // ← главная страница
            await utils.apartment.getMyApartments.invalidate(); // ← мои объекты
            await utils.apartment.getById.invalidate({ id: Number(apartmentId) }); // ← эта квартира
            void router.push('/my-apartments');
        },
        onError: (err) => {
            setError(err.message ?? 'Ошибка при обновлении');
            setIsSubmitting(false);
        },
    });

    // ===== ОТПРАВКА ФОРМЫ =====
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        setError(null);
        setValidationError(null);
        // Без фото сохранять нельзя: сохранение физически стирает удалённые
        // файлы из хранилища — пустой список уничтожил бы все фото объекта
        if ((formData.images ?? []).length === 0) {
            setValidationError('Добавьте хотя бы одну фотографию');
            return;
        }
        setIsSubmitting(true);
        try {
            const data = {
                ...formData,
                price: Number(formData.price),
                capacity: Number(formData.capacity),
                rooms: Number(formData.rooms),
                beds: Number(formData.beds),
                singleBeds: Number(formData.singleBeds),
                doubleSofas: Number(formData.doubleSofas),
                singleSofas: Number(formData.singleSofas),
                // 0 в поле — «не знаю»: в базу уходит null, а не 0
                minsToMetro: formData.minsToMetro > 0 ? formData.minsToMetro : null,
                parking: isParkingType(formData.parking) ? formData.parking : undefined,
                region: formData.region || undefined,
                lat: formData.lat > 0 ? formData.lat : undefined,
                lon: formData.lon > 0 ? formData.lon : undefined,
                metroStation: formData.metroStation || undefined,
                amenities: (formData.amenities ?? []).filter(isAmenity),
            };

            await updateApartment.mutateAsync({ id: Number(apartmentId), ...data });
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Произошла ошибка';
            setError(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return {
        formData,
        setFormData,
        isSubmitting,
        isLoadingData,
        error,
        validationError,
        apartmentData,
        updateField,
        handleSubmit,
        isUpdating: updateApartment.isPending, // ← isPending вместо isLoading
    };
}
