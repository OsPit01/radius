import { FlatCompat } from '@eslint/eslintrc';
import tseslint from 'typescript-eslint';
// @ts-ignore -- no types for this plugin
import drizzle from 'eslint-plugin-drizzle';
import simpleImportSort from 'eslint-plugin-simple-import-sort';
import unusedImports from 'eslint-plugin-unused-imports';

const compat = new FlatCompat({
    baseDirectory: import.meta.dirname,
});

export default tseslint.config(
    {
        // next-env.d.ts генерирует Next.js, править его нельзя.
        ignores: ['.next', 'next-env.d.ts'],
    },
    ...compat.extends('next/core-web-vitals'),
    {
        // Конфиги инструментов обязаны экспортировать объект по умолчанию.
        files: ['*.config.{js,mjs,ts}'],
        rules: { 'import/no-anonymous-default-export': 'off' },
    },
    {
        files: ['**/*.ts', '**/*.tsx'],
        plugins: {
            drizzle,
            'simple-import-sort': simpleImportSort,
            'unused-imports': unusedImports,
        },
        extends: [
            ...tseslint.configs.recommended,
            ...tseslint.configs.recommendedTypeChecked,
            ...tseslint.configs.stylisticTypeChecked,
        ],
        rules: {
            '@typescript-eslint/array-type': 'off',
            '@typescript-eslint/consistent-type-definitions': 'off',
            '@typescript-eslint/consistent-type-imports': [
                'warn',
                { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
            ],
            // Неиспользуемые переменные проверяет плагин unused-imports
            // (он же удаляет неиспользуемые импорты при lint:fix).
            '@typescript-eslint/no-unused-vars': 'off',
            'unused-imports/no-unused-imports': 'error',
            'unused-imports/no-unused-vars': ['warn', { argsIgnorePattern: '^_' }],
            // Порядок импортов: побочные эффекты → react → пакеты → алиас @/ → относительные.
            'simple-import-sort/imports': [
                'error',
                {
                    groups: [['^\\u0000'], ['^react'], ['^@?\\w'], ['^@/'], ['^\\.']],
                },
            ],
            'simple-import-sort/exports': 'error',
            // Правила стиля, перенесённые из проекта yango-drive.
            curly: 'error',
            'no-console': ['error', { allow: ['warn', 'error'] }],
            'react/jsx-curly-brace-presence': 'error',
            '@typescript-eslint/require-await': 'off',
            '@typescript-eslint/no-misused-promises': ['error', { checksVoidReturn: { attributes: false } }],
            'drizzle/enforce-delete-with-where': ['error', { drizzleObjectName: ['db', 'ctx.db'] }],
            'drizzle/enforce-update-with-where': ['error', { drizzleObjectName: ['db', 'ctx.db'] }],
        },
    },
    {
        // В CLI-скриптах вывод в консоль — это и есть результат работы.
        files: ['scripts/**'],
        rules: { 'no-console': 'off' },
    },
    {
        linterOptions: {
            reportUnusedDisableDirectives: true,
        },
        languageOptions: {
            parserOptions: {
                projectService: true,
            },
        },
    },
);
