"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/trpc/react";
import { Step1_Type } from "./steps/Step1_Type";
import { Step2_City } from "./steps/Step2_City";
import { Step3_Address } from "./steps/Step3_Address";
import { Step4_Details } from "./steps/Step4_Details";
import { Step5_Images } from "./steps/Step5_Images";
import { NavigationButtons } from "./components/NavigationButtons";
import { ClientHeader } from "@/app/_components/layout/ClientHeader";
import {
  formatApartmentData,
  validateStep,
  updateFieldWithAddress,
  type FormData,
} from "@/lib/utils";

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
    beds: 0,
    singleBeds: 0,
    doubleSofas: 0,
    singleSofas: 0,
    image: "",
    description: "",
    rules: "",
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
  const goToNextStep = async () => {
    console.log("🔍 currentStep:", currentStep);
    console.log("📦 formData.images:", formData.images);
    console.log("📦 formData.image:", formData.image);
    const validation = validateStep(currentStep, formData);
    console.log("✅ validation:", validation);
    if (!validation.isValid) {
      console.log("❌ Ошибка валидации:", validation.error, validation.fields);
      setError(validation.error ?? null);
      setErrorFields(validation.fields ?? []);
      return;
    }
    setError(null);
    setErrorFields([]);
    if (currentStep === 5) {
      console.log("🟢 5 шаг, вызываем handleSubmit");
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
        <div className="mx-auto my-6 max-w-[800px] rounded-[24px] border-2 border-white bg-[#0d021d] p-10 shadow-[0_10px_30px_white] max-[640px]:p-5">
          {/* Восстановлен ваш оригинальный h1 */}
          <h1
            className="mb-[30px] text-center text-[28px] text-[#c4deeb]"
            onClick={() => null}
          >
            {" "}
            Создание обьекта{" "}
          </h1>

          {/* Восстановлена ваша РОДНАЯ форма, CSS будет работать идеально */}
          <form
            className="flex flex-col gap-5"
            onSubmit={(e) => {
              e.preventDefault();
            }}
          >
            {/* Вызываем функцию динамического рендера вместо старого спреда компонентов */}
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
    </>
  );
}
