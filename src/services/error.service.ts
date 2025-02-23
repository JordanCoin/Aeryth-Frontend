import { logger } from '../utils/logger';
import toast from 'react-hot-toast';
import { AxiosError } from 'axios';

export type ErrorType = 'API' | 'VALIDATION' | 'AUTH' | 'NETWORK' | 'UNKNOWN';

interface ErrorDetails {
  type: ErrorType;
  message: string;
  code?: string;
  originalError?: unknown;
}

export const errorService = {
  handleError(error: unknown) {
    if (this.isNetworkError(error)) {
      const axiosError = error as AxiosError;
      const status = axiosError.response?.status;
      const message = this.getNetworkErrorMessage(status);
      logger.error('Network error:', error);
      toast.error(message);
      return { type: 'NETWORK', message };
    }

    if (error instanceof Error) {
      if (error.name === 'ValidationError') {
        logger.error('Validation error:', error);
        toast.error(error.message);
        return { type: 'VALIDATION', message: error.message };
      }

      logger.error('Error:', error);
      toast.error(error.message);
      return { type: 'UNKNOWN', message: error.message };
    }

    // Handle plain objects with message property
    if (typeof error === 'object' && error !== null && 'message' in error) {
      const message = (error as { message: string }).message;
      logger.error('Error:', error);
      toast.error(message);
      return { type: 'UNKNOWN', message };
    }

    const message = 'An unexpected error occurred';
    logger.error('Unknown error:', error);
    toast.error(message);
    return { type: 'UNKNOWN', message };
  },

  formatError(error: unknown): ErrorDetails {
    if (error instanceof Error) {
      // Network error
      if ('isAxiosError' in error && (error as AxiosError).isAxiosError) {
        const axiosError = error as AxiosError;
        const status = axiosError.response?.status;

        return {
          type: 'NETWORK',
          message: this.getNetworkErrorMessage(status),
          code: String(status),
          originalError: error,
        };
      }

      // Validation error
      if (error.name === 'ValidationError') {
        return {
          type: 'VALIDATION',
          message: error.message,
          originalError: error,
        };
      }

      return {
        type: 'UNKNOWN',
        message: error.message,
        originalError: error,
      };
    }

    return {
      type: 'UNKNOWN',
      message: 'An unexpected error occurred',
      originalError: error,
    };
  },

  getNetworkErrorMessage(status?: number): string {
    switch (status) {
      case 401:
        return 'Authentication required';
      case 403:
        return 'Access denied';
      case 404:
        return 'Resource not found';
      case 500:
        return 'Server error occurred';
      default:
        return 'Network request failed';
    }
  },

  isNetworkError(error: unknown): boolean {
    if (error instanceof Error) {
      return 'isAxiosError' in error && (error as AxiosError).isAxiosError;
    }
    return false;
  },

  isAuthError(error: unknown): boolean {
    if (this.isNetworkError(error)) {
      const axiosError = error as AxiosError;
      return axiosError.response?.status === 401;
    }
    return false;
  },
};
