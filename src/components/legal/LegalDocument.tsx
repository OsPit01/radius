// ============================================================
// src/components/legal/LegalDocument.tsx — РЕНДЕРЕР ЮРИДИЧЕСКОГО ДОКУМЕНТА
// ============================================================
//
// Одна вёрстка для всех документов (Политика, Соглашение,
// Cookie-политика, Согласие). Тексты живут в src/lib/legal/*.tsx
// как данные — сюда приходит только структура.
//
// Что умеет страница:
// - оглавление: на десктопе — липкая колонка слева, на телефоне —
//   сворачиваемый блок (details), чтобы не отодвигать текст;
// - якоря разделов со скроллом ниже липкой шапки (scroll-mt);
// - таблицы: на десктопе — обычная таблица, на телефоне — карточки
//   (строка → карточка), поэтому страница не скроллится по горизонтали;
// - слот footer — дополнительный контент после текста (кнопка
//   «Настроить cookie» на странице /cookies).
// ============================================================

import type { ReactNode } from 'react';

import Link from 'next/link';

import { ClientHeader } from '@/components/layout/ClientHeader';
import { Seo } from '@/components/Seo';
import type { LegalBlock, LegalDocumentData } from '@/lib/legal/types';

type LegalDocumentProps = {
    doc: LegalDocumentData;
    /** Дополнение после текста документа (например, кнопка настроек cookie). */
    footer?: ReactNode;
};

export function LegalDocument({ doc, footer }: LegalDocumentProps) {
    return (
        <>
            <Seo
                title={doc.seoTitle}
                description={doc.description}
                canonical={doc.slug}
                noindex={doc.noindex}
            />
            <ClientHeader />

            <main className="mx-auto w-full max-w-6xl px-5 py-10 text-foreground max-md:px-4 max-md:py-6">
                <div className="grid gap-8 lg:grid-cols-[240px_minmax(0,1fr)]">
                    {/* ===== Оглавление ===== */}
                    <aside className="hidden lg:block">
                        <nav className="sticky top-24 rounded-2xl border border-border bg-card p-5">
                            <p className="mb-3 text-sm font-semibold text-foreground">Оглавление</p>
                            <ol className="flex flex-col gap-2 text-sm">
                                {doc.sections.map((section) => (
                                    <li key={section.id}>
                                        <a
                                            href={`#${section.id}`}
                                            className="break-words text-muted-foreground transition-colors hover:text-primary"
                                        >
                                            {section.title}
                                        </a>
                                    </li>
                                ))}
                            </ol>
                        </nav>
                    </aside>

                    {/* ===== Сам документ ===== */}
                    <article className="min-w-0 rounded-2xl bg-card p-8 shadow-sm max-md:p-5">
                        <h1 className="mb-3 text-3xl font-bold max-md:text-2xl">{doc.title}</h1>
                        <p className="mb-6 text-sm text-muted-foreground">
                            Версия {doc.version} · Обновлено {doc.updatedAt}
                        </p>

                        {/* Мобильное оглавление: сворачивается, чтобы не мешать чтению */}
                        <details className="mb-6 rounded-xl border border-border bg-muted p-4 lg:hidden">
                            <summary className="cursor-pointer text-sm font-medium text-foreground">Оглавление</summary>
                            <ol className="mt-3 flex flex-col gap-2 text-sm">
                                {doc.sections.map((section) => (
                                    <li key={section.id}>
                                        <a
                                            href={`#${section.id}`}
                                            className="break-words text-muted-foreground"
                                        >
                                            {section.title}
                                        </a>
                                    </li>
                                ))}
                            </ol>
                        </details>

                        <div className="space-y-8">
                            {doc.sections.map((section) => (
                                <section
                                    key={section.id}
                                    id={section.id}
                                    // scroll-mt-24: якорь останавливается ниже липкой шапки,
                                    // иначе заголовок раздела оказался бы под ней.
                                    className="scroll-mt-24"
                                >
                                    <h2 className="mb-3 text-xl font-semibold max-md:text-lg">{section.title}</h2>
                                    <div className="space-y-3 text-[15px] leading-relaxed">
                                        {section.blocks.map((block, index) => (
                                            <LegalBlockView
                                                key={index}
                                                block={block}
                                            />
                                        ))}
                                    </div>
                                </section>
                            ))}
                        </div>

                        {footer && <div className="mt-10 flex justify-center">{footer}</div>}

                        {/* Переход к следующему документу — маленькая навигация по «Документам» */}
                        <p className="mt-10 border-t border-border pt-4 text-sm text-muted-foreground">
                            Другие документы:{' '}
                            <Link
                                href="/privacy"
                                className="text-primary underline hover:text-primary/80"
                            >
                                Политика обработки персональных данных
                            </Link>
                            {', '}
                            <Link
                                href="/cookies"
                                className="text-primary underline hover:text-primary/80"
                            >
                                Политика cookie
                            </Link>
                            {', '}
                            <Link
                                href="/terms"
                                className="text-primary underline hover:text-primary/80"
                            >
                                Пользовательское соглашение
                            </Link>
                            {', '}
                            <Link
                                href="/consent"
                                className="text-primary underline hover:text-primary/80"
                            >
                                Согласие на обработку персональных данных
                            </Link>
                            .
                        </p>
                    </article>
                </div>
            </main>
        </>
    );
}

