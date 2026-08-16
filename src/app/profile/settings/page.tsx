"use client";
import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { AuthGuard } from "@/app/_components/layout/AuthGuard";
import { api } from "@/trpc/react";
import { ClientHeader } from "@/app/_components/layout/ClientHeader";
import Image from "next/image";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";
import { toE164 } from "@/lib/phone";
import { readFileAsDataURL } from "@/lib/file";
import { Modal } from "@/app/_components/ui/Modal";

export default function SettingsPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const apiUtils = api.useUtils();
  const userId = session?.user?.id ?? "";
  // Загрузка данных пользователя
  const { data: user } = api.user.getById.useQuery(
    { id: userId },
    { enabled: !!userId },
  );

  // Мутация обновления
  const updateMutation = api.user.updateProfile.useMutation({
    onSuccess: () => {
      void apiUtils.user.getById.invalidate();
      router.push("/profile");
    },
  });

  // Состояние модалки
  const [modalOpen, setModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Состояние формы
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    patronymic: "",
    phone: "",
    image: "",
  });
  useEffect(() => {
    if (user) {
      setForm({
        firstName: user.firstName ?? "",
        lastName: user.lastName ?? "",
        patronymic: user.patronymic ?? "",
        phone: toE164(user.phone),
        image: user.image ?? "",
      });
    }
  }, [user]);
  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    updateMutation.mutate({
      firstName: form.firstName || undefined,
      lastName: form.lastName || undefined,
      patronymic: form.patronymic || undefined,
      phone: form.phone || undefined,
      image: form.image || undefined,
    });
  };

  // Выбор файла с компьютера
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await readFileAsDataURL(file);
      setForm((prev) => ({ ...prev, image: dataUrl }));
      setModalOpen(false);
    } catch (error) {
      console.error(error);
      alert("Не удалось прочитать файл");
    } finally {
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };
  // const isDirty =
  //   form.firstName !== (user?.firstName ?? "") ||
  //   form.lastName !== (user?.lastName ?? "") ||
  //   form.patronymic !== (user?.patronymic ?? "") ||
  //   form.phone !== (user?.phone ?? "");
  return (
    <>
      <AuthGuard>
        <ClientHeader />
        <div className="mx-auto max-w-[900px] rounded-[25px] px-5 py-10 max-[480px]:px-2.5 max-[480px]:py-5">
          <div className="relative rounded-[15px] bg-[#0e081b] p-10 shadow-[0_2px_8px_rgba(0,0,0,0.08)] max-[480px]:p-4 max-md:p-5">
            <h1 className="text-[28px] font-bold text-white max-md:text-[22px]">
              Редактирование профиля
            </h1>
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="absolute top-10 right-10 cursor-pointer rounded-full transition-opacity hover:opacity-80"
              aria-label="Изменить фото профиля"
            >
              {form.image === "" ? (
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[#3a2a4a] text-[28px]">
                  👤
                </div>
              ) : (
                <Image
                  src={form.image}
                  alt={"avatar"}
                  width={56}
                  height={56}
                  unoptimized
                  className="h-14 w-14 rounded-full object-cover"
                />
              )}
            </button>
            {/*ФОРМА*/}

            <form
              className="autofill-dark mt-10 px-5 pt-5 text-[20px] text-white"
              onSubmit={handleSubmit}
            >
              {/* Имя */}
              <div className="mb-5">
                <label className="pr-5 text-[17px]">Имя:</label>
                <input
                  className="cursor-pointer border-b border-white/30 bg-transparent p-1 pl-2 text-[15px] text-white outline-none focus:border-[#b552c7]"
                  type="text"
                  value={form.firstName}
                  onChange={(e) =>
                    setForm({ ...form, firstName: e.target.value })
                  }
                ></input>
                {form.firstName !== (user?.firstName ?? "") && (
                  <span className="ml-2 inline-block h-2.5 w-2.5 rounded-full bg-green-500"></span>
                )}
              </div>
              {/* фамилия */}
              <div className="mb-5">
                <label className="pr-5 text-[17px]">Фамилия:</label>
                <input
                  className="cursor-pointer border-b border-white/30 bg-transparent p-1 pl-2 text-[15px] text-white outline-none focus:border-[#b552c7]"
                  type="text"
                  value={form.lastName}
                  onChange={(e) =>
                    setForm({ ...form, lastName: e.target.value })
                  }
                ></input>
                {form.lastName !== (user?.lastName ?? "") && (
                  <span className="ml-2 inline-block h-2.5 w-2.5 rounded-full bg-green-500"></span>
                )}
              </div>

              <div className="mb-5 text-[17px]">
                <label className="pr-5">Отчество:</label>
                <input
                  className="cursor-pointer border-b border-white/30 bg-transparent p-1 pl-2 text-[15px] text-white outline-none focus:border-[#b552c7]"
                  type="text"
                  value={form.patronymic}
                  onChange={(e) =>
                    setForm({ ...form, patronymic: e.target.value })
                  }
                ></input>
                {form.patronymic !== (user?.patronymic ?? "") && (
                  <span className="ml-2 inline-block h-2.5 w-2.5 rounded-full bg-green-500"></span>
                )}
              </div>
              <div className="mb-5 flex items-center text-[17px]">
                <label className="pr-5">Номер телефона:</label>
                <PhoneInput
                  international
                  defaultCountry="BY"
                  value={form.phone}
                  onChange={(value) => setForm({ ...form, phone: value ?? "" })}
                  className="w-1/2 border-b border-white/30 bg-transparent p-1 pl-2 text-[15px]"
                />
                {form.phone !== toE164(user?.phone) && (
                  <span className="ml-2 inline-block h-2.5 w-2.5 rounded-full bg-green-500"></span>
                )}
              </div>
              <button
                className="mt-10 cursor-pointer rounded-[30px] bg-[#3a2a4a] px-8 py-3 text-base font-semibold text-white hover:bg-[#4a3a5a]"
                type="submit"
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? "Сохранение... " : "Сохранить"}
              </button>
            </form>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleFileChange}
        />

        <Modal open={modalOpen} onClose={() => setModalOpen(false)}>
          <div className="text-center">
            <p className="text-lg text-[#1a1a2e]">
              Хотите поменять фотографию профиля?
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="cursor-pointer rounded-[30px] bg-[#b552c7] px-6 py-2.5 text-base font-semibold text-white hover:bg-[#a244b2]"
              >
                Выбрать фото
              </button>
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="cursor-pointer rounded-[30px] border border-[#ddd] px-6 py-2.5 text-base font-semibold text-[#1a1a2e] hover:bg-gray-100"
              >
                Отмена
              </button>
            </div>
          </div>
        </Modal>
      </AuthGuard>
    </>
  );
}
