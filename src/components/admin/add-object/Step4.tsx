import React, { type ChangeEvent, type Dispatch, type DragEvent, type SetStateAction } from 'react';

import Image from 'next/image';

import { Camera, Close, Hourglass, Star } from '@/components/icons';
import { Button } from '@/shared/ui/button';
import { FieldDescription, FieldError, FieldLegend, FieldRequired, FieldSet } from '@/shared/ui/field';
import { api } from '@/trpc/react';

import type { ApartmentForm, StepValidation } from './form';

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

/** Заглавное фото всегда первое: обложка (image) и порядок (images) меняются вместе. */
function withImages(form: ApartmentForm, images: string[]): ApartmentForm {
    return { ...form, images, image: images[0] ?? '' };
}

interface Step4Props {
    form: ApartmentForm;
    setForm: Dispatch<SetStateAction<ApartmentForm>>;
    /** Сообщения об ошибках по полям; приходят только после попытки отправить форму. */
    messages?: StepValidation['messages'];
    /** Пока фото грузятся, страница не даёт отправить форму — иначе уйдёт неполный набор. */
    onUploadingChange?: (isUploading: boolean) => void;
}

export function Step4({ form, setForm, messages = {}, onUploadingChange }: Step4Props) {
    const [isUploading, setIsUploading] = React.useState(false);
    const [uploadError, setUploadError] = React.useState<string | null>(null);
    const [dragIndex, setDragIndex] = React.useState<number | null>(null);

    const uploadImage = api.upload.image.useMutation();

    // Фото грузятся по одному; то, что успело загрузиться до ошибки, остаётся в списке
    const uploadFiles = async (files: File[]) => {
        const images = files.filter((file) => file.type.startsWith('image/'));
        if (isUploading || images.length === 0) {
            return;
        }

        setIsUploading(true);
        onUploadingChange?.(true);
        setUploadError(null);
        try {
            for (const file of images) {
                const { url } = await uploadImage.mutateAsync({ dataUrl: await readAsDataUrl(file) });
                setForm((prev) => withImages(prev, [...prev.images, url]));
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
        setForm((prev) =>
            withImages(
                prev,
                prev.images.filter((_, i) => i !== index),
            ),
        );
    };

    const handleMakeMain = (index: number) => {
        setForm((prev) => {
            const image = prev.images[index];
            if (image === undefined) {
                return prev;
            }
            return withImages(prev, [image, ...prev.images.filter((_, i) => i !== index)]);
        });
    };

    const handleDragStart = (e: DragEvent<HTMLLIElement>, index: number) => {
        // Firefox не начинает перетаскивание, пока в dataTransfer ничего нет
        e.dataTransfer.setData('text/plain', String(index));
        e.dataTransfer.effectAllowed = 'move';
        setDragIndex(index);
    };

    // Фото уступает место тому, над которым его держат: порядок меняется прямо во время перетаскивания
    const handleDragOver = (e: DragEvent<HTMLLIElement>, overIndex: number) => {
        e.preventDefault();
        if (dragIndex === null || dragIndex === overIndex) {
            return;
        }
        setForm((prev) => {
            const images = [...prev.images];
            const [moved] = images.splice(dragIndex, 1);
            if (moved === undefined) {
                return prev;
            }
            images.splice(overIndex, 0, moved);
            return withImages(prev, images);
        });
        setDragIndex(overIndex);
    };

    const handleDragEnd = () => {
        setDragIndex(null);
    };

    const photoError = uploadError ?? messages.images;

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

                {form.images.length > 0 && (
                    <>
                        <p className="text-sm font-medium">
                            Фотографии ({form.images.length}){' '}
                            <span className="font-normal text-muted-foreground">
                                — перетаскивайте, чтобы изменить порядок
                            </span>
                        </p>
                        <ul className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-4">
                            {form.images.map((image, index) => (
                                <li
                                    key={image}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, index)}
                                    onDragOver={(e) => handleDragOver(e, index)}
                                    onDragEnd={handleDragEnd}
                                    className={`relative aspect-square cursor-grab overflow-hidden rounded-xl border-2 bg-background transition-[border-color,box-shadow] ${
                                        index === 0
                                            ? 'border-warning shadow-[0_0_0_2px_var(--warning)]'
                                            : 'border-border hover:border-primary'
                                    }`}
                                >
                                    <Image
                                        src={image}
                                        alt={`Фото ${index + 1}`}
                                        width={200}
                                        height={200}
                                        className="size-full object-cover"
                                    />
                                    {index === 0 && (
                                        <span className="pointer-events-none absolute top-2 left-2 inline-flex items-center gap-1 rounded bg-warning px-2 py-0.5 text-[10px] font-semibold text-warning-foreground">
                                            <Star className="size-3" />
                                            Заглавное
                                        </span>
                                    )}
                                    <div className="absolute top-2 right-2 flex flex-col gap-1.5">
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            size="icon-sm"
                                            title="Удалить"
                                            aria-label={`Удалить фото ${index + 1}`}
                                            onClick={() => handleRemove(index)}
                                        >
                                            <Close />
                                        </Button>
                                        {index !== 0 && (
                                            <Button
                                                type="button"
                                                variant="secondary"
                                                size="icon-sm"
                                                title="Сделать заглавным"
                                                aria-label={`Сделать фото ${index + 1} заглавным`}
                                                onClick={() => handleMakeMain(index)}
                                            >
                                                <Star muted />
                                            </Button>
                                        )}
                                    </div>
                                </li>
                            ))}
                        </ul>
                    </>
                )}
            </FieldSet>
        </div>
    );
}
