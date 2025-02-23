import React, { useState, useEffect, useMemo } from 'react';
import { TaskList } from './TaskList';
import { Task, TaskStatus, Priority } from '@/types/task.types';
import { logger } from '@/utils/logger';
import {
  WifiOff,
  Database,
  Search,
  Filter,
  SortAsc,
  Github,
  Video,
  RefreshCw,
  CheckCircle2,
  AlertCircle,
  GitBranch,
  Link as LinkIcon,
  Calendar,
  Mail,
} from 'lucide-react';
import { toast } from 'sonner';
import { Card } from '@/components/ui/card';
import { STORAGE_KEYS } from '@/constants/storage';

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
    startedAt: new Date(Date.now() - 45 * 60000).toISOString(), // Started 45 mins ago
    estimatedCompletion: new Date(Date.now() + 30 * 60000).toISOString(), // 30 mins remaining
    progress: {
      type: 'percentage',
      current: 60,
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
  {
    id: '4',
    title: 'Design System Updates',
    text: 'Update component library with new design tokens',
    description: 'Implement dark mode and accessibility improvements',
    status: 'in_progress' as TaskStatus,
    priority: 'medium' as Priority,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    verified: true,
    scheduled: false,
    completed: false,
    startedAt: new Date(Date.now() - 20 * 60000).toISOString(),
    progress: {
      type: 'steps',
      steps: [
        { name: 'Design Review', completed: true },
        { name: 'Implementation', completed: true },
        { name: 'Testing', completed: false },
        { name: 'Documentation', completed: false },
      ],
    },
  },
];

const STORAGE_KEY = 'task-management-data';

interface IntegrationStatus {
  github?: {
    connected: boolean;
    username?: string;
    lastSync?: string;
  };
  zoom?: {
    connected: boolean;
    email?: string;
    lastSync?: string;
  };
  gitlab?: {
    connected: boolean;
    username?: string;
    lastSync?: string;
    projects?: number;
  };
  google?: {
    connected: boolean;
    email?: string;
    lastSync?: string;
    calendars?: number;
    tasks?: number;
  };
  apple?: {
    connected: boolean;
    teamId?: string;
    lastSync?: string;
    appStoreApps?: number;
    testflightApps?: number;
    issuerID?: string;
    keyID?: string;
  };
}

