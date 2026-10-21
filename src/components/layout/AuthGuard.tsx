import Link from 'next/link';
import { useSession } from 'next-auth/react';

import { LoadingSpinner } from '@/components/ui/LoadingSpinner';

import { ClientHeader } from './ClientHeader';

export function AuthGuard({ children }: { children: React.ReactNode }) {
    const { status } = useSession();

    if (status === 'loading') {
        return (
            <>
                <ClientHeader />
                <LoadingSpinner label="Загрузка..." />
            </>
        );
    }

    if (status === 'unauthenticated') {
        return (
            <>
                <ClientHeader />
                <div className="mx-auto max-w-[1200px] px-5 py-10 max-md:px-4 max-md:py-5">
                    <div className="rounded-2xl bg-muted p-[80px_20px] text-center">
                        <p className="mb-5 text-lg text-muted-foreground">Пожалуйста, войдите в систему</p>
                        <Link
                            href="/auth/signin"
                            className="inline-block cursor-pointer rounded-[30px] border-none bg-foreground px-8 py-3 text-base font-medium text-background no-underline transition-colors duration-200 hover:bg-foreground/85"
                        >
                            Войти
                        </Link>
                    </div>
                </div>
            </>
        );
    }

    return <>{children}</>;
}
