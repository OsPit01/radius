import { SortableImageGrid } from '@/components/apartments/SortableImageGrid';
import { Camera, Hourglass } from '@/components/icons';

import type { EditApartmentForm } from './types';

// Что принимает секция: хук-объект + три обработчика фотографий.
type PhotosSectionProps = {
    form: EditApartmentForm;
    isUploading: boolean;
    onFilesChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    onRemove: (index: number) => void;
    onReorder: (from: number, to: number) => void;
};

export function PhotosSection({ form, isUploading, onFilesChange, onRemove, onReorder }: PhotosSectionProps) {
    return (
        <div className="edit-drop-zone">
            <SortableImageGrid
                images={form.formData.images ?? []}
                onReorder={onReorder}
                onRemove={onRemove}
            >
                <label className="flex aspect-square cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-border bg-background hover:border-primary">
                    <span className="flex cursor-pointer flex-col items-center gap-1 text-[13px] text-muted-foreground">
                        {isUploading ? <Hourglass className="h-8 w-8" /> : <Camera className="h-8 w-8" />}
                    </span>
                    <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={onFilesChange}
                        className="hidden"
                    />
                </label>
            </SortableImageGrid>
        </div>
    );
}
