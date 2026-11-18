import React, { type ChangeEvent, type DragEvent } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';

import { SortableImageGrid } from '@/components/apartments/SortableImageGrid';
import { Camera, Hourglass } from '@/components/icons';
import { FieldDescription, FieldError, FieldLegend, FieldRequired, FieldSet } from '@/shared/ui/field';
import { api } from '@/trpc/react';

import type { ApartmentForm } from './form';

function readAsDataUrl(file: File) {
    return new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            if (typeof reader.result === 'string') {
                resolve(reader.result);
            } else {
                reject(new Error('Не удалось прочитать файл'));
            }
        };
        reader.onerror = () => reject(reader.error ?? new Error('Не удалось прочитать файл'));
        reader.readAsDataURL(file);
    });
}

interface Step4Props {
    /** Пока фото грузятся, страница не даёт отправить форму — иначе уйдёт неполный набор. */
    onUploadingChange?: (isUploading: boolean) => void;
}

export function Step4({ onUploadingChange }: Step4Props) {
    const {
        control,
        getValues,
        setValue,
        formState: { errors },
    } = useFormContext<ApartmentForm>();
    const images = useWatch({ control, name: 'images' });

    const [isUploading, setIsUploading] = React.useState(false);
    const [uploadError, setUploadError] = React.useState<string | null>(null);

    const setImages = (next: string[]) => {
        setValue('images', next);
    };

    const uploadImage = api.upload.image.useMutation();

    // Фото грузятся по одному; то, что успело загрузиться до ошибки, остаётся в списке
    const uploadFiles = async (files: File[]) => {
        const imageFiles = files.filter((file) => file.type.startsWith('image/'));
        if (isUploading || imageFiles.length === 0) {
            return;
        }

        setIsUploading(true);
        onUploadingChange?.(true);
        setUploadError(null);
        try {
            for (const file of imageFiles) {
                const { url } = await uploadImage.mutateAsync({ dataUrl: await readAsDataUrl(file) });
                setImages([...getValues('images'), url]);
            }
        } catch (error) {
            setUploadError(error instanceof Error ? error.message : 'Не удалось загрузить изображения');
        } finally {
            setIsUploading(false);
            onUploadingChange?.(false);
        }
    };

    const handleFilesChange = (e: ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files ?? []);
        // Без сброса выбор того же файла второй раз не вызвал бы change
        e.target.value = '';
        void uploadFiles(files);
    };

    const handleDrop = (e: DragEvent<HTMLLabelElement>) => {
        e.preventDefault();
        void uploadFiles(Array.from(e.dataTransfer.files));
    };

    const handleRemove = (index: number) => {
        setImages(getValues('images').filter((_, i) => i !== index));
    };

    const handleMakeMain = (index: number) => {
        const current = getValues('images');
        const image = current[index];
        if (image === undefined) {
            return;
        }
        setImages([image, ...current.filter((_, i) => i !== index)]);
    };

    // Перестановка из SortableImageGrid (dnd-kit): работает и мышью, и пальцем —
    // нативный HTML5 drag (draggable/onDragStart), стоявший здесь раньше, на
    // мобильных платформах не поддерживается ВООБЩЕ (iOS/Android игнорируют
    // drag-события от касаний) — фото тасковались только на десктопе.
    const handleReorder = (from: number, to: number) => {
        if (from === to || from < 0 || to < 0) {
            return;
        }
        const current = [...getValues('images')];
        const [moved] = current.splice(from, 1);
        if (moved === undefined) {
            return;
        }
        current.splice(to, 0, moved);
        setImages(current);
    };

    const photoError = uploadError ?? errors.images?.message;

    return (
        <div className="animate-[fadeIn_0.3s_ease] text-foreground">
            <h2 className="mb-3 text-[17px] text-foreground">Шаг 4 из 4: Фотографии объекта</h2>

            <FieldSet className="mt-5">
                <FieldLegend variant="legend">
                    Загрузите фотографии <FieldRequired />
                </FieldLegend>
                <FieldDescription>
                    Минимум 1 фото, до 5 МБ каждое. Первое фото — заглавное, оно показывается в каталоге.
                </FieldDescription>

                {/* Настоящий input скрыт визуально, но остаётся в порядке Tab: фокус на нём подсвечивает всю область */}
                <label
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDrop}
                    className="flex min-h-36 w-full cursor-pointer flex-col items-center justify-center gap-1 rounded-xl border-2 border-dashed border-input bg-background p-4 text-center text-sm transition-[color,background-color,border-color] hover:border-primary hover:bg-primary/5 has-focus-visible:border-ring has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ring has-disabled:cursor-not-allowed has-disabled:opacity-60 has-aria-invalid:border-destructive"
                >
                    <input
                        type="file"
                        name="photos"
                        accept="image/*"
                        multiple
                        disabled={isUploading}
                        aria-invalid={photoError ? true : undefined}
                        onChange={handleFilesChange}
                        className="sr-only"
                    />
                    {isUploading ? (
                        <span
                            role="status"
                            className="flex flex-col items-center gap-1"
                        >
                            <Hourglass className="size-10" />
                            Загрузка...
                        </span>
                    ) : (
                        <>
                            <Camera className="size-10" />
                            Нажмите или перетащите фотографии
                            <span className="text-xs text-muted-foreground">Можно выбрать несколько файлов</span>
                        </>
                    )}
                </label>
                <FieldError>{photoError}</FieldError>

                {images.length > 0 && (
                    <>
                        <p className="text-sm font-medium">
                            Фотографии ({images.length}){' '}
                            <span className="font-normal text-muted-foreground">
                                — удерживайте и перетаскивайте, чтобы изменить порядок
                            </span>
                        </p>
                        <SortableImageGrid
                            images={images}
                            onReorder={handleReorder}
                            onRemove={handleRemove}
                            onMakeMain={handleMakeMain}
                        >
                            {/* Дети сетки: плитка «добавить ещё» — рядом с фото,
                                общий вид с редактированием объекта. */}
                            <label className="flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border-2 border-dashed border-border text-center text-xs text-muted-foreground transition-colors hover:border-primary">
                                <input
                                    type="file"
                                    name="photos-more"
                                    accept="image/*"
                                    multiple
                                    disabled={isUploading}
                                    onChange={handleFilesChange}
                                    className="sr-only"
                                />
                                <Camera className="size-6" />
                                Ещё фото
                            </label>
                        </SortableImageGrid>
                    </>
                )}
            </FieldSet>
        </div>
    );
}
