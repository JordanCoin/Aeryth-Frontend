export type TaskType = 'UI' | 'BACKEND' | 'TESTING' | 'OTHER';
export type TaskPriority = 'HIGH' | 'MEDIUM' | 'LOW';

export interface ExtractedTask {
  title: string;
  type: TaskType;
  priority: TaskPriority;
  dependencies: string[];
  estimatedTime?: string;
}

export interface TaskUpdate {
  taskId: string;
  type: 'status' | 'priority' | 'content';
  value: string;
  timestamp: number;
  userId: string;
}

export type TaskStatus = 'todo' | 'in_progress' | 'done';
export type Priority = 'low' | 'medium' | 'high';

export interface Task {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: Priority;
  createdAt: string;
  dueDate?: string;
  project?: string;
}
