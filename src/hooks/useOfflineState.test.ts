import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useOfflineState } from './useOfflineState';
import { offlineService } from '../services/offline.service';

vi.mock('../services/offline.service', () => ({
  offlineService: {
    getCachedTasks: vi.fn(),
    saveTasksToCache: vi.fn(),
  },
}));

describe('useOfflineState', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset online status
    Object.defineProperty(navigator, 'onLine', {
      writable: true,
      value: true,
    });
  });

  it('initializes with correct online state', () => {
    const { result } = renderHook(() => useOfflineState());
    expect(result.current.isOffline).toBe(false);
  });

  it('handles offline state', () => {
    const mockTasks = [{ title: 'Test Task', type: 'UI', priority: 'HIGH', dependencies: [] }];
    vi.mocked(offlineService.getCachedTasks).mockReturnValue(mockTasks);

    const { result } = renderHook(() => useOfflineState());

    act(() => {
      // Simulate going offline
      Object.defineProperty(navigator, 'onLine', { value: false });
      window.dispatchEvent(new Event('offline'));
    });

    expect(result.current.isOffline).toBe(true);
    expect(result.current.cachedTasks).toEqual(mockTasks);
  });

  it('saves tasks to cache', () => {
    const { result } = renderHook(() => useOfflineState());
    const mockTasks = [{ title: 'Test Task', type: 'UI', priority: 'HIGH', dependencies: [] }];

    act(() => {
      result.current.saveTasks(mockTasks);
    });

    expect(offlineService.saveTasksToCache).toHaveBeenCalledWith(mockTasks);
  });
});
