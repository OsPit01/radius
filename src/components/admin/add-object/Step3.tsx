import React, { type ChangeEvent, type Dispatch, type SetStateAction } from 'react';

import { AMENITIES, PARKING_TYPES } from '@/lib/constants';
import { PAYERTYPE } from '@/lib/constants/info-company';
import { createApartmentInput } from '@/lib/schemas/apartment';
import { Field, FieldError, FieldGroup, FieldLabel, FieldLegend, FieldRequired, FieldSet } from '@/shared/ui/field';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { Textarea } from '@/shared/ui/textarea';

import type { ApartmentForm, StepValidation } from './form';

// Длина заголовка задана колонкой varchar в таблице apartments; серверная схема берёт её оттуда же
const TITLE_MAX_LENGTH = createApartmentInput.shape.title.maxLength ?? undefined;

const SLEEP_OPTIONS = Array.from({ length: 11 }, (_, i) => ({
    value: String(i),
    label: i === 0 ? 'Нет' : String(i),
}));

const TIME_OPTIONS = Array.from({ length: 24 }, (_, i) => {
    const time = `${String(i).padStart(2, '0')}:00`;
    return { value: time, label: time };
});

interface Step3Props {
    form: ApartmentForm;
    setForm: Dispatch<SetStateAction<ApartmentForm>>;
    messages?: StepValidation['messages'];
}

