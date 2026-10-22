import { useState } from 'react';

import Image from 'next/image';
import { signIn } from 'next-auth/react';

import { Google } from '@/components/icons';
import { Seo } from '@/components/Seo';
export default function SignInPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [isEmailLoading, setIsEmailLoading] = useState(false);
    const [isSent, setIsSent] = useState(false);
    const handleGoogleSignIn = async () => {
        setIsLoading(true);
        await signIn('google', { callbackUrl: '/' });
    };
    const handleEmailSignIn = async () => {
        setIsEmailLoading(true);
        await signIn('resend', { email, callbackUrl: '/', redirect: false });
        setIsEmailLoading(false);
        setIsSent(true);
    };
    return (
        <div className="mx-auto mt-20 max-w-[500px] rounded-[20px] border-2 border-foreground bg-card px-5 py-5 max-md:mx-4 max-md:px-4">
            <Seo title="Вход и регистрация" />
            <span className="bg-gradient-to-r from-primary to-foreground bg-clip-text text-[12px] font-normal tracking-[0.2em] text-transparent">
                {' '}
                Radius stay
            </span>
            <div className="flex items-center justify-center px-4">
                {/* image */}

                <Image
                    src="/assets/images/authimage.png"
                    alt="radius-stay.by"
                    width={96}
                    height={96}
                />
            </div>
            {/* Текст вход и регистрация */}
            <div className="flex items-center justify-center px-4">
                <span className="text-[25px] font-[600] max-md:text-[20px]"> Вход и регистрация </span>
            </div>
            {/* действия вход через гугл */}
            <div className="my-6 flex items-center justify-center px-4">
                <button
                    type="button"
                    className="flex w-full items-center justify-center gap-3 rounded-xl border border-border bg-card py-3 font-medium text-foreground transition-colors hover:bg-muted"
                    onClick={handleGoogleSignIn}
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-border border-t-foreground" />
                    ) : (
                        <Google className="h-6 w-6" />
                    )}
                    {isLoading ? 'Загрузка...' : 'Войти через Google'}
                </button>
                {/* резделитель */}
            </div>
            <div className="my-6 flex items-center gap-3">
                <div className="h-px flex-1 bg-border" />
                <span>или</span>
                <div className="h-px flex-1 bg-border" />
            </div>
            {/* действия вход через email */}
            {isSent ? (
                <p className="mt-3 rounded-xl bg-muted px-4 py-3 text-center text-foreground">
                    Проверьте почту — мы отправили ссылку на {email}.
                </p>
            ) : (
                <>
                    <input
                        type="email"
                        value={email}
                        placeholder="you@example.com"
                        className="w-full rounded-xl border border-border bg-card px-4 py-3 text-foreground outline-none focus:border-primary"
                        onChange={(e) => setEmail(e.target.value)}
                    />
                    <button
                        type="button"
                        className="mt-3 w-full rounded-xl bg-foreground py-3 font-semibold text-background transition-colors hover:bg-foreground/85"
                        onClick={handleEmailSignIn}
                        disabled={isEmailLoading}
                        // Пока идёт отправка, внутри только спиннер — имя кнопки должно остаться.
                        aria-label="Получить ссылку для входа"
                    >
                        {isEmailLoading ? (
                            <div className="mx-auto h-5 w-5 animate-spin rounded-full border-2 border-border border-t-background"></div>
                        ) : (
                            'Получить ссылку для входа'
                        )}
                    </button>
                </>
            )}
        </div>
    );
}
