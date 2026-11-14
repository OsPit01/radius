import { Controller, useFormContext } from 'react-hook-form';

import { TIME_OPTIONS } from '@/lib/constants/time';
import { Field, FieldLabel, FieldLegend, FieldSet } from '@/shared/ui/field';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';

import type { ApartmentForm } from '../form';

// Время заезда и выезда.
export function CheckInOut() {
    const { control } = useFormContext<ApartmentForm>();

    return (
        <FieldSet>
            <FieldLegend variant="legend">Время заезда и выезда</FieldLegend>
            <div className="grid grid-cols-2 gap-3 max-[640px]:grid-cols-1">
                <Field>
                    <FieldLabel>Заселение</FieldLabel>
                    <Controller
                        control={control}
                        name="checkInTime"
                        render={({ field }) => (
                            <Select
                                name={field.name}
                                value={field.value}
                                onValueChange={field.onChange}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {TIME_OPTIONS.map(({ value, label }) => (
                                        <SelectItem
                                            key={value}
                                            value={value}
                                        >
                                            {label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    />
                </Field>
                <Field>
                    <FieldLabel>Выезд</FieldLabel>
                    <Controller
                        control={control}
                        name="checkOutTime"
                        render={({ field }) => (
                            <Select
                                name={field.name}
                                value={field.value}
                                onValueChange={field.onChange}
                            >
                                <SelectTrigger className="w-full">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {TIME_OPTIONS.map(({ value, label }) => (
                                        <SelectItem
                                            key={value}
                                            value={value}
                                        >
                                            {label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}
                    />
                </Field>
            </div>
        </FieldSet>
    );
}
