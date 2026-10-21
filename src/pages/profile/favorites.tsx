import { FaRegHeart } from 'react-icons/fa';

import Link from 'next/link';

import { ApartmentCard } from '@/components/apartments/ApartmentCard';
import { AuthGuard } from '@/components/layout/AuthGuard';
import { ClientHeader } from '@/components/layout/ClientHeader';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { getApartmentCardData } from '@/lib/apartment-format';
import { requireAuth } from '@/server/auth/require-auth';
import { api } from '@/trpc/react';

// Неавторизованных отправляем на вход ещё на сервере
export const getServerSideProps = requireAuth;

export default function FavoritesPage() {
    const { data: favorites, isLoading } = api.favorites.list.useQuery();

    return (
        <>
            <AuthGuard>
                <ClientHeader />
                <div className="mx-auto max-w-[1400px] px-5 py-10 max-md:px-4">
                    <h1 className="mb-8 text-2xl font-bold text-[#222]">Избранное</h1>

                    {isLoading ? (
                        <LoadingSpinner label="Загрузка..." />
                    ) : !favorites || favorites.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 text-center">
                            <FaRegHeart className="text-[64px] text-[#6b21a8]" />
                            <p className="mt-6 text-xl font-semibold text-[#333]">У вас пока нет избранных квартир</p>
                            <p className="mt-2 text-base text-[#666]">
                                Нажимайте на сердечко, чтобы сохранять понравившиеся варианты
                            </p>
                            <Link
                                href="/"
                                className="mt-6 inline-block rounded-[30px] bg-gray-800 px-8 py-3 text-base font-medium text-white no-underline transition-colors duration-200 hover:bg-gray-700"
                            >
                                Смотреть квартиры
                            </Link>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 gap-[50px] max-md:grid-cols-1 max-md:gap-5">
                            {favorites.map((apartment) => (
                                <ApartmentCard
                                    key={apartment.id}
                                    apartment={getApartmentCardData(apartment)}
                                    isFavorite={true}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </AuthGuard>
        </>
    );
}
