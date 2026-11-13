import { Bed, Clock, Home, MapPin, Money, Sofa } from '@/components/icons';
import { TIME_OPTIONS } from '@/lib/constants/time';
import { Input } from '@/shared/ui/input';
import { Textarea } from '@/shared/ui/textarea';

import type { EditApartmentForm } from './types';

// Секция «Информация»: получает весь результат хука, рисует поля и вызывает form.updateField.
export function InfoSection({ form }: { form: EditApartmentForm }) {
    return (
        <section className="mb-10 text-muted-foreground">
            <div className="mt-[35px] mb-[15px] flex items-center gap-2 border-b border-border pb-2 text-xl font-semibold text-foreground">
                <Home className="h-6 w-6" />
                Информация
            </div>

            {/* Подраздел: Название и цена */}
            <div className="mt-[30px] mb-7 flex items-center gap-2 border-b border-border pb-2 text-lg font-semibold text-primary">
                <Money className="h-6 w-6" />
                Название и цена
            </div>
            <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
                <div className="mb-4 flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-foreground">Заголовок*</label>
                    <Input
                        type="text"
                        value={form.formData.title}
                        onChange={(e) => form.updateField('title', e.target.value)}
                        required
                    />
                </div>
                <div className="mb-4 flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-foreground">Цена за сутки*</label>
                    <div className="flex items-center gap-2">
                        <Input
                            type="number"
                            value={form.formData.price}
                            onChange={(e) => form.updateField('price', Number(e.target.value))}
                            required
                            min="1"
                            className="flex-1"
                        />
                    </div>
                </div>
            </div>

            {/* Подраздел: Вместимость */}
            <div className="mt-[30px] mb-7 flex items-center gap-2 border-b border-border pb-2 text-lg font-semibold text-primary">
                <Sofa className="h-6 w-6" />
                Вместимость
            </div>
            <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
                <div className="mb-4 flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-foreground">Количество комнат*</label>
                    <Input
                        type="number"
                        value={form.formData.rooms}
                        onChange={(e) => form.updateField('rooms', Number(e.target.value))}
                        required
                        min="1"
                        max="20"
                    />
                </div>
                <div className="mb-4 flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-foreground">Вместимость (человек)</label>
                    <Input
                        type="number"
                        value={form.formData.capacity}
                        onChange={(e) => form.updateField('capacity', Number(e.target.value))}
                        min="1"
                        max="30"
                    />
                </div>
            </div>

            {/* Подраздел: Места для сна */}
            <div className="mt-[30px] mb-7 flex items-center gap-2 border-b border-border pb-2 text-lg font-semibold text-primary">
                <Bed className="h-6 w-6" />
                Места для сна
            </div>
            <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
                <div className="mb-4 flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-foreground">Двуспальные кровати</label>
                    <Input
                        type="number"
                        value={form.formData.beds}
                        onChange={(e) => form.updateField('beds', Number(e.target.value))}
                        min="0"
                        max="20"
                    />
                </div>
                <div className="mb-4 flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-foreground">Односпальные кровати</label>
                    <Input
                        type="number"
                        value={form.formData.singleBeds}
                        onChange={(e) => form.updateField('singleBeds', Number(e.target.value))}
                        min="0"
                        max="20"
                    />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
                <div className="mb-4 flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-foreground">Двуспальные диваны</label>
                    <Input
                        type="number"
                        value={form.formData.doubleSofas}
                        onChange={(e) => form.updateField('doubleSofas', Number(e.target.value))}
                        min="0"
                        max="20"
                    />
                </div>
                <div className="mb-4 flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-foreground">Односпальные диваны</label>
                    <Input
                        type="number"
                        value={form.formData.singleSofas}
                        onChange={(e) => form.updateField('singleSofas', Number(e.target.value))}
                        min="0"
                        max="20"
                    />
                </div>
            </div>

            {/* Подраздел: Время заезда и выезда */}
            <div className="mt-[30px] mb-7 flex items-center gap-2 border-b border-border pb-2 text-lg font-semibold text-primary">
                <Clock className="h-6 w-6" />
                Время заезда и выезда
            </div>
            <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
                <div className="mb-4 flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-foreground">Заселение</label>
                    <select
                        value={form.formData.checkInTime}
                        onChange={(e) => form.updateField('checkInTime', e.target.value)}
                        className="h-[42px] cursor-pointer rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none"
                    >
                        {TIME_OPTIONS.map((t) => (
                            <option
                                key={t.value}
                                value={t.value}
                            >
                                {t.label}
                            </option>
                        ))}
                    </select>
                </div>
                <div className="mb-4 flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-foreground">Выезд</label>
                    <select
                        value={form.formData.checkOutTime}
                        onChange={(e) => form.updateField('checkOutTime', e.target.value)}
                        className="h-[42px] cursor-pointer rounded-lg border border-border bg-background px-3 text-sm text-foreground outline-none"
                    >
                        {TIME_OPTIONS.map((t) => (
                            <option
                                key={t.value}
                                value={t.value}
                            >
                                {t.label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Подраздел: Расположение, описание, правила */}
            <div className="mt-[30px] mb-7 flex items-center gap-2 border-b border-border pb-2 text-lg font-semibold text-primary">
                <MapPin className="h-6 w-6" />
                Расположение и описание
            </div>
            <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
                <div className="mb-4 flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-foreground">Метро (мин пешком)</label>
                    <Input
                        type="text"
                        inputMode="numeric"
                        value={form.formData.minsToMetro || ''}
                        onChange={(e) => form.updateField('minsToMetro', Number(e.target.value.replace(/\D/g, '')))}
                    />
                </div>
                <div className="mb-4 flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-foreground">Описание</label>
                    <Textarea
                        value={form.formData.description}
                        onChange={(e) => form.updateField('description', e.target.value)}
                        rows={4}
                        className="min-h-[100px]"
                    />
                </div>
                <div className="mb-4 flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-foreground">
                        Правила проживания <span className="text-muted-foreground">(необязательно)</span>
                    </label>
                    <Textarea
                        value={form.formData.rules}
                        onChange={(e) => form.updateField('rules', e.target.value)}
                        rows={4}
                        className="min-h-[100px]"
                        placeholder="Например: без вечеринок, без животных, заезд после 14:00..."
                    />
                </div>
            </div>

            {/* Площадь / этаж / санузлы */}
            <div className="grid grid-cols-3 gap-4 max-md:grid-cols-1">
                <div className="mb-4 flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-foreground">Площадь, м²</label>
                    <Input
                        type="number"
                        min={0}
                        value={form.formData.area || ''}
                        onChange={(e) => form.updateField('area', Number(e.target.value))}
                    />
                </div>
                <div className="mb-4 flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-foreground">Этаж</label>
                    <Input
                        type="number"
                        value={form.formData.floor || ''}
                        onChange={(e) => form.updateField('floor', Number(e.target.value))}
                    />
                </div>
                <div className="mb-4 flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-foreground">Санузлы</label>
                    <Input
                        type="number"
                        min={0}
                        value={form.formData.bathrooms || ''}
                        onChange={(e) => form.updateField('bathrooms', Number(e.target.value))}
                    />
                </div>
            </div>
        </section>
    );
}
