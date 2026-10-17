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
import { getCountryCodePrefixFromNumber, toE164, isValidPhoneNumber } from "@/lib/phone";
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

  const uploadImage = api.upload.image.useMutation();

  // Telegram: привязка через одноразовый код
  const startTelegramLink = api.user.startTelegramLink.useMutation({
    onSuccess: (data) => {
      setLinkCode(data.code);
      // Открываем бота сразу с готовым кодом (deep-link) —
      // пользователю не нужно ничего вводить вручную.
      window.open(`https://t.me/radius_booking_bot?start=${data.code}`, "_blank");
    },
  });
  const confirmTelegramLink = api.user.confirmTelegramLink.useMutation({
    onSuccess: () => {
      void apiUtils.user.getById.invalidate();
      setLinkCode("");
    },
  });
  const clearTelegramLink = api.user.clearTelegramLink.useMutation({
    onSuccess: () => void apiUtils.user.getById.invalidate(),
  });

  // Состояние модалки
  const [modalOpen, setModalOpen] = useState(false);
  const [linkCode, setLinkCode] = useState("");
  // Последний известный "+код" страны ("+375", "+7" и т.д.) — чтобы восстановить
  // код, если пользователь его стёр. Работает для любой страны.
  const lastPhonePrefixRef = useRef("+375");
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Состояние формы
  const [form, setForm] = useState({
    name: "",
    firstName: "",
    lastName: "",
    patronymic: "",
    phone: "",
    image: "",
  });
  useEffect(() => {
    if (user) {
      const phone = toE164(user.phone);
      // Запоминаем код страны телефона пользователя, чтобы защищать его от стирания.
      if (phone) {
        const prefix = getCountryCodePrefixFromNumber(phone);
        if (prefix) lastPhonePrefixRef.current = prefix;
      }
      setForm({
        name: user.name ?? "",
        firstName: user.firstName ?? "",
        lastName: user.lastName ?? "",
        patronymic: user.patronymic ?? "",
        phone,
        image: user.image ?? "",
      });
    }
  }, [user]);
  const handleSubmit = (e: React.SyntheticEvent) => {
    e.preventDefault();
    if (form.phone && !isValidPhoneNumber(form.phone)) {
      alert("Введите корректный номер телефона");
      return;
    }
    updateMutation.mutate({
      name:
        [form.firstName, form.lastName].filter(Boolean).join(" ") || undefined,
      firstName: form.firstName || undefined,
      lastName: form.lastName || undefined,
      patronymic: form.patronymic || undefined,
      phone: form.phone || undefined,
      image: form.image || undefined,
    });
  };

  // Код страны телефона стирать нельзя, причём для ЛЮБОЙ страны (не только BY/RU).
  const handlePhoneChange = (value?: string) => {
    const next = value ?? "";
    if (next.startsWith("+")) {
      const prefix = getCountryCodePrefixFromNumber(next);
      if (prefix) lastPhonePrefixRef.current = prefix;
      setForm((prev) => ({ ...prev, phone: next }));
      return;
    }
    const digits = next.replace(/\D/g, "");
    const prefixDigits = lastPhonePrefixRef.current.slice(1);
    const national = digits.startsWith(prefixDigits)
      ? digits.slice(prefixDigits.length)
      : digits;
    setForm((prev) => ({
      ...prev,
      phone: lastPhonePrefixRef.current + national,
    }));
  };

  // Выбор файла с компьютера
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const dataUrl = await readFileAsDataURL(file);
      const res = await uploadImage.mutateAsync({ dataUrl });
      setForm((prev) => ({ ...prev, image: res.url }));
      setModalOpen(false);
    } catch {
      alert("Не удалось загрузить фото");
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
              <div className="mb-5 text-[17px]">
                <label className="pr-5">Номер телефона:</label>
                <PhoneInput
                  international
                  defaultCountry="BY"
                  limitMaxLength
                  value={form.phone}
                  onChange={handlePhoneChange}
                  className="w-full border-b border-white/30 bg-transparent p-1 pl-2 text-[15px] md:w-1/2"
                />
                {form.phone !== toE164(user?.phone) && (
                  <span className="ml-2 inline-block h-2.5 w-2.5 rounded-full bg-green-500"></span>
                )}
              </div>
              {/* Telegram уведомления о бронированиях */}
              <div className="mb-5">
                <p className="text-[17px]">
                  Telegram-уведомления о бронированиях:
                </p>
                {user?.telegramChatId ? (
                  <div className="mt-2 flex items-center gap-3">
                    <span className="inline-flex items-center gap-1 rounded-full bg-green-500/20 px-3 py-1 text-[13px] text-green-300">
                      Подключено
                    </span>
                    <button
                      type="button"
                      onClick={() => clearTelegramLink.mutate()}
                      className="cursor-pointer rounded-full border border-white/20 px-4 py-1.5 text-[13px] text-white/80 hover:text-white"
                    >
                      Отвязать
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => startTelegramLink.mutate()}
                    disabled={startTelegramLink.isPending}
                    className="mt-2 cursor-pointer rounded-[30px] bg-[#3a2a4a] px-6 py-2.5 text-base font-semibold text-white hover:bg-[#4a3a5a] disabled:opacity-60"
                  >
                    {startTelegramLink.isPending
                      ? "Подключаем..."
                      : "Подключить Telegram"}
                  </button>
                )}
                <p className="pt-2 text-[13px] text-white/60">
                  Новые заявки с сайта будут приходить вам в Telegram бот{" "}
                  <span className="text-white/80">@radius_booking_bot</span>
                </p>
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

        {/* Модалка привязки Telegram */}
        <Modal
          open={!!linkCode}
          onClose={() => setLinkCode("")}
        >
          {confirmTelegramLink.isSuccess ? (
            <div className="flex flex-col items-center gap-3 py-4 text-center">
              <p className="text-4xl">✅</p>
              <p className="text-lg font-semibold text-[#1a1a2e]">
                Telegram подключен!
              </p>
              <p className="text-sm text-[#555]">
                Теперь заявки на ваши квартиры будут приходить вам в бот{" "}
                @radius_booking_bot
              </p>
              <button
                type="button"
                onClick={() => {
                  confirmTelegramLink.reset();
                  setLinkCode("");
                }}
                className="mt-2 cursor-pointer rounded-[30px] bg-[#b552c7] px-6 py-2.5 text-base font-semibold text-white hover:bg-[#a244b2]"
              >
                Готово
              </button>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-[17px] font-semibold text-[#1a1a2e]">
                Подключение Telegram
              </p>
              <p className="mt-3 text-sm text-[#555]">
                1. Мы открыли бота{" "}
                <span className="font-medium text-[#6b21a8]">
                  @radius_booking_bot
                </span>{" "}
                в Telegram
              </p>
              <p className="mt-1 text-sm text-[#555]">
                2. Нажмите в нём кнопку «Запустить» (Start)
              </p>
              <button
                type="button"
                onClick={() => confirmTelegramLink.mutate()}
                disabled={confirmTelegramLink.isPending}
                className="mt-5 cursor-pointer rounded-[30px] bg-[#b552c7] px-6 py-2.5 text-base font-semibold text-white hover:bg-[#a244b2] disabled:opacity-60"
              >
                {confirmTelegramLink.isPending
                  ? "Проверяем..."
                  : "Я нажал «Запустить» — проверить"}
              </button>
              {confirmTelegramLink.error && (
                <p className="mx-auto mt-3 max-w-xs text-sm text-red-600">
                  {confirmTelegramLink.error.message}
                </p>
              )}
            </div>
          )}
        </Modal>
      </AuthGuard>
    </>
  );
}
