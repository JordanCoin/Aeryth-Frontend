import React, { useMemo } from 'react';
import { Task, TaskStatus, Priority } from '../../types/task.types';
import { useWebSocketUpdates } from '../../hooks/useWebSocketUpdates';
import { logger } from '../../utils/logger';

interface TaskListProps {
  tasks: Task[];
  onStatusChange?: (taskId: string, status: TaskStatus) => void;
  onPriorityChange?: (taskId: string, priority: Priority) => void;
  groupBy?: 'status' | 'priority' | 'project';
  sortBy?: 'dueDate' | 'priority' | 'created';
}

interface GroupedTasks {
  [key: string]: Task[];
}

export const TaskList: React.FC<TaskListProps> = ({
  tasks,
  groupBy = 'status',
  sortBy = 'priority',
  onStatusChange,
  onPriorityChange,
}) => {
  const taskIds = tasks.map(task => task.id);
  const { updates, status: wsStatus } = useWebSocketUpdates(taskIds);

  const sortTasks = (tasksToSort: Task[]) => {
    return [...tasksToSort].sort((a, b) => {
      switch (sortBy) {
        case 'dueDate':
          return (a.dueDate || '').localeCompare(b.dueDate || '');
        case 'priority':
          return b.priority.localeCompare(a.priority);
        case 'created':
          return b.createdAt.localeCompare(a.createdAt);
        default:
          return 0;
      }
    });
  };

  const groupedTasks = useMemo(() => {
    const grouped: GroupedTasks = {};

    tasks.forEach(task => {
      const key = task[groupBy] || 'undefined';
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(task);
    });

    // Sort tasks within each group
    Object.keys(grouped).forEach(key => {
      grouped[key] = sortTasks(grouped[key]);
    });

    logger.info('Tasks grouped and sorted', {
      groupBy,
      sortBy,
      groupCount: Object.keys(grouped).length,
    });

    return grouped;
  }, [tasks, groupBy, sortBy]);

  const renderTask = (task: Task) => (
    <div key={task.id} className="bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-2">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">{task.title}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">{task.description}</p>
        </div>
        <div className="flex gap-2">
          <select
            value={task.status}
            onChange={e => onStatusChange?.(task.id, e.target.value as TaskStatus)}
            className="rounded border border-gray-300 dark:border-gray-600"
          >
            <option value="todo">Todo</option>
            <option value="in_progress">In Progress</option>
            <option value="done">Done</option>
          </select>
          <select
            value={task.priority}
            onChange={e => onPriorityChange?.(task.id, e.target.value as Priority)}
            className="rounded border border-gray-300 dark:border-gray-600"
          >
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
          </select>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* WebSocket status indicator */}
      <div className={`websocket-status-${wsStatus} text-sm text-right`}>
        {wsStatus === 'connected' ? '🟢' : wsStatus === 'connecting' ? '🟡' : '🔴'}
      </div>

      {/* Grouped tasks */}
      {Object.entries(groupedTasks).map(([group, groupTasks]) => (
        <div key={group} className="space-y-2">
          <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 capitalize">
            {group}
          </h2>
          <div className="space-y-2">{groupTasks.map(renderTask)}</div>
        </div>
      ))}
    </div>
  );
};
