import { getTypeLabel } from '@/lib/constants';
import { BELARUS_REGIONS, getRegion, localityLabel } from '@/lib/constants/belarus-locations';
import type { StepProps } from '@/lib/utils';

import { CustomSelect } from '../components/CustomSelect';

export function Step2_City({ formData, updateField, error }: StepProps) {
    const region = getRegion(formData.region);
    const isCityRegion = Boolean(region?.cityDistricts);

    const regionOptions = BELARUS_REGIONS.map((r) => ({
        value: r.value,
        label: r.label,
    }));

    const districtOptions = (region?.districts ?? []).map((d) => ({
        value: d.name,
        label: d.name,
    }));
    const cityDistrictOptions = (region?.cityDistricts ?? []).map((r) => ({
        value: r,
        label: r,
    }));

    const selectedDistrict = (region?.districts ?? []).find((d) => d.name === formData.district);
    const localities = selectedDistrict?.localities ?? [];
    const showLocalitySelect = !isCityRegion && localities.length > 1;

    const handleRegionChange = (value: string) => {
        updateField('region', value);
        updateField('district', '');
        updateField('city', '');
        updateField('cityDistrict', '');
        const next = getRegion(value);
        if (next?.cityDistricts) {
            updateField('city', next.label);
        }
    };

    const handleDistrictChange = (value: string) => {
        updateField('district', value);
        updateField('cityDistrict', '');
        const next = (region?.districts ?? []).find((d) => d.name === value);
        if (next?.localities?.length === 1) {
            updateField('city', next.localities[0]?.name ?? '');
        } else {
            updateField('city', '');
        }
    };

    return (
        <fieldset className="animate-[fadeIn_0.3s_ease] text-white">
            <legend className="mb-2.5 text-[17px] text-white">Шаг 2: выберите расположение</legend>

            <div className="mt-2.5 flex flex-col gap-2">
                <label className="pt-[5px] text-sm font-semibold text-white">Город / область</label>
                <CustomSelect
                    options={regionOptions}
                    value={formData.region}
                    onChange={handleRegionChange}
                    placeholder="Выберите город или область"
                />
            </div>

            <div className="mt-2.5 flex flex-col gap-2">
                <label className="pt-[5px] text-sm font-semibold text-white">
                    {isCityRegion ? 'Район города' : 'Район'}
                </label>
                <CustomSelect
                    options={isCityRegion ? cityDistrictOptions : districtOptions}
                    value={formData.district}
                    onChange={(value) => {
                        if (isCityRegion) {
                            updateField('district', value);
                            updateField('city', region?.label ?? '');
                        } else {
                            handleDistrictChange(value);
                        }
                    }}
                    placeholder={
                        formData.region
                            ? isCityRegion
                                ? 'Выберите район города'
                                : 'Выберите район'
                            : 'Сначала выберите город или область'
                    }
                />
            </div>

            {showLocalitySelect && (
                <div className="mt-2.5 flex flex-col gap-2">
                    <label className="pt-[5px] text-sm font-semibold text-white">Населённый пункт</label>
                    <CustomSelect
                        options={localities.map((l) => ({
                            value: l.name,
                            label: localityLabel(l),
                        }))}
                        value={formData.city}
                        onChange={(value) => updateField('city', value)}
                        placeholder="Выберите пункт"
                    />
                </div>
            )}

            {error && <div className="mt-1 text-[13px] text-[#ee7272]"> {error} </div>}

            <div className="mt-5 p-[5px] text-[13px] text-[rgba(216,214,214,0.911)]">{getTypeLabel(formData.type)}</div>
        </fieldset>
    );
}
