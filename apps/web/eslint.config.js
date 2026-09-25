/**
 * Lint config for the web app: the shared Next.js preset (React hooks, Next rules, type-aware).
 */
import { createNextConfig } from '@groundwork/eslint-config/nextjs';

export default createNextConfig({ tsconfigRootDir: import.meta.dirname });
