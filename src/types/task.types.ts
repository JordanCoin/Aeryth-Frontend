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

export type TaskSource = 'manual' | 'git' | 'code' | 'radar' | 'pipeline' | 'integration';

export interface Task {
  id: string;
  title: string;
  text: string;
  description: string;
  status: TaskStatus;
  priority: Priority;
  source: TaskSource;
  createdAt: string;
  verified: boolean | null;
  scheduled: boolean;
  completed: boolean;
  type?: 'terminal' | 'git' | 'general' | 'file' | 'ci' | 'gitlab' | 'ios';
  assignee?: string;
  dueDate?: string;
  estimate?: string;
  tags?: string[];
  dependencies?: string[];
  metadata?: {
    confidence?: number;
    source?: string;
    radarScore?: number;
    requires?: string[];
    pipeline?: {
      type: 'ios' | 'android' | 'web';
      steps: string[];
      config: Record<string, unknown>;
    };
  };
  progress?: {
    type: 'time' | 'percentage' | 'steps';
    current?: number;
    steps?: Array<{ name: string; completed: boolean }>;
  };
  integrations?: {
    zoom?: ZoomMeeting;
    slack?: SlackIntegration;
  };
}

export interface ZoomMeeting {
  meetingId: string;
  scheduledTime: string;
  notes?: {
    summary: string;
    actionItems: string[];
    timestamp: string;
  };
}

export interface SlackIntegration {
  channel: string;
  notified: boolean;
}

export interface Story {
  id: number;
  timestamp: string;
  title: string;
  narrative: string;
  tasks: Task[];
  tags: string[];
}

export interface Analysis {
  summary: string;
  breakdown: string[];
  categories: Record<string, number>;
}

export type AnalyticsEvent = 'TASK_EXTRACTION' | 'TASK_SCHEDULED' | 'CACHE_HIT' | 'ERROR';
