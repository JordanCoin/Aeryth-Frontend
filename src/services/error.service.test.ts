import { describe, it, expect, vi, beforeEach } from 'vitest';
import { errorService } from './error.service';
import { logger } from '../utils/logger';
import toast from 'react-hot-toast';
import { AxiosError } from 'axios';

vi.mock('../utils/logger', () => ({
  logger: {
    error: vi.fn(),
  },
}));

vi.mock('react-hot-toast', () => ({
  default: {
    error: vi.fn(),
  },
}));

interface MockAxiosConfig {
  headers: Record<string, string>;
  data?: unknown;
  method?: string;
  url?: string;
}

// Helper to create mock Axios errors
const createMockAxiosError = (status?: number, message = 'Error') => {
  const error = new Error(message) as AxiosError;
  error.isAxiosError = true;
  error.response = status
    ? {
        status,
        statusText: message,
        data: {},
        headers: {},
        config: {} as MockAxiosConfig,
      }
    : undefined;
  return error;
};

interface ErrorData {
  message: string;
  code?: number;
  details?: Record<string, unknown>;
}

describe('ErrorService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('handles network errors correctly', () => {
    const networkError = createMockAxiosError(401, 'Authentication required');

    const result = errorService.handleError(networkError);

    expect(result.type).toBe('NETWORK');
    expect(result.message).toBe('Authentication required');
    expect(logger.error).toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith('Authentication required');
  });

  it('handles validation errors correctly', () => {
    const validationError = new Error('Invalid input');
    validationError.name = 'ValidationError';

    const result = errorService.handleError(validationError);

    expect(result.type).toBe('VALIDATION');
    expect(result.message).toBe('Invalid input');
    expect(logger.error).toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith('Invalid input');
  });

  it('handles unknown errors correctly', () => {
    const unknownError = 'Something went wrong';

    const result = errorService.handleError(unknownError);

    expect(result.type).toBe('UNKNOWN');
    expect(result.message).toBe('An unexpected error occurred');
    expect(logger.error).toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith('An unexpected error occurred');
  });

  it('detects network errors correctly', () => {
    const networkError = createMockAxiosError();
    const regularError = new Error('regular error');

    expect(errorService.isNetworkError(networkError)).toBe(true);
    expect(errorService.isNetworkError(regularError)).toBe(false);
  });

  it('detects auth errors correctly', () => {
    const authError = createMockAxiosError(401, 'Unauthorized');
    const regularError = new Error('regular error');

    expect(errorService.isAuthError(authError)).toBe(true);
    expect(errorService.isAuthError(regularError)).toBe(false);
  });

  it('handles different HTTP status codes appropriately', () => {
    expect(errorService.handleError(createMockAxiosError(403)).message).toBe('Access denied');
    expect(errorService.handleError(createMockAxiosError(404)).message).toBe('Resource not found');
    expect(errorService.handleError(createMockAxiosError(500)).message).toBe(
      'Server error occurred'
    );
  });

  it('handles different error types correctly', () => {
    const mockError: ErrorData = {
      message: 'Test error',
      code: 500,
    };

    const result = errorService.handleError(mockError);

    expect(result.type).toBe('UNKNOWN');
    expect(result.message).toBe('Test error');
    expect(logger.error).toHaveBeenCalled();
    expect(toast.error).toHaveBeenCalledWith('Test error');
  });
});
