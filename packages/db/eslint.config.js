/**
 * Lint config for the db package: the shared base preset.
 */
import { createBaseConfig } from '@groundwork/eslint-config/base';

export default createBaseConfig({ tsconfigRootDir: import.meta.dirname });
