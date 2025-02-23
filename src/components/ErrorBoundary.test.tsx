import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ErrorBoundary } from './ErrorBoundary';

describe('ErrorBoundary', () => {
  const ThrowError = () => {
    throw new Error('Test error');
  };

  it('renders children when there is no error', () => {
    render(
      <ErrorBoundary>
        <div>Test content</div>
      </ErrorBoundary>
    );
    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('renders error UI when there is an error', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(
      <ErrorBoundary>
        <ThrowError />
      </ErrorBoundary>
    );

    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('Test error')).toBeInTheDocument();

    spy.mockRestore();
  });

  it('resets error state when clicking try again', async () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const mockReset = vi.fn();
    let shouldThrow = true;

    const TestComponent = () => {
      React.useEffect(() => {
        if (!shouldThrow) {
          mockReset();
        }
      }, []);

      if (shouldThrow) {
        throw new Error('Test error');
      }
      return <div data-testid="recovered">Recovered content</div>;
    };

    render(
      <ErrorBoundary>
        <TestComponent />
      </ErrorBoundary>
    );

    // Verify error state
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();

    // Click try again and update shouldThrow
    shouldThrow = false;
    fireEvent.click(screen.getByText('Try Again'));

    // Wait for the reset to complete
    await waitFor(() => {
      expect(mockReset).toHaveBeenCalled();
    });

    // Verify recovery
    expect(screen.getByTestId('recovered')).toBeInTheDocument();

    spy.mockRestore();
  });
});
