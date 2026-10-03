"use client";

type TabsProps<T extends string> = {
  tabs: readonly { id: T; label: string }[];
  active: T;
  onChange: (id: T) => void;
};
export function Tabs<T extends string>({
  tabs,
  active,
  onChange,
}: TabsProps<T>) {
  return (
    <div className="flex flex-wrap gap-2">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`cursor-pointer rounded-full px-4 py-2.5 text-sm font-medium whitespace-nowrap transition-colors ${
            active === tab.id
              ? "bg-gray-100 font-semibold text-purple-900"
              : "text-gray-500 hover:text-purple-900"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
