/**
 * Lint config for the UI package: the shared React preset (no Next.js rules).
 */
import { createReactConfig } from '@groundwork/eslint-config/nextjs';

export default createReactConfig({ tsconfigRootDir: import.meta.dirname });
