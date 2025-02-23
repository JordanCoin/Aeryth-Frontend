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

class ErrorService {
  private formatError(error: unknown): ErrorDetails {
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
  }

  private getNetworkErrorMessage(status?: number): string {
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
  }

  public handleError(error: unknown, context?: string) {
    const errorDetails = this.formatError(error);

    // Log error
    logger.error('Error occurred:', {
      context,
      ...errorDetails,
    });

    // Show user-friendly notification
    toast.error(errorDetails.message);

    return errorDetails;
  }

  public isNetworkError(error: unknown): boolean {
    if (error instanceof Error) {
      return 'isAxiosError' in error && (error as AxiosError).isAxiosError;
    }
    return false;
  }

  public isAuthError(error: unknown): boolean {
    if (this.isNetworkError(error)) {
      const axiosError = error as AxiosError;
      return axiosError.response?.status === 401;
    }
    return false;
  }
}

export const errorService = new ErrorService();
