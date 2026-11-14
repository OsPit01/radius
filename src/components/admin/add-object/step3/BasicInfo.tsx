import { Controller, useFormContext } from 'react-hook-form';

import { BASE_CURRENCY_SYMBOL } from '@/lib/constants';
import { createApartmentInput } from '@/lib/schemas/apartment';
import { Field, FieldError, FieldLabel, FieldLegend, FieldRequired, FieldSet } from '@/shared/ui/field';
import { Input } from '@/shared/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';

import type { ApartmentForm } from '../form';

const TITLE_MAX_LENGTH = createApartmentInput.shape.title.maxLength ?? undefined;

const SLEEP_OPTIONS = Array.from({ length: 11 }, (_, i) => ({
    value: String(i),
    label: i === 0 ? 'Нет' : String(i),
}));

// Заголовок, цена, вместимость и места для сна. Форму берём из контекста
// react-hook-form — пропсы не нужны.
export function BasicInfo() {
    const {
        control,
        register,
        formState: { errors },
    } = useFormContext<ApartmentForm>();

    return (
        <>
            <Field invalid={Boolean(errors.title)}>
                <FieldLabel>
                    Заголовок <FieldRequired />
                </FieldLabel>
                <Input
                    {...register('title')}
                    required
                    maxLength={TITLE_MAX_LENGTH}
                    placeholder="Например: Уютная студия в центре города"
                />
                <FieldError>{errors.title?.message}</FieldError>
            </Field>

            <Field invalid={Boolean(errors.price)}>
                <FieldLabel>
                    Цена за сутки, {BASE_CURRENCY_SYMBOL} <FieldRequired />
                </FieldLabel>
                <Input
                    type="number"
                    {...register('price', { valueAsNumber: true })}
                    required
                    min={30}
                    placeholder="100"
                />
                <FieldError>{errors.price?.message}</FieldError>
            </Field>

            <FieldSet>
                <FieldLegend variant="legend">Вместимость</FieldLegend>
                <div className="grid grid-cols-2 gap-3 max-[640px]:grid-cols-1">
                    <Field invalid={Boolean(errors.rooms)}>
                        <FieldLabel>
                            Количество комнат <FieldRequired />
                        </FieldLabel>
                        <Input
                            type="number"
                            {...register('rooms', { valueAsNumber: true })}
                            required
                            min={1}
                            max={20}
                            placeholder="1"
                        />
                        <FieldError>{errors.rooms?.message}</FieldError>
                    </Field>
                    <Field invalid={Boolean(errors.capacity)}>
                        <FieldLabel>
                            Вместимость (человек) <FieldRequired />
                        </FieldLabel>
                        <Input
                            type="number"
                            {...register('capacity', { valueAsNumber: true })}
                            required
                            min={1}
                            max={35}
                            placeholder="2"
                        />
                        <FieldError>{errors.capacity?.message}</FieldError>
                    </Field>
                </div>
            </FieldSet>

            <FieldSet>
                <FieldLegend variant="legend">Места для сна</FieldLegend>
                <div className="grid grid-cols-2 gap-3 max-[640px]:grid-cols-1">
                    <Field>
                        <FieldLabel>Двуспальные кровати</FieldLabel>
                        <Controller
                            control={control}
                            name="beds"
                            render={({ field }) => (
                                <Select
                                    name={field.name}
                                    value={String(field.value)}
                                    onValueChange={(value) => field.onChange(Number(value))}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {SLEEP_OPTIONS.map(({ value, label }) => (
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
                        <FieldLabel>Односпальные кровати</FieldLabel>
                        <Controller
                            control={control}
                            name="singleBeds"
                            render={({ field }) => (
                                <Select
                                    name={field.name}
                                    value={String(field.value)}
                                    onValueChange={(value) => field.onChange(Number(value))}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {SLEEP_OPTIONS.map(({ value, label }) => (
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
                        <FieldLabel>Двуспальные диваны</FieldLabel>
                        <Controller
                            control={control}
                            name="doubleSofas"
                            render={({ field }) => (
                                <Select
                                    name={field.name}
                                    value={String(field.value)}
                                    onValueChange={(value) => field.onChange(Number(value))}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {SLEEP_OPTIONS.map(({ value, label }) => (
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
                        <FieldLabel>Односпальные диваны</FieldLabel>
                        <Controller
                            control={control}
                            name="singleSofas"
                            render={({ field }) => (
                                <Select
                                    name={field.name}
                                    value={String(field.value)}
                                    onValueChange={(value) => field.onChange(Number(value))}
                                >
                                    <SelectTrigger className="w-full">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {SLEEP_OPTIONS.map(({ value, label }) => (
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
        </>
    );
}
