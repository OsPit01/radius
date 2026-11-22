import React from 'react';

import { useRouter } from 'next/router';

import { Footer } from '@/components/layout/Footer';
import { Header } from '@/components/layout/Header';

import { cn } from '../lib/utils';

interface LayoutProps {
    children: React.ReactNode;
    className?: string;
    withFooter?: boolean;
}

export const Layout: React.FC<LayoutProps> = function Layout({ children, className, withFooter = false }) {
    const router = useRouter();

    return (
        <>
            {router.pathname !== '/auth/signin' && <Header />}
            <main
                className={cn('min-w-0', withFooter && 'flex-auto', 'mx-auto w-full max-w-7xl pt-3 pb-10', className)}
            >
                {children}
            </main>

            {withFooter && <Footer />}
        </>
    );
};
