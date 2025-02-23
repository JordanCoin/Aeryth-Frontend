import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import NetworkStatus from './NetworkStatus';
import toast from 'react-hot-toast';

vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('NetworkStatus', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true,
    });
  });

  it('shows nothing when online initially', () => {
    const { container } = render(<NetworkStatus />);
    expect(container.firstChild).toBeNull();
  });

  it('shows offline status when connection is lost', () => {
    render(<NetworkStatus />);

    act(() => {
      Object.defineProperty(navigator, 'onLine', { value: false });
      window.dispatchEvent(new Event('offline'));
    });

    expect(screen.getByText('Working Offline')).toBeInTheDocument();
    expect(toast.error).toHaveBeenCalledWith('Connection lost - Working offline');
  });

  it('shows reconnected message temporarily', async () => {
    vi.useFakeTimers();
    render(<NetworkStatus />);

    act(() => {
      // First go offline
      Object.defineProperty(navigator, 'onLine', { value: false });
      window.dispatchEvent(new Event('offline'));
    });

    act(() => {
      // Then back online
      Object.defineProperty(navigator, 'onLine', { value: true });
      window.dispatchEvent(new Event('online'));
    });

    expect(screen.getByText('Connection Restored')).toBeInTheDocument();
    expect(toast.success).toHaveBeenCalledWith('Connection restored');

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(screen.queryByText('Connection Restored')).not.toBeInTheDocument();

    vi.useRealTimers();
  });
});
