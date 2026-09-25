/**
 * Base flat config shared by every TypeScript workspace.
 *
 * Uses the type-aware `strictTypeChecked` preset, so every workspace must
 * lint with `projectService` enabled (see `createBaseConfig`). The rules
 * below encode repository policy that the compiler cannot express:
 * no `any`, no non-null assertions, exhaustive switches, and no
 * `process.env` reads outside the dedicated env modules.
 */
import js from '@eslint/js';
import prettierConfig from 'eslint-config-prettier';
import globals from 'globals';
import tseslint from 'typescript-eslint';

const ENV_MODULE_GLOBS = [
  '**/config/env.ts',
  '**/lib/env.ts',
  '**/src/migrate.ts',
  '**/*.config.{ts,js,mjs}',
];
const TEST_GLOBS = ['**/test/**/*.ts', '**/*.test.ts', '**/*.test.tsx', '**/*.spec.ts'];

/**
 * @param {{ tsconfigRootDir: string }} options
 */
export function createBaseConfig({ tsconfigRootDir }) {
  return tseslint.config(
    {
      ignores: [
        '**/dist/**',
        '**/.next/**',
        '**/.turbo/**',
        '**/coverage/**',
        '**/node_modules/**',
        '**/next-env.d.ts',
        '**/drizzle/**',
      ],
    },
    js.configs.recommended,
    ...tseslint.configs.strictTypeChecked,
    ...tseslint.configs.stylisticTypeChecked,
    {
      languageOptions: {
        ecmaVersion: 2023,
        sourceType: 'module',
        globals: { ...globals.node },
        parserOptions: { projectService: true, tsconfigRootDir },
      },
      linterOptions: { reportUnusedDisableDirectives: 'error' },
      rules: {
        eqeqeq: ['error', 'always'],
        curly: ['error', 'all'],
        'no-console': 'error',
        'object-shorthand': 'error',
        'prefer-template': 'error',
        '@typescript-eslint/no-explicit-any': 'error',
        '@typescript-eslint/no-non-null-assertion': 'error',
        '@typescript-eslint/switch-exhaustiveness-check': 'error',
        '@typescript-eslint/consistent-type-imports': [
          'error',
          { prefer: 'type-imports', fixStyle: 'inline-type-imports' },
        ],
        '@typescript-eslint/consistent-type-definitions': ['error', 'interface'],
        '@typescript-eslint/no-unused-vars': [
          'error',
          { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrors: 'none' },
        ],
        '@typescript-eslint/restrict-template-expressions': [
          'error',
          { allowNumber: true, allowBoolean: true },
        ],
        'no-restricted-properties': [
          'error',
          {
            object: 'process',
            property: 'env',
            message: 'Read configuration from the typed `env` module, never from process.env.',
          },
        ],
        'no-restricted-syntax': [
          'error',
          {
            selector: 'TSEnumDeclaration',
            message: 'Use a `const` tuple plus a union type instead of a TypeScript enum.',
          },
        ],
      },
    },
    {
      files: ENV_MODULE_GLOBS,
      rules: { 'no-restricted-properties': 'off' },
    },
    {
      files: TEST_GLOBS,
      rules: {
        'no-restricted-properties': 'off',
        '@typescript-eslint/no-unsafe-assignment': 'off',
        '@typescript-eslint/no-unsafe-member-access': 'off',
        '@typescript-eslint/no-unsafe-argument': 'off',
        '@typescript-eslint/unbound-method': 'off',
      },
    },
    {
      files: ['**/*.{js,mjs,cjs}'],
      ...tseslint.configs.disableTypeChecked,
    },
    prettierConfig,
  );
}
