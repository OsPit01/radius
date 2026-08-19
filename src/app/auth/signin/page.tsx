"use client";
import { signIn } from "next-auth/react";
import Image from "next/image";
import { FcGoogle } from "react-icons/fc";
import { useState } from "react";
export default function SignInPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [isEmailLoading, setIsEmailLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);
  const handleGoogleSignIn = async () => {
    setIsLoading(true);
    await signIn("google", { callbackUrl: "/" });
  };
  const handleEmailSignIn = async () => {
    setIsEmailLoading(true);
    await signIn("resend", { email, callbackUrl: "/", redirect: false });
    setIsEmailLoading(false);
    setIsSent(true);
  };
  return (
    <div className="mx-auto mt-20 max-w-[500px] rounded-[20px] border-2 border-black bg-white px-5 py-5 max-md:mx-4 max-md:px-4">
      <span className="bg-gradient-to-r from-[#b552c7] to-[#1a0a2a] bg-clip-text text-[12px] font-normal tracking-[0.2em] text-transparent">
        {" "}
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
        <span className="text-[25px] font-[600] max-md:text-[20px]">
          {" "}
          Вход и регистрация{" "}
        </span>
      </div>
      {/* действия вход через гугл */}
      <div className="my-6 flex items-center justify-center px-4">
        <button
          type="button"
          className="flex w-full items-center justify-center gap-3 rounded-xl border border-[#e0e0e0] bg-white py-3 font-medium text-[#222] transition-colors hover:bg-[#f5f5f5]"
          onClick={handleGoogleSignIn}
          disabled={isLoading}
        >
          {isLoading ? (
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-gray-600" />
          ) : (
            <FcGoogle size={20} />
          )}
          {isLoading ? "Загрузка..." : "Войти через Google"}
        </button>
        {/* резделитель */}
      </div>
      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-[#e0e0e0]" />
        <span>или</span>
        <div className="h-px flex-1 bg-[#e0e0e0]" />
      </div>
      {/* действия вход через email */}
      {isSent ? (
        <p className="mt-3 rounded-xl bg-gray-100 px-4 py-3 text-center text-[#222]">
          Проверьте почту — мы отправили ссылку на {email}.
        </p>
      ) : (
        <>
          <input
            type="email"
            value={email}
            placeholder="you@example.com"
            className="w-full rounded-xl border border-[#e0e0e0] bg-white px-4 py-3 text-[#222] outline-none focus:border-gray-400"
            onChange={(e) => setEmail(e.target.value)}
          />
          <button
            type="button"
            className="mt-3 w-full rounded-xl bg-gray-800 py-3 font-semibold text-white transition-colors hover:bg-gray-700"
            onClick={handleEmailSignIn}
            disabled={isEmailLoading}
          >
            {isEmailLoading ? (
              <div className="mx-auto h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white"></div>
            ) : (
              "Получить ссылку для входа"
            )}
          </button>
        </>
      )}
    </div>
  );
}
