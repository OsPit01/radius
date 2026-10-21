/** @type {import('lint-staged').Configuration} */
export default {
    // Команды в массиве идут строго по очереди (разные ключи lint-staged гоняет параллельно).
    // ESLint чинит что может, но любое оставшееся предупреждение блокирует коммит.
    // Prettier после ESLint — форматирование финальное. tsc последним проверяет уже готовый код.
    '*.{ts,tsx}': [
        'eslint --fix --max-warnings=0',
        'prettier --write',
        // Функция вместо строки: tsc должен проверять весь проект, а не только staged-файлы.
        () => 'tsc --noEmit',
    ],
    '*.{js,jsx,mjs}': ['eslint --fix --max-warnings=0', 'prettier --write'],
    '*.mdx': 'prettier --write',
};
