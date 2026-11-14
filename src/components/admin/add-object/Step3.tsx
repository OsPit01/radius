import { FieldGroup, FieldRequired } from '@/shared/ui/field';

import { BasicInfo } from './step3/BasicInfo';
import { CheckInOut } from './step3/CheckInOut';
import { DescriptionAndRules } from './step3/DescriptionAndRules';
import { ParamsAndAmenities } from './step3/ParamsAndAmenities';
import { PayerRequisites } from './step3/PayerRequisites';

export function Step3() {
    return (
        <div className="animate-[fadeIn_0.3s_ease] text-foreground">
            <h2 className="mb-3 text-[17px] text-foreground">Шаг 3 из 4: Детали объекта</h2>
            <p className="text-sm text-muted-foreground">
                Поля, отмеченные <FieldRequired />, обязательны
            </p>

            <FieldGroup className="mt-5">
                <BasicInfo />
                <ParamsAndAmenities />
                <DescriptionAndRules />
                <CheckInOut />
                <PayerRequisites />
            </FieldGroup>
        </div>
    );
}
