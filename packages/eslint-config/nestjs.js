/**
 * Flat config for NestJS workspaces (api, worker).
 *
 * Nest modules are intentionally empty decorated classes, so
 * `no-extraneous-class` is relaxed only for decorated classes.
 */
import { createBaseConfig } from './base.js';

/**
 * @param {{ tsconfigRootDir: string }} options
 */
export function createNestConfig(options) {
  return [
    ...createBaseConfig(options),
    {
      rules: {
        '@typescript-eslint/no-extraneous-class': ['error', { allowWithDecorator: true }],
        // Type-only imports erase constructor parameter types that Nest's DI
        // container reads through emitted decorator metadata.
        '@typescript-eslint/consistent-type-imports': 'off',
      },
    },
  ];
}