export const TaskManagement: React.FC = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [lastSynced, setLastSynced] = useState<Date | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [groupBy, setGroupBy] = useState<'status' | 'priority' | 'assignee' | 'type'>('status');
  const [sortBy, setSortBy] = useState<'priority' | 'created' | 'dueDate' | 'title'>('priority');
  const [isLoading, setIsLoading] = useState(true);
  const [loadingTasks, setLoadingTasks] = useState<string[]>([]);
  const [failedTasks, setFailedTasks] = useState<TaskError[]>([]);
  const TASK_UPDATE_TIMEOUT = 10000; // 10 seconds timeout
  const [integrationStatus, setIntegrationStatus] = useState<IntegrationStatus>({});
  const [isSyncing, setIsSyncing] = useState<Record<string, boolean>>({});

  // Load tasks from localStorage on mount
  useEffect(() => {
    const loadTasks = async () => {
      setIsLoading(true);
      try {
        const storedTasks = localStorage.getItem(STORAGE_KEYS.TASKS);
        if (storedTasks) {
          const tasks = JSON.parse(storedTasks);
          setTasks(tasks);
          setLastSynced(new Date());
          logger.info('Loaded tasks from storage', { count: tasks.length });
        } else {
          setTasks(mockTasks);
          logger.info('Using mock tasks');
        }
      } catch (error) {
        logger.error('Failed to load tasks', { error });
      } finally {
        setIsLoading(false);
      }
    };

    loadTasks();
  }, []);

  // Save tasks to localStorage when they change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(tasks));
    logger.info('Saved tasks to storage', { count: tasks.length });
  }, [tasks]);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleTaskUpdate = (updatedTask: Task) => {
    setTasks(prev => {
      const newTasks = prev.map(t => 
        t.id === updatedTask.id ? updatedTask : t
      );
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(newTasks));
      return newTasks;
    });
  };

  const handleStatusChange = async (taskId: string, newStatus: TaskStatus) => {
    const updateFn = async () => {
      await new Promise(resolve => setTimeout(resolve, 800));
      setTasks(prevTasks =>
        prevTasks.map(task =>
          task.id === taskId
            ? {
                ...task,
                status: newStatus,
                completed: newStatus === 'done',
                startedAt: newStatus === 'in_progress' ? new Date().toISOString() : task.startedAt,
                progress:
                  newStatus === 'in_progress'
                    ? { type: 'percentage', current: 0 }
                    : newStatus === 'done'
                      ? { type: 'percentage', current: 100 }
                      : undefined,
              }
            : task
        )
      );
    };

    await handleTaskUpdate(tasks.find(t => t.id === taskId) || tasks[0]);
  };

  const handlePriorityChange = async (taskId: string, newPriority: Priority) => {
    const updateFn = async () => {
      await new Promise(resolve => setTimeout(resolve, 800));
      setTasks(prevTasks =>
        prevTasks.map(task => (task.id === taskId ? { ...task, priority: newPriority } : task))
      );
    };

    await handleTaskUpdate(tasks.find(t => t.id === taskId) || tasks[0]);
  };

  const handleRetry = async (taskId: string) => {
    const failedTask = failedTasks.find(f => f.taskId === taskId);
    if (!failedTask) return;

    const task = tasks.find(t => t.id === taskId);
    if (!task) return;

    // Retry the last failed action
    if (task.status === 'in_progress') {
      await handleStatusChange(taskId, task.status);
    } else {
      await handlePriorityChange(taskId, task.priority);
    }
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

  const taskAnalytics = useMemo(() => {
    const now = new Date();
    return {
      total: tasks.length,
      completed: tasks.filter(t => t.completed).length,
      inProgress: tasks.filter(t => t.status === 'in_progress').length,
      highPriority: tasks.filter(t => t.priority === 'high').length,
      withDueDate: tasks.filter(t => t.dueDate).length,
      withAssignee: tasks.filter(t => t.assignee).length,
      withTags: tasks.filter(t => t.tags?.length).length,
      averageConfidence:
        tasks.reduce((acc, t) => acc + (t.metadata?.confidence || 0), 0) / tasks.length,
      overdueTasks: tasks.filter(t => t.dueDate && new Date(t.dueDate) < now).length,
      dueSoon: tasks.filter(t => {
        if (!t.dueDate || t.status === 'done') return false;
        const daysUntil = Math.ceil(
          (new Date(t.dueDate).getTime() - now.getTime()) / (1000 * 3600 * 24)
        );
        return daysUntil <= 3 && daysUntil >= 0;
      }).length,
      completedOnTime: tasks.filter(
        t =>
          t.status === 'done' &&
          t.dueDate &&
          t.completedAt &&
          new Date(t.completedAt) <= new Date(t.dueDate)
      ).length,
    };
  }, [tasks]);

  const handleGitHubConnect = async () => {
    try {
      setIsSyncing(prev => ({ ...prev, github: true }));

      // Initialize GitHub OAuth flow
      const response = await fetch('/api/v1/auth/github/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const { authUrl } = await response.json();

      // Open GitHub OAuth popup
      const popup = window.open(
        authUrl,
        'GitHub Authorization',
        'width=600,height=700,scrollbars=yes'
      );

      // Listen for OAuth completion
      window.addEventListener('message', async event => {
        if (event.data.type === 'github-oauth-success') {
          const { accessToken } = event.data;

          // Sync GitHub data
          const syncResponse = await fetch('/api/v1/integrations/github/sync', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${accessToken}`,
            },
          });

          const { username, issues } = await syncResponse.json();

          setIntegrationStatus(prev => ({
            ...prev,
            github: {
              connected: true,
              username,
              lastSync: new Date().toISOString(),
            },
          }));

          // Convert GitHub issues to tasks
          const newTasks = issues.map(issue => ({
            id: `gh-${issue.number}`,
            title: issue.title,
            description: issue.body,
            status: issue.state === 'open' ? 'todo' : 'done',
            priority: issue.labels.includes('high') ? 'high' : 'medium',
            createdAt: issue.created_at,
            type: 'github',
            metadata: {
              source: 'github',
              url: issue.html_url,
              repo: issue.repository,
              labels: issue.labels,
            },
          }));

          setTasks(prev => [...prev, ...newTasks]);
          toast.success(`Imported ${newTasks.length} tasks from GitHub`);
          logger.info('GitHub sync completed', { issueCount: newTasks.length });
        }
      });
    } catch (error) {
      toast.error('Failed to connect to GitHub');
      logger.error('GitHub connection failed', { error });
    } finally {
      setIsSyncing(prev => ({ ...prev, github: false }));
    }
  };

  const handleZoomConnect = async () => {
    try {
      setIsSyncing(prev => ({ ...prev, zoom: true }));

      // Initialize Zoom OAuth flow
      const response = await fetch('/api/v1/auth/zoom/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const { authUrl } = await response.json();

      // Open Zoom OAuth popup
      const popup = window.open(
        authUrl,
        'Zoom Authorization',
        'width=600,height=700,scrollbars=yes'
      );

      // Listen for OAuth completion
      window.addEventListener('message', async event => {
        if (event.data.type === 'zoom-oauth-success') {
          const { accessToken } = event.data;

          // Sync Zoom data
          const syncResponse = await fetch('/api/v1/integrations/zoom/sync', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${accessToken}`,
            },
          });

          const { email, meetings } = await syncResponse.json();

          setIntegrationStatus(prev => ({
            ...prev,
            zoom: {
              connected: true,
              email,
              lastSync: new Date().toISOString(),
            },
          }));

          // Convert Zoom meetings to tasks
          const newTasks = meetings.map(meeting => ({
            id: `zm-${meeting.id}`,
            title: meeting.topic,
            description: meeting.agenda || 'No agenda provided',
            status: 'todo',
            priority: 'medium',
            createdAt: new Date().toISOString(),
            type: 'zoom',
            metadata: {
              source: 'zoom',
              meetingId: meeting.id,
              startTime: meeting.start_time,
              duration: meeting.duration,
            },
          }));

          setTasks(prev => [...prev, ...newTasks]);
          toast.success(`Imported ${newTasks.length} tasks from Zoom meetings`);
          logger.info('Zoom sync completed', { meetingCount: newTasks.length });
        }
      });
    } catch (error) {
      toast.error('Failed to connect to Zoom');
      logger.error('Zoom connection failed', { error });
    } finally {
      setIsSyncing(prev => ({ ...prev, zoom: false }));
    }
  };

  const handleGitLabConnect = async () => {
    try {
      setIsSyncing(prev => ({ ...prev, gitlab: true }));

      // Initialize GitLab OAuth flow
      const response = await fetch('/api/v1/auth/gitlab/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const { authUrl } = await response.json();

      // Open GitLab OAuth popup
      const popup = window.open(
        authUrl,
        'GitLab Authorization',
        'width=600,height=700,scrollbars=yes'
      );

      // Listen for OAuth completion
      window.addEventListener('message', async event => {
        if (event.data.type === 'gitlab-oauth-success') {
          const { accessToken } = event.data;

          // Sync GitLab data
          const syncResponse = await fetch('/api/v1/integrations/gitlab/sync', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${accessToken}`,
            },
          });

          const { username, issues, projects } = await syncResponse.json();

          setIntegrationStatus(prev => ({
            ...prev,
            gitlab: {
              connected: true,
              username,
              lastSync: new Date().toISOString(),
              projects: projects.length,
            },
          }));

          // Convert GitLab issues to tasks
          const newTasks = issues.map(issue => ({
            id: `gl-${issue.iid}`,
            title: issue.title,
            description: issue.description,
            status: issue.state === 'opened' ? 'todo' : 'done',
            priority: issue.labels.includes('priority::high') ? 'high' : 'medium',
            createdAt: issue.created_at,
            type: 'gitlab',
            metadata: {
              source: 'gitlab',
              url: issue.web_url,
              project: issue.project_id,
              labels: issue.labels,
              milestone: issue.milestone,
              weight: issue.weight,
              timeStats: issue.time_stats,
            },
          }));

          setTasks(prev => [...prev, ...newTasks]);
          toast.success(`Imported ${newTasks.length} tasks from GitLab`);
          logger.info('GitLab sync completed', {
            issueCount: newTasks.length,
            projectCount: projects.length,
          });
        }
      });
    } catch (error) {
      toast.error('Failed to connect to GitLab');
      logger.error('GitLab connection failed', { error });
    } finally {
      setIsSyncing(prev => ({ ...prev, gitlab: false }));
    }
  };

  const handleAddDueDate = async (taskId: string, date: Date) => {
    const updateFn = async () => {
      await new Promise(resolve => setTimeout(resolve, 800)); // Simulate API call
      setTasks(prevTasks =>
        prevTasks.map(task =>
          task.id === taskId
            ? {
                ...task,
                dueDate: date.toISOString(),
                metadata: {
                  ...task.metadata,
                  dueDateSet: new Date().toISOString(),
                  dueIn: Math.ceil((date.getTime() - new Date().getTime()) / (1000 * 3600 * 24)),
                },
              }
            : task
        )
      );

      // Save to localStorage immediately
      const updatedTasks = tasks.map(task =>
        task.id === taskId
          ? {
              ...task,
              dueDate: date.toISOString(),
              metadata: {
                ...task.metadata,
                dueDateSet: new Date().toISOString(),
                dueIn: Math.ceil((date.getTime() - new Date().getTime()) / (1000 * 3600 * 24)),
              },
            }
          : task
      );
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(updatedTasks));

      logger.info('Due date added', { taskId, dueDate: date.toISOString() });
      toast.success('Due date set successfully');
    };

    await handleTaskUpdate(tasks.find(t => t.id === taskId) || tasks[0]);
  };

  const handleGoogleConnect = async () => {
    try {
      setIsSyncing(prev => ({ ...prev, google: true }));

      const response = await fetch('/api/v1/auth/google/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      const { authUrl } = await response.json();

      const popup = window.open(
        authUrl,
        'Google Authorization',
        'width=600,height=700,scrollbars=yes'
      );

      window.addEventListener('message', async event => {
        if (event.data.type === 'google-oauth-success') {
          const { accessToken } = event.data;

          const syncResponse = await fetch('/api/v1/integrations/google/sync', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${accessToken}`,
            },
          });

          const { email, tasks, events, calendars } = await syncResponse.json();

          setIntegrationStatus(prev => ({
            ...prev,
            google: {
              connected: true,
              email,
              lastSync: new Date().toISOString(),
              calendars: calendars.length,
              tasks: tasks.length,
            },
          }));

          // Convert Google tasks and events to our task format
          const newTasks = [
            ...tasks.map(task => ({
              id: `gt-${task.id}`,
              title: task.title,
              description: task.notes || '',
              status: task.completed ? 'done' : 'todo',
              priority: task.priority === 'high' ? 'high' : 'medium',
              dueDate: task.due,
              createdAt: new Date().toISOString(),
              type: 'google_task',
              metadata: {
                source: 'google_tasks',
                taskListId: task.taskListId,
              },
            })),
            ...events.map(event => ({
              id: `ge-${event.id}`,
              title: event.summary,
              description: event.description || '',
              status: 'todo',
              priority: 'medium',
              dueDate: event.start.dateTime || event.start.date,
              createdAt: new Date().toISOString(),
              type: 'google_calendar',
              metadata: {
                source: 'google_calendar',
                calendarId: event.calendarId,
                eventId: event.id,
                location: event.location,
                attendees: event.attendees,
              },
            })),
          ];

          setTasks(prev => [...prev, ...newTasks]);
          toast.success(`Imported ${newTasks.length} items from Google`);
          logger.info('Google sync completed', {
            taskCount: tasks.length,
            eventCount: events.length,
          });
        }
      });
    } catch (error) {
      toast.error('Failed to connect to Google');
      logger.error('Google connection failed', { error });
    } finally {
      setIsSyncing(prev => ({ ...prev, google: false }));
    }
  };

  const handleAppleConnect = async () => {
    try {
      setIsSyncing(prev => ({ ...prev, apple: true }));

      // First, validate App Store Connect API credentials
      const response = await fetch('/api/v1/integrations/apple/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          issuerID: process.env.NEXT_PUBLIC_APPLE_ISSUER_ID,
          keyID: process.env.NEXT_PUBLIC_APPLE_KEY_ID,
          privateKey: process.env.NEXT_PUBLIC_APPLE_PRIVATE_KEY,
        }),
      });

      if (!response.ok) {
        throw new Error('Invalid App Store Connect API credentials');
      }

      const { token } = await response.json();

      // Fetch data from App Store Connect API
      const syncResponse = await fetch('/api/v1/integrations/apple/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });

      const { 
        teamId,
        apps,
        testflightBuilds,
        inAppPurchases,
        customerReviews 
      } = await syncResponse.json();

      setIntegrationStatus(prev => ({
        ...prev,
        apple: {
          connected: true,
          teamId,
          lastSync: new Date().toISOString(),
          appStoreApps: apps.length,
          testflightApps: testflightBuilds.length,
          issuerID: process.env.NEXT_PUBLIC_APPLE_ISSUER_ID,
          keyID: process.env.NEXT_PUBLIC_APPLE_KEY_ID,
        },
      }));

      // Convert App Store Connect data to tasks
      const newTasks = [
        // App Store apps as tasks
        ...apps.map(app => ({
          id: `as-${app.id}`,
          title: `Review ${app.name} App Store Update`,
          description: `Version: ${app.version}\nStatus: ${app.status}`,
          status: app.status === 'READY_FOR_SALE' ? 'done' : 'todo',
          priority: 'high',
          createdAt: new Date().toISOString(),
          type: 'appstore_app',
          metadata: {
            source: 'app_store_connect',
            appId: app.id,
            bundleId: app.bundleId,
            platform: app.platform,
            version: app.version,
          },
        })),

        // TestFlight builds as tasks
        ...testflightBuilds.map(build => ({
          id: `tf-${build.id}`,
          title: `Review TestFlight Build ${build.version}`,
          description: `Build: ${build.buildNumber}\nExpires: ${build.expirationDate}`,
          status: build.status === 'PROCESSING' ? 'in_progress' : 'todo',
          priority: 'medium',
          dueDate: build.expirationDate,
          createdAt: new Date().toISOString(),
          type: 'testflight_build',
          metadata: {
            source: 'app_store_connect',
            buildId: build.id,
            appId: build.appId,
            version: build.version,
            buildNumber: build.buildNumber,
          },
        })),

        // Customer reviews as tasks
        ...customerReviews.map(review => ({
          id: `rv-${review.id}`,
          title: `Respond to App Review - ${review.rating} Stars`,
          description: review.comment,
          status: review.responseText ? 'done' : 'todo',
          priority: review.rating <= 3 ? 'high' : 'medium',
          createdAt: review.createdDate,
          type: 'app_review',
          metadata: {
            source: 'app_store_connect',
            reviewId: review.id,
            appId: review.appId,
            rating: review.rating,
            territory: review.territory,
          },
        })),
      ];

      setTasks(prev => [...prev, ...newTasks]);
      toast.success(`Imported ${newTasks.length} items from App Store Connect`);
      logger.info('App Store Connect sync completed', {
        appCount: apps.length,
        buildCount: testflightBuilds.length,
        reviewCount: customerReviews.length,
      });

    } catch (error) {
      toast.error('Failed to connect to App Store Connect');
      logger.error('App Store Connect connection failed', { error });
    } finally {
      setIsSyncing(prev => ({ ...prev, apple: false }));
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Offline Status Card */}
      <div className="mb-8">
        <div className={`rounded-lg p-4 ${isOffline ? 'bg-yellow-50' : 'bg-green-50'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {isOffline ? (
                <WifiOff className="w-5 h-5 text-yellow-500" />
              ) : (
                <Database className="w-5 h-5 text-green-500" />
              )}
              <div>
                <h3 className={`font-medium ${isOffline ? 'text-yellow-800' : 'text-green-800'}`}>
                  {isOffline ? 'Working Offline' : 'Connected'}
                </h3>
                <p className={`text-sm ${isOffline ? 'text-yellow-600' : 'text-green-600'}`}>
                  {isOffline ? 'Changes will be saved locally' : 'Changes will sync automatically'}
                </p>
              </div>
            </div>
            <div className="text-right text-sm text-gray-500">
              <div>Last synced:</div>
              <div>{lastSynced?.toLocaleTimeString() || 'Never'}</div>
            </div>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Task Management</h1>
          <button
            onClick={addTestTask}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Add Test Task
          </button>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              placeholder="Search tasks..."
              className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600
                focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-gray-400 flex-shrink-0" />
              <select
                value={groupBy}
                onChange={e => setGroupBy(e.target.value as typeof groupBy)}
                className="w-full sm:w-auto rounded border border-gray-300 dark:border-gray-600 px-2 py-2"
              >
                <option value="status">Group by Status</option>
                <option value="priority">Group by Priority</option>
                <option value="assignee">Group by Assignee</option>
                <option value="type">Group by Type</option>
              </select>
            </div>
            <div className="flex items-center gap-2">
              <SortAsc className="w-5 h-5 text-gray-400 flex-shrink-0" />
              <select
                value={sortBy}
                onChange={e => setSortBy(e.target.value as typeof sortBy)}
                className="w-full sm:w-auto rounded border border-gray-300 dark:border-gray-600 px-2 py-2"
              >
                <option value="priority">Sort by Priority</option>
                <option value="created">Sort by Created Date</option>
                <option value="dueDate">Sort by Due Date</option>
                <option value="title">Sort by Title</option>
              </select>
            </div>
          </div>
        </div>

        {/* Integration Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          <Card className="p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Github className="w-6 h-6 flex-shrink-0" />
                <div>
                  <h3 className="font-medium">GitHub Integration</h3>
                  <p className="text-sm text-gray-500 break-words">
                    {integrationStatus.github?.connected
                      ? `Connected as ${integrationStatus.github.username}`
                      : 'Import tasks from GitHub issues'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleGitHubConnect}
                disabled={isSyncing.github}
                className={`w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  integrationStatus.github?.connected
                    ? 'bg-green-100 text-green-700 hover:bg-green-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {isSyncing.github ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : integrationStatus.github?.connected ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Synced</span>
                  </>
                ) : (
                  <>
                    <LinkIcon className="w-4 h-4" />
                    <span>Connect</span>
                  </>
                )}
              </button>
            </div>
            {integrationStatus.github?.lastSync && (
              <p className="text-xs text-gray-500 mt-2">
                Last synced: {new Date(integrationStatus.github.lastSync).toLocaleString()}
              </p>
            )}
          </Card>

          <Card className="p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Video className="w-6 h-6 flex-shrink-0" />
                <div>
                  <h3 className="font-medium">Zoom Integration</h3>
                  <p className="text-sm text-gray-500 break-words">
                    {integrationStatus.zoom?.connected
                      ? `Connected as ${integrationStatus.zoom.email}`
                      : 'Import tasks from Zoom meetings'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleZoomConnect}
                disabled={isSyncing.zoom}
                className={`w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  integrationStatus.zoom?.connected
                    ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {isSyncing.zoom ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : integrationStatus.zoom?.connected ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Synced</span>
                  </>
                ) : (
                  <>
                    <LinkIcon className="w-4 h-4" />
                    <span>Connect</span>
                  </>
                )}
              </button>
            </div>
            {integrationStatus.zoom?.lastSync && (
              <p className="text-xs text-gray-500 mt-2">
                Last synced: {new Date(integrationStatus.zoom.lastSync).toLocaleString()}
              </p>
            )}
          </Card>

          <Card className="p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <GitBranch className="w-6 h-6 flex-shrink-0" />
                <div>
                  <h3 className="font-medium">GitLab Integration</h3>
                  <p className="text-sm text-gray-500 break-words">
                    {integrationStatus.gitlab?.connected
                      ? `Connected as ${integrationStatus.gitlab.username}
                        ${integrationStatus.gitlab.projects && ` (${integrationStatus.gitlab.projects} projects)`}`
                      : 'Import tasks from GitLab issues'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleGitLabConnect}
                disabled={isSyncing.gitlab}
                className={`w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  integrationStatus.gitlab?.connected
                    ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {isSyncing.gitlab ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : integrationStatus.gitlab?.connected ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Synced</span>
                  </>
                ) : (
                  <>
                    <LinkIcon className="w-4 h-4" />
                    <span>Connect</span>
                  </>
                )}
              </button>
            </div>
            {integrationStatus.gitlab?.lastSync && (
              <p className="text-xs text-gray-500 mt-2">
                Last synced: {new Date(integrationStatus.gitlab.lastSync).toLocaleString()}
              </p>
            )}
          </Card>

          <Card className="p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Mail className="w-6 h-6 flex-shrink-0" />
                <div>
                  <h3 className="font-medium">Google Integration</h3>
                  <p className="text-sm text-gray-500 break-words">
                    {integrationStatus.google?.connected
                      ? `Connected as ${integrationStatus.google.email}
                        ${integrationStatus.google.calendars && ` (${integrationStatus.google.calendars} calendars)`}`
                      : 'Import tasks from Google Tasks & Calendar'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleGoogleConnect}
                disabled={isSyncing.google}
                className={`w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  integrationStatus.google?.connected
                    ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {isSyncing.google ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : integrationStatus.google?.connected ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Synced</span>
                  </>
                ) : (
                  <>
                    <LinkIcon className="w-4 h-4" />
                    <span>Connect</span>
                  </>
                )}
              </button>
            </div>
            {integrationStatus.google?.lastSync && (
              <p className="text-xs text-gray-500 mt-2">
                Last synced: {new Date(integrationStatus.google.lastSync).toLocaleString()}
              </p>
            )}
          </Card>

          <Card className="p-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <Calendar className="w-6 h-6 flex-shrink-0" />
                <div>
                  <h3 className="font-medium">App Store Connect</h3>
                  <p className="text-sm text-gray-500 break-words">
                    {integrationStatus.apple?.connected
                      ? `Connected as Team ${integrationStatus.apple.teamId}
                        ${integrationStatus.apple.appStoreApps && ` (${integrationStatus.apple.appStoreApps} apps)`}
                        ${integrationStatus.apple.testflightApps && `, ${integrationStatus.apple.testflightApps} TestFlight builds`}`
                      : 'Import tasks from App Store Connect'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleAppleConnect}
                disabled={isSyncing.apple}
                className={`w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 rounded-lg transition-colors ${
                  integrationStatus.apple?.connected
                    ? 'bg-gray-900 text-white hover:bg-gray-800'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {isSyncing.apple ? (
                  <RefreshCw className="w-4 h-4 animate-spin" />
                ) : integrationStatus.apple?.connected ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Synced</span>
                  </>
                ) : (
                  <>
                    <LinkIcon className="w-4 h-4" />
                    <span>Connect</span>
                  </>
                )}
              </button>
            </div>
            {integrationStatus.apple?.lastSync && (
              <p className="text-xs text-gray-500 mt-2">
                Last synced: {new Date(integrationStatus.apple.lastSync).toLocaleString()}
              </p>
            )}
          </Card>
        </div>

        {/* Enhanced Task Statistics with Loading State */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {isLoading
            ? // Loading skeletons for statistics
              Array(8)
                .fill(0)
                .map((_, index) => (
                  <div
                    key={index}
                    className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 animate-pulse"
                  >
                    <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded mb-2" />
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
                  </div>
                ))
            : [
                {
                  label: 'Total Tasks',
                  value: taskAnalytics.total,
                  color: 'bg-blue-100 text-blue-800',
                },
                {
                  label: 'Completed',
                  value: taskAnalytics.completed,
                  color: 'bg-green-100 text-green-800',
                  percentage: Math.round((taskAnalytics.completed / taskAnalytics.total) * 100),
                },
                {
                  label: 'In Progress',
                  value: taskAnalytics.inProgress,
                  color: 'bg-yellow-100 text-yellow-800',
                  percentage: Math.round((taskAnalytics.inProgress / taskAnalytics.total) * 100),
                },
                {
                  label: 'High Priority',
                  value: taskAnalytics.highPriority,
                  color: 'bg-red-100 text-red-800',
                  percentage: Math.round((taskAnalytics.highPriority / taskAnalytics.total) * 100),
                },
                {
                  label: 'With Due Date',
                  value: taskAnalytics.withDueDate,
                  color: 'bg-purple-100 text-purple-800',
                  percentage: Math.round((taskAnalytics.withDueDate / taskAnalytics.total) * 100),
                },
                {
                  label: 'Assigned',
                  value: taskAnalytics.withAssignee,
                  color: 'bg-indigo-100 text-indigo-800',
                  percentage: Math.round((taskAnalytics.withAssignee / taskAnalytics.total) * 100),
                },
                {
                  label: 'Tagged',
                  value: taskAnalytics.withTags,
                  color: 'bg-green-100 text-green-800',
                  percentage: Math.round((taskAnalytics.withTags / taskAnalytics.total) * 100),
                },
                {
                  label: 'Avg. Confidence',
                  value: `${Math.round(taskAnalytics.averageConfidence * 100)}%`,
                  color: 'bg-gray-100 text-gray-800',
                },
                <div key="overdue" className="bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-200 rounded-lg p-4">
                  <div className="text-2xl font-bold">{taskAnalytics.overdueTasks}</div>
                  <div className="text-sm">Overdue Tasks</div>
                  <div className="mt-2 text-xs">Requires immediate attention</div>
                </div>,
                <div key="due-soon" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-200 rounded-lg p-4">
                  <div className="text-2xl font-bold">{taskAnalytics.dueSoon}</div>
                  <div className="text-sm">Due in 3 Days</div>
                  <div className="mt-2 text-xs">Plan your week accordingly</div>
                </div>,
                <div key="completed" className="bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-200 rounded-lg p-4">
                  <div className="text-2xl font-bold">{taskAnalytics.completedOnTime}</div>
                  <div className="text-sm">Completed On Time</div>
                  <div className="mt-2 text-xs">Keep up the good work!</div>
                </div>
              ].map((stat, index) => (
                <div 
                  key={`stat-${index}`} 
                  className={stat.color} 
                  style={{ width: '100%' }}
                >
                  <div className="text-2xl font-bold">{stat.value}</div>
                  <div className="text-sm">{stat.label}</div>
                  {stat.percentage !== undefined && (
                    <div className="mt-2 h-1 bg-gray-200 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-current opacity-50"
                        style={{ width: `${stat.percentage}%` }}
                      />
                    </div>
                  )}
                </div>
              ))
          }
        </div>
      </div>
    </div>
  );
};