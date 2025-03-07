import '@testing-library/jest-dom';
import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import * as matchers from '@testing-library/jest-dom/matchers';

// Extend Vitest's expect with jest-dom matchers
expect.extend(matchers);

// Cleanup after each test
afterEach(() => {
  cleanup();
});

interface MockFetchResponse {
  json: () => Promise<Record<string, unknown>>;
  status: number;
  ok: boolean;
  headers: Headers;
}

global.fetch = vi.fn().mockImplementation(() => {
  return Promise.resolve({
    json: () => Promise.resolve({}),
    status: 200,
    ok: true,
    headers: new Headers(),
  } as MockFetchResponse);
});
