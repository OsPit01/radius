import React, { type Dispatch, type SetStateAction, useState } from 'react';

import { getCityDistricts, getRegion } from '@/lib/constants/belarus-locations';
import { MINSK_METRO_STATIONS } from '@/lib/constants/minsk-metro';
import { findNearestMetro, isMetroRegion } from '@/lib/metro';
import { METRO_WALK_LIMIT_MINUTES } from '@/lib/metro-limit';
import type { AddressSuggestion } from '@/server/yandex-geocoder';
import { Field, FieldDescription, FieldLabel, FieldLegend, FieldSet } from '@/shared/ui/field';
import { Input } from '@/shared/ui/input';

import { AddressSearch } from './AddressSearch';
import type { ApartmentForm } from './form';

export interface Step2Props {
    setForm: Dispatch<SetStateAction<ApartmentForm>>;
    form: ApartmentForm;
}

export const Step2: React.FC<Step2Props> = function ({ setForm, form }) {
    const { city, street, numberHome, district, lat, lon, metroStation, minsToMetro } = form;

    const region = getRegion(form.region);
    const cityDistrict = getCityDistricts(city);

    const hasCoordinates = lat > 0 && lon > 0;

    const [isManualMode] = useState(false);

    const fillTheFormWithResolvedAddress = React.useCallback(
        (resolvedAddress: AddressSuggestion) => {
            const { city, lat, lon, region, street, house, district } = resolvedAddress;

            const nearestMetro = isMetroRegion(region) ? findNearestMetro(lat, lon) : null;

            setForm((prev) => {
                return {
                    ...prev,
                    city,
                    lat,
                    lon,
                    region,
                    district,
                    street,
                    numberHome: house,
                    metroStation: nearestMetro?.station?.id ?? '',
                    minsToMetro: nearestMetro?.walkMinutes ?? 0,
                };
            });
        },
        [setForm],
    );

    const isResolved = city.trim() !== '' && street.trim() !== '' && numberHome.trim() !== '';

    return (
        <div className="animate-[fadeIn_0.3s_ease] text-foreground">
            <h2 className="mb-3 text-[17px] text-foreground">Шаг 2 из 4: Адрес объекта</h2>

            {/* <Button
                type="button"
                variant="link"
                size="sm"
                aria-expanded={isManualMode}
                onClick={() => setManualMode((prev) => !prev)}
                className="mt-3 h-auto px-0! py-1 underline"
            >
                {isManualMode ? 'Вернуться к автозаполнению' : 'Проблемы с автозаполнением? Можно заполнить вручную'}
            </Button> */}

            {!isManualMode && (
                <div className="mt-2.5">
                    <AddressSearch onResolved={fillTheFormWithResolvedAddress} />
                </div>
            )}

            {isResolved && !isManualMode && (
                <>
                    <FieldSet className="mt-5">
                        <FieldLegend
                            variant="legend"
                            className="mb-3"
                        >
                            Определено по адресу
                        </FieldLegend>

                        {region && (
                            <Field>
                                <FieldLabel>Область</FieldLabel>
                                <Input
                                    disabled
                                    value={region.label}
                                    placeholder="—"
                                />
                            </Field>
                        )}

                        {!cityDistrict && (
                            <Field>
                                <FieldLabel>Район</FieldLabel>
                                <Input
                                    disabled
                                    value={district}
                                    placeholder="—"
                                />
                            </Field>
                        )}

                        <Field>
                            <FieldLabel>Населённый пункт</FieldLabel>
                            <Input
                                disabled
                                value={city}
                                placeholder="—"
                            />
                        </Field>

                        {cityDistrict && (
                            <Field>
                                <FieldLabel>Район города</FieldLabel>
                                <Input
                                    disabled
                                    value={district}
                                    placeholder="—"
                                />
                            </Field>
                        )}

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
                    </FieldSet>

                    {minsToMetro <= METRO_WALK_LIMIT_MINUTES && metroStation && (
                        <FieldSet className="mt-5 gap-3!">
                            <FieldLegend variant="legend">Метро</FieldLegend>
                            <div className="grid grid-cols-2 gap-3 max-[480px]:grid-cols-1">
                                <Field>
                                    <FieldLabel>Ближайшая станция</FieldLabel>
                                    <Input
                                        name="metroStation"
                                        value={MINSK_METRO_STATIONS.find((m) => m.id === metroStation)?.name}
                                        disabled
                                    />
                                    {/* <Select
                                        name="metroStation"
                                        value={metroStation}
                                        disabled
                                    >
                                        <SelectTrigger className="w-full">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {METRO_STATION_OPTIONS.map(({ label, value }) => (
                                                <SelectItem
                                                    value={value}
                                                    key={value}
                                                >
                                                    {label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select> */}
                                </Field>
                                <Field>
                                    <FieldLabel>Минут пешком</FieldLabel>
                                    <Input
                                        name="minsToMetro"
                                        inputMode="numeric"
                                        value={minsToMetro}
                                        disabled
                                    />
                                </Field>
                            </div>
                        </FieldSet>
                    )}

                    {hasCoordinates && (
                        <FieldSet className="mt-7 gap-3!">
                            <FieldLegend variant="legend">Координаты</FieldLegend>
                            <FieldDescription>
                                Определяется автоматически — нужно будет для отображения на этапе бронирования
                            </FieldDescription>
                            <div className="grid grid-cols-2 gap-2 max-[480px]:grid-cols-1">
                                <Field>
                                    <FieldLabel>Широта</FieldLabel>
                                    <Input
                                        name="lat"
                                        disabled
                                        value={lat}
                                        placeholder="—"
                                    />
                                </Field>
                                <Field>
                                    <FieldLabel>Долгота</FieldLabel>
                                    <Input
                                        name="lon"
                                        disabled
                                        value={lon}
                                        placeholder="—"
                                    />
                                </Field>
                            </div>
                        </FieldSet>
                    )}
                </>
            )}
        </div>
    );
};
