"use client";
import { signIn } from "next-auth/react";
import Image from "next/image";
import { FcGoogle } from "react-icons/fc";
export default function SignInPage() {
  return (
    <div className="mx-auto mt-20 max-w-[500px] rounded-[20px] border-2 border-black bg-white px-5 py-5 max-md:px-4">
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
        <span className="text-[25px] font-[600]"> Вход и регистрация </span>
      </div>
      {/* действия вход через гугл */}
      <div className="my-6 flex items-center justify-center px-4">
        <button
          type="button"
          className="flex w-full items-center justify-center gap-3 rounded-xl border border-[#e0e0e0] bg-white py-3 font-medium text-[#222] transition-colors hover:bg-[#f5f5f5]"
          onClick={() => signIn("google", { callbackUrl: "/" })}
        >
          <FcGoogle size={20} />
          Войти через Google
        </button>
        {/* резделитель */}
      </div>
      <div className="my-6 flex items-center gap-3">
        <div className="h-px flex-1 bg-[#e0e0e0]" />
        <span>или</span>
        <div className="h-px flex-1 bg-[#e0e0e0]" />
      </div>
      {/* действия вход через email */}
      <input
        type="email"
        placeholder="you@example.com"
        className="w-full rounded-xl border border-[#e0e0e0] bg-white px-4 py-3 text-[#222] outline-none focus:border-gray-400"
      />
      <button
        type="button"
        className="mt-3 w-full rounded-xl bg-gray-800 py-3 font-semibold text-white transition-colors hover:bg-gray-700"
      >
        Получить ссылку для входа
      </button>
    </div>
  );
}