/** Рисует один блок документа по его типу. */
function LegalBlockView({ block }: { block: LegalBlock }) {
    switch (block.kind) {
        case 'p':
            return <p className="break-words">{block.children}</p>;

        case 'list':
            return block.ordered ? (
                <ol className="list-decimal space-y-2 pl-6">
                    {block.items.map((item, index) => (
                        <li
                            key={index}
                            className="break-words"
                        >
                            {item}
                        </li>
                    ))}
                </ol>
            ) : (
                <ul className="list-disc space-y-2 pl-6">
                    {block.items.map((item, index) => (
                        <li
                            key={index}
                            className="break-words"
                        >
                            {item}
                        </li>
                    ))}
                </ul>
            );

        case 'table':
            return <LegalTable block={block} />;

        case 'notice':
            // Заметка «важно»: полоса слева, спокойный фон — читается,
            // но не кричит. Текст наследует цвет темы (контраст сохранён
            // и в тёмной теме).
            return (
                <div className="rounded-xl border-l-4 border-primary bg-muted p-4 text-[15px] leading-relaxed">
                    {block.children}
                </div>
            );
    }
}

/**
 * Таблица: на десктопе — обычная таблица, на телефоне — карточки.
 * Голова таблицы «превращается» в подписи полей карточки, поэтому
 * на 360px всё читается и ничего не вылезает за экран.
 */
function LegalTable({ block }: { block: Extract<LegalBlock, { kind: 'table' }> }) {
    const { head, rows } = block;

    return (
        <>
            {/* Десктоп/планшет */}
            <div className="hidden overflow-x-auto rounded-xl border border-border md:block">
                <table className="w-full border-collapse text-left text-[15px]">
                    <thead>
                        <tr className="bg-muted">
                            {head.map((title) => (
                                <th
                                    key={title}
                                    className="p-3 font-semibold text-foreground"
                                >
                                    {title}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row, index) => (
                            <tr
                                key={index}
                                className="border-t border-border align-top"
                            >
                                {row.map((cell, cellIndex) => (
                                    <td
                                        key={cellIndex}
                                        className="p-3 text-foreground"
                                    >
                                        {cell}
                                    </td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Телефон: каждая строка — карточка с парами «заголовок: значение» */}
            <div className="space-y-3 md:hidden">
                {rows.map((row, index) => (
                    <div
                        key={index}
                        className="rounded-xl border border-border p-4"
                    >
                        {row.map((cell, cellIndex) => (
                            <div
                                key={cellIndex}
                                className="mb-2 last:mb-0"
                            >
                                <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                                    {head[cellIndex]}
                                </p>
                                <p className="text-[15px] break-words text-foreground">{cell}</p>
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </>
    );
}
