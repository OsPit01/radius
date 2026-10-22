import { type SubmitEvent, useState } from 'react';

import Image from 'next/image';
import { signIn } from 'next-auth/react';

import { Google, Mail } from '@/components/icons';
import { Seo } from '@/components/Seo';

const BUTTON_CLASS =
    'cursor-pointer transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary enabled:hover:-translate-y-0.5 enabled:active:translate-y-0 disabled:cursor-not-allowed disabled:opacity-60';

export default function SignInPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [email, setEmail] = useState('');
    const [isEmailLoading, setIsEmailLoading] = useState(false);
    const [isSent, setIsSent] = useState(false);
    const handleGoogleSignIn = async () => {
        setIsLoading(true);
        await signIn('google', { callbackUrl: '/' });
    };
    const handleEmailSignIn = async (event: SubmitEvent<HTMLFormElement>) => {
        event.preventDefault();
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
                {/* Логотип: у светлой и тёмной темы сайта (класс .dark) своя иконка — показываем нужную
            через dark:-варианты, так нет мигания при гидрации. Скрытая (display: none) не грузится и скринридером не читается. */}
                <Image
                    src="/light/icon-512x512.png"
                    alt="radius-stay.by"
                    width={96}
                    height={96}
                    className="rounded-[20px] dark:hidden"
                />
                <Image
                    src="/web-app-manifest-512x512.png"
                    alt="radius-stay.by"
                    width={96}
                    height={96}
                    className="hidden rounded-[20px] dark:block"
                />
            </div>
            {/* Текст вход и регистрация */}
            <div className="flex items-center justify-center px-4">
                <span className="text-[25px] font-[600] max-md:text-[20px]"> Вход и регистрация </span>
            </div>
            {/* действия вход через гугл */}
            <div className="my-6 flex items-center justify-center">
                <button
                    type="button"
                    className={`${BUTTON_CLASS} flex w-full items-center justify-center gap-3 rounded-xl border border-border bg-card py-3 font-medium text-foreground enabled:hover:border-primary enabled:hover:bg-muted enabled:hover:shadow-[0_8px_25px_color-mix(in_oklab,var(--primary)_18%,transparent)]`}
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
                <form onSubmit={handleEmailSignIn}>
                    <label
                        htmlFor="email"
                        className="sr-only"
                    >
                        Электронная почта
                    </label>
                    {/* --accent — цвет подсветки поля (рамка, кольцо, иконка в фокусе): акцентный, а у неверного адреса — красный. */}
                    <div className="group relative [--accent:var(--primary)] has-[input:user-invalid]:[--accent:var(--destructive)]">
                        <Mail className="pointer-events-none absolute top-1/2 left-4 h-5 w-5 -translate-y-1/2 text-muted-foreground transition-colors duration-200 group-focus-within:text-(color:--accent)" />
                        <input
                            id="email"
                            name="email"
                            type="email"
                            inputMode="email"
                            autoComplete="email"
                            autoCapitalize="none"
                            spellCheck={false}
                            required
                            value={email}
                            disabled={isEmailLoading}
                            placeholder="you@example.com"
                            // user-invalid: красная рамка появляется только после ухода из поля с неверным адресом, не пока человек печатает.
                            className="w-full rounded-xl border border-border bg-card py-3 pr-4 pl-11 text-foreground outline-hidden transition-[border-color,box-shadow] duration-200 user-invalid:border-destructive focus:border-(color:--accent) focus:ring-4 focus:ring-(color:--accent)/15 disabled:cursor-not-allowed disabled:opacity-60"
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </div>
                    <button
                        type="submit"
                        className={`${BUTTON_CLASS} mt-3 w-full rounded-xl bg-foreground py-3 font-semibold text-background enabled:hover:bg-primary enabled:hover:text-primary-foreground enabled:hover:shadow-[0_8px_25px_color-mix(in_oklab,var(--primary)_35%,transparent)]`}
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
                </form>
            )}
        </div>
    );
}
