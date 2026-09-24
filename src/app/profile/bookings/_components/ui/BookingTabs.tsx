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
    <div className="flex gap-2 pb-10">
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          className={`min-w-0 flex-1 rounded-full px-1.5 py-2.5 text-center text-xs leading-tight font-medium transition-colors sm:px-4 sm:text-lg ${
            active === tab.id ? "border-b border-purple-800 font-semibold" : ""
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
