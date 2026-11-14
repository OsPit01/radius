import 'react-phone-number-input/style.css';

import { useEffect, useRef, useState } from 'react';
import PhoneInput from 'react-phone-number-input';

import { useRouter } from 'next/router';
import { useSession } from 'next-auth/react';

import { AuthGuard } from '@/components/layout/AuthGuard';
import { ClientHeader } from '@/components/layout/ClientHeader';
import { AppearanceSettings } from '@/components/settings/AppearanceSettings';
import { ProfilePhotoSection } from '@/components/settings/ProfilePhotoSection';
import { TelegramConnectModal } from '@/components/settings/TelegramConnectModal';
import { TelegramSection } from '@/components/settings/TelegramSection';
import { readFileAsDataURL } from '@/lib/file';
import { getCountryCodePrefixFromNumber, isValidPhoneNumber, toE164 } from '@/lib/phone';
import { canCustomizeTheme } from '@/lib/theme';
import { requireAuth } from '@/server/auth/require-auth';
import { api } from '@/trpc/react';

// Неавторизованных отправляем на вход ещё на сервере
export const getServerSideProps = requireAuth;

export default function SettingsPage() {
    const { data: session } = useSession();
    const router = useRouter();
    const apiUtils = api.useUtils();
    const userId = session?.user?.id ?? '';
    // Загрузка данных пользователя
    const { data: user } = api.user.getById.useQuery({ id: userId }, { enabled: !!userId });

    // Мутация обновления
    const updateMutation = api.user.updateProfile.useMutation({
        onSuccess: () => {
            void apiUtils.user.getById.invalidate();
            void router.push('/profile');
        },
    });

    const uploadImage = api.upload.image.useMutation();

    // Telegram: привязка через одноразовый код
    const startTelegramLink = api.user.startTelegramLink.useMutation({
        onSuccess: (data) => {
            setLinkCode(data.code);
            // Открываем бота сразу с готовым кодом (deep-link) —
            // пользователю не нужно ничего вводить вручную.
            window.open(`https://t.me/radius_booking_bot?start=${data.code}`, '_blank');
        },
    });
    const confirmTelegramLink = api.user.confirmTelegramLink.useMutation({
        onSuccess: () => {
            void apiUtils.user.getById.invalidate();
            setLinkCode('');
        },
    });
    const clearTelegramLink = api.user.clearTelegramLink.useMutation({
        onSuccess: () => void apiUtils.user.getById.invalidate(),
    });

    // Состояние модалки
    const [modalOpen, setModalOpen] = useState(false);
    const [linkCode, setLinkCode] = useState('');
    // Последний известный "+код" страны ("+375", "+7" и т.д.) — чтобы восстановить
    // код, если пользователь его стёр. Работает для любой страны.
    const lastPhonePrefixRef = useRef('+375');
    const fileInputRef = useRef<HTMLInputElement>(null);
    // Состояние формы
    const [form, setForm] = useState({
        name: '',
        firstName: '',
        lastName: '',
        patronymic: '',
        phone: '',
        image: '',
    });
    useEffect(() => {
        if (user) {
            const phone = toE164(user.phone);
            // Запоминаем код страны телефона пользователя, чтобы защищать его от стирания.
            if (phone) {
                const prefix = getCountryCodePrefixFromNumber(phone);
                if (prefix) {
                    lastPhonePrefixRef.current = prefix;
                }
            }
            setForm({
                name: user.name ?? '',
                firstName: user.firstName ?? '',
                lastName: user.lastName ?? '',
                patronymic: user.patronymic ?? '',
                phone,
                image: user.image ?? '',
            });
        }
    }, [user]);
    const handleSubmit = (e: React.SyntheticEvent) => {
        e.preventDefault();
        if (form.phone && !isValidPhoneNumber(form.phone)) {
            alert('Введите корректный номер телефона');
            return;
        }
        updateMutation.mutate({
            name: [form.firstName, form.lastName].filter(Boolean).join(' ') || undefined,
            firstName: form.firstName || undefined,
            lastName: form.lastName || undefined,
            patronymic: form.patronymic || undefined,
            phone: form.phone || undefined,
            image: form.image || undefined,
        });
    };

    // Код страны телефона стирать нельзя, причём для ЛЮБОЙ страны (не только BY/RU).
    const handlePhoneChange = (value?: string) => {
        const next = value ?? '';
        if (next.startsWith('+')) {
            const prefix = getCountryCodePrefixFromNumber(next);
            if (prefix) {
                lastPhonePrefixRef.current = prefix;
            }
            setForm((prev) => ({ ...prev, phone: next }));
            return;
        }
        const digits = next.replace(/\D/g, '');
        const prefixDigits = lastPhonePrefixRef.current.slice(1);
        const national = digits.startsWith(prefixDigits) ? digits.slice(prefixDigits.length) : digits;
        setForm((prev) => ({
            ...prev,
            phone: lastPhonePrefixRef.current + national,
        }));
    };

    // Выбор файла с компьютера
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) {
            return;
        }
        try {
            const dataUrl = await readFileAsDataURL(file);
            const res = await uploadImage.mutateAsync({ dataUrl });
            setForm((prev) => ({ ...prev, image: res.url }));
            setModalOpen(false);
        } catch {
            alert('Не удалось загрузить фото');
        } finally {
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
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
                    <div className="relative rounded-[15px] bg-card p-10 shadow-[0_2px_8px_rgba(0,0,0,0.08)] max-[480px]:p-4 max-md:p-5">
                        <h1 className="text-[28px] font-bold text-foreground max-md:text-[22px]">
                            Редактирование профиля
                        </h1>
                        {/* Изменить фото профиля */}
                        <ProfilePhotoSection
                            image={form.image}
                            modalOpen={modalOpen}
                            onOpenModal={() => setModalOpen(true)}
                            onCloseModal={() => setModalOpen(false)}
                            fileInputRef={fileInputRef}
                            onFileChange={handleFileChange}
                        />

                        {/*ФОРМА*/}

                        <form
                            className="mt-10 px-5 pt-5 text-[20px] text-foreground"
                            onSubmit={handleSubmit}
                        >
                            {/* Имя */}
                            <div className="mb-5">
                                <label className="pr-5 text-[17px]">Имя:</label>
                                <input
                                    className="cursor-pointer border-b border-border bg-transparent p-1 pl-2 text-[15px] text-foreground outline-none focus:border-primary"
                                    type="text"
                                    value={form.firstName}
                                    onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                                ></input>
                                {form.firstName !== (user?.firstName ?? '') && (
                                    <span className="ml-2 inline-block h-2.5 w-2.5 rounded-full bg-success"></span>
                                )}
                            </div>
                            {/* фамилия */}
                            <div className="mb-5">
                                <label className="pr-5 text-[17px]">Фамилия:</label>
                                <input
                                    className="cursor-pointer border-b border-border bg-transparent p-1 pl-2 text-[15px] text-foreground outline-none focus:border-primary"
                                    type="text"
                                    value={form.lastName}
                                    onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                                ></input>
                                {form.lastName !== (user?.lastName ?? '') && (
                                    <span className="ml-2 inline-block h-2.5 w-2.5 rounded-full bg-success"></span>
                                )}
                            </div>

                            <div className="mb-5 text-[17px]">
                                <label className="pr-5">Отчество:</label>
                                <input
                                    className="cursor-pointer border-b border-border bg-transparent p-1 pl-2 text-[15px] text-foreground outline-none focus:border-primary"
                                    type="text"
                                    value={form.patronymic}
                                    onChange={(e) => setForm({ ...form, patronymic: e.target.value })}
                                ></input>
                                {form.patronymic !== (user?.patronymic ?? '') && (
                                    <span className="ml-2 inline-block h-2.5 w-2.5 rounded-full bg-success"></span>
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
                                    className="w-full border-b border-border bg-transparent p-1 pl-2 text-[15px] md:w-1/2"
                                />
                                {form.phone !== toE164(user?.phone) && (
                                    <span className="ml-2 inline-block h-2.5 w-2.5 rounded-full bg-success"></span>
                                )}
                            </div>
                            {/* Telegram уведомления о бронированиях */}
                            <TelegramSection
                                connected={!!user?.telegramChatId}
                                isConnecting={startTelegramLink.isPending}
                                onConnect={() => startTelegramLink.mutate()}
                                onDisconnect={() => clearTelegramLink.mutate()}
                            />

                            <button
                                className="mt-10 cursor-pointer rounded-[30px] bg-primary px-8 py-3 text-base font-semibold text-primary-foreground hover:bg-primary/90"
                                type="submit"
                                disabled={updateMutation.isPending}
                            >
                                {updateMutation.isPending ? 'Сохранение... ' : 'Сохранить'}
                            </button>
                        </form>
                    </div>
                    {/* Внешний вид — пока только для суперадминов */}
                    {canCustomizeTheme(session?.user?.role) && <AppearanceSettings />}
                </div>

                {/* Модалка привязки Telegram */}
                <TelegramConnectModal
                    open={!!linkCode}
                    onClose={() => setLinkCode('')}
                    isSuccess={confirmTelegramLink.isSuccess}
                    isPending={confirmTelegramLink.isPending}
                    errorMessage={confirmTelegramLink.error?.message ?? null}
                    onConfirm={() => confirmTelegramLink.mutate()}
                    onDone={() => {
                        confirmTelegramLink.reset();
                        setLinkCode('');
                    }}
                />
            </AuthGuard>
        </>
    );
}
