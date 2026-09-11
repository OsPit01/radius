"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

const STORAGE_KEY = "cookie-consent";

export function CookieConsent() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(STORAGE_KEY)) {
      setVisible(true);
    }
  }, []);

  const accept = () => {
    localStorage.setItem(STORAGE_KEY, "accepted");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed right-0 bottom-0 left-0 z-[1100] p-4">
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-3 rounded-2xl border border-[#eee] bg-white p-4 shadow-[0_10px_40px_rgba(0,0,0,0.15)] sm:flex-row sm:justify-between">
        <p className="text-sm text-[#333]">
          Мы используем файлы cookie для корректной работы сайта. Продолжая
          пользоваться сайтом, вы соглашаетесь с{" "}
          <Link
            href="/privacy"
            className="text-[#b552c7] underline hover:text-[#a244b2]"
          >
            Политикой конфиденциальности
          </Link>
          .
        </p>
        <button
          type="button"
          onClick={accept}
          className="shrink-0 cursor-pointer rounded-[30px] bg-gray-800 px-6 py-2.5 text-sm font-medium text-white hover:bg-gray-700"
        >
          Принять
        </button>
      </div>
    </div>
  );
}
