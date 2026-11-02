import { useController, useFormContext } from 'react-hook-form';

import type { ApartmentForm } from './form';

export function Step1() {
    const { control } = useFormContext<ApartmentForm>();
    const { field } = useController({ control, name: 'type' });

    return (
        <fieldset className="animate-[fadeIn_0.3s_ease] text-foreground">
            <legend className="mb-2.5 text-[17px] text-foreground"> Шаг 1 из 4: что вы хотите добавить?</legend>
            <div className="flex flex-wrap gap-4">
                <div
                    className={`cursor-pointer rounded-xl border-[3px] px-6 py-4 text-base transition-all duration-200 select-none ${
                        field.value === 'apartment'
                            ? 'border-primary bg-primary/15 text-foreground'
                            : 'border-border text-muted-foreground hover:border-primary hover:text-foreground'
                    }`}
                    onClick={() => field.onChange(field.value === 'apartment' ? '' : 'apartment')}
                >
                    <p> квартира,</p> <p> апартаменты</p>
                </div>
            </div>
            <p className="mt-3 text-sm text-muted-foreground"> Выберите тип объекта (пока доступна только квартира)</p>
        </fieldset>
    );
}
