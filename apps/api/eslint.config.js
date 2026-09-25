import { createNestConfig } from '@groundwork/eslint-config/nestjs';

export default createNestConfig({ tsconfigRootDir: import.meta.dirname });
