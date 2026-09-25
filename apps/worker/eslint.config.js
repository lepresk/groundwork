/**
 * Lint config for the worker: the shared NestJS preset with type-aware rules.
 */
import { createNestConfig } from '@groundwork/eslint-config/nestjs';

export default createNestConfig({ tsconfigRootDir: import.meta.dirname });
