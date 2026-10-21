/** @type {import('prettier').Config & import('prettier-plugin-tailwindcss').PluginOptions} */
export default {
    plugins: ['prettier-plugin-tailwindcss'],
    // Tailwind v4: плагину нужен файл с @theme, чтобы знать наши цвета (bg-card, text-primary...)
    // и сортировать их классы наравне со стандартными.
    tailwindStylesheet: './src/styles/globals.css',
    // Стиль форматирования перенесён из проекта yango-drive.
    singleQuote: true,
    tabWidth: 4,
    printWidth: 120,
    singleAttributePerLine: true,
    overrides: [
        // В CSS кавычки двойные (как в yango-drive).
        { files: '*.css', options: { singleQuote: false } },
    ],
};
