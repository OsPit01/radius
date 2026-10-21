import { getTypeLabel } from '@/lib/constants';
import type { StepProps } from '@/lib/utils';

export function Step1_Type({ formData, updateField }: StepProps) {
    return (
        <fieldset className="animate-[fadeIn_0.3s_ease] text-foreground">
            <legend className="mb-2.5 text-[17px] text-foreground"> Шаг: 1 что вы хотите добавить?</legend>
            <div className="flex flex-wrap gap-4">
                <div
                    className={`cursor-pointer rounded-xl border-[3px] px-6 py-4 text-base transition-all duration-200 select-none ${
                        formData.type === 'apartment'
                            ? 'border-primary bg-primary/15 text-foreground'
                            : 'border-border text-muted-foreground hover:border-primary hover:text-foreground'
                    }`}
                    onClick={() => updateField('type', formData.type === 'apartment' ? '' : 'apartment')}
                >
                    <p> квартира,</p> <p> апартаменты</p>
                </div>
                {/* Позже можно добавить: Коттедж, Отель, Гостевой дом */}
            </div>
            <p className="mt-3 text-sm text-muted-foreground"> Выберите тип объекта (пока доступна только квартира)</p>
            <p className="mt-5 p-[5px] text-[13px] text-muted-foreground"> {getTypeLabel(formData.type)}</p>
        </fieldset>
    );
}