export function Step3({ form, setForm, messages = {} }: Step3Props) {
    const handleTitleChange = (e: ChangeEvent<HTMLInputElement>) => {
        setForm((prev) => ({ ...prev, title: e.target.value }));
    };

    const handlePriceChange = (e: ChangeEvent<HTMLInputElement>) => {
        setForm((prev) => ({ ...prev, price: Number(e.target.value) }));
    };

    const handleRoomsChange = (e: ChangeEvent<HTMLInputElement>) => {
        setForm((prev) => ({ ...prev, rooms: Number(e.target.value) }));
    };

    const handleCapacityChange = (e: ChangeEvent<HTMLInputElement>) => {
        setForm((prev) => ({ ...prev, capacity: Number(e.target.value) }));
    };

    const handleBedsChange = (value: string) => {
        setForm((prev) => ({ ...prev, beds: Number(value) }));
    };

    const handleSingleBedsChange = (value: string) => {
        setForm((prev) => ({ ...prev, singleBeds: Number(value) }));
    };

    const handleDoubleSofasChange = (value: string) => {
        setForm((prev) => ({ ...prev, doubleSofas: Number(value) }));
    };

    const handleSingleSofasChange = (value: string) => {
        setForm((prev) => ({ ...prev, singleSofas: Number(value) }));
    };

    const handleAreaChange = (e: ChangeEvent<HTMLInputElement>) => {
        setForm((prev) => ({ ...prev, area: Number(e.target.value) }));
    };

    const handleFloorChange = (e: ChangeEvent<HTMLInputElement>) => {
        setForm((prev) => ({ ...prev, floor: Number(e.target.value) }));
    };

    const handleBathroomsChange = (e: ChangeEvent<HTMLInputElement>) => {
        setForm((prev) => ({ ...prev, bathrooms: Number(e.target.value) }));
    };

    const handleAmenityChange = (amenityId: string, checked: boolean) => {
        setForm((prev) => {
            const rest = prev.amenities.filter((id) => id !== amenityId);
            return { ...prev, amenities: checked ? [...rest, amenityId] : rest };
        });
    };

    const handleParkingChange = (parkingId: string) => {
        setForm((prev) => ({ ...prev, parking: parkingId }));
    };

    const handleDescriptionChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
        setForm((prev) => ({ ...prev, description: e.target.value }));
    };

    const handleRulesChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
        setForm((prev) => ({ ...prev, rules: e.target.value }));
    };

    const handleCheckInTimeChange = (value: string) => {
        setForm((prev) => ({ ...prev, checkInTime: value }));
    };

    const handleCheckOutTimeChange = (value: string) => {
        setForm((prev) => ({ ...prev, checkOutTime: value }));
    };

    const handlePayerTypeChange = (payerType: string) => {
        setForm((prev) => ({ ...prev, payerType }));
    };

    const handleUnpChange = (e: ChangeEvent<HTMLInputElement>) => {
        setForm((prev) => ({ ...prev, unp: e.target.value.replace(/\D/g, '').slice(0, 9) }));
    };

    const handlePayerNameChange = (e: ChangeEvent<HTMLInputElement>) => {
        setForm((prev) => ({ ...prev, payerName: e.target.value }));
    };

    return (
        <div className="animate-[fadeIn_0.3s_ease] text-foreground">
            <h2 className="mb-3 text-[17px] text-foreground">Шаг 3 из 4: Детали объекта</h2>
            <p className="text-sm text-muted-foreground">
                Поля, отмеченные <FieldRequired />, обязательны
            </p>

            <FieldGroup className="mt-5">
                <Field invalid={Boolean(messages.title)}>
                    <FieldLabel>
                        Заголовок <FieldRequired />
                    </FieldLabel>
                    <Input
                        name="title"
                        required
                        maxLength={TITLE_MAX_LENGTH}
                        value={form.title}
                        onChange={handleTitleChange}
                        placeholder="Например: Уютная студия в центре города"
                    />
                    <FieldError>{messages.title}</FieldError>
                </Field>

                <Field invalid={Boolean(messages.price)}>
                    <FieldLabel>
                        Цена за сутки, {form.currency} <FieldRequired />
                    </FieldLabel>
                    <Input
                        name="price"
                        type="number"
                        required
                        min={30}
                        value={form.price || ''}
                        onChange={handlePriceChange}
                        placeholder="100"
                    />
                    <FieldError>{messages.price}</FieldError>
                </Field>

                <FieldSet>
                    <FieldLegend variant="legend">Вместимость</FieldLegend>
                    <div className="grid grid-cols-2 gap-3 max-[640px]:grid-cols-1">
                        <Field invalid={Boolean(messages.rooms)}>
                            <FieldLabel>
                                Количество комнат <FieldRequired />
                            </FieldLabel>
                            <Input
                                name="rooms"
                                type="number"
                                required
                                min={1}
                                max={20}
                                value={form.rooms || ''}
                                onChange={handleRoomsChange}
                                placeholder="1"
                            />
                            <FieldError>{messages.rooms}</FieldError>
                        </Field>
                        <Field invalid={Boolean(messages.capacity)}>
                            <FieldLabel>
                                Вместимость (человек) <FieldRequired />
                            </FieldLabel>
                            <Input
                                name="capacity"
                                type="number"
                                required
                                min={1}
                                max={35}
                                value={form.capacity || ''}
                                onChange={handleCapacityChange}
                                placeholder="2"
                            />
                            <FieldError>{messages.capacity}</FieldError>
                        </Field>
                    </div>
                </FieldSet>

                <FieldSet>
                    <FieldLegend variant="legend">Места для сна</FieldLegend>
                    <div className="grid grid-cols-2 gap-3 max-[640px]:grid-cols-1">
                        <Field>
                            <FieldLabel>Двуспальные кровати</FieldLabel>
                            <Select
                                name="beds"
                                value={String(form.beds)}
                                onValueChange={handleBedsChange}
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
                        </Field>
                        <Field>
                            <FieldLabel>Односпальные кровати</FieldLabel>
                            <Select
                                name="singleBeds"
                                value={String(form.singleBeds)}
                                onValueChange={handleSingleBedsChange}
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
                        </Field>
                        <Field>
                            <FieldLabel>Двуспальные диваны</FieldLabel>
                            <Select
                                name="doubleSofas"
                                value={String(form.doubleSofas)}
                                onValueChange={handleDoubleSofasChange}
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
                        </Field>
                        <Field>
                            <FieldLabel>Односпальные диваны</FieldLabel>
                            <Select
                                name="singleSofas"
                                value={String(form.singleSofas)}
                                onValueChange={handleSingleSofasChange}
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
                        </Field>
                    </div>
                </FieldSet>

                <FieldSet>
                    <FieldLegend variant="legend">Параметры объекта</FieldLegend>
                    <div className="grid grid-cols-3 gap-3 max-[640px]:grid-cols-1">
                        <Field invalid={Boolean(messages.area)}>
                            <FieldLabel>Площадь, м²</FieldLabel>
                            <Input
                                name="area"
                                type="number"
                                min={0}
                                value={form.area || ''}
                                onChange={handleAreaChange}
                                placeholder="45"
                            />
                            <FieldError>{messages.area}</FieldError>
                        </Field>
                        <Field invalid={Boolean(messages.floor)}>
                            <FieldLabel>Этаж</FieldLabel>
                            <Input
                                name="floor"
                                type="number"
                                min={1}
                                value={form.floor || ''}
                                onChange={handleFloorChange}
                                placeholder="5"
                            />
                            <FieldError>{messages.floor}</FieldError>
                        </Field>
                        <Field invalid={Boolean(messages.bathrooms)}>
                            <FieldLabel>Санузлы</FieldLabel>
                            <Input
                                name="bathrooms"
                                type="number"
                                min={0}
                                value={form.bathrooms || ''}
                                onChange={handleBathroomsChange}
                                placeholder="1"
                            />
                            <FieldError>{messages.bathrooms}</FieldError>
                        </Field>
                    </div>
                </FieldSet>

                <FieldSet>
                    <FieldLegend variant="legend">Удобства</FieldLegend>
                    <div className="grid grid-cols-3 gap-x-4 gap-y-1 max-[480px]:grid-cols-1 max-md:grid-cols-2">
                        {AMENITIES.map((amenity) => (
                            <Label
                                key={amenity.id}
                                className="cursor-pointer py-1.5 transition-colors hover:text-primary"
                            >
                                <input
                                    type="checkbox"
                                    name="amenities"
                                    value={amenity.id}
                                    checked={form.amenities.includes(amenity.id)}
                                    onChange={(e) => handleAmenityChange(amenity.id, e.target.checked)}
                                    className="size-4 shrink-0 cursor-pointer accent-primary pointer-coarse:size-5"
                                />
                                {amenity.label}
                            </Label>
                        ))}
                    </div>
                </FieldSet>

                <FieldSet>
                    <FieldLegend variant="legend">Парковка</FieldLegend>
                    <div className="flex flex-wrap gap-x-6 gap-y-1">
                        {PARKING_TYPES.map((type) => (
                            <Label
                                key={type.id}
                                className="cursor-pointer py-2 transition-colors hover:text-primary"
                            >
                                <input
                                    type="radio"
                                    name="parking"
                                    value={type.id}
                                    checked={form.parking === type.id}
                                    onChange={() => handleParkingChange(type.id)}
                                    className="size-4 shrink-0 cursor-pointer accent-primary pointer-coarse:size-5"
                                />
                                {type.label}
                            </Label>
                        ))}
                    </div>
                </FieldSet>

                <Field invalid={Boolean(messages.description)}>
                    <FieldLabel>Описание</FieldLabel>
                    <Textarea
                        name="description"
                        rows={4}
                        value={form.description}
                        onChange={handleDescriptionChange}
                        placeholder="Опишите квартиру, особенности, что рядом находится..."
                    />
                    <FieldError>{messages.description}</FieldError>
                </Field>

                <Field invalid={Boolean(messages.rules)}>
                    <FieldLabel>Правила проживания</FieldLabel>
                    <Textarea
                        name="rules"
                        rows={4}
                        value={form.rules}
                        onChange={handleRulesChange}
                        placeholder="Например: без вечеринок, без животных, курение запрещено, заезд после 14:00..."
                    />
                    <FieldError>{messages.rules}</FieldError>
                </Field>

                <FieldSet>
                    <FieldLegend variant="legend">Время заезда и выезда</FieldLegend>
                    <div className="grid grid-cols-2 gap-3 max-[640px]:grid-cols-1">
                        <Field>
                            <FieldLabel>Заселение</FieldLabel>
                            <Select
                                name="checkInTime"
                                value={form.checkInTime}
                                onValueChange={handleCheckInTimeChange}
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
                        </Field>
                        <Field>
                            <FieldLabel>Выезд</FieldLabel>
                            <Select
                                name="checkOutTime"
                                value={form.checkOutTime}
                                onValueChange={handleCheckOutTimeChange}
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
                        </Field>
                    </div>
                </FieldSet>

                <FieldSet>
                    <FieldLegend variant="legend">Реквизиты плательщика</FieldLegend>

                    <FieldSet className="gap-0">
                        <FieldLegend variant="label">Плательщик</FieldLegend>
                        <div className="flex flex-col">
                            {PAYERTYPE.map((payer) => (
                                <Label
                                    key={payer.value}
                                    className="cursor-pointer py-2 transition-colors hover:text-primary"
                                >
                                    <input
                                        type="radio"
                                        name="payerType"
                                        value={payer.value}
                                        checked={form.payerType === payer.value}
                                        onChange={() => handlePayerTypeChange(payer.value)}
                                        className="size-4 shrink-0 cursor-pointer accent-primary pointer-coarse:size-5"
                                    />
                                    {payer.label}
                                </Label>
                            ))}
                        </div>
                    </FieldSet>

                    <div className="grid grid-cols-2 gap-3 max-[640px]:grid-cols-1">
                        <Field invalid={Boolean(messages.unp)}>
                            <FieldLabel>
                                Учётный номер плательщика (УНП) <FieldRequired />
                            </FieldLabel>
                            <Input
                                name="unp"
                                type="text"
                                inputMode="numeric"
                                autoComplete="off"
                                required
                                maxLength={9}
                                pattern="\d{9}"
                                value={form.unp}
                                onChange={handleUnpChange}
                                placeholder="9 цифр"
                            />
                            <FieldError>{messages.unp}</FieldError>
                        </Field>
                        <Field invalid={Boolean(messages.payerName)}>
                            <FieldLabel>Наименование организации</FieldLabel>
                            <Input
                                name="payerName"
                                value={form.payerName}
                                onChange={handlePayerNameChange}
                                placeholder="Название вашей организации"
                            />
                            <FieldError>{messages.payerName}</FieldError>
                        </Field>
                    </div>
                </FieldSet>
            </FieldGroup>
        </div>
    );
}
