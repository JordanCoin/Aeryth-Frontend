import React, { useState } from 'react';
import { TaskList } from './TaskList';
import { Task, TaskStatus, Priority } from '@/types/task.types';
import { logger } from '@/utils/logger';

// Mock data for testing
const mockTasks: Task[] = [
  {
    id: '1',
    title: 'Implement Authentication Flow',
    text: 'Set up OAuth2 authentication with Google and GitHub',
    description: 'Create login/signup flows and handle token management',
    status: 'in_progress' as TaskStatus,
    priority: 'high' as Priority,
    createdAt: new Date().toISOString(),
    verified: true,
    scheduled: true,
    completed: false,
    integrations: {
      slack: {
        channel: 'team-auth',
        notified: true,
      },
    },
  },
  {
    id: '2',
    title: 'Design System Updates',
    text: 'Update component library with new design tokens',
    description: 'Implement dark mode and accessibility improvements',
    status: 'todo' as TaskStatus,
    priority: 'medium' as Priority,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    verified: true,
    scheduled: false,
    completed: false,
  },
  {
    id: '3',
    title: 'API Performance Optimization',
    text: 'Optimize API endpoints for better performance',
    description: 'Implement caching and reduce response times',
    status: 'done' as TaskStatus,
    priority: 'high' as Priority,
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    verified: true,
    scheduled: true,
    completed: true,
    integrations: {
      zoom: {
        meetingId: 'mock-meeting-123',
        scheduledTime: new Date(Date.now() + 86400000).toISOString(),
      },
    },
  },
];

export const TaskManagement: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>(mockTasks);

  const handleStatusChange = (taskId: string, newStatus: TaskStatus) => {
    logger.info('Updating task status', { taskId, newStatus });
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId
          ? {
              ...task,
              status: newStatus,
              completed: newStatus === 'done',
            }
          : task
      )
    );
  };

  const handlePriorityChange = (taskId: string, newPriority: Priority) => {
    logger.info('Updating task priority', { taskId, newPriority });
    setTasks(prevTasks =>
      prevTasks.map(task =>
        task.id === taskId
          ? {
              ...task,
              priority: newPriority,
            }
          : task
      )
    );
  };

  const addTestTask = () => {
    const newTask: Task = {
      id: `task-${Date.now()}`,
      title: `Test Task ${tasks.length + 1}`,
      text: 'This is a test task',
      description: 'Created for testing purposes',
      status: 'todo' as TaskStatus,
      priority: 'medium' as Priority,
      createdAt: new Date().toISOString(),
      verified: true,
      scheduled: false,
      completed: false,
    };

    setTasks(prevTasks => [...prevTasks, newTask]);
    logger.info('Added test task', { taskId: newTask.id });
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Task Management</h1>
        <button
          onClick={addTestTask}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
        >
          Add Test Task
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        {[
          {
            label: 'Total Tasks',
            value: tasks.length,
            color: 'bg-blue-100 text-blue-800',
          },
          {
            label: 'Completed',
            value: tasks.filter(t => t.completed).length,
            color: 'bg-green-100 text-green-800',
          },
          {
            label: 'In Progress',
            value: tasks.filter(t => t.status === 'in_progress').length,
            color: 'bg-yellow-100 text-yellow-800',
          },
        ].map((stat, index) => (
          <div key={index} className={`${stat.color} rounded-lg p-4 text-center`}>
            <div className="text-2xl font-bold">{stat.value}</div>
            <div className="text-sm">{stat.label}</div>
          </div>
        ))}
      </div>

      <TaskList
        tasks={tasks}
        groupBy="status"
        sortBy="priority"
        onStatusChange={handleStatusChange}
        onPriorityChange={handlePriorityChange}
      />
    </div>
  );
};
