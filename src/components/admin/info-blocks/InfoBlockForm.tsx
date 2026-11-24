import { INFO_BLOCK_ICON_OPTIONS } from '@/lib/constants/info-block';

// Пункт блока (совпадает с InfoItemData в схеме БД).
export type InfoItemForm = { text: string; href: string | null };

// Состояние формы — поля блока. Порядка (sortOrder) здесь нет:
// он задаётся только drag-and-drop, а новый блок сервер ставит в конец.
export type InfoBlockFormState = {
    id: string;
    icon: string;
    title: string;
    items: InfoItemForm[];
};

// ============================================================
// Форма создания/редактирования блока.
// Родитель держит состояние (form) и передаёт его сюда + колбэки.
// ============================================================
type InfoBlockFormProps = {
    form: InfoBlockFormState;
    setForm: (updater: (prev: InfoBlockFormState) => InfoBlockFormState) => void;
    error: string | null;
    onSubmit: () => void;
    onCancel: () => void;
};

export function InfoBlockForm({ form, setForm, error, onSubmit, onCancel }: InfoBlockFormProps) {
    return (
        <div className="mt-6 flex flex-col gap-4 rounded-2xl border border-border bg-card p-5">
            <h2 className="text-base font-semibold text-foreground">{form.id ? 'Редактировать блок' : 'Новый блок'}</h2>

            {/* Ошибка валидации */}
            {error && (
                <p className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-2.5 text-sm text-destructive">
                    {error}
                </p>
            )}

            <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-foreground">id (ключ блока)</span>
                <input
                    type="text"
                    value={form.id}
                    onChange={(e) => setForm((prev) => ({ ...prev, id: e.target.value }))}
                    placeholder="например: how-it-works"
                    className="min-h-11 w-full rounded-xl border border-border bg-background px-4 text-base text-foreground outline-none focus:border-primary"
                />
            </label>

            <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-foreground">Иконка</span>
                <select
                    value={form.icon}
                    onChange={(e) => setForm((prev) => ({ ...prev, icon: e.target.value }))}
                    className="min-h-11 w-full rounded-xl border border-border bg-background px-4 text-base text-foreground outline-none focus:border-primary"
                >
                    {INFO_BLOCK_ICON_OPTIONS.map((opt) => (
                        <option
                            key={opt.value}
                            value={opt.value}
                        >
                            {opt.label}
                        </option>
                    ))}
                </select>
            </label>

            <label className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-foreground">Заголовок</span>
                <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm((prev) => ({ ...prev, title: e.target.value }))}
                    placeholder="например: Как это работает"
                    className="min-h-11 w-full rounded-xl border border-border bg-background px-4 text-base text-foreground outline-none focus:border-primary"
                />
            </label>

            {/* Конструктор пунктов */}
            <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-foreground">Пункты</span>
                    <button
                        type="button"
                        onClick={() =>
                            setForm((prev) => ({
                                ...prev,
                                items: [...prev.items, { text: '', href: null }],
                            }))
                        }
                        className="cursor-pointer rounded-[30px] border border-border px-4 py-1.5 text-sm font-medium text-foreground transition-colors hover:border-primary"
                    >
                        Добавить пункт
                    </button>
                </div>

                {form.items.map((item, index) => (
                    <div
                        key={index}
                        className="flex flex-col gap-2 rounded-lg border border-border p-3"
                    >
                        <textarea
                            value={item.text}
                            onChange={(e) =>
                                setForm((prev) => ({
                                    ...prev,
                                    items: prev.items.map((it, i) =>
                                        i === index ? { ...it, text: e.target.value } : it,
                                    ),
                                }))
                            }
                            placeholder="Текст пункта"
                            rows={3}
                            className="field-sizing-content min-h-11 w-full resize-y rounded-xl border border-border bg-background px-4 py-2.5 text-base text-foreground outline-none focus:border-primary"
                        />
                        <input
                            type="text"
                            value={item.href ?? ''}
                            onChange={(e) =>
                                setForm((prev) => ({
                                    ...prev,
                                    items: prev.items.map((it, i) =>
                                        i === index ? { ...it, href: e.target.value || null } : it,
                                    ),
                                }))
                            }
                            placeholder="Ссылка (необязательно)"
                            className="min-h-11 w-full rounded-xl border border-border bg-background px-4 text-base text-foreground outline-none focus:border-primary"
                        />
                        <button
                            type="button"
                            onClick={() =>
                                setForm((prev) => ({
                                    ...prev,
                                    items: prev.items.filter((_, i) => i !== index),
                                }))
                            }
                            className="cursor-pointer self-start rounded-[30px] border border-destructive px-4 py-1.5 text-sm font-medium text-destructive transition-colors hover:bg-destructive/10"
                        >
                            Удалить пункт
                        </button>
                    </div>
                ))}
            </div>

            <div className="flex gap-3">
                <button
                    type="button"
                    onClick={onSubmit}
                    className="min-h-11 cursor-pointer rounded-[30px] bg-foreground px-8 py-3 text-sm font-medium text-background transition-colors hover:bg-foreground/85"
                >
                    Сохранить
                </button>
                <button
                    type="button"
                    onClick={onCancel}
                    className="min-h-11 cursor-pointer rounded-[30px] border border-border px-8 py-3 text-sm font-medium text-foreground transition-colors hover:bg-muted"
                >
                    Отмена
                </button>
            </div>
        </div>
    );
}
