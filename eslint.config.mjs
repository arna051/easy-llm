import { defineConfig } from 'eslint/config';
import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';
import prettier from 'eslint-plugin-prettier';
import globals from 'globals';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const tsRecommended = tsPlugin.configs['flat/recommended'].map((config) => ({
    ...config,
    files: ['src/**/*.{ts,tsx}'],
    languageOptions: {
        ...config.languageOptions,
        parser: tsParser,
        parserOptions: {
            ...(config.languageOptions?.parserOptions ?? {}),
            project: './tsconfig.json',
            tsconfigRootDir: __dirname,
        },
        globals: {
            ...globals.browser,
            ...globals.node,
            ...(config.languageOptions?.globals ?? {}),
        },
    },
}));

export default defineConfig([
    {
        ignores: ['dist', 'test', 'eslint.config.mjs', '**/*.d.ts'],
    },
    ...tsRecommended,
    {
        files: ['src/**/*.{ts,tsx}'],
        languageOptions: {
            parser: tsParser,
            parserOptions: {
                project: './tsconfig.json',
                tsconfigRootDir: __dirname,
            },
            globals: {
                ...globals.browser,
                ...globals.node,
            },
        },
        plugins: {
            '@typescript-eslint': tsPlugin,
            prettier,
        },
        rules: {
            'prettier/prettier': [
                'error',
                {
                    singleQuote: true,
                    semi: true,
                    trailingComma: 'all',
                    printWidth: 100,
                },
            ],
            '@typescript-eslint/no-unused-vars': [
                'warn',
                {
                    argsIgnorePattern: '^_',
                },
            ],
            '@typescript-eslint/explicit-function-return-type': 'off',
            '@typescript-eslint/no-explicit-any': 'off',
        },
    },
]);
