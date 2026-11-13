import { useCallback, useMemo, useState } from 'react';

import Link from 'next/link';
import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';

import type { AddressSuggestion } from '@/components/address/AddressSearch';
import { AddressSection } from '@/components/apartments/edit/AddressSection';
import { AmenitiesSection } from '@/components/apartments/edit/AmenitiesSection';
import { InfoSection } from '@/components/apartments/edit/InfoSection';
import { PayerSection } from '@/components/apartments/edit/PayerSection';
import { PhotosSection } from '@/components/apartments/edit/PhotosSection';
import { AuthGuard } from '@/components/layout/AuthGuard';
import { ClientHeader } from '@/components/layout/ClientHeader';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { useApartmentForm } from '@/hooks/useApartmentForm';
import { isAdminRole } from '@/lib/constants/roles';
import { findNearestMetro, isMetroRegion } from '@/lib/metro';
import { requireAuth } from '@/server/auth/require-auth';
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
    // Весь результат хука целиком — его получает PhotosSection (и будущие секции).
    const form = useApartmentForm(id);
    // А это — тот же результат по частям: для кода, который остался в странице.
    const { formData, isSubmitting, isLoadingData, error, validationError, updateField, setFormData, handleSubmit } =
        form;

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
                            <PhotosSection
                                form={form}
                                isUploading={isUploading}
                                onFilesChange={handleFileChange}
                                onRemove={removeImage}
                                onReorder={reorderImages}
                            />
                            {validationError && (
                                <p className="mt-2 text-sm font-medium text-destructive">{validationError}</p>
                            )}
                            {/* ИНФОРМАЦИЯ */}
                            <InfoSection form={form} />
                            <AddressSection
                                form={form}
                                canEditAddress={canEditAddress}
                                onAddressResolved={handleAddressResolved}
                            />
                            <PayerSection form={form} />
                            <AmenitiesSection form={form} />

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
