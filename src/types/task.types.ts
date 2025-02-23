export type TaskType = 'UI' | 'BACKEND' | 'TESTING' | 'OTHER';
export type TaskPriority = 'HIGH' | 'MEDIUM' | 'LOW';

export interface ExtractedTask {
  title: string;
  type: TaskType;
  priority: TaskPriority;
  dependencies: string[];
  estimatedTime?: string;
}
