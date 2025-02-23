import React from 'react';
import { useState } from 'react';
import { useExtractTasksMutation } from '../../services/api';
import { ExtractedTask } from '../../types/task.types';
import TaskList from './components/TaskList';
import TextInput from './components/TextInput';
import LoadingOverlay from '../../components/LoadingOverlay';
import { errorService } from '../../services/error.service';
import { logger } from '../../utils/logger';
import { useOfflineState } from '../../hooks/useOfflineState';
import { taskSyncService } from '../../services/task.service';
import { analytics } from '../../services/analytics.service';

export default function TaskExtractor() {
  const [text, setText] = useState('');
  const [extractTasks, { isLoading }] = useExtractTasksMutation();
  const [tasks, setTasks] = useState<ExtractedTask[]>([]);
  const { isOffline, cachedTasks, saveTasks } = useOfflineState();

  const handleExtract = async () => {
    const startTime = Date.now();

    try {
      logger.info('Extracting tasks from text', { textLength: text.length });
      const result = await extractTasks({ text }).unwrap();

      setTasks(result);
      saveTasks(result);
      await taskSyncService.queueTasks(result);

      analytics.trackEvent('TASK_EXTRACTION', {
        taskCount: result.length,
        textLength: text.length,
        duration: Date.now() - startTime,
      });

      logger.info('Tasks extracted and queued', { count: result.length });
    } catch (error) {
      if (errorService.isNetworkError(error) && cachedTasks.length > 0) {
        setTasks(cachedTasks);
        analytics.trackEvent('CACHE_HIT', { taskCount: cachedTasks.length });
        logger.info('Using cached tasks due to network error');
      } else {
        analytics.trackEvent('ERROR', {
          errorType: errorService.isNetworkError(error) ? 'NETWORK' : 'UNKNOWN',
        });
      }
      errorService.handleError(error, 'TaskExtractor.handleExtract');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6 relative">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Task Extractor</h1>
        {isOffline && (
          <div className="text-yellow-600 dark:text-yellow-400 flex items-center">
            <span className="mr-2">⚠️</span>
            Offline Mode
          </div>
        )}
      </div>

      <TextInput value={text} onChange={setText} onSubmit={handleExtract} isLoading={isLoading} />

      {isLoading && <LoadingOverlay message="Extracting tasks..." />}
      <TaskList tasks={tasks} />
    </div>
  );
}
