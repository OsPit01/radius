import { AuthGuard } from '@/components/layout/AuthGuard';
import { ClientHeader } from '@/components/layout/ClientHeader';
import { requireAuth } from '@/server/auth/require-auth';

export const getServerSideProps = requireAuth;

export default function ReviewsPage() {
    return (
        <AuthGuard>
            <ClientHeader />
            <div className="mx-auto max-w-[1400px] px-5 py-10 max-md:px-4">
                <h1 className="mb-8 text-2xl font-bold text-foreground">Мои отзывы</h1>
                <p>Здесь скоро появятся ваши отзывы</p>
            </div>
        </AuthGuard>
    );
}
