import { getUnpRule, PAYER_TYPE_OPTIONS } from '@/lib/constants/payer';
import { EDIT_INPUT_CLASS } from '@/lib/utils';
import { Input } from '@/shared/ui/input';

import type { EditApartmentForm } from './types';

// Секция «Реквизиты плательщика».
export function PayerSection({ form }: { form: EditApartmentForm }) {
    return (
        <section className="mb-10 text-muted-foreground">
            <div className="mt-[35px] mb-[15px] border-b border-border pb-2 text-xl font-semibold text-foreground">
                Реквизиты плательщика
            </div>
            <div className="flex flex-col gap-4">
                <label className="text-medium text-sm text-foreground">Плательщик</label>
                <select
                    value={form.formData.payerType}
                    onChange={(e) => form.updateField('payerType', e.target.value)}
                    className={EDIT_INPUT_CLASS}
                >
                    {PAYER_TYPE_OPTIONS.map((i) => (
                        <option
                            key={i.value}
                            value={i.value}
                        >
                            {i.label}
                        </option>
                    ))}
                </select>
                <label className="text-medium text-sm text-foreground">Учетный номер плательщика</label>

                <Input
                    type="text"
                    value={form.formData.unp ?? ''}
                    onChange={(e) =>
                        form.updateField(
                            'unp',
                            e.target.value
                                .toUpperCase()
                                .replace(/[^A-Z0-9]/g, '')
                                .slice(0, 9),
                        )
                    }
                    placeholder={form.formData.payerType === 'individual' ? 'MA1953684' : '123456789'}
                    className="max-w-[300px]"
                    maxLength={9}
                />
                <p className="text-xs text-muted-foreground">{getUnpRule(form.formData.payerType).message}</p>
                <label className="text-medium text-sm text-foreground">Наименование организации</label>
                <Input
                    type="text"
                    value={form.formData.payerName ?? ''}
                    onChange={(e) => form.updateField('payerName', e.target.value)}
                    placeholder="Название вашей организации"
                />
            </div>
        </section>
    );
}
