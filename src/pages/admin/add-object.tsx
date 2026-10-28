import React from 'react';

import Link from 'next/link';

import {
    createEmptyApartmentForm,
    type StepNumber,
    toCreateInput,
    validateStep,
} from '@/components/admin/add-object/form';
import { Step1 } from '@/components/admin/add-object/Step1';
import { Step2 } from '@/components/admin/add-object/Step2';
import { Step3 } from '@/components/admin/add-object/Step3';
import { Step4 } from '@/components/admin/add-object/Step4';
import { ArrowLeft, ArrowRight, Plus } from '@/components/icons';
import { ClientHeader } from '@/components/layout/ClientHeader';
import { requireAuth } from '@/server/auth/require-auth';
import { Button, buttonVariants } from '@/shared/ui/button';
import { api } from '@/trpc/react';

export const getServerSideProps = requireAuth;

const STEPS: readonly StepNumber[] = [1, 2, 3, 4];
const LAST_STEP: StepNumber = 4;

export default function AddObjectPage() {
    const utils = api.useUtils();

    const [step, setStep] = React.useState<StepNumber>(1);
    const [form, setForm] = React.useState(createEmptyApartmentForm());
    // Ошибки показываем только после нажатия «Далее»: пока человек не закончил, подсвечивать пустые поля рано
    const [attempted, setAttempted] = React.useState(false);
    const [isUploading, setIsUploading] = React.useState(false);

    const createApartment = api.apartment.create.useMutation({
        onSuccess: () => utils.apartment.getAll.invalidate(),
    });

    const validation = React.useMemo(() => validateStep(step, form), [step, form]);
    const showErrors = attempted && !validation.isValid;

    // Шаги разной высоты: без этого новый шаг открывается на уровне нажатой кнопки
    React.useEffect(() => {
        window.scrollTo({ top: 0 });
    }, [step]);

    const handleBack = () => {
        setAttempted(false);
        setStep((prev) => (prev - 1) as StepNumber);
    };

    const handleNext = () => {
        if (!validation.isValid) {
            setAttempted(true);
            return;
        }
        setAttempted(false);
        setStep((prev) => (prev + 1) as StepNumber);
    };

    const handleSubmit = () => {
        // К последнему шагу все предыдущие уже проходили проверку, но на всякий случай проверяем форму целиком
        for (const stepToCheck of STEPS) {
            if (!validateStep(stepToCheck, form).isValid) {
                setStep(stepToCheck);
                setAttempted(true);
                return;
            }
        }
        createApartment.mutate(toCreateInput(form));
    };

    if (createApartment.isSuccess) {
        return (
            <>
                <ClientHeader />

                <div className="mx-auto my-6 max-w-[800px] rounded-[24px] border border-border bg-card p-10 text-center shadow-[0_10px_30px_rgba(0,0,0,0.08)] max-[640px]:p-5">
                    <h1 className="mb-4 text-[28px] text-primary">Объект добавлен</h1>
                    <p className="mb-6 text-base text-foreground">
                        Ваш объект успешно добавлен и находится на модерации. После проверки модератором он появится в
                        каталоге.
                    </p>
                    <Link
                        href="/"
                        className={buttonVariants()}
                    >
                        На главную
                    </Link>
                </div>
            </>
        );
    }

    return (
        <>
            <ClientHeader />

            <div>
                <div className="mx-auto my-6 max-w-[800px] rounded-[24px] border border-border bg-card p-10 shadow-[0_10px_30px_rgba(0,0,0,0.08)] max-[640px]:p-5">
                    <h1 className="mb-[30px] text-center text-[28px] text-primary">Создание объекта</h1>

                    <form
                        className="flex flex-col gap-5"
                        onSubmit={(e) => {
                            e.preventDefault();
                            // Enter в поле адреса тоже отправляет форму, но на промежуточных шагах это не отправка
                            if (step === LAST_STEP) {
                                handleSubmit();
                            }
                        }}
                    >
                        {step === 1 && (
                            <Step1
                                form={form}
                                setForm={setForm}
                            />
                        )}

                        {step === 2 && (
                            <Step2
                                form={form}
                                setForm={setForm}
                            />
                        )}

                        {step === 3 && (
                            <Step3
                                form={form}
                                setForm={setForm}
                                messages={showErrors ? validation.messages : undefined}
                            />
                        )}

                        {step === 4 && (
                            <Step4
                                form={form}
                                setForm={setForm}
                                messages={showErrors ? validation.messages : undefined}
                                onUploadingChange={setIsUploading}
                            />
                        )}

                        <div className="mt-[30px] flex justify-between gap-2 max-[640px]:flex-col">
                            {step > 1 && (
                                <Button
                                    type="button"
                                    variant="secondary"
                                    className="flex-1"
                                    disabled={createApartment.isPending}
                                    onClick={handleBack}
                                >
                                    <ArrowLeft className="h-5 w-5" />
                                    Назад
                                </Button>
                            )}

                            {step === LAST_STEP ? (
                                <Button
                                    type="submit"
                                    variant="default"
                                    className="flex-1"
                                    disabled={createApartment.isPending || isUploading}
                                >
                                    <Plus className="h-5 w-5" />
                                    {createApartment.isPending ? 'Добавляем...' : 'Добавить квартиру'}
                                </Button>
                            ) : (
                                <Button
                                    type="button"
                                    variant="default"
                                    className="flex-1"
                                    onClick={handleNext}
                                >
                                    Далее
                                    <ArrowRight className="h-5 w-5" />
                                </Button>
                            )}
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}
