"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/trpc/react";
import { Step1_Type } from "./steps/Step1_Type";
import { Step2_City } from "./steps/Step2_City";
import { Step3_Address } from "./steps/Step3_Address";
import { Step4_Details } from "./steps/Step4_Details";
import { NavigationButtons } from "./components/NavigationButtons";
import {
  formatApartmentData,
  validateStep,
  updateFieldWithAddress,
} from "./utils";
import "./style.css";
// ===== ТИП ДАННЫХ ФОРМЫ =====
export type FormData = {
  type: string;
  city: string;
  cityError: string;
  street: string;
  numberHome: string;
  building: string;
  formattedAddress: string;
  district: string;
  addressError: string;
  title: string;
  capacity: number;
  price: number;
  currency: string;
  rooms: number;
  image: string;
  description: string;
  metro: string;
  amenities: string[];
  parking: string;
  images: string[];
};

// ===== ТИП ДЛЯ ПРОПСОВ КАЖДОГО ШАГА =====
type StepProps = {
  formData: FormData;
  updateField: (
    field: keyof FormData,
    value: string | number | string[],
  ) => void;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  error?: string | null;
  errorFields: (keyof FormData)[];
};

export default function AddApartmentPage() {
  const router = useRouter();
  const utils = api.useUtils();

  // ===== СОСТОЯНИЯ ДЛЯ ФОРМЫ =====
  const [currentStep, setCurrentStep] = useState(1);

  // ЧТО И ЗАЧЕМ ТУТ МЕНЯТЬ: Полностью вернули твой ОРИГИНАЛЬНЫЙ useState со всеми дефолтными полями
  const [formData, setFormData] = useState<FormData>({
    type: "apartment",
    city: "",
    cityError: "",
    street: "",
    numberHome: "",
    building: "",
    formattedAddress: "",
    district: "",
    addressError: "",
    title: "",
    capacity: 2,
    price: 100,
    currency: "BYN",
    rooms: 1,
    image: "",
    description: "",
    metro: "",
    amenities: [],
    parking: "",
    images: [],
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorFields, setErrorFields] = useState<(keyof FormData)[]>([]);

  // ===== ФУНКЦИЯ ОБНОВЛЕНИЯ ДАННЫХ =====
  const updateField = (
    field: keyof FormData,
    value: string | number | string[],
  ) => {
    setFormData((prev) => updateFieldWithAddress(field, value, prev));
    setErrorFields((prev) => prev.filter((f) => f !== field));
  };

  // ===== MUTATION ДЛЯ СОЗДАНИЯ КВАРТИРЫ =====
  const createApartment = api.apartment.create.useMutation({
    onSuccess: async () => {
      await utils.apartment.getAll.invalidate();
      router.push("/");
    },
    onError: (trpcErr) => {
      setError(trpcErr.message ?? "Произошла ошибка при отправке");
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
        setError("Произошла ошибка");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // ===== ПЕРЕХОД МЕЖДУ ШАГАМИ =====
  const goToNextStep = () => {
    const validation = validateStep(currentStep, formData);
    if (!validation.isValid) {
      setError(validation.error ?? null);
      setErrorFields(validation.fields ?? []);
      return;
    }
    setError(null);
    setErrorFields([]);
    setCurrentStep(currentStep + 1);
  };

  const goToPrevStep = () => {
    setError(null);
    setErrorFields([]);
    setCurrentStep(currentStep - 1);
  };

  // ЧТО И ЗАЧЕМ ТУТ МЕНЯТЬ: Динамический метод рендеринга.
  // Благодаря ему пропсы внутри шагов всегда свежие, и TypeScript больше не падает.
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
      default:
        return <div>Шаг не найден</div>;
    }
  };

  // CHAT_HELP: Мы полностью удалили отсюда старые строчки const currentStepIndex = currentStep - 1,
  // константы CurrentStepComponent и спред-аргумент stepProps, которые вызывали ошибку ts(2556).

  return (
    <div className="add-apartment-page">
      <div className="add-apartment-container">
        {/* Восстановлен ваш оригинальный h1 */}
        <h1 onClick={() => null}> Создание обьекта </h1>

        {/* Восстановлена ваша РОДНАЯ форма, CSS будет работать идеально */}
        <form
          className="apartment-form"
          onSubmit={async (e) => {
            e.preventDefault();
          }}
        >
          {/* Вызываем функцию динамического рендера вместо старого спреда компонентов */}
          {renderCurrentStep()}

          <NavigationButtons
            currentStep={currentStep}
            totalSteps={4}
            onNext={goToNextStep}
            onPrev={goToPrevStep}
            isSubmitting={isSubmitting}
            isLastStep={currentStep === 4}
          />
        </form>
      </div>
    </div>
  );
}
