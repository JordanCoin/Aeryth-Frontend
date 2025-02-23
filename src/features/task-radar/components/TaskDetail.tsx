import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Task } from '@/types/task.types';
import { logger } from '@/utils/logger';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  ArrowLeft,
  Calendar,
  MessageSquare,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { STORAGE_KEYS } from '@/constants/storage';

export const TaskDetail: React.FC = () => {
  const { taskId } = useParams();
  const navigate = useNavigate();
  const [task, setTask] = useState<Task | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const loadTask = async () => {
      try {
        const storedTasks = localStorage.getItem(STORAGE_KEYS.TASKS);
        if (storedTasks) {
          const tasks = JSON.parse(storedTasks);
          const foundTask = tasks.find((t: Task) => t.id === taskId);
          if (foundTask) {
            setTask(foundTask);
            logger.info('Task loaded', { taskId });
          }
        }
      } catch (error) {
        logger.error('Failed to load task', { taskId, error });
        toast.error('Failed to load task');
      } finally {
        setLoading(false);
      }
    };

    loadTask();
  }, [taskId]);

  const handleAction = async (action: 'schedule' | 'share') => {
    setActionLoading(prev => ({ ...prev, [action]: true }));
    try {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      toast.success(`Task ${action}d successfully`);
    } catch (error) {
      toast.error(`Failed to ${action} task`);
      logger.error(`Task ${action} failed`, { taskId, error });
    } finally {
      setActionLoading(prev => ({ ...prev, [action]: false }));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (!task) {
    return (
      <div className="container mx-auto px-4 py-8">
        <Card className="p-6 text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Task Not Found</h2>
          <p className="text-gray-600 mb-4">The task you're looking for doesn't exist.</p>
          <Button onClick={() => navigate('/radar')}>Return to Task Radar</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="bg-gray-900 text-gray-100 p-6">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/radar')}
            className="text-gray-400 hover:text-gray-100"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold">{task.title}</h1>
            <p className="text-gray-400">Task ID: {task.id}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold mb-2">Description</h2>
              <p className="text-gray-300">{task.description}</p>
            </div>

            <div>
              <h2 className="text-lg font-semibold mb-2">Status</h2>
              <div className="flex items-center gap-2">
                <span
                  className={`px-3 py-1 rounded-full text-sm ${
                    task.status === 'done'
                      ? 'bg-green-500/20 text-green-300'
                      : task.status === 'in_progress'
                        ? 'bg-blue-500/20 text-blue-300'
                        : 'bg-gray-500/20 text-gray-300'
                  }`}
                >
                  {task.status}
                </span>
                <span
                  className={`px-3 py-1 rounded-full text-sm ${
                    task.priority === 'high'
                      ? 'bg-red-500/20 text-red-300'
                      : task.priority === 'medium'
                        ? 'bg-yellow-500/20 text-yellow-300'
                        : 'bg-green-500/20 text-green-300'
                  }`}
                >
                  {task.priority} priority
                </span>
              </div>
            </div>

            <div>
              <h2 className="text-lg font-semibold mb-2">AI Analysis</h2>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <span className="text-blue-400">Confidence:</span>
                  <span>{(task.metadata?.confidence || 0) * 100}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-400">Radar Score:</span>
                  <span>{(task.metadata?.radarScore || 0) * 100}%</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold mb-2">Actions</h2>
              <div className="flex gap-4">
                <Button
                  onClick={() => handleAction('schedule')}
                  disabled={actionLoading.schedule}
                  className="flex items-center gap-2"
                >
                  {actionLoading.schedule ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Calendar className="w-4 h-4" />
                  )}
                  Schedule
                </Button>
                <Button
                  onClick={() => handleAction('share')}
                  disabled={actionLoading.share}
                  className="flex items-center gap-2"
                >
                  {actionLoading.share ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <MessageSquare className="w-4 h-4" />
                  )}
                  Share
                </Button>
              </div>
            </div>

            {task.integrations && Object.keys(task.integrations).length > 0 && (
              <div>
                <h2 className="text-lg font-semibold mb-2">Integrations</h2>
                <div className="space-y-2">
                  {Object.entries(task.integrations).map(([id, integration]) => (
                    <div
                      key={id}
                      className="flex items-center justify-between p-3 rounded-lg bg-gray-800"
                    >
                      <span className="capitalize">{id}</span>
                      <CheckCircle2 className="w-5 h-5 text-green-500" />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
}; 