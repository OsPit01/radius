import { useState } from 'react';

import Link from 'next/link';

import { Plus } from '@/components/icons';
import { AuthGuard } from '@/components/layout/AuthGuard';
import { ClientHeader } from '@/components/layout/ClientHeader';
import { ImageWithFallback } from '@/components/ui/ImageWithFallback';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Modal } from '@/components/ui/Modal';
import { useMyApartments } from '@/hooks/useApartments';
import { formatByn, getStatusInfo } from '@/lib/constants';
import { requireAuth } from '@/server/auth/require-auth';

// Неавторизованных отправляем на вход ещё на сервере
export const getServerSideProps = requireAuth;

export default function MyApartmentsPage() {
    const { myApartments, isLoading, error, count, handleDelete, isDeleting } = useMyApartments();

    const [deleteTarget, setDeleteTarget] = useState<{
        id: number;
        title: string;
    } | null>(null);

    // ===== ЗАГРУЗКА =====
    if (isLoading) {
        return (
            <>
                <ClientHeader />
                <LoadingSpinner label="Загрузка..." />
            </>
        );
    }

    // ===== ОШИБКА =====
    if (error) {
        return (
            <AuthGuard>
                <div className="p-[60px_20px] text-center text-lg">Ошибка: {error.message}</div>
            </AuthGuard>
        );
    }

    // ===== ОСНОВНОЙ РЕНДЕР =====
    return (
        <>
            <AuthGuard>
                <ClientHeader />
                <div className="mx-auto mt-auto max-w-[1200px] px-5 py-10 max-md:px-4 max-md:py-5">
                    <div className="mb-2 flex flex-wrap items-center gap-4">
                        <span className="text-[28px] font-bold text-foreground max-md:text-[22px]">Мои объекты</span>
                        <span className="rounded-[20px] bg-primary px-3.5 py-0.5 text-base font-semibold text-primary-foreground">
                            {count}
                        </span>
                    </div>

                    <p className="mb-8 text-base text-muted-foreground">
                        Всего {count} {count === 1 ? 'объявление' : 'объявлений'}
                    </p>

                    {myApartments && myApartments.length > 0 ? (
                        // Карточки
                        <div className="grid grid-cols-4 gap-4 max-lg:grid-cols-2 max-md:grid-cols-1">
                            {myApartments.map((item, index) => {
                                const s = getStatusInfo(item.apartment.status);
                                return (
                                    <div
                                        key={item.apartment.id}
                                        className="flex flex-col gap-2.5 overflow-hidden rounded-2xl bg-card shadow-[0_2px_8px_rgba(0,0,0,0.08)] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_12px_32px_rgba(0,0,0,0.12)]"
                                    >
                                        {/* Верх карточки: на мобилке — строка «фото + шапка»,
                                            на десктопе — столбик «фото, потом контент».
                                            flex-row СТРОГО на этой обёртке, не на карточке:
                                            иначе низ карточки встал бы в ту же строку сбоку. */}
                                        <div className="flex flex-col max-md:flex-row">
                                            {/* Фотография: на мобилке — квадратная миниатюра слева от шапки */}
                                            <div className="relative h-[190px] w-full shrink-0 overflow-hidden bg-muted max-md:aspect-square max-md:h-auto max-md:w-[110px]">
                                                <ImageWithFallback
                                                    src={item.apartment.images?.[0]}
                                                    alt={item.apartment.title}
                                                    fill
                                                    className="object-cover"
                                                    sizes="(max-width: 768px) 110px, (max-width: 1024px) 50vw, 25vw"
                                                    priority={index < 3}
                                                />
                                            </div>
                                            {/* ШАПКА: заголовок + город + цена — на мобилке стоят рядом с фото */}
                                            <div className="flex min-w-0 flex-1 flex-col gap-1 p-4 max-md:p-3">
                                                <span className="line-clamp-2 block text-sm leading-[1.3] font-semibold text-foreground max-md:text-[13px]">
                                                    {item.apartment.title}
                                                </span>
                                                <p className="text-xs text-muted-foreground">{item.apartment.city}</p>
                                                <p className="text-[22px] font-bold text-foreground max-md:text-base">
                                                    {formatByn(item.apartment.price)}
                                                </p>
                                            </div>
                                        </div>
                                        {/* НИЗ: на десктопе — столбик (кнопки, ниже ID+статус),
                                            на мобилке — ОДНА строка: ID слева, кнопки справа.
                                            flex-row-reverse визуально переворачивает порядок детей:
                                            в DOM кнопки идут первыми (удобно для скринридеров),
                                            а на экране мобилки ID оказывается слева. */}
                                        <div className="mt-auto flex flex-col gap-1.5 px-4 pb-4 max-md:flex-row-reverse max-md:items-center max-md:justify-between max-md:gap-3 max-md:px-3 max-md:pb-3">
                                            <div className="flex flex-wrap gap-2 max-md:gap-1.5">
                                                <Link
                                                    href={`/my-apartments/${item.apartment.id}/edit`}
                                                    className="inline-block rounded-[30px] bg-foreground px-4 py-2 text-xs font-medium text-background no-underline transition-colors duration-200 hover:bg-primary hover:text-primary-foreground"
                                                >
                                                    Редактировать
                                                </Link>
                                                <button
                                                    onClick={() =>
                                                        setDeleteTarget({
                                                            id: item.apartment.id,
                                                            title: item.apartment.title,
                                                        })
                                                    }
                                                    disabled={isDeleting}
                                                    className="cursor-pointer rounded-[30px] border-none bg-destructive px-4 py-2 text-xs font-medium text-destructive-foreground transition-colors duration-200 hover:bg-destructive/90 disabled:cursor-not-allowed disabled:opacity-50"
                                                >
                                                    Удалить
                                                </button>
                                            </div>
                                            {/* ИНДИКАТОР СТАТУСА + тултип при наведении.
                                                pt-2 — только десктоп (там ID-строка под кнопками);
                                                на мобиле строка встаёт в ряд с кнопками — отступ не нужен */}
                                            <div className="flex items-center justify-between pt-2 max-md:pt-0">
                                                <span className="text-[13px] font-bold text-muted-foreground">
                                                    {' '}
                                                    ID: {item.apartment.id}{' '}
                                                </span>
                                                <span
                                                    className="group relative ml-auto hidden h-4 w-4 cursor-help rounded-[35px] sm:inline-block"
                                                    style={{ background: s.color }}
                                                >
                                                    <span className="pointer-events-none absolute top-1/2 right-full mr-2 -translate-y-1/2 rounded-lg bg-foreground px-2 py-1 text-xs whitespace-nowrap text-background opacity-0 transition-opacity duration-150 group-hover:opacity-100">
                                                        Статус: {s.label}
                                                    </span>
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="rounded-2xl bg-muted p-[80px_20px] text-center">
                            <p className="mb-5 text-lg text-muted-foreground">У вас пока нет добавленных объектов</p>
                            <Link
                                href="/admin/add-object"
                                className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-[30px] border-none bg-primary px-8 py-3 text-base font-semibold text-primary-foreground no-underline transition-colors duration-200 hover:bg-primary/90 max-[480px]:w-full max-[480px]:text-center"
                            >
                                <Plus className="h-5 w-5" />
                                Добавить квартиру
                            </Link>
                        </div>
                    )}
                </div>
            </AuthGuard>

            <Modal
                open={deleteTarget !== null}
                onClose={() => setDeleteTarget(null)}
                title="Удалить объект"
            >
                <p className="text-base text-foreground">Вы уверены, что хотите удалить «{deleteTarget?.title}»?</p>
                <div className="mt-6 flex justify-center gap-3">
                    <button
                        type="button"
                        onClick={() => {
                            if (deleteTarget) {
                                handleDelete(deleteTarget.id);
                            }
                            setDeleteTarget(null);
                        }}
                        disabled={isDeleting}
                        className="cursor-pointer rounded-[30px] bg-destructive px-6 py-2.5 text-base font-semibold text-destructive-foreground transition-colors hover:bg-destructive/90 disabled:opacity-50"
                    >
                        {isDeleting ? 'Удаление...' : 'Да, удалить'}
                    </button>
                    <button
                        type="button"
                        onClick={() => setDeleteTarget(null)}
                        className="cursor-pointer rounded-[30px] border border-border px-6 py-2.5 text-base font-semibold text-foreground transition-colors hover:bg-muted"
                    >
                        Отмена
                    </button>
                </div>
            </Modal>
        </>
    );
}
