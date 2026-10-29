import { useEffect, useState } from 'react';

import { formatAddressLine, normalizeHouse } from '@/lib/address';
import { BELARUS_REGIONS, getCityDistricts, getRegion } from '@/lib/constants/belarus-locations';
import { findNearestMetro, getMetroStation, isMetroRegion, METRO_STATIONS_ALPHABETICAL } from '@/lib/metro';
import { METRO_WALK_LIMIT_MINUTES } from '@/lib/metro-limit';
import { chooseMetroStation, type FieldPath, isSameStreet, normalizeGeoName, type StepProps } from '@/lib/utils';
import { Button } from '@/shared/ui/button';
import { Field, FieldDescription, FieldError, FieldLabel, FieldLegend, FieldSet } from '@/shared/ui/field';
import { Input } from '@/shared/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/ui/select';
import { api } from '@/trpc/react';

import { AddressSearch, type AddressSuggestion } from '../../add-object/AddressSearch';

type SelectOption = { value: string; label: string };

const COORDINATES_DEBOUNCE_MS = 800;
const LOOKUP_CACHE_MS = 5 * 60 * 1000;

// Станция выбирается из всех по алфавиту. Первый пункт с пустым значением сбрасывает выбор: подобранную нами станцию
// иначе нельзя было бы убрать.
const METRO_STATION_OPTIONS: SelectOption[] = [
    { value: '', label: 'Не выбрана' },
    ...METRO_STATIONS_ALPHABETICAL.map((station) => ({ value: station.id, label: station.name })),
];

/**
 * Район и район города: определяются по адресу и руками не меняются, поэтому только показываются.
 * «Район города» — у Минска и областных центров («Центральный»), «Район» — у остальных («Минский район»).
 */
function DistrictField({ label, value }: { label: string; value: string }) {
    return (
        <Field>
            <FieldLabel>{label}</FieldLabel>
            <Input
                disabled
                value={value}
                placeholder="—"
            />
        </Field>
    );
}

type SelectFieldProps = {
    label: string;
    name: string;
    value: string;
    options: SelectOption[];
    placeholder: string;
    onValueChange: (value: string) => void;
    description?: string;
    disabled?: boolean;
    required?: boolean;
    invalid?: boolean;
};

