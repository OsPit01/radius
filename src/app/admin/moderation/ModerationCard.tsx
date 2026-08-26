"use client";

import Image from "next/image";
import { api, type RouterOutputs } from "@/trpc/react";
import { getStatusInfo } from "@/lib/constants/apartment-status";

type ModerationItem = RouterOutputs["apartment"]["getForModeration"][number];

export function ModerationCard({ item }: { item: ModerationItem }) {
  const statusInfo = getStatusInfo(item.apartment.status);
  const utils = api.useUtils();
  const updateStatus = api.apartment.updateStatus.useMutation({
    onSuccess: () => {
      void utils.apartment.getForModeration.invalidate();
    },
  });
  return (
    // Внешняя "коробка" карточки: белый фон, рамка, скругление, тень.
    // overflow-hidden — чтобы фото не вылезало за скруглённые углы
    <div className="flex flex-col overflow-hidden rounded-2xl border border-[#e5e5e5] bg-white shadow-sm">
      {/* ФОТО. relative + fill + object-cover — картинка заполняет блок 16:9 */}
      <div className="relative aspect-[16/9] w-full bg-[#f0f0f0]">
        <Image
          src={item.apartment.image}
          alt={item.apartment.title}
          fill
          unoptimized
          className="object-cover"
        ></Image>
      </div>
      {/* ТЕКСТ. flex flex-col gap-2 — всё столбиком с промежутком 0.5rem.
          p-5 — внутренний отступ со всех сторон. */}
      <div className="flex flex-col gap-2 p-5">
        {/* заголовок */}
        <p className="text-lg font-semibold text-[#222]">
          {item.apartment.title}
        </p>
        {/* город + цена. "·" — просто разделитель-точка в тексте */}
        <p className="text-sm text-[#666]">
          {item.apartment.city} · {item.apartment.price}{" "}
          {item.apartment.currency}
        </p>
        {/* СТАТУС — цветной бейдж. Цвет динамический, поэтому через style,
            а не через Tailwind (Tailwind не умеет динамические цвета). */}
        <span
          style={{ background: statusInfo.color }}
          className="w-fit rounded-full px-3 py-1 text-xs font-semibold tracking-wide text-white uppercase"
        >
          {statusInfo.label}
        </span>
        {/* ВЛАДЕЛЕЦ. item.user может быть null (leftJoin), поэтому "?" */}
        <p className="text-sm text-[#666]">
          Владелец: {item.user?.email ?? "нет данных"}
        </p>
        {/* //две кнопки */}
        <div className="mt-5 flex gap-2">
          <button
            onClick={() =>
              updateStatus.mutate({ id: item.apartment.id, status: "active" })
            }
            className="cursor-pointer rounded-[30px] bg-green-900 px-5 py-2 text-sm font-semibold text-white transition-colors hover:bg-green-800"
          >
            Одобрить
          </button>
          <button
            onClick={() =>
              updateStatus.mutate({ id: item.apartment.id, status: "inactive" })
            }
            className="flex-1 cursor-pointer rounded-[30px] border border-red-200 px-5 py-2 text-sm font-medium text-[#666] transition-colors hover:border-red-900 hover:text-red-900"
          >
            Отклонить
          </button>
        </div>
      </div>
    </div>
  );
}
