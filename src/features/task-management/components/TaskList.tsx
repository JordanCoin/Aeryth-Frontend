import React, { useMemo } from 'react';
import { Task, TaskStatus, Priority } from '@/types/task.types';
import { logger } from '@/utils/logger';
import {
  Calendar,
  Clock,
  Tag,
  User,
  GitBranch,
  Link,
  AlertCircle,
  Loader2,
  CheckCircle,
  Circle,
  Timer,
  ArrowRight,
  RotateCcw,
  RefreshCw,
} from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { format } from 'date-fns';

interface TaskError {
  taskId: string;
  error: string;
  timestamp: number;
}

interface TaskListProps {
  tasks: Task[];
  onStatusChange?: (taskId: string, status: TaskStatus) => void;
  onPriorityChange?: (taskId: string, priority: Priority) => void;
  groupBy?: 'status' | 'priority' | 'assignee' | 'type';
  sortBy?: 'priority' | 'created' | 'dueDate' | 'title';
  searchTerm?: string;
  loadingTasks: string[];
  failedTasks: TaskError[];
  onRetry: (taskId: string) => void;
  onAddDueDate?: (taskId: string, date: Date) => void;
}

interface GroupedTasks {
  [key: string]: Task[];
}

interface TaskProgress {
  type: 'time' | 'percentage' | 'steps';
  current?: number;
  total?: number;
  startedAt?: string;
  estimatedCompletion?: string;
  steps?: {
    name: string;
    completed: boolean;
  }[];
}

interface Task {
  progress?: TaskProgress;
  startedAt?: string;
  estimatedCompletion?: string;
}

