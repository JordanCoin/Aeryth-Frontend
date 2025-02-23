import { useState, useEffect } from 'react';
import { websocketService, WebSocketStatus } from '../services/websocket.service';
import { TaskUpdate } from '../types/task.types';
import { logger } from '../utils/logger';

export function useWebSocketUpdates(taskIds: string[]) {
  const [updates, setUpdates] = useState<TaskUpdate[]>([]);
  const [status, setStatus] = useState<WebSocketStatus>('disconnected');

  useEffect(() => {
    websocketService.connect();

    const unsubscribeUpdates = websocketService.subscribe(update => {
      if (taskIds.includes(update.taskId)) {
        setUpdates(prev => [...prev, update]);
        logger.info('Received task update', { taskId: update.taskId });
      }
    });

    const unsubscribeStatus = websocketService.subscribeToStatus(setStatus);

    return () => {
      unsubscribeUpdates();
      unsubscribeStatus();
    };
  }, [taskIds]);

  return { updates, status };
}
