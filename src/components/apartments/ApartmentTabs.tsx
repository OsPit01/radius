import { useState } from 'react';

import { AMENITIES } from '@/lib/constants/amenities';

const TABS = [
    { id: 0, label: 'Описание', emoji: '📝' },
    { id: 1, label: 'Удобства', emoji: '✨' },
    { id: 2, label: 'Правила', emoji: '📋' },
    { id: 3, label: 'Карта', emoji: '🗺️' },
] as const;

export function ApartmentTabs({
    description,
    amenities,
    rules,
    checkInTime,
    checkOutTime,
}: {
    description: string;
    amenities: string[];
    rules: string;
    checkInTime: string | null;
    checkOutTime: string | null;
}) {
    const [activeTab, setActiveTab] = useState(0);

    return (
        <div className="mt-10">
            {/* Вкладки */}
            <div className="flex flex-wrap justify-center gap-2 rounded-2xl bg-muted p-2 max-sm:gap-1.5">
                {TABS.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-xl px-4 py-3 text-[15px] font-medium transition-all duration-200 max-sm:min-w-[45%] ${
                            activeTab === tab.id
                                ? 'bg-foreground text-background shadow-[0_4px_12px_rgba(0,0,0,0.2)]'
                                : 'text-muted-foreground hover:bg-card hover:text-foreground'
                        }`}
                    >
                        <span className="text-base">{tab.emoji}</span>
                        {tab.label}
                    </button>
                ))}
            </div>

            <div className="py-8">
                {activeTab === 0 && (
                    <div className="mx-auto max-w-2xl">
                        {description ? (
                            <p className="text-base leading-8 whitespace-pre-line text-foreground">{description}</p>
                        ) : (
                            <p className="text-center text-base text-muted-foreground">Описание пока не добавлено</p>
                        )}
                    </div>
                )}

                {activeTab === 1 && (
                    <>
                        {amenities.length > 0 ? (
                            <div className="mx-auto grid max-w-2xl grid-cols-1 gap-3 sm:grid-cols-2">
                                {amenities.map((id) => {
                                    const found = AMENITIES.find((a) => a.id === id);
                                    return (
                                        <div
                                            key={id}
                                            className="flex items-center gap-3 rounded-xl border border-border bg-muted px-4 py-3 text-sm text-foreground"
                                        >
                                            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs text-primary-foreground">
                                                ✓
                                            </span>
                                            {found?.label ?? id}
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="text-center text-base text-muted-foreground">Удобства не указаны</p>
                        )}
                    </>
                )}

                {activeTab === 2 && (
                    <div className="mx-auto max-w-2xl rounded-2xl border border-border bg-muted p-6">
                        {(checkInTime ?? checkOutTime) && (
                            <div className="mb-6 rounded-2xl border border-border bg-card p-4 shadow-sm">
                                <p className="mb-4 flex items-center gap-2 text-sm font-semibold text-primary">
                                    <span className="text-base">⏰</span>
                                    Режим работы
                                </p>
                                <div className="flex flex-col gap-3">
                                    <div className="flex items-center gap-2.5 rounded-xl bg-muted px-3.5 py-3 text-sm text-foreground">
                                        <span className="text-base">🕒</span>
                                        <span>Заселение после</span>
                                        <span className="ml-auto rounded-lg bg-primary px-2.5 py-1 text-sm font-semibold text-primary-foreground">
                                            {checkInTime ?? '14:00'}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2.5 rounded-xl bg-muted px-3.5 py-3 text-sm text-foreground">
                                        <span className="text-base">🕒</span>
                                        <span>Выезд до</span>
                                        <span className="ml-auto rounded-lg bg-primary px-2.5 py-1 text-sm font-semibold text-primary-foreground">
                                            {checkOutTime ?? '12:00'}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        )}
                        {rules ? (
                            <p className="text-base leading-7 whitespace-pre-line text-foreground">{rules}</p>
                        ) : (
                            <p className="text-center text-base text-muted-foreground">Правила проживания не указаны</p>
                        )}
                    </div>
                )}

                {activeTab === 3 && (
                    <div className="mx-auto max-w-2xl rounded-2xl border border-border bg-muted p-6">
                        <p className="text-center text-muted-foreground">Карта появится здесь в ближайшее время</p>
                    </div>
                )}
            </div>
        </div>
    );
}