export const TaskList: React.FC<TaskListProps> = ({
  tasks,
  groupBy = 'status',
  sortBy = 'priority',
  onStatusChange,
  onPriorityChange,
  searchTerm = '',
  loadingTasks,
  failedTasks,
  onRetry,
  onAddDueDate,
}) => {
  const sortTasks = useMemo(() => {
    return (tasksToSort: Task[]) => {
      return [...tasksToSort].sort((a, b) => {
        switch (sortBy) {
          case 'priority':
            return b.priority.localeCompare(a.priority);
          case 'created':
            return b.createdAt.localeCompare(a.createdAt);
          default:
            return 0;
        }
      });
    };
  }, [sortBy]);

  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      if (!searchTerm) return true;
      const searchLower = searchTerm.toLowerCase();
      return (
        task.title.toLowerCase().includes(searchLower) ||
        task.description.toLowerCase().includes(searchLower) ||
        task.assignee?.toLowerCase().includes(searchLower) ||
        task.tags?.some(tag => tag.toLowerCase().includes(searchLower))
      );
    });
  }, [tasks, searchTerm]);

  const groupedTasks = useMemo(() => {
    const grouped: GroupedTasks = {};

    filteredTasks.forEach(task => {
      const key = task[groupBy] || 'undefined';
      if (!grouped[key]) {
        grouped[key] = [];
      }
      grouped[key].push(task);
    });

    Object.keys(grouped).forEach(key => {
      grouped[key] = sortTasks(grouped[key]);
    });

    logger.info('Tasks grouped and sorted', {
      groupBy,
      sortBy,
      groupCount: Object.keys(grouped).length,
    });

    return grouped;
  }, [filteredTasks, groupBy, sortBy, sortTasks]);

  const getProgressIndicator = (task: Task) => {
    if (!task.progress) return null;

    switch (task.progress.type) {
      case 'percentage':
        return `${task.progress.current}%`;
      case 'steps':
        return `${task.progress.steps?.filter(s => s.completed).length || 0}/${task.progress.steps?.length || 0} steps`;
      case 'time':
        if (task.startedAt) {
          const elapsed = Date.now() - new Date(task.startedAt).getTime();
          const hours = Math.floor(elapsed / (1000 * 60 * 60));
          const minutes = Math.floor((elapsed % (1000 * 60 * 60)) / (1000 * 60));
          return `${hours}h ${minutes}m`;
        }
        return null;
      default:
        return null;
    }
  };

  const renderTaskMetadata = (task: Task) => (
    <div className="mt-3 flex flex-wrap gap-2 text-sm">
      {task.assignee && (
        <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
          <User className="w-4 h-4" />
          <span>{task.assignee}</span>
        </div>
      )}
      {task.dueDate && (
        <div className="flex items-center gap-1 text-red-600 dark:text-red-400">
          <Calendar className="w-4 h-4" />
          <span>{new Date(task.dueDate).toLocaleDateString()}</span>
        </div>
      )}
      {task.estimate && (
        <div className="flex items-center gap-1 text-purple-600 dark:text-purple-400">
          <Clock className="w-4 h-4" />
          <span>{task.estimate}</span>
        </div>
      )}
      {task.tags && task.tags.length > 0 && (
        <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
          <Tag className="w-4 h-4" />
          <div className="flex gap-1">
            {task.tags.map(tag => (
              <span
                key={tag}
                className="bg-green-100 dark:bg-green-900 px-2 py-0.5 rounded-full text-xs"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}
      {task.dependencies && task.dependencies.length > 0 && (
        <div className="flex items-center gap-1 text-orange-600 dark:text-orange-400">
          <Link className="w-4 h-4" />
          <span>{task.dependencies.length} dependencies</span>
        </div>
      )}
      {task.type && (
        <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
          <GitBranch className="w-4 h-4" />
          <span>{task.type}</span>
        </div>
      )}
    </div>
  );

  const renderTaskProgress = (task: Task) => {
    const hasMetadata = task.metadata?.requires?.length || task.metadata?.pipeline;
    if (!hasMetadata) return null;

    return (
      <div className="mt-3 border-t border-gray-200 dark:border-gray-700 pt-3">
        {task.metadata.requires && (
          <div className="text-sm text-gray-600 dark:text-gray-400">
            <div className="font-medium mb-1">Requirements:</div>
            <div className="flex flex-wrap gap-1">
              {task.metadata.requires.map(req => (
                <span
                  key={req}
                  className="bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded text-xs"
                >
                  {req}
                </span>
              ))}
            </div>
          </div>
        )}
        {task.metadata.pipeline && (
          <div className="mt-2 text-sm">
            <div className="font-medium text-gray-600 dark:text-gray-400 mb-1">
              Pipeline Progress:
            </div>
            <div className="flex gap-2">
              {task.metadata.pipeline.steps.map((step, index) => (
                <div
                  key={step}
                  className={`flex items-center px-2 py-1 rounded ${
                    index === 0 ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  <span className="text-xs">{step}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderTaskStatus = (task: Task) => {
    const isLoading = loadingTasks.includes(task.id);
    const failedTask = failedTasks.find(f => f.taskId === task.id);
    const hasError = !!failedTask;

    if (isLoading) {
      return (
        <div className="flex items-center gap-2 text-blue-500">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span className="text-sm">Updating status...</span>
        </div>
      );
    }

    if (hasError) {
      return (
        <div className="flex items-center gap-2 text-red-500">
          <AlertCircle className="w-4 h-4" />
          <span className="text-sm">{failedTask.error}</span>
          <button
            onClick={() => onRetry(task.id)}
            className="flex items-center gap-1 px-2 py-1 bg-red-100 hover:bg-red-200 
              text-red-700 rounded-full text-xs transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            Retry
          </button>
        </div>
      );
    }

    return null;
  };

  const renderDueDatePicker = (taskId: string) => (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className="w-full sm:w-32 flex items-center justify-center gap-1 px-2 py-1 
            text-sm rounded border border-gray-300 hover:bg-gray-50 
            dark:border-gray-600 dark:hover:bg-gray-800"
        >
          <Calendar className="w-4 h-4" />
          Add Due Date
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <CalendarComponent
          mode="single"
          selected={undefined}
          onSelect={date => date && onAddDueDate?.(taskId, date)}
          initialFocus
          disabled={date => date < new Date()}
        />
      </PopoverContent>
    </Popover>
  );

  const renderTask = (task: Task) => {
    const isOverdue = task.dueDate && new Date(task.dueDate) < new Date();
    const daysUntilDue = task.dueDate
      ? Math.ceil((new Date(task.dueDate).getTime() - new Date().getTime()) / (1000 * 3600 * 24))
      : null;

    return (
      <div
        key={task.id}
        className={`bg-white dark:bg-gray-800 rounded-lg shadow p-4 mb-2 border-l-4 
          ${
            isOverdue
              ? 'border-red-500 bg-red-50 dark:bg-red-900/10'
              : task.status === 'done'
                ? 'border-green-500'
                : task.status === 'in_progress'
                  ? 'border-blue-500'
                  : 'border-gray-500'
          }`}
      >
        <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
          <div className="flex-1 min-w-0">
            {/* Due Date Banner */}
            {task.dueDate && (
              <div
                className={`mb-3 px-3 py-1.5 rounded-lg text-sm font-medium flex items-center gap-2
                ${
                  isOverdue
                    ? 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200'
                    : daysUntilDue && daysUntilDue <= 3
                      ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200'
                      : 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-200'
                }`}
              >
                <Calendar className="w-4 h-4" />
                {isOverdue ? (
                  <span>Overdue by {Math.abs(daysUntilDue!)} days</span>
                ) : daysUntilDue === 0 ? (
                  <span>Due today</span>
                ) : daysUntilDue === 1 ? (
                  <span>Due tomorrow</span>
                ) : (
                  <span>Due in {daysUntilDue} days</span>
                )}
                <span className="text-xs opacity-75">
                  ({new Date(task.dueDate).toLocaleDateString()})
                </span>
              </div>
            )}

            {/* Existing task content */}
            <div className="flex items-start gap-2">
              <div className="flex-shrink-0 mt-1">
                {task.status === 'done' ? (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                ) : task.status === 'in_progress' ? (
                  <Timer className="w-5 h-5 text-blue-500" />
                ) : (
                  <Circle className="w-5 h-5 text-gray-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 truncate">
                  {task.title}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                  {task.description}
                </p>
              </div>
            </div>
          </div>

          {/* Task Actions */}
          <div className="flex flex-col gap-2 w-full sm:w-auto">
            {!task.dueDate && renderDueDatePicker(task.id)}

            <select
              value={task.status}
              onChange={e => onStatusChange?.(task.id, e.target.value as TaskStatus)}
              disabled={loadingTasks.includes(task.id)}
              className="w-full sm:w-32 rounded border px-2 py-1 text-sm"
            >
              <option value="todo">Todo</option>
              <option value="in_progress">In Progress</option>
              <option value="done">Done</option>
            </select>
            <select
              value={task.priority}
              onChange={e => onPriorityChange?.(task.id, e.target.value as Priority)}
              disabled={loadingTasks.includes(task.id)}
              className="w-full sm:w-32 rounded border px-2 py-1 text-sm"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {Object.entries(groupedTasks).map(([group, groupTasks]) => (
        <div key={group} className="space-y-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 capitalize">
              {group}
            </h2>
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {groupTasks.length} tasks
            </span>
          </div>
          <div className="space-y-2">{groupTasks.map(renderTask)}</div>
        </div>
      ))}
    </div>
  );
};
