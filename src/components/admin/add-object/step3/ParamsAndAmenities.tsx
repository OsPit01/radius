import { Controller, useFormContext } from 'react-hook-form';

import { AMENITIES, PARKING_TYPES } from '@/lib/constants';
import { Field, FieldError, FieldLabel, FieldLegend, FieldSet } from '@/shared/ui/field';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';

import type { ApartmentForm } from '../form';

// Параметры объекта (площадь/этаж/санузлы), удобства и парковка.
export function ParamsAndAmenities() {
    const {
        control,
        register,
        formState: { errors },
    } = useFormContext<ApartmentForm>();

    return (
        <>
            <FieldSet>
                <FieldLegend variant="legend">Параметры объекта</FieldLegend>
                <div className="grid grid-cols-3 gap-3 max-[640px]:grid-cols-1">
                    <Field invalid={Boolean(errors.area)}>
                        <FieldLabel>Площадь, м²</FieldLabel>
                        <Input
                            type="number"
                            {...register('area', { valueAsNumber: true })}
                            min={0}
                            placeholder="45"
                        />
                        <FieldError>{errors.area?.message}</FieldError>
                    </Field>
                    <Field invalid={Boolean(errors.floor)}>
                        <FieldLabel>Этаж</FieldLabel>
                        <Input
                            type="number"
                            {...register('floor', { valueAsNumber: true })}
                            min={1}
                            placeholder="5"
                        />
                        <FieldError>{errors.floor?.message}</FieldError>
                    </Field>
                    <Field invalid={Boolean(errors.bathrooms)}>
                        <FieldLabel>Санузлы</FieldLabel>
                        <Input
                            type="number"
                            {...register('bathrooms', { valueAsNumber: true })}
                            min={0}
                            placeholder="1"
                        />
                        <FieldError>{errors.bathrooms?.message}</FieldError>
                    </Field>
                </div>
            </FieldSet>

            <FieldSet>
                <FieldLegend variant="legend">Удобства</FieldLegend>
                <Controller
                    control={control}
                    name="amenities"
                    render={({ field }) => (
                        <div className="grid grid-cols-3 gap-x-4 gap-y-1 max-[480px]:grid-cols-1 max-md:grid-cols-2">
                            {AMENITIES.map((amenity) => (
                                <Label
                                    key={amenity.id}
                                    className="cursor-pointer py-1.5 transition-colors hover:text-primary"
                                >
                                    <input
                                        type="checkbox"
                                        name={field.name}
                                        value={amenity.id}
                                        checked={field.value.includes(amenity.id)}
                                        onChange={(e) => {
                                            const rest = field.value.filter((id) => id !== amenity.id);
                                            field.onChange(e.target.checked ? [...rest, amenity.id] : rest);
                                        }}
                                        className="size-4 shrink-0 cursor-pointer accent-primary pointer-coarse:size-5"
                                    />
                                    {amenity.label}
                                </Label>
                            ))}
                        </div>
                    )}
                />
            </FieldSet>

            <FieldSet>
                <FieldLegend variant="legend">Парковка</FieldLegend>
                <Controller
                    control={control}
                    name="parking"
                    render={({ field }) => (
                        <div className="flex flex-wrap gap-x-6 gap-y-1">
                            {PARKING_TYPES.map((type) => (
                                <Label
                                    key={type.id}
                                    className="cursor-pointer py-2 transition-colors hover:text-primary"
                                >
                                    <input
                                        type="radio"
                                        name={field.name}
                                        value={type.id}
                                        checked={field.value === type.id}
                                        onChange={() => field.onChange(type.id)}
                                        className="size-4 shrink-0 cursor-pointer accent-primary pointer-coarse:size-5"
                                    />
                                    {type.label}
                                </Label>
                            ))}
                        </div>
                    )}
                />
            </FieldSet>
        </>
    );
}
