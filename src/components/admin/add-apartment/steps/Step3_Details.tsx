import { Car, Clipboard, Clock, Money, Note, Ruler, Sofa, Sparkles } from '@/components/icons';
import { formatAddressLine } from '@/lib/address';
import { AMENITIES, CURRENCIES, getTypeLabel, PARKING_TYPES } from '@/lib/constants';
import { PAYERTYPE } from '@/lib/constants/info-company';
import type { StepProps } from '@/lib/utils';
import { EDIT_INPUT_CLASS, INPUT_CLASS, toggleAmenity } from '@/lib/utils';

import { CustomSelect } from '../components/CustomSelect';

export function Step3_Details({ formData, updateField, error, errors }: StepProps) {
    // ===== ОПЦИИ ДЛЯ ВЫБОРА КОЛИЧЕСТВА МЕСТ ДЛЯ СНА =====
    const SLEEP_OPTIONS = Array.from({ length: 11 }, (_, i) => ({
        value: String(i),
        label: i === 0 ? 'Нет' : String(i),
    }));

    // ===== ОПЦИИ ДЛЯ ВЫБОРА ВРЕМЕНИ ЗАЕЗДА/ВЫЕЗДА (каждый час) =====
    const TIME_OPTIONS = Array.from({ length: 24 }, (_, i) => ({
        value: `${String(i).padStart(2, '0')}:00`,
        label: `${String(i).padStart(2, '0')}:00`,
    }));

    // ===== ФУНКЦИЯ ДЛЯ ЧЕКБОКСОВ УДОБСТВ =====
    const handleAmenityToggle = (amenityId: string, checked: boolean) => {
        updateField('amenities', toggleAmenity(formData.amenities || [], amenityId, checked));
    };

    // ===== ФУНКЦИЯ ДЛЯ РАДИО КНОПОК ПАРКОВКИ =====
    const handleParkingChange = (value: string) => {
        updateField('parking', value);
    };

    return (
        <fieldset className="animate-[fadeIn_0.3s_ease] text-foreground">
            <legend className="mb-2.5 text-[17px] text-foreground">Шаг 3: Детали объекта</legend>

            {error && (
                <div
                    className="rounded-xl bg-destructive/10 p-3 text-center text-destructive"
                    role="alert"
                >
                    {error}
                </div>
            )}

            {/* ===== 1. ЗАГОЛОВОК ===== */}
            <div className="flex flex-col gap-2">
                <label
                    htmlFor="title-field"
                    className="pt-[5px] text-sm font-semibold text-foreground"
                >
                    Напишите заголовок <span className="required">*</span>
                </label>
                <input
                    id="title-field"
                    type="text"
                    value={formData.title}
                    onChange={(e) => updateField('title', e.target.value)}
                    className={`${INPUT_CLASS} ${errors.includes('title') ? '!border-destructive' : ''}`}
                    placeholder="Например: Уютная студия в центре города"
                />
            </div>

            {/* ========== РАЗДЕЛИТЕЛЬ ========== */}
            <div className="mt-7 mb-5 border-t border-border" />

            {/* ===== СЕКЦИЯ: ЦЕНА ===== */}
            <div className="mb-5 flex items-center gap-2">
                <Money className="h-6 w-6 text-primary" />
                <h3 className="text-base font-semibold tracking-wide text-primary uppercase">Цена и валюта</h3>
            </div>
            <div className="grid grid-cols-2 gap-5 max-[640px]:grid-cols-1">
                <div className="flex flex-col gap-2">
                    <label
                        htmlFor="price-field"
                        className="pt-[5px] text-sm font-semibold text-foreground"
                    >
                        Цена за сутки <span className="required">*</span>
                    </label>
                    <input
                        id="price-field"
                        type="number"
                        value={formData.price || ''}
                        onChange={(e) => updateField('price', Number(e.target.value))}
                        className={`${INPUT_CLASS} ${errors.includes('price') ? '!border-destructive' : ''}`}
                        placeholder="100"
                        min="30"
                    />
                </div>
                <div className="flex flex-col gap-2">
                    <label
                        htmlFor="currency-field"
                        className="pt-[5px] text-sm font-semibold text-foreground"
                    >
                        Валюта
                    </label>
                    <CustomSelect
                        options={CURRENCIES}
                        value={formData.currency ?? 'BYN'}
                        onChange={(value) => updateField('currency', value)}
                    />
                </div>
            </div>

            {/* ========== РАЗДЕЛИТЕЛЬ ========== */}
            <div className="mt-7 mb-5 border-t border-border" />

            {/* ===== СЕКЦИЯ: ВМЕСТИМОСТЬ ===== */}
            <div className="mb-5 flex items-center gap-2">
                <Sofa className="h-6 w-6 text-primary" />
                <h3 className="text-base font-semibold tracking-wide text-primary uppercase">Вместимость</h3>
            </div>
            <div className="grid grid-cols-2 gap-5 max-[640px]:grid-cols-1">
                <div className="flex flex-col gap-2">
                    <label
                        htmlFor="rooms-field"
                        className="pt-[5px] text-sm font-semibold text-foreground"
                    >
                        Количество комнат <span className="required">*</span>
                    </label>
                    <input
                        id="rooms-field"
                        type="number"
                        value={formData.rooms || ''}
                        onChange={(e) => updateField('rooms', Number(e.target.value))}
                        className={`${INPUT_CLASS} ${errors.includes('rooms') ? '!border-destructive' : ''}`}
                        placeholder="1"
                        min="1"
                        max="20"
                    />
                </div>
                <div className="flex flex-col gap-2">
                    <label
                        htmlFor="capacity-field"
                        className="pt-[5px] text-sm font-semibold text-foreground"
                    >
                        Вместимость (человек) <span className="required">*</span>
                    </label>
                    <input
                        id="capacity-field"
                        type="number"
                        value={formData.capacity || ''}
                        onChange={(e) => updateField('capacity', Number(e.target.value))}
                        className={`${INPUT_CLASS} ${errors.includes('capacity') ? '!border-destructive' : ''}`}
                        placeholder="2"
                        min="1"
                        max="35"
                    />
                </div>
            </div>

            {/* ===== Подблок: МЕСТА ДЛЯ СНА ===== */}
            <div className="mt-4">
                <p className="mb-3 text-sm font-semibold tracking-wide text-foreground/70 uppercase">Места для сна</p>
                {/* 2 селекта сверху горизонтально */}
                <div className="grid grid-cols-2 gap-5 max-[640px]:grid-cols-1">
                    <div className="flex flex-col gap-2">
                        <label
                            htmlFor="beds-field"
                            className="text-sm font-medium text-foreground/80"
                        >
                            Двуспальные кровати
                        </label>
                        <CustomSelect
                            options={SLEEP_OPTIONS}
                            value={String(formData.beds ?? 0)}
                            onChange={(value) => updateField('beds', Number(value))}
                        />
                    </div>
                    <div className="flex flex-col gap-2">
                        <label
                            htmlFor="singlebeds-field"
                            className="text-sm font-medium text-foreground/80"
                        >
                            Односпальные кровати
                        </label>
                        <CustomSelect
                            options={SLEEP_OPTIONS}
                            value={String(formData.singleBeds ?? 0)}
                            onChange={(value) => updateField('singleBeds', Number(value))}
                        />
                    </div>
                </div>
                {/* 2 селекта снизу горизонтально */}
                <div className="mt-5 grid grid-cols-2 gap-5 max-[640px]:grid-cols-1">
                    <div className="flex flex-col gap-2">
                        <label
                            htmlFor="doublesofas-field"
                            className="text-sm font-medium text-foreground/80"
                        >
                            Двуспальные диваны
                        </label>
                        <CustomSelect
                            options={SLEEP_OPTIONS}
                            value={String(formData.doubleSofas ?? 0)}
                            onChange={(value) => updateField('doubleSofas', Number(value))}
                        />
                    </div>
                    <div className="flex flex-col gap-2">
                        <label
                            htmlFor="singlesofas-field"
                            className="text-sm font-medium text-foreground/80"
                        >
                            Односпальные диваны
                        </label>
                        <CustomSelect
                            options={SLEEP_OPTIONS}
                            value={String(formData.singleSofas ?? 0)}
                            onChange={(value) => updateField('singleSofas', Number(value))}
                        />
                    </div>
                </div>
            </div>

            {/* ========== РАЗДЕЛИТЕЛЬ ========== */}
            <div className="mt-7 mb-5 border-t border-border" />

            {/* ===== СЕКЦИЯ: ПАРАМЕТРЫ ОБЪЕКТА ===== */}
            <div className="mb-5 flex items-center gap-2">
                <Ruler className="h-6 w-6 text-primary" />
                <h3 className="text-base font-semibold tracking-wide text-primary uppercase">Параметры объекта</h3>
            </div>

            {/* Площадь / этаж / санузлы */}
            <div className="grid grid-cols-3 gap-4 max-[640px]:grid-cols-1">
                <div className="flex flex-col gap-2">
                    <label
                        htmlFor="area-field"
                        className="text-sm font-medium text-foreground/80"
                    >
                        Площадь, м²
                    </label>
                    <input
                        id="area-field"
                        type="number"
                        min={0}
                        value={formData.area || ''}
                        onChange={(e) => updateField('area', Number(e.target.value))}
                        className={INPUT_CLASS}
                        placeholder="45"
                    />
                </div>
                <div className="flex flex-col gap-2">
                    <label
                        htmlFor="floor-field"
                        className="text-sm font-medium text-foreground/80"
                    >
                        Этаж
                    </label>
                    <input
                        id="floor-field"
                        type="number"
                        value={formData.floor || ''}
                        onChange={(e) => updateField('floor', Number(e.target.value))}
                        className={INPUT_CLASS}
                        placeholder="5"
                    />
                </div>
                <div className="flex flex-col gap-2">
                    <label
                        htmlFor="bathrooms-field"
                        className="text-sm font-medium text-foreground/80"
                    >
                        Санузлы
                    </label>
                    <input
                        id="bathrooms-field"
                        type="number"
                        min={0}
                        value={formData.bathrooms || ''}
                        onChange={(e) => updateField('bathrooms', Number(e.target.value))}
                        className={INPUT_CLASS}
                        placeholder="1"
                    />
                </div>
            </div>

            {/* ========== РАЗДЕЛИТЕЛЬ ========== */}
            <div className="mt-7 mb-5 border-t border-border" />

            {/* ===== СЕКЦИЯ: УДОБСТВА ===== */}
            <div className="mb-5 flex items-center gap-2">
                <Sparkles className="h-6 w-6 text-primary" />
                <h3 className="text-base font-semibold tracking-wide text-primary uppercase">Удобства</h3>
            </div>
            <div className="flex flex-col gap-2">
                <div className="grid grid-cols-3 gap-[8px_16px] py-2 max-[480px]:grid-cols-1 max-md:grid-cols-2">
                    {AMENITIES.map((amenity) => (
                        <label
                            key={amenity.id}
                            className="flex cursor-pointer items-center gap-2.5 py-1.5 text-sm text-foreground transition-colors duration-200 hover:text-primary"
                        >
                            <input
                                type="checkbox"
                                checked={formData.amenities?.includes(amenity.id) || false}
                                onChange={(e) => handleAmenityToggle(amenity.id, e.target.checked)}
                                className="h-[18px] min-h-[18px] w-[18px] min-w-[18px] shrink-0 cursor-pointer accent-primary"
                            />
                            {amenity.label}
                        </label>
                    ))}
                </div>
            </div>

            {/* ========== РАЗДЕЛИТЕЛЬ ========== */}
            <div className="mt-7 mb-5 border-t border-border" />

            {/* ===== СЕКЦИЯ: ПАРКОВКА ===== */}
            <div className="mb-5 flex items-center gap-2">
                <Car className="h-6 w-6 text-primary" />
                <h3 className="text-base font-semibold tracking-wide text-primary uppercase">Парковка</h3>
            </div>
            <div className="radio-group flex flex-wrap gap-x-6 gap-y-2">
                {PARKING_TYPES.map((type) => (
                    <label
                        key={type.id}
                        className="flex cursor-pointer items-center gap-2 py-2.5 text-sm text-foreground transition-colors duration-200 hover:text-primary"
                    >
                        <input
                            type="radio"
                            name="parking"
                            value={type.id}
                            checked={formData.parking === type.id}
                            onChange={() => handleParkingChange(type.id)}
                            className="h-[18px] min-h-[18px] w-[18px] min-w-[18px] shrink-0 cursor-pointer accent-primary"
                        />
                        {type.label}
                    </label>
                ))}
            </div>

            {/* ========== РАЗДЕЛИТЕЛЬ ========== */}
            <div className="mt-7 mb-5 border-t border-border" />

            {/* ===== СЕКЦИЯ: ОПИСАНИЕ ===== */}
            <div className="mb-5 flex items-center gap-2">
                <Note className="h-6 w-6 text-primary" />
                <h3 className="text-base font-semibold tracking-wide text-primary uppercase">Описание</h3>
            </div>
            <div className="flex flex-col gap-2">
                <textarea
                    id="description-field"
                    value={formData.description || ''}
                    onChange={(e) => updateField('description', e.target.value)}
                    className={`${INPUT_CLASS} min-h-[100px] resize-y`}
                    placeholder="Опишите квартиру, особенности, что рядом находится..."
                    rows={4}
                />
            </div>

            {/* ========== РАЗДЕЛИТЕЛЬ ========== */}
            <div className="mt-7 mb-5 border-t border-border" />

            {/* ===== СЕКЦИЯ: ПРАВИЛА ===== */}
            <div className="mb-5 flex items-center gap-2">
                <Clipboard className="h-6 w-6 text-primary" />
                <h3 className="text-base font-semibold tracking-wide text-primary uppercase">Правила проживания</h3>
            </div>
            <div className="flex flex-col gap-2">
                <textarea
                    id="rules-field"
                    value={formData.rules || ''}
                    onChange={(e) => updateField('rules', e.target.value)}
                    className={`${INPUT_CLASS} min-h-[100px] resize-y`}
                    placeholder="Например: без вечеринок, без животных, курение запрещено, заезд после 14:00..."
                    rows={4}
                />
            </div>

            {/* ========== РАЗДЕЛИТЕЛЬ ========== */}
            <div className="mt-7 mb-5 border-t border-border" />

            {/* ===== СЕКЦИЯ: ВРЕМЯ ЗАЕЗДА/ВЫЕЗДА ===== */}
            <div className="mb-5 flex items-center gap-2">
                <Clock className="h-6 w-6 text-primary" />
                <h3 className="text-base font-semibold tracking-wide text-primary uppercase">Время заезда и выезда</h3>
            </div>
            <div className="grid grid-cols-2 gap-5 max-[640px]:grid-cols-1">
                <div className="flex flex-col gap-2">
                    <label
                        htmlFor="checkin-field"
                        className="text-sm font-medium text-foreground/80"
                    >
                        Заселение
                    </label>
                    <CustomSelect
                        options={TIME_OPTIONS}
                        value={formData.checkInTime || '14:00'}
                        onChange={(value) => updateField('checkInTime', value)}
                    />
                </div>
                <div className="flex flex-col gap-2">
                    <label
                        htmlFor="checkout-field"
                        className="text-sm font-medium text-foreground/80"
                    >
                        Выезд
                    </label>
                    <CustomSelect
                        options={TIME_OPTIONS}
                        value={formData.checkOutTime || '12:00'}
                        onChange={(value) => updateField('checkOutTime', value)}
                    />
                </div>
            </div>
            {/*ЮРИДИЧЕСКАЯ ИНФОРМАЦИЯ/РЕКВИЗИТЫ ПЛАТЕЛЬЩИКА*/}
            <section className="mb-10 text-muted-foreground">
                <div className="mt-[35px] mb-[15px] border-b border-border pb-2 text-xl font-semibold text-foreground">
                    Реквизиты плательщика
                </div>
                <div className="flex flex-col gap-4">
                    <label className="text-medium text-sm text-foreground">Плательщик</label>
                    <select
                        value={formData.payerType}
                        onChange={(e) => updateField('payerType', e.target.value)}
                        className={EDIT_INPUT_CLASS}
                    >
                        {PAYERTYPE.map((i) => (
                            <option
                                key={i.value}
                                value={i.value}
                            >
                                {i.label}
                            </option>
                        ))}
                    </select>
                    <label className="text-medium text-sm text-foreground">Учетный номер плательщика</label>

                    <input
                        type="text"
                        value={formData.unp ?? ''}
                        onChange={(e) => updateField('unp', e.target.value.replace(/\D/g, '').slice(0, 9))}
                        placeholder="Введите УНП"
                        className={`${INPUT_CLASS} w-full max-w-[300px] ${errors.includes('unp') ? '!border-destructive' : ''}`}
                        maxLength={9}
                    />
                    <label className="text-medium text-sm text-foreground">Наименование организации</label>
                    <input
                        type="text"
                        value={formData.payerName ?? ''}
                        onChange={(e) => updateField('payerName', e.target.value)}
                        placeholder="Название вашей организации"
                        className={EDIT_INPUT_CLASS}
                    />
                </div>
            </section>

            {/* ===== ПАНЕЛЬ С ИНФОРМАЦИЕЙ ===== */}
            <div
                className="mt-5 border-t border-border p-[5px] pt-3 text-[13px] text-muted-foreground"
                aria-live="polite"
            >
                <p>{getTypeLabel(formData.type)}</p>
                <p>Адрес: {formatAddressLine(formData) || 'не указан'}</p>
            </div>
        </fieldset>
    );
}
