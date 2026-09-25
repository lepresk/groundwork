/**
 * Lint config for the shared contracts package: the shared base preset.
 */
import { createBaseConfig } from '@groundwork/eslint-config/base';

export default createBaseConfig({ tsconfigRootDir: import.meta.dirname });
