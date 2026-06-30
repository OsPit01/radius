"use client";

import { useState, type SyntheticEvent } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/trpc/react";
import { Step1_Type } from "./steps/Step1_Type";
import { Step2_City } from "./steps/Step2_City";
import { Step3_Address } from "./steps/Step3_Address";
import { Step4_Details } from "./steps/Step4_Details";
import { NavigationButtons } from "./components/NavigationButtons";
import { StepsIndicator } from "./components/StepsIndicator";
import "./style.css";
import { formatApartmentData, validateStep } from "./utils";
// ===== ТИП ДАННЫХ ФОРМЫ =====
export type FormData = {
  type: string;
  city: string;
  cityError: string;

  street: string;

  building: string;
  house: string;
  district: string;
  addressError: string;
  title: string;
  capacity: number;
  price: number;
  rooms: number;
  image: string;
  description: string;
  metro: string;
};
// ===== ТИП ДЛЯ ПРОПСОВ КАЖДОГО ШАГА =====
// Все шаги принимают одни и те же пропсы
type StepProps = {
  formData: FormData;
  updateField: (field: keyof FormData, value: string | number) => void;
  setFormData: React.Dispatch<React.SetStateAction<FormData>>;
  error?: string | null;
};

export default function AddApartmentPage() {
  const router = useRouter();
  const utils = api.useUtils();

  // ===== СОСТОЯНИЯ ДЛЯ ФОРМЫ =====
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({
    type: "apartment",
    city: "",
    cityError: "",
    street: "",
    building: "",
    house: "",
    district: "",
    addressError: "",
    title: "",
    capacity: 2,
    price: 2000,
    rooms: 1,
    image: "",
    description: "",
    metro: "",
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ===== ФУНКЦИЯ ОБНОВЛЕНИЯ ДАННЫХ =====
  const updateField = (field: keyof FormData, value: string | number) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // ===== MUTATION ДЛЯ СОЗДАНИЯ КВАРТИРЫ =====
  const createApartment = api.apartment.create.useMutation({
    onSuccess: async () => {
      // Очищаем кэш, чтобы список обновился
      await utils.apartment.getAll.invalidate();
      // Перенаправляем на главную
      router.push("/");
    },
    onError: (err) => {
      setError(err.message);
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
      setError(err instanceof Error ? err.message : "Произошла ошибка");
    } finally {
      setIsSubmitting(false);
    }
  };

  // ===== ПЕРЕХОД МЕЖДУ ШАГАМИ =====
  const goToNextStep = () => {
    const validation = validateStep(currentStep, formData);
    if (!validation.isValid) {
      setError(validation.error);
      return;
    }
    setError(null);
    setCurrentStep(currentStep + 1);
  };

  const goToPrevStep = () => {
    setError(null);
    setCurrentStep(currentStep - 1);
  };

  // ===== МАССИВ ШАГОВ С ТИПАМИ =====
  // ОБЪЯСНЕНИЕ: каждый элемент массива — это объект с полем component (компонент шага)
  // и props (пропсы, которые передаются в этот компонент)
  type StepConfig = {
    component: React.ComponentType<StepProps>; // ← это React-компонент
    props: StepProps;
  };

  // ===== ШАГИ =====

  const steps: StepConfig[] = [
    {
      component: Step1_Type as React.ComponentType<StepProps>,
      props: { formData, updateField, setFormData },
    },
    {
      component: Step2_City as React.ComponentType<StepProps>,
      props: { formData, updateField, setFormData, error },
    },
    {
      component: Step3_Address as React.ComponentType<StepProps>,
      props: { formData, updateField, setFormData },
    },
    {
      component: Step4_Details as React.ComponentType<StepProps>,
      props: { formData, updateField, setFormData, error },
    },
  ];
  const currentStepIndex = currentStep - 1;
  const currentStepData = steps[currentStepIndex];

  if (!currentStepData) {
    return <div>Шаг не найден</div>;
  }
  const CurrentStepComponent = currentStepData?.component;
  const stepProps = currentStepData?.props;
  // метод для нашего содержание при выборе и переходе на следующий шаг

  /////////////////////////////////////////////////////
  ////////////////////// RETURN////////////////////////////
  ////////////////////////////////////////////////////////

  return (
    <div className="add-apartment-page">
      <div className="add-apartment-container">
        <h1 onClick={() => null}> Создание обьекта </h1>
        {/*    <StepsIndicator currentStap ={currentStep}/>  */}
        <form
          className="apartment-form"
          onSubmit={async (e) => {
            e.preventDefault();
            if (currentStep === 4) {
              await handleSubmit();
            }
          }}
        >
          <CurrentStepComponent {...stepProps} />
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
