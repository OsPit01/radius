import { AuthGuard } from '@/components/layout/AuthGuard';
import { requireAuth } from '@/server/auth/require-auth';
import { Layout } from '@/shared/ui/layout';

export const getServerSideProps = requireAuth;

export default function ReviewsPage() {
    return (
        <AuthGuard>
            <Layout className="w-auto! px-5! py-10! max-md:px-4!">
                <h1 className="mb-8 text-2xl font-bold text-foreground">Мои отзывы</h1>
                <p>Здесь скоро появятся ваши отзывы</p>
            </Layout>
        </AuthGuard>
    );
}
