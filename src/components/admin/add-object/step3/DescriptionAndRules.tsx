import { useFormContext } from 'react-hook-form';

import { Field, FieldError, FieldLabel } from '@/shared/ui/field';
import { Textarea } from '@/shared/ui/textarea';

import type { ApartmentForm } from '../form';

// Описание и правила проживания.
export function DescriptionAndRules() {
    const {
        register,
        formState: { errors },
    } = useFormContext<ApartmentForm>();

    return (
        <>
            <Field invalid={Boolean(errors.description)}>
                <FieldLabel>Описание</FieldLabel>
                <Textarea
                    {...register('description')}
                    rows={4}
                    placeholder="Опишите квартиру, особенности, что рядом находится..."
                />
                <FieldError>{errors.description?.message}</FieldError>
            </Field>

            <Field invalid={Boolean(errors.rules)}>
                <FieldLabel>Правила проживания</FieldLabel>
                <Textarea
                    {...register('rules')}
                    rows={4}
                    placeholder="Например: без вечеринок, без животных, курение запрещено, заезд после 14:00..."
                />
                <FieldError>{errors.rules?.message}</FieldError>
            </Field>
        </>
    );
}
