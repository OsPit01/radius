"use client";

export function NotificationCard({
  title,
  text,
  createdAt,
  onClick,
}: {
  title: string;
  text: string;
  createdAt: Date;
  onClick: () => void;
}) {
  return (
    <div
      className="w-full rounded-xl border border-[#eee5f4] bg-white p-4 transition-all duration-200 hover:border-[#6b21a8] hover:bg-[#f5effd] hover:shadow-md"
      onClick={onClick}
    >
      <div className="">
        <p className="line-clamp-1 cursor-pointer font-bold">{title}</p>
        <p className="line-clamp-1 cursor-pointer truncate">{text}</p>
        <p className="line-clamp-1 cursor-pointer truncate text-gray-500">
          {createdAt.toLocaleDateString("ru-Ru")}
        </p>
      </div>
    </div>
  );
}
