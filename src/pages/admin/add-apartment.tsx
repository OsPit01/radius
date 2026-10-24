import { useState } from 'react';

import { useRouter } from 'next/router';

import { NavigationButtons } from '@/components/admin/add-apartment/components/NavigationButtons';
import { Step1_Type } from '@/components/admin/add-apartment/steps/Step1_Type';
import { Step2_City } from '@/components/admin/add-apartment/steps/Step2_City';
import { Step3_Address } from '@/components/admin/add-apartment/steps/Step3_Address';
import { Step4_Details } from '@/components/admin/add-apartment/steps/Step4_Details';
import { Step5_Images } from '@/components/admin/add-apartment/steps/Step5_Images';
import { ClientHeader } from '@/components/layout/ClientHeader';
import { Modal } from '@/components/ui/Modal';
import { formatApartmentData, type FormData, updateFieldWithAddress, validateStep } from '@/lib/utils';
import { requireAuth } from '@/server/auth/require-auth';
import { api } from '@/trpc/react';

// Неавторизованных отправляем на вход ещё на сервере
export const getServerSideProps = requireAuth;

export default function AddApartmentPage() {
    const router = useRouter();
    const utils = api.useUtils();

    // ===== СОСТОЯНИЯ ДЛЯ ФОРМЫ =====
    const [currentStep, setCurrentStep] = useState(1);

    // ЧТО И ЗАЧЕМ ТУТ МЕНЯТЬ: Полностью вернули твой ОРИГИНАЛЬНЫЙ useState со всеми дефолтными полями
    const [formData, setFormData] = useState<FormData>({
        type: 'apartment',
        region: '',
        district: '',
        city: '',
        cityDistrict: '',
        cityError: '',
        street: '',
        streetConfirmed: false,
        numberHome: '',
        building: '',
        microdistrict: '',
        formattedAddress: '',
        addressError: '',
        title: '',
        capacity: 2,
        price: 100,
        currency: 'BYN',
        rooms: 1,
        beds: 0,
        singleBeds: 0,
        doubleSofas: 0,
        singleSofas: 0,
        image: '',
        description: '',
        rules: '',
        metro: '',
        area: 0,
        floor: 0,
        bathrooms: 0,
        amenities: [],
        parking: '',
        images: [],
        checkInTime: '14:00',
        checkOutTime: '12:00',
        payerType: 'individual',
        unp: '',
        payerName: '',
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [errorFields, setErrorFields] = useState<(keyof FormData)[]>([]);
    const [showSuccess, setShowSuccess] = useState(false);

    // ===== ФУНКЦИЯ ОБНОВЛЕНИЯ ДАННЫХ =====
    const updateField = (field: keyof FormData, value: string | number | string[] | boolean) => {
        setFormData((prev) => updateFieldWithAddress(field, value, prev));
        setErrorFields((prev) => prev.filter((f) => f !== field));
    };

    // ===== MUTATION ДЛЯ СОЗДАНИЯ КВАРТИРЫ =====
    const createApartment = api.apartment.create.useMutation({
        onSuccess: async () => {
            await utils.apartment.getAll.invalidate();
            setShowSuccess(true);
        },
        onError: (trpcErr) => {
            setError(trpcErr.message ?? 'Произошла ошибка при отправке');
            setIsSubmitting(false);
        },
    });

    // ===== ОБРАБОТЧИК ОТПРАВКИ ФОРМЫ =====
    const handleSubmit = async () => {
        setIsSubmitting(true);
        setError(null);
        try {
            await createApartment.mutateAsync(formatApartmentData(formData));
        } catch (err) {
            // !!!!! ИСПРАВЛЕНО: явная проверка на Error !!!!!
            if (err instanceof Error) {
                setError(err.message);
            } else {
                setError('Произошла ошибка');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const goToNextStep = async () => {
        const validation = validateStep(currentStep, formData);
        if (!validation.isValid) {
            setError(validation.error ?? null);
            setErrorFields(validation.fields ?? []);
            return;
        }
        setError(null);
        setErrorFields([]);
        if (currentStep === 5) {
            await handleSubmit();
            return;
        }
        setCurrentStep(currentStep + 1);
    };

    const goToPrevStep = () => {
        setError(null);
        setErrorFields([]);
        setCurrentStep(currentStep - 1);
    };

    const renderCurrentStep = () => {
        switch (currentStep) {
            case 1:
                return (
                    <Step1_Type
                        formData={formData}
                        updateField={updateField}
                        setFormData={setFormData}
                        errorFields={errorFields}
                    />
                );
            case 2:
                return (
                    <Step2_City
                        formData={formData}
                        updateField={updateField}
                        setFormData={setFormData}
                        error={error}
                        errorFields={errorFields}
                    />
                );
            case 3:
                return (
                    <Step3_Address
                        formData={formData}
                        updateField={updateField}
                        setFormData={setFormData}
                        error={error}
                        errorFields={errorFields}
                    />
                );
            case 4:
                return (
                    <Step4_Details
                        formData={formData}
                        updateField={updateField}
                        setFormData={setFormData}
                        error={error}
                        errorFields={errorFields}
                    />
                );
            case 5:
                return (
                    <Step5_Images
                        formData={formData}
                        updateField={updateField}
                        setFormData={setFormData}
                        error={error}
                        errorFields={errorFields}
                    />
                );
            default:
                return <div>Шаг не найден</div>;
        }
    };

    return (
        <>
            <ClientHeader />
            <div className="add-apartment-page">
                <div className="mx-auto my-6 max-w-[800px] rounded-[24px] border border-border bg-card p-10 shadow-[0_10px_30px_rgba(0,0,0,0.08)] max-[640px]:p-5">
                    <h1
                        className="mb-[30px] text-center text-[28px] text-primary"
                        onClick={() => null}
                    >
                        {' '}
                        Создание объекта{' '}
                    </h1>

                    <form
                        className="flex flex-col gap-5"
                        onSubmit={(e) => {
                            e.preventDefault();
                        }}
                    >
                        {renderCurrentStep()}

                        <NavigationButtons
                            currentStep={currentStep}
                            onNext={goToNextStep}
                            onPrev={goToPrevStep}
                            isSubmitting={isSubmitting}
                            isLastStep={currentStep === 5}
                        />
                    </form>
                </div>
            </div>

            <Modal
                open={showSuccess}
                onClose={() => router.push('/')}
                title="Объект добавлен"
            >
                <p className="mb-6 text-center text-base text-foreground">
                    Ваш объект успешно добавлен и находится на модерации. После проверки модератором он появится в
                    каталоге.
                </p>
                <button
                    type="button"
                    onClick={() => router.push('/')}
                    className="w-full cursor-pointer rounded-[30px] bg-foreground px-6 py-3 text-base font-medium text-background transition-colors hover:bg-foreground/85"
                >
                    На главную
                </button>
            </Modal>
        </>
    );
}
