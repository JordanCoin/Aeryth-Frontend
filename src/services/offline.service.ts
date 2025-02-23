import { ExtractedTask } from '../types/task.types';
import { logger } from '../utils/logger';

interface CachedData {
  tasks: ExtractedTask[];
  timestamp: number;
}

export class OfflineService {
  private readonly CACHE_KEY = 'task-extractor-cache';
  private readonly MAX_AGE = 24 * 60 * 60 * 1000; // 24 hours

  public saveTasksToCache(tasks: ExtractedTask[]) {
    try {
      const data: CachedData = {
        tasks,
        timestamp: Date.now(),
      };
      localStorage.setItem(this.CACHE_KEY, JSON.stringify(data));
      logger.info('Tasks saved to cache', { count: tasks.length });
    } catch (error) {
      logger.error('Failed to save tasks to cache:', error);
    }
  }

  public getCachedTasks(): ExtractedTask[] | null {
    try {
      const cached = localStorage.getItem(this.CACHE_KEY);
      if (!cached) return null;

      const data: CachedData = JSON.parse(cached);

      // Check if cache is still valid
      if (Date.now() - data.timestamp > this.MAX_AGE) {
        localStorage.removeItem(this.CACHE_KEY);
        return null;
      }

      return data.tasks;
    } catch (error) {
      logger.error('Failed to retrieve tasks from cache:', error);
      return null;
    }
  }

  public clearCache() {
    try {
      localStorage.removeItem(this.CACHE_KEY);
      logger.info('Cache cleared');
    } catch (error) {
      logger.error('Failed to clear cache:', error);
    }
  }
}

export const offlineService = new OfflineService();
