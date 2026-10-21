import { useState } from 'react';

import Image from 'next/image';
import Link from 'next/link';

import { AuthGuard } from '@/components/layout/AuthGuard';
import { ClientHeader } from '@/components/layout/ClientHeader';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Modal } from '@/components/ui/Modal';
import { useMyApartments } from '@/hooks/useApartments';
import { getStatusInfo } from '@/lib/constants';
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
                        <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-6 max-md:grid-cols-1">
                            {myApartments.map((item, index) => {
                                const s = getStatusInfo(item.apartment.status);
                                return (
                                    <div
                                        key={item.apartment.id}
                                        className="flex flex-col overflow-hidden rounded-2xl bg-card shadow-[0_2px_8px_rgba(0,0,0,0.08)] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_12px_32px_rgba(0,0,0,0.12)]"
                                    >
                                        <div className="relative h-[300px] w-full overflow-hidden bg-muted max-[480px]:aspect-square max-md:aspect-[16/9] max-md:h-auto">
                                            <Image
                                                src={item.apartment.image}
                                                alt={item.apartment.title}
                                                fill
                                                className="object-cover"
                                                sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                                priority={index < 3}
                                            />
                                        </div>
                                        <div className="flex flex-1 flex-col gap-2 p-5">
                                            <span className="mb-1 block text-lg leading-[1.3] font-semibold text-foreground">
                                                {item.apartment.title}
                                            </span>
                                            <p className="mb-2 text-sm text-muted-foreground">{item.apartment.city}</p>
                                            <p className="mb-3 text-[22px] font-bold text-foreground max-md:text-xl">
                                                {item.apartment.price} {item.apartment.currency}
                                            </p>
                                            <div className="mt-auto flex flex-col gap-2 pt-4">
                                                <div className="flex flex-wrap gap-2">
                                                    <Link
                                                        href={`/my-apartments/${item.apartment.id}/edit`}
                                                        className="inline-block rounded-[30px] bg-foreground px-6 py-2.5 text-sm font-medium text-background no-underline transition-colors duration-200 hover:bg-primary hover:text-primary-foreground max-[480px]:w-full max-[480px]:text-center"
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
                                                        className="cursor-pointer rounded-[30px] border-none bg-destructive px-6 py-2.5 text-sm font-medium text-destructive-foreground transition-colors duration-200 hover:bg-destructive/90 disabled:cursor-not-allowed disabled:opacity-50 max-[480px]:w-full max-[480px]:text-center"
                                                    >
                                                        Удалить
                                                    </button>
                                                </div>
                                                {/* ИНДИКАТОР СТАТУСА + тултип при наведении */}
                                                <div className="flex items-center justify-between pt-2">
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
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="rounded-2xl bg-muted p-[80px_20px] text-center">
                            <p className="mb-5 text-lg text-muted-foreground">У вас пока нет добавленных объектов</p>
                            <Link
                                href="/admin/add-apartment"
                                className="inline-block cursor-pointer rounded-[30px] border-none bg-primary px-8 py-3 text-base font-semibold text-primary-foreground no-underline transition-colors duration-200 hover:bg-primary/90 max-[480px]:w-full max-[480px]:text-center"
                            >
                                ➕ Добавить квартиру
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
