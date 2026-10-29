import type { Dispatch, SetStateAction } from 'react';

import type { ApartmentForm } from './form';

interface Step1Props {
    form: ApartmentForm;
    setForm: Dispatch<SetStateAction<ApartmentForm>>;
}

export function Step1({ form, setForm }: Step1Props) {
    return (
        <fieldset className="animate-[fadeIn_0.3s_ease] text-foreground">
            <legend className="mb-2.5 text-[17px] text-foreground"> Шаг 1 из 4: что вы хотите добавить?</legend>
            <div className="flex flex-wrap gap-4">
                <div
                    className={`cursor-pointer rounded-xl border-[3px] px-6 py-4 text-base transition-all duration-200 select-none ${
                        form.type === 'apartment'
                            ? 'border-primary bg-primary/15 text-foreground'
                            : 'border-border text-muted-foreground hover:border-primary hover:text-foreground'
                    }`}
                    onClick={() => setForm((prev) => ({ ...prev, type: prev.type === 'apartment' ? '' : 'apartment' }))}
                >
                    <p> квартира,</p> <p> апартаменты</p>
                </div>
            </div>
            <p className="mt-3 text-sm text-muted-foreground"> Выберите тип объекта (пока доступна только квартира)</p>
        </fieldset>
    );
}
