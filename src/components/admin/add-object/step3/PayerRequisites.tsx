import { Controller, useFormContext } from 'react-hook-form';

import { PAYER_TYPE_OPTIONS } from '@/lib/constants/payer';
import { Field, FieldError, FieldLabel, FieldLegend, FieldRequired, FieldSet } from '@/shared/ui/field';
import { Input } from '@/shared/ui/input';
import { Label } from '@/shared/ui/label';

import type { ApartmentForm } from '../form';

// Реквизиты плательщика: тип плательщика, УНП, наименование организации.
export function PayerRequisites() {
    const {
        control,
        register,
        formState: { errors },
    } = useFormContext<ApartmentForm>();

    return (
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
    );
}