function SelectField({
    label,
    name,
    value,
    options,
    placeholder,
    onValueChange,
    description,
    disabled,
    required,
    invalid,
}: SelectFieldProps) {
    return (
        <Field invalid={invalid}>
            <FieldLabel>
                {label} {required && <span aria-hidden="true">*</span>}
            </FieldLabel>
            {description && <FieldDescription>{description}</FieldDescription>}
            <Select
                name={name}
                value={value}
                onValueChange={onValueChange}
                disabled={disabled}
            >
                <SelectTrigger
                    className="w-full!"
                    aria-required={required ? true : undefined}
                >
                    <SelectValue placeholder={placeholder} />
                </SelectTrigger>
                <SelectContent>
                    {options.map((option) => (
                        <SelectItem
                            key={option.value}
                            value={option.value}
                        >
                            {option.label}
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </Field>
    );
}

export function Step2_Address({ formData, updateField, updateAddress, setFormData, error, errors }: StepProps) {
    const utils = api.useUtils();

    const { city, street, numberHome, district, lat, lon } = formData;

    const [manual, setManual] = useState(false);

    // Координат ещё нет — в адресе это 0 (в Беларуси широта и долгота всегда положительные).
    const hasCoordinates = lat > 0 && lon > 0;

    // Координаты определяются автоматически. Из поиска они приходят сразу; если адрес введён вручную,
    // находим их по адресу, когда человек закончил печатать (есть город, улица и дом).
    useEffect(() => {
        const houseText = numberHome.trim();
        if (hasCoordinates || street.trim().length < 2 || !houseText || !city.trim()) {
            return;
        }

        let cancelled = false;
        const timer = setTimeout(() => {
            const query = `${city}, ${street.trim()}, ${houseText}`;
            void (async () => {
                try {
                    const found = await utils.geo.searchAddress.fetch({ query }, { staleTime: LOOKUP_CACHE_MS });

                    const exact = found.find(
                        (s) =>
                            s.house !== '' &&
                            isSameStreet(s.street, street) &&
                            normalizeGeoName(s.city) === normalizeGeoName(city) &&
                            normalizeHouse(s.house) === normalizeHouse(houseText),
                    );

                    if (!cancelled && exact) {
                        updateAddress({ lat: exact.lat, lon: exact.lon });
                    }
                } catch {
                    //TODO подсветить что "Не смогли определить координаты, сделаем это сами на этапе модерации"
                }
            })();
        }, COORDINATES_DEBOUNCE_MS);

        return () => {
            cancelled = true;
            clearTimeout(timer);
        };
    }, [city, street, numberHome, hasCoordinates, utils, updateAddress]);

    const handleResolved = (resolved: AddressSuggestion) => {
        updateAddress({
            region: resolved.region,
            district: resolved.district,
            city: resolved.city,
            street: resolved.street,
            numberHome: resolved.house,
            lat: resolved.lat,
            lon: resolved.lon,
        });
    };

    const region = getRegion(formData.region);
    const districtLabel = getCityDistricts(city) ? 'Район города' : 'Район';

    const regionOptions = BELARUS_REGIONS.map((r) => ({ value: r.value, label: r.label }));

    const invalid = (field: FieldPath) => errors.includes(field);

    const handleRegionChange = (value: string) => {
        if (value === formData.region) {
            return;
        }
        // Район относился к прежней области. Город не трогаем: область могли просто поправить.
        updateAddress({ region: value, district: '' });
    };

    const isResolved = city.trim() !== '' && street.trim() !== '' && numberHome.trim() !== '';

    const hasMetro = isMetroRegion(formData.region) && (!hasCoordinates || findNearestMetro(lat, lon) !== null);
    const metroStation = getMetroStation(formData.metroStation);

    let metroHint = 'Станцию определим по адресу, её можно поменять. Если метро рядом, укажите минуты сами.';
    if (Number(formData.minsToMetro) >= METRO_WALK_LIMIT_MINUTES) {
        metroHint = `Метро, до которого ${METRO_WALK_LIMIT_MINUTES} минут пешком и больше, мы не показываем и не сохраняем.`;
    } else if (metroStation) {
        metroHint = 'Рассчитано по адресу приблизительно — можно поправить.';
    }

    return (
        <fieldset className="animate-[fadeIn_0.3s_ease] text-foreground">
            <legend className="mb-2.5 text-[17px] text-foreground">Шаг 2 из 4: Адрес объекта</legend>

            {error && <FieldError className="mt-2.5">{error}</FieldError>}

            <Button
                type="button"
                variant="link"
                size="sm"
                aria-expanded={manual}
                onClick={() => setManual((value) => !value)}
                className="mt-3 h-auto px-0! py-1 underline"
            >
                {manual ? 'Вернуться к автозаполнению' : 'Проблемы с автозаполнением? Можно заполнить вручную'}
            </Button>

            {!manual && (
                <div className="mt-2.5">
                    <AddressSearch
                        initialValue={isResolved ? formatAddressLine(formData) : ''}
                        onResolved={handleResolved}
                    />
                </div>
            )}

            {!manual && isResolved && (
                <FieldSet className="mt-5 gap-3!">
                    <FieldLegend
                        variant="label"
                        className="mb-2!"
                    >
                        Определено по адресу
                    </FieldLegend>
                    <div className="grid grid-cols-2 gap-3 max-[480px]:grid-cols-1">
                        {region ? (
                            <Field>
                                <FieldLabel>Область</FieldLabel>
                                <Input
                                    disabled
                                    value={region.label}
                                    placeholder="—"
                                />
                            </Field>
                        ) : (
                            <SelectField
                                name="region"
                                label="Область"
                                required
                                value=""
                                options={regionOptions}
                                placeholder="Выберите область"
                                description="По адресу область определить не удалось — выберите из списка."
                                onValueChange={(value) => updateAddress({ region: value })}
                                invalid={invalid('region')}
                            />
                        )}

                        <DistrictField
                            label={districtLabel}
                            value={district}
                        />

                        <Field>
                            <FieldLabel>Населённый пункт</FieldLabel>
                            <Input
                                disabled
                                value={city}
                                placeholder="—"
                            />
                        </Field>

                        <Field>
                            <FieldLabel>Улица</FieldLabel>
                            <Input
                                disabled
                                value={street}
                                placeholder="—"
                            />
                        </Field>

                        <Field>
                            <FieldLabel>Номер дома</FieldLabel>
                            <Input
                                disabled
                                value={numberHome}
                                placeholder="—"
                            />
                        </Field>
                    </div>
                </FieldSet>
            )}

            {/* Ручной ввод: свободный — улицу и дом человек пишет как хочет, подтверждать их по списку не нужно */}
            {manual && (
                <div className="mt-5 flex flex-col gap-5">
                    <SelectField
                        name="region"
                        label="Область"
                        required
                        value={formData.region}
                        options={regionOptions}
                        placeholder="Выберите область"
                        onValueChange={handleRegionChange}
                        invalid={invalid('region')}
                    />
                    {/* Выбрать район нельзя, а список пунктов от района больше не зависит — город пишут сами,
                        как улицу и дом. Район показываем, только если он уже определён (например, при поиске адреса). */}
                    <Field invalid={invalid('city')}>
                        <FieldLabel>
                            Населённый пункт <span aria-hidden="true">*</span>
                        </FieldLabel>
                        <Input
                            name="city"
                            required
                            autoComplete="off"
                            value={city}
                            placeholder="Например: Минск, Борисов, Копище"
                            onChange={(e) => updateAddress({ city: e.target.value })}
                        />
                    </Field>
                    {district && (
                        <DistrictField
                            label={districtLabel}
                            value={district}
                        />
                    )}
                    <Field invalid={errors.includes('street')}>
                        <FieldLabel>
                            Улица <span aria-hidden="true">*</span>
                        </FieldLabel>
                        <Input
                            name="street"
                            required
                            autoComplete="off"
                            value={street}
                            placeholder="Например: улица Немига"
                            onChange={(e) => updateAddress({ street: e.target.value })}
                        />
                    </Field>
                    <Field invalid={errors.includes('numberHome')}>
                        <FieldLabel>
                            Номер дома <span aria-hidden="true">*</span>
                        </FieldLabel>
                        <Input
                            name="numberHome"
                            required
                            autoComplete="off"
                            value={numberHome}
                            placeholder="Например: 5, 156к1, 2А"
                            onChange={(e) => updateAddress({ numberHome: e.target.value })}
                        />
                        <FieldDescription>Корпус пишите вместе с номером: 156к1.</FieldDescription>
                    </Field>
                </div>
            )}

            {hasMetro && (
                <FieldSet className="mt-5 gap-3!">
                    <FieldLegend
                        variant="label"
                        className="mb-2!"
                    >
                        Метро
                    </FieldLegend>
                    <div className="grid grid-cols-2 gap-3 max-[480px]:grid-cols-1">
                        <SelectField
                            name="metroStation"
                            label="Ближайшая станция"
                            value={formData.metroStation}
                            options={METRO_STATION_OPTIONS}
                            placeholder="Не выбрана"
                            onValueChange={(stationId) => setFormData((prev) => chooseMetroStation(prev, stationId))}
                        />
                        <Field>
                            <FieldLabel>Минут пешком</FieldLabel>
                            <Input
                                name="minsToMetro"
                                inputMode="numeric"
                                value={formData.minsToMetro ? formData.minsToMetro : ''}
                                placeholder="5"
                                onChange={(e) => updateField('minsToMetro', e.target.value)}
                            />
                            <FieldDescription>{metroHint}</FieldDescription>
                        </Field>
                    </div>
                </FieldSet>
            )}

            {!manual && isResolved && (
                <FieldSet className="mt-5 gap-3!">
                    <FieldLegend
                        variant="label"
                        className="mb-0!"
                    >
                        Координаты
                    </FieldLegend>
                    <FieldDescription id="coordinates-hint">
                        Определяется автоматически — нужно будет для отображения на этапе бронирования
                    </FieldDescription>
                    <div className="grid grid-cols-2 gap-3 max-[480px]:grid-cols-1">
                        <Field>
                            <FieldLabel>Широта</FieldLabel>
                            <Input
                                name="lat"
                                disabled
                                value={hasCoordinates ? lat : ''}
                                placeholder="—"
                                aria-describedby="coordinates-hint"
                            />
                        </Field>
                        <Field>
                            <FieldLabel>Долгота</FieldLabel>
                            <Input
                                name="lon"
                                disabled
                                value={hasCoordinates ? lon : ''}
                                placeholder="—"
                                aria-describedby="coordinates-hint"
                            />
                        </Field>
                    </div>
                </FieldSet>
            )}
        </fieldset>
    );
}
