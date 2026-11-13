import { AddressSearch, type AddressSuggestion } from '@/components/address/AddressSearch';
import { formatAddressLine } from '@/lib/address';
import { sanitizeStreet } from '@/lib/utils';
import { Input } from '@/shared/ui/input';

import type { EditApartmentForm } from './types';

type AddressSectionProps = {
    form: EditApartmentForm;
    /** Адрес может менять только администратор и выше. */
    canEditAddress: boolean;
    /** Пользователь выбрал адрес из подсказок — страница обновляет форму. */
    onAddressResolved: (address: AddressSuggestion) => void;
};

export function AddressSection({ form, canEditAddress, onAddressResolved }: AddressSectionProps) {
    return (
        <section className="mb-10 text-muted-foreground">
            <div className="mt-[35px] mb-[15px] border-b border-border pb-2 text-xl font-semibold text-foreground">
                Адрес
            </div>
            {!canEditAddress && (
                <p className="mb-4 rounded-lg border border-border bg-background px-4 py-3 text-sm text-muted-foreground">
                    Адрес объекта может изменить только администратор.
                </p>
            )}

            {canEditAddress && (
                <div className="mb-4">
                    <AddressSearch
                        initialValue={formatAddressLine({
                            city: form.formData.city,
                            street: form.formData.street,
                            numberHome: form.formData.numberHome,
                            building: form.formData.building,
                        })}
                        onResolved={onAddressResolved}
                    />
                </div>
            )}
            <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
                <div className="mb-4 flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-foreground">Город *</label>
                    <Input
                        type="text"
                        value={form.formData.city}
                        onChange={(e) => form.updateField('city', e.target.value)}
                        required
                        disabled={!canEditAddress}
                    />
                </div>
                <div className="mb-4 flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-foreground">Район</label>
                    <Input
                        type="text"
                        value={form.formData.district}
                        onChange={(e) => form.updateField('district', e.target.value)}
                        disabled={!canEditAddress}
                    />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
                <div className="relative mb-4 flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-foreground">Улица *</label>
                    <Input
                        type="text"
                        value={form.formData.street}
                        onChange={(e) => form.updateField('street', sanitizeStreet(e.target.value))}
                        placeholder="Название улицы"
                        autoComplete="off"
                        required
                        disabled={!canEditAddress}
                    />
                </div>
                <div className="mb-4 flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-foreground">Номер дома *</label>
                    <Input
                        type="text"
                        value={form.formData.numberHome}
                        onChange={(e) => form.updateField('numberHome', e.target.value)}
                        required
                        disabled={!canEditAddress}
                    />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4 max-md:grid-cols-1">
                <div className="mb-4 flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-foreground">Корпус</label>
                    <Input
                        type="text"
                        value={form.formData.building}
                        onChange={(e) => form.updateField('building', e.target.value)}
                        disabled={!canEditAddress}
                    />
                </div>
                <div className="mb-4 flex flex-col gap-1.5">
                    <label className="text-sm font-medium text-foreground">
                        Микрорайон <span className="text-muted-foreground">(необязательно)</span>
                    </label>
                    <Input
                        type="text"
                        value={form.formData.microdistrict}
                        onChange={(e) => form.updateField('microdistrict', e.target.value)}
                        disabled={!canEditAddress}
                        placeholder="Например: Уручье, Новая Боровая"
                    />
                </div>
            </div>
            {/* Широта и долгота */}
            {canEditAddress && form.formData.lat > 0 && (
                <div className="mb-4 grid grid-cols-2 gap-4 max-md:grid-cols-1">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-foreground">Широта</label>
                        <Input
                            disabled
                            value={form.formData.lat}
                        />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-foreground">Долгота</label>
                        <Input
                            disabled
                            value={form.formData.lon}
                        />
                    </div>
                </div>
            )}
        </section>
    );
}
