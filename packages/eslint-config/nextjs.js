/**
 * Flat config for Next.js App Router workspaces and React packages.
 */
import nextPlugin from '@next/eslint-plugin-next';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';
import { createBaseConfig } from './base.js';

/**
 * @param {{ tsconfigRootDir: string }} options
 */
export function createNextConfig(options) {
  return [
    ...createBaseConfig(options),
    reactHooks.configs.flat.recommended,
    {
      plugins: { '@next/next': nextPlugin },
      languageOptions: { globals: { ...globals.browser } },
      rules: {
        ...nextPlugin.configs.recommended.rules,
        ...nextPlugin.configs['core-web-vitals'].rules,
      },
    },
    {
      files: ['**/*.{ts,tsx}'],
      rules: {
        // Allow `onSubmit={handleSubmit(...)}`: React ignores the returned promise.
        '@typescript-eslint/no-misused-promises': [
          'error',
          { checksVoidReturn: { attributes: false } },
        ],
      },
    },
  ];
}

/**
 * Same rules without the Next.js plugin, for plain React libraries.
 *
 * @param {{ tsconfigRootDir: string }} options
 */
export function createReactConfig(options) {
  return [
    ...createBaseConfig(options),
    reactHooks.configs.flat.recommended,
    { languageOptions: { globals: { ...globals.browser } } },
  ];
}
