import Image from 'next/image';

import { useImageManager } from '@/hooks/useImageManager';
import type { FormData, StepProps } from '@/lib/utils';

export function Step5_Images({ formData, updateField, error, errorFields }: StepProps) {
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
        images: formData.images || [],
        mainImage: formData.image || '',
        onImagesChange: (newImages) => updateField('images', newImages),
        onMainImageChange: (newMain) => updateField('image', newMain),
    });

    const hasError = (field: keyof FormData) => errorFields.includes(field);

    return (
        <fieldset className="animate-[fadeIn_0.3s_ease] text-foreground">
            <legend className="mb-2.5 text-[17px] text-foreground">Шаг 5: Фотографии объекта</legend>

            {error && (
                <div
                    className="rounded-xl bg-destructive/10 p-3 text-center text-destructive"
                    role="alert"
                >
                    {error}
                </div>
            )}

            <div className="mt-2.5 flex flex-col gap-2">
                <label className="pt-[5px] text-sm font-semibold text-foreground">
                    Загрузите фотографии
                    <span className="required">*</span>
                    <span className="mt-[-8px] mb-3 block text-sm text-muted-foreground">(минимум 1 фото)</span>
                </label>

                <div
                    className={`flex aspect-[4/1] w-full cursor-pointer items-center justify-center rounded-xl border-2 border-dashed border-border bg-background transition-all duration-200 hover:border-primary hover:bg-primary/5 max-[480px]:aspect-[2/1] ${
                        isUploading ? 'opacity-60' : ''
                    }`}
                    onClick={openFilePicker}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={handleDrop}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => addImages(e.target.files)}
                        className="hidden"
                        disabled={isUploading}
                    />

                    <div className="flex flex-col items-center">
                        {isUploading ? (
                            <>
                                <span className="text-3xl">⏳</span>
                                <p>Загрузка...</p>
                            </>
                        ) : (
                            <>
                                <span className="text-3xl">📸</span>
                                <p>Нажмите или перетащите фотографии</p>
                                <small className="text-xs text-muted-foreground">Можно выбрать несколько файлов</small>
                            </>
                        )}
                    </div>
                </div>

                {hasError('images') && (
                    <div className="mt-1 text-[13px] text-destructive">Добавьте хотя бы одну фотографию</div>
                )}
            </div>

            {images.length > 0 && (
                <div className="mt-2.5 flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                        <label className="pt-[5px] text-sm font-semibold text-foreground">
                            Фотографии ({images.length})
                            {mainImage && (
                                <span className="ml-2 rounded bg-warning px-2 py-0.5 text-[10px] font-semibold text-warning-foreground">
                                    ⭐ Заглавная выбрана
                                </span>
                            )}
                        </label>
                        <span className="text-sm text-muted-foreground">Перетаскивайте для изменения порядка</span>
                    </div>

                    <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-4 py-[11px]">
                        {images.map((image, index) => {
                            const isMain = mainImage === image;
                            return (
                                <div
                                    key={index}
                                    className={`relative aspect-square cursor-grab rounded-xl border-2 border-border bg-background transition-all duration-300 hover:-translate-y-0.5 hover:border-primary hover:shadow-[0_4px_12px_color-mix(in_oklab,var(--primary)_30%,transparent)] ${
                                        isMain
                                            ? 'border-warning shadow-[0_0_0_2px_var(--warning),0_4px_12px_color-mix(in_oklab,var(--warning)_30%,transparent)]'
                                            : ''
                                    }`}
                                    draggable
                                    onDragStart={() => handleDragStart(index)}
                                    onDragOver={(e) => handleDragOver(e, index)}
                                    onDragEnd={handleDragEnd}
                                >
                                    <div className="relative aspect-square w-full overflow-hidden rounded-t-xl">
                                        <Image
                                            src={image}
                                            alt={`фото ${index + 1}`}
                                            width={200}
                                            height={200}
                                            className="h-full w-full object-cover"
                                            priority={index === 0}
                                        />
                                        {isMain && (
                                            <div className="pointer-events-none absolute top-2 left-2 z-[5] rounded bg-warning px-2 py-0.5 text-[10px] font-semibold text-warning-foreground">
                                                ⭐ Заглавная
                                            </div>
                                        )}
                                    </div>

                                    <div className="absolute top-2 right-2 z-10 flex flex-col gap-1.5">
                                        {/* КРЕСТИК - ПЕРВЫЙ (СВЕРХУ) */}
                                        <button
                                            type="button"
                                            className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border-none bg-black/70 text-xs text-white shadow-[0_2px_8px_rgba(0,0,0,0.3)] transition-all duration-200 hover:scale-110 hover:bg-destructive/90"
                                            onClick={() => removeImage(index)}
                                            title="Удалить"
                                        >
                                            ✕
                                        </button>

                                        {/* ЗВЁЗДОЧКА - ВТОРАЯ (СНИЗУ) */}
                                        {!isMain && (
                                            <button
                                                type="button"
                                                className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-full border-none bg-black/70 text-xs text-white shadow-[0_2px_8px_rgba(0,0,0,0.3)] transition-all duration-200 hover:scale-110 hover:bg-warning hover:text-warning-foreground"
                                                onClick={() => setMainImage(index)}
                                                title="Сделать заглавной"
                                            >
                                                ⭐
                                            </button>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            )}

            <div className="mt-5 p-[5px] text-[13px] text-muted-foreground">
                <p>📸 Загружено: {images.length} фото</p>
                {mainImage && <p>⭐ Заглавное фото: выбрано</p>}
                {!mainImage && images.length > 0 && (
                    <p className="text-[13px] text-destructive">⚠️ Выберите заглавное фото (⭐)</p>
                )}
            </div>
        </fieldset>
    );
}
