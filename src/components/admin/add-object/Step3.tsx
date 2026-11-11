import React from 'react';
import { Controller, useFormContext } from 'react-hook-form';

import { AMENITIES, BASE_CURRENCY_SYMBOL, PARKING_TYPES } from '@/lib/constants';
import { PAYER_TYPE_OPTIONS } from '@/lib/constants/payer';
import { TIME_OPTIONS } from '@/lib/constants/time';
import { createApartmentInput } from '@/lib/schemas/apartment';
import { Field, FieldError, FieldGroup, FieldLabel, FieldLegend, FieldRequired, FieldSet } from '@/shared/ui/field';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Textarea } from '@/shared/ui/textarea';

import type { ApartmentForm } from './form';

// Длина заголовка задана колонкой varchar в таблице apartments; серверная схема берёт её оттуда же
const TITLE_MAX_LENGTH = createApartmentInput.shape.title.maxLength ?? undefined;

const SLEEP_OPTIONS = Array.from({ length: 11 }, (_, i) => ({
    value: String(i),
    label: i === 0 ? 'Нет' : String(i),
}));

export function Step3() {
    const {
        control,
        register,
        formState: { errors },
    } = useFormContext<ApartmentForm>();

    return (
        <div className="animate-[fadeIn_0.3s_ease] text-foreground">
            <h2 className="mb-3 text-[17px] text-foreground">Шаг 3 из 4: Детали объекта</h2>
            <p className="text-sm text-muted-foreground">
                Поля, отмеченные <FieldRequired />, обязательны
            </p>

            <FieldGroup className="mt-5">
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

                <Field invalid={Boolean(errors.description)}>
                    <FieldLabel>Описание</FieldLabel>
                    <Textarea
                        {...register('description')}
                        rows={4}
                        placeholder="Опишите квартиру, особенности, что рядом находится..."
                    />
                    <FieldError>{errors.description?.message}</FieldError>
                </Field>

                <Field invalid={Boolean(errors.rules)}>
                    <FieldLabel>Правила проживания</FieldLabel>
                    <Textarea
                        {...register('rules')}
                        rows={4}
                        placeholder="Например: без вечеринок, без животных, курение запрещено, заезд после 14:00..."
                    />
                    <FieldError>{errors.rules?.message}</FieldError>
                </Field>

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

                <FieldSet>
                    <FieldLegend variant="legend">Реквизиты плательщика</FieldLegend>

                    <FieldSet className="gap-0">
                        <FieldLegend variant="label">Плательщик</FieldLegend>
                        <Controller
                            control={control}
                            name="payerType"
                            render={({ field }) => (
                                <div className="flex flex-col">
                                    {PAYER_TYPE_OPTIONS.map((payer) => (
                                        <Label
                                            key={payer.value}
                                            className="cursor-pointer py-2 transition-colors hover:text-primary"
                                        >
                                            <input
                                                type="radio"
                                                name={field.name}
                                                value={payer.value}
                                                checked={field.value === payer.value}
                                                onChange={() => field.onChange(payer.value)}
                                                className="size-4 shrink-0 cursor-pointer accent-primary pointer-coarse:size-5"
                                            />
                                            {payer.label}
                                        </Label>
                                    ))}
                                </div>
                            )}
                        />
                    </FieldSet>

                    <div className="grid grid-cols-2 gap-3 max-[640px]:grid-cols-1">
                        <Field invalid={Boolean(errors.unp)}>
                            <FieldLabel>
                                Учётный номер плательщика (УНП) <FieldRequired />
                            </FieldLabel>
                            <Input
                                {...register('unp')}
                                autoComplete="off"
                                required
                                maxLength={9}
                                placeholder="9 символов"
                            />
                            <FieldError>{errors.unp?.message}</FieldError>
                        </Field>

                        <Field invalid={Boolean(errors.payerName)}>
                            <FieldLabel>Наименование организации</FieldLabel>
                            <Input
                                {...register('payerName')}
                                placeholder="Название вашей организации"
                            />
                            <FieldError>{errors.payerName?.message}</FieldError>
                        </Field>
                    </div>
                </FieldSet>
            </FieldGroup>
        </div>
    );
}
