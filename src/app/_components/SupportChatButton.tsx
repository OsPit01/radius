"use client";

import { useState } from "react";
import { MessageCircle } from "lucide-react";

export function SupportChatButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      {/*Заглушка окна - видна только когда open */}
      {open && (
        <div className="fixed right-5 bottom-24 z-50 h-96 w-80 rounded-2xl bg-white shadow-2xl">
          <p className="p-4 font-semibold">Поддержка</p>
        </div>
      )}
      {/* Кнопка внизу справа */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="fixed right-5 bottom-5 z-50 flex h-14 w-14 cursor-pointer items-center justify-center rounded-full bg-[#6b21a8] text-white shadow-lg hover:bg-[#5a1a8f]"
        aria-label="Поддержка"
      >
        <MessageCircle className="h-6 w-6" />
      </button>
    </>
  );
}
