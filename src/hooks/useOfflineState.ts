import { useState, useEffect } from 'react';
import { ExtractedTask } from '../types/task.types';
import { offlineService } from '../services/offline.service';
import { logger } from '../utils/logger';

export function useOfflineState() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [cachedTasks, setCachedTasks] = useState<ExtractedTask[]>([]);

  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => {
      setIsOffline(true);
      // Load cached tasks when going offline
      const tasks = offlineService.getCachedTasks();
      if (tasks) {
        setCachedTasks(tasks);
        logger.info('Loaded tasks from cache', { count: tasks.length });
      }
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const saveTasks = (tasks: ExtractedTask[]) => {
    offlineService.saveTasksToCache(tasks);
    setCachedTasks(tasks);
  };

  return {
    isOffline,
    cachedTasks,
    saveTasks,
  };
}
