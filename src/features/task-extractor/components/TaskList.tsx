import { ExtractedTask } from '../../../types/task.types';
import { ClockIcon, ArrowsPointingOutIcon } from '@heroicons/react/24/outline';

interface TaskListProps {
  tasks: ExtractedTask[];
}

const priorityColors = {
  HIGH: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  MEDIUM: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  LOW: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
};

const typeColors = {
  UI: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  BACKEND: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  TESTING: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  OTHER: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200',
};

export default function TaskList({ tasks }: TaskListProps) {
  if (!tasks.length) return null;

  return (
    <div className="space-y-4">
      {tasks.map((task, index) => (
        <div
          key={index}
          className="bg-white dark:bg-gray-800 rounded-lg shadow p-6
                     hover:shadow-md transition-shadow duration-200"
        >
          <div className="flex items-start justify-between">
            <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">{task.title}</h3>
            <div className="flex space-x-2">
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${priorityColors[task.priority]}`}
              >
                {task.priority}
              </span>
              <span
                className={`px-2 py-1 rounded-full text-xs font-medium ${typeColors[task.type]}`}
              >
                {task.type}
              </span>
            </div>
          </div>

          {task.estimatedTime && (
            <div className="mt-2 flex items-center text-sm text-gray-500 dark:text-gray-400">
              <ClockIcon className="h-4 w-4 mr-1" />
              {task.estimatedTime}
            </div>
          )}

          {task.dependencies.length > 0 && (
            <div className="mt-2">
              <div className="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-1">
                <ArrowsPointingOutIcon className="h-4 w-4 mr-1" />
                Dependencies:
              </div>
              <div className="flex flex-wrap gap-2">
                {task.dependencies.map((dep, i) => (
                  <span
                    key={i}
                    className="px-2 py-1 rounded-full text-xs font-medium
                             bg-gray-100 text-gray-700
                             dark:bg-gray-700 dark:text-gray-300"
                  >
                    {dep}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
