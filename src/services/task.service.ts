import { ExtractedTask } from '../types/task.types';
import { api } from './api';
import { offlineService } from './offline.service';
import { logger } from '../utils/logger';
import { analytics } from './analytics.service';

// Sync configuration
const SYNC_CONFIG = {
  maxRetries: 3,
  retryDelay: 1000,
  batchSize: 50,
};

// Extend the API with task endpoints
export const taskApi = api.injectEndpoints({
  endpoints: build => ({
    saveTasks: build.mutation<void, ExtractedTask[]>({
      query: tasks => ({
        url: '/tasks',
        method: 'POST',
        body: { tasks },
      }),
      // Optimistic updates
      async onQueryStarted(tasks, { queryFulfilled }) {
        try {
          await queryFulfilled;
          analytics.trackEvent('TASK_SYNC', { taskCount: tasks.length });
        } catch (error) {
          logger.error('Task sync failed:', error);
          analytics.trackEvent('ERROR', { errorType: 'SYNC_FAILED' });
        }
      },
    }),
    getTasks: build.query<ExtractedTask[], void>({
      query: () => '/tasks',
      // Keep cache fresh for 5 minutes
      keepUnusedDataFor: 300,
    }),
  }),
});

export class TaskSyncService {
  private syncQueue: ExtractedTask[][] = [];
  private isSyncing = false;
  private retryCount = 0;

  constructor() {
    // Listen for online status to trigger sync
    window.addEventListener('online', this.handleOnline);
    window.addEventListener('offline', this.handleOffline);
  }

  private handleOnline = () => {
    logger.info('Connection restored, starting sync');
    this.retryCount = 0;
    this.syncTasks();
  };

  private handleOffline = () => {
    logger.info('Connection lost, pausing sync');
    this.isSyncing = false;
  };

  public async queueTasks(tasks: ExtractedTask[]) {
    // Split into smaller batches if needed
    const batches = this.splitIntoBatches(tasks);
    this.syncQueue.push(...batches);

    offlineService.saveTasksToCache(tasks);
    analytics.trackEvent('TASK_QUEUED', { taskCount: tasks.length });

    if (navigator.onLine && !this.isSyncing) {
      await this.syncTasks();
    }
  }

  private splitIntoBatches(tasks: ExtractedTask[]): ExtractedTask[][] {
    const batches: ExtractedTask[][] = [];
    for (let i = 0; i < tasks.length; i += SYNC_CONFIG.batchSize) {
      batches.push(tasks.slice(i, i + SYNC_CONFIG.batchSize));
    }
    return batches;
  }

  private async syncTasks() {
    if (this.isSyncing || this.syncQueue.length === 0) return;

    try {
      this.isSyncing = true;
      logger.info('Starting task sync', {
        queueLength: this.syncQueue.length,
        retryCount: this.retryCount,
      });

      while (this.syncQueue.length > 0) {
        const batch = this.syncQueue[0];
        await this.syncBatch(batch);
        this.syncQueue.shift();
      }

      logger.info('Task sync completed');
      this.retryCount = 0;
    } catch (error) {
      this.handleSyncError(error);
    } finally {
      this.isSyncing = false;
    }
  }

  private async syncBatch(tasks: ExtractedTask[]) {
    try {
      await taskApi.endpoints.saveTasks.initiate(tasks);
      logger.info('Synced tasks batch', { count: tasks.length });
    } catch (error) {
      if (this.retryCount < SYNC_CONFIG.maxRetries) {
        this.retryCount++;
        logger.warn('Retrying sync', { retryCount: this.retryCount });
        await new Promise(resolve => setTimeout(resolve, SYNC_CONFIG.retryDelay));
        throw error; // Propagate to trigger retry
      }
      throw new Error('Max retries exceeded');
    }
  }

  private handleSyncError(error: unknown) {
    logger.error('Task sync failed:', error);
    analytics.trackEvent('ERROR', {
      errorType: 'SYNC_FAILED',
      retryCount: this.retryCount,
    });
  }

  public cleanup() {
    window.removeEventListener('online', this.handleOnline);
    window.removeEventListener('offline', this.handleOffline);
  }
}

export const taskSyncService = new TaskSyncService();
export const { useSaveTasksMutation, useGetTasksQuery } = taskApi;

export const processTask = async (taskData: TaskData) => {
  try {
    // Implementation without dispatch
    return await api.post('/tasks', taskData);
  } catch (error) {
    handleError(error);
    throw error;
  }
};
