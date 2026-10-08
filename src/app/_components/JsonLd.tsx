/**
 * Вставляет структурированные данные (JSON-LD) в страницу.
 * Google читает их для расширенных сниппетов (Rich Results),
 * хлебных крошек, «поиска по сайту» и т.д.
 *
 * Компонент серверный — рендерит обычный <script type="application/ld+json">.
 */
export function JsonLd({ data }: { data: Record<string, unknown> }) {
  return (
    <script
      type="application/ld+json"
      // dangerouslySetInnerHTML нужен, чтобы вставить именно объект JSON,
      // а не текст-строку.
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  );
}
