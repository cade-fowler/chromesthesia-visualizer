import js from '@eslint/js';
import globals from 'globals';
import reactHooks from 'eslint-plugin-react-hooks';
import tseslint from 'typescript-eslint';

export default tseslint.config(
    { ignores: ['**/dist', '**/node_modules', '**/coverage'] },

    js.configs.recommended,
    ...tseslint.configs.recommended,

    {
        rules: {
            // Allow intentionally unused vars/args when prefixed with _
            '@typescript-eslint/no-unused-vars': [
                'error',
                { argsIgnorePattern: '^_', varsIgnorePattern: '^_', ignoreRestSiblings: true },
            ],
        },
    },

    // Browser code (React)
    {
        files: ['client/**/*.{ts,tsx}'],
        languageOptions: { globals: globals.browser },
        plugins: { 'react-hooks': reactHooks },
        rules: reactHooks.configs.recommended.rules,
    },

    // Node code
    {
        files: ['server/**/*.ts', '**/*.config.{js,ts}'],
        languageOptions: { globals: globals.node },
    },
);
