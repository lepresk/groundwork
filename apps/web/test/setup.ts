/**
 * Vitest setup: DOM matchers, cleanup between tests, and a test API URL.
 */
import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';

process.env['API_INTERNAL_URL'] ??= 'http://api.test/api/v1';

afterEach(() => {
  cleanup();
});
