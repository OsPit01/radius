import React from 'react';
import { FormProvider, useForm } from 'react-hook-form';

import Link from 'next/link';

import {
    type ApartmentForm,
    apartmentFormResolver,
    createEmptyApartmentForm,
    getFirstInvalidStep,
    getStepError,
    STEP_FIELDS,
    type StepNumber,
    toCreateInput,
} from '@/components/admin/add-object/form';
import { Step1 } from '@/components/admin/add-object/Step1';
import { Step2 } from '@/components/admin/add-object/Step2';
import { Step3 } from '@/components/admin/add-object/Step3';
import { Step4 } from '@/components/admin/add-object/Step4';
import { ArrowLeft, ArrowRight, Plus, Warning } from '@/components/icons';
import { ClientHeader } from '@/components/layout/ClientHeader';
import { requireAuth } from '@/server/auth/require-auth';
import { Button, buttonVariants } from '@/shared/ui/button';
import { api } from '@/trpc/react';

export const getServerSideProps = requireAuth;

const LAST_STEP: StepNumber = 4;

const UNAUTHORIZED_MESSAGE = 'Сессия истекла. Войдите в аккаунт и попробуйте ещё раз';
const SUBMIT_ERROR_MESSAGE = 'Не удалось добавить объект. Проверьте данные и попробуйте ещё раз';

export default function AddObjectPage() {
    const utils = api.useUtils();

    const [step, setStep] = React.useState<StepNumber>(1);
    const [attempted, setAttempted] = React.useState(false);
    const [isUploading, setIsUploading] = React.useState(false);
    const [submitError, setSubmitError] = React.useState<string | null>(null);

    const form = useForm<ApartmentForm>({
        defaultValues: createEmptyApartmentForm(),
        resolver: apartmentFormResolver,
    });

    const { clearErrors, handleSubmit, trigger, watch } = form;

    const createApartment = api.apartment.create.useMutation({
        onSuccess: () => utils.apartment.getAll.invalidate(),
        onError: (error) => {
            switch (error.data?.code) {
                case 'UNAUTHORIZED':
                    setSubmitError(UNAUTHORIZED_MESSAGE);
                    break;
                case 'FORBIDDEN':
                    setSubmitError(error.message);
                    break;
                default:
                    setSubmitError(SUBMIT_ERROR_MESSAGE);
            }
        },
    });

    // Шаги разной высоты: без этого новый шаг открывается на уровне нажатой кнопки
    React.useEffect(() => {
        window.scrollTo({ top: 0 });
    }, [step]);

    // До первой неудачной попытки ошибок нет. После неё поля шага перепроверяются при каждом изменении:
    // ошибка уходит, как только значение стало верным
    React.useEffect(() => {
        if (!attempted) {
            return;
        }
        const subscription = watch(() => {
            void trigger([...STEP_FIELDS[step]]);
        });
        return () => subscription.unsubscribe();
    }, [attempted, step, trigger, watch]);

    const handleBack = () => {
        setAttempted(false);
        clearErrors();
        setSubmitError(null);
        setStep((prev) => (prev - 1) as StepNumber);
    };

    const handleNext = async () => {
        // Не handleSubmit: он проверяет всю форму и после первого вызова включает проверку на каждый ввод у всех шагов.
        // trigger берёт только поля этого шага; shouldFocus — при ошибке фокус уходит на первое неверное поле
        const isValid = await trigger([...STEP_FIELDS[step]], { shouldFocus: true });
        if (!isValid) {
            setAttempted(true);
            return;
        }
        setAttempted(false);
        setStep((step + 1) as StepNumber);
    };

    const submit = handleSubmit(
        (values) => {
            setSubmitError(null);
            createApartment.mutate(toCreateInput(values));
        },
        (errors) => {
            // Форма проверяется целиком: ошибка на уже пройденном шаге не должна остаться незамеченной
            setAttempted(true);
            setStep(getFirstInvalidStep(errors) ?? LAST_STEP);
        },
    );

    // Сообщение для шагов без поля ввода рядом с ошибкой (тип, адрес); у остальных ошибки видны у самих полей
    const stepError = step <= 2 ? getStepError(step, form.formState.errors) : null;
    const alertMessage = stepError ?? submitError;

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

                    <FormProvider {...form}>
                        <form
                            className="flex flex-col gap-5"
                            onSubmit={(e) => {
                                e.preventDefault();
                                void submit(e);
                            }}
                        >
                            {step === 1 && <Step1 />}

                            {step === 2 && <Step2 />}

                            {step === 3 && <Step3 />}

                            {step === 4 && <Step4 onUploadingChange={setIsUploading} />}

                            {alertMessage && (
                                <div
                                    role="alert"
                                    className="flex items-start gap-2 rounded-xl bg-destructive/10 p-3 text-sm text-destructive"
                                >
                                    <Warning className="mt-0.5 size-4 shrink-0" />
                                    <p>{alertMessage}</p>
                                </div>
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
                                        onClick={() => void handleNext()}
                                    >
                                        Далее
                                        <ArrowRight className="h-5 w-5" />
                                    </Button>
                                )}
                            </div>
                        </form>
                    </FormProvider>
                </div>
            </div>
        </>
    );
}
