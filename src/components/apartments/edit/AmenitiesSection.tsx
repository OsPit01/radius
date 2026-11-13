import { AMENITIES, PARKING_TYPES } from '@/lib/constants';
import { EDIT_INPUT_CLASS, toggleAmenity } from '@/lib/utils';

import type { EditApartmentForm } from './types';

// Секция «Удобства»: чекбоксы + парковка.
export function AmenitiesSection({ form }: { form: EditApartmentForm }) {
    return (
        <section className="mb-10 text-muted-foreground">
            <div className="mt-[35px] mb-[15px] border-b border-border pb-2 text-xl font-semibold text-foreground">
                Удобства
            </div>
            <div className="mb-4 grid grid-cols-[repeat(auto-fill,minmax(120px,1fr))] gap-2 max-[480px]:grid-cols-1 max-md:grid-cols-2">
                {AMENITIES.map((amenity) => (
                    <label
                        key={amenity.id}
                        className="flex cursor-pointer items-center gap-2 text-xs text-foreground"
                    >
                        <input
                            type="checkbox"
                            checked={form.formData.amenities.includes(amenity.id)}
                            onChange={(e) =>
                                form.updateField(
                                    'amenities',
                                    toggleAmenity(form.formData.amenities, amenity.id, e.target.checked),
                                )
                            }
                            className="h-[18px] min-h-[18px] w-[18px] min-w-[18px] shrink-0 cursor-pointer accent-primary"
                        />
                        {amenity.label}
                    </label>
                ))}
            </div>
            <div className="mb-4 flex flex-col gap-1.5">
                <label className="text-sm font-medium text-foreground">Парковка</label>
                <select
                    value={form.formData.parking}
                    onChange={(e) => form.updateField('parking', e.target.value)}
                    className={EDIT_INPUT_CLASS}
                >
                    {PARKING_TYPES.map((p) => (
                        <option
                            key={p.id}
                            value={p.id}
                        >
                            {p.label}
                        </option>
                    ))}
                </select>
            </div>
        </section>
    );
}
