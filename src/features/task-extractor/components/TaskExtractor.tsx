import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Sparkles,
  ClipboardList,
  X,
  Check,
  BookOpen,
  Calendar,
  Edit2,
  ThumbsUp,
  ThumbsDown,
  Video,
  MessageSquare,
  AlertCircle,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle } from '@/components/ui/alert';
import { Task, Story, Analysis } from '@/types/task.types';
import { logger } from '@/utils/logger';
import { useExtractTasksMutation } from '@/services/api';
import { errorService } from '@/services/error.service';
import { useOfflineState } from '@/hooks/useOfflineState';
import { taskSyncService } from '@/services/task.service';
import { analytics } from '@/services/analytics.service';
import { CalendarModal } from '@/components/ui/calendar-modal';

// Add integration types
interface IntegrationAction {
  type: 'zoom' | 'slack';
  action: 'meeting' | 'notification';
  details: {
    title: string;
    description?: string;
    scheduledTime?: string;
    channel?: string;
  };
}

// Add integration handlers
const handleZoomSchedule = async (task: Task) => {
  // In real app, this would integrate with Zoom API
  console.log('Scheduling Zoom meeting for:', task.text);
  return {
    meetingId: 'mock-meeting-id',
    scheduledTime: new Date().toISOString(),
  };
};

const handleSlackNotify = async (task: Task, channel: string) => {
  // In real app, this would integrate with Slack API
  console.log('Sending Slack notification for:', task.text, 'to channel:', channel);
  return {
    channel,
    notified: true,
  };
};

// Mock data with proper formatting
const mockAnalysis: Analysis = {
  summary: "I've analyzed your input and identified several actionable items...",
  breakdown: [
    '3 high-priority tasks identified',
    '2 tasks are time-sensitive (due dates mentioned)',
    '1 task involves team coordination',
  ],
  categories: {
    'Project Management': 2,
    'Client Communication': 1,
  },
};

interface TaskExtractorProps {
  onChange: (value: string) => void;
  onSubmit: () => void;
}

export const TaskExtractor: React.FC<TaskExtractorProps> = ({ onChange, onSubmit }) => {
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const { isOffline, cachedTasks } = useOfflineState();
  const [extractTasks] = useExtractTasksMutation();
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scheduledTasks, setScheduledTasks] = useState<Set<string>>(new Set());

  const stories = [
    {
      id: 1,
      timestamp: new Date().toLocaleString(),
      title: 'Project Management Updates',
      narrative: 'During our morning review, several key actions emerged...',
      tasks: [
        {
          id: 't1',
          title: 'Schedule team meeting',
          text: 'Schedule team meeting',
          description: 'Team sync to discuss project progress',
          status: 'todo',
          priority: 'high',
          createdAt: new Date().toISOString(),
          verified: null,
          scheduled: false,
          completed: false,
        },
        {
          id: 't2',
          title: 'Update presentation',
          text: 'Update presentation',
          description: 'Prepare slides for client review',
          status: 'todo',
          priority: 'medium',
          createdAt: new Date().toISOString(),
          verified: true,
          scheduled: false,
          completed: false,
        },
        {
          id: 't3',
          title: 'Follow up with vendor',
          text: 'Follow up with vendor',
          description: 'Check delivery timeline',
          status: 'todo',
          priority: 'low',
          createdAt: new Date().toISOString(),
          verified: false,
          scheduled: false,
          completed: false,
        },
      ],
      tags: ['Project Review', 'Client Work', 'Team Coordination'],
    },
  ];

  const handleTaskVerification = (storyId: number, taskId: string, isVerified: boolean) => {
    // In real app, this would update the backend
    console.log(`Task ${taskId} ${isVerified ? 'verified' : 'rejected'}`);
  };

  const handleTaskSchedule = (storyId: number, taskId: string) => {
    // In real app, this would open calendar integration
    console.log(`Scheduling task ${taskId}`);
  };

  const handleExtract = async () => {
    const startTime = Date.now();
    setIsProcessing(true);
    setError(null);

    try {
      if (Math.random() > 0.5) {
        // Simulate random error
        throw new Error('Failed to connect to AI service');
      }
      logger.info('Extracting tasks from text', { textLength: inputText.length });
      const result = await extractTasks({ text: inputText }).unwrap();

      await taskSyncService.queueTasks(result);

      analytics.trackEvent('TASK_EXTRACTION', {
        taskCount: result.length,
        textLength: inputText.length,
        duration: Date.now() - startTime,
      });

      logger.info('Tasks extracted and queued', { count: result.length });
    } catch (error) {
      if (errorService.isNetworkError(error) && cachedTasks.length > 0) {
        analytics.trackEvent('CACHE_HIT', { taskCount: cachedTasks.length });
        logger.info('Using cached tasks due to network error');
      } else {
        analytics.trackEvent('ERROR', {
          errorType: errorService.isNetworkError(error) ? 'NETWORK' : 'UNKNOWN',
        });
      }
      setError('Unable to extract tasks. Please try again.');
      errorService.handleError(error);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleScheduleTask = async (
    taskId: string,
    date: string,
    time: string,
    reminder: number
  ) => {
    try {
      logger.info('Scheduling task', { taskId, date, time, reminder });

      // Update task scheduled status
      const updatedTasks = stories.map(story => ({
        ...story,
        tasks: story.tasks.map(task => (task.id === taskId ? { ...task, scheduled: true } : task)),
      }));

      // Here you would integrate with your calendar service
      // For now, we'll just log the action
      analytics.trackEvent('TASK_SCHEDULED', {
        taskId,
        scheduledDate: date,
        scheduledTime: time,
        reminder,
      });

      logger.info('Task scheduled successfully', { taskId });
    } catch (error) {
      logger.error('Failed to schedule task', { error, taskId });
      errorService.handleError(error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-gray-900">AI-Powered Task Extraction</h1>
          <p className="text-lg text-gray-600">Transform your text into actionable tasks</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Input Card */}
          <div className="lg:col-span-4">
            <Card className="p-6 bg-white shadow-lg">
              <div className="space-y-6">
                <div className="flex items-center space-x-2">
                  <Search className="w-5 h-5 text-gray-600" />
                  <h2 className="text-lg font-medium text-gray-900">Extract New Tasks</h2>
                </div>

                <div>
                  <label
                    htmlFor="input-text"
                    className="block text-sm font-medium text-gray-700 mb-2"
                  >
                    Paste your notes, emails, or documents
                  </label>
                  <textarea
                    id="input-text"
                    rows={6}
                    className="w-full rounded-lg border border-gray-300 p-4 text-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                    placeholder="Paste your text here..."
                    value={inputText}
                    onChange={e => {
                      setInputText(e.target.value);
                      onChange(e.target.value);
                    }}
                  />
                </div>

                <Button
                  onClick={onSubmit}
                  disabled={!inputText || isProcessing}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center space-x-2 w-full justify-center"
                  isLoading={isProcessing}
                >
                  <Sparkles className="w-5 h-5" />
                  <span>Extract Tasks</span>
                </Button>
              </div>
            </Card>
          </div>

          {/* Analysis Card */}
          <div className="lg:col-span-4">
            <Card className="p-6 bg-white shadow-lg h-full">
              <div className="space-y-6">
                <div className="flex items-center space-x-2">
                  <ClipboardList className="w-5 h-5 text-gray-600" />
                  <h2 className="text-lg font-medium text-gray-900">Analysis & Tasks</h2>
                </div>

                <div className="space-y-4">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h3 className="font-medium text-blue-900 mb-2">Content Analysis</h3>
                    <p className="text-blue-800 text-sm mb-3">{mockAnalysis.summary}</p>
                    <div className="space-y-2">
                      {mockAnalysis.breakdown.map((point, index) => (
                        <div key={index} className="flex items-center text-sm text-blue-700">
                          <span className="mr-2">•</span>
                          {point}
                        </div>
                      ))}
                    </div>
                  </div>

                  <Alert className="bg-green-50 border-green-200">
                    <AlertTitle className="text-green-800">
                      {stories.reduce((total, story) => total + story.tasks.length, 0)} Tasks
                      Extracted
                    </AlertTitle>
                  </Alert>

                  <div className="space-y-3">
                    {stories.map(story => (
                      <div
                        key={story.id}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-md"
                      >
                        <div className="flex items-center space-x-3">
                          <button className="w-6 h-6 rounded-full border border-gray-300 flex items-center justify-center">
                            {story.tasks.every(task => task.completed) && (
                              <Check className="w-4 h-4 text-green-500" />
                            )}
                          </button>
                          <span className="text-gray-800">{story.title}</span>
                        </div>
                        <button className="text-gray-400 hover:text-gray-600">
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Stories Card */}
          <div className="lg:col-span-4">
            <Card className="p-6 bg-white shadow-lg">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <BookOpen className="w-5 h-5 text-gray-600" />
                    <h2 className="text-lg font-medium text-gray-900">Task Stories</h2>
                  </div>
                  <span className="text-sm text-gray-500">Developer Verification Required</span>
                </div>

                <div className="space-y-6">
                  {stories.map(story => (
                    <div
                      key={story.id}
                      className="p-4 bg-gray-50 rounded-lg space-y-3 border-l-4 border-blue-500"
                    >
                      <div className="flex justify-between items-start">
                        <h3 className="text-md font-medium text-gray-900">{story.title}</h3>
                        <span className="text-xs text-gray-500">{story.timestamp}</span>
                      </div>

                      <p className="text-sm text-gray-700">{story.narrative}</p>

                      <div className="flex flex-wrap gap-2">
                        {story.tags.map((tag, index) => (
                          <span
                            key={index}
                            className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full text-xs"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>

                      <div className="mt-3 pt-3 border-t border-gray-200">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Final Tasks:</h4>
                        <ul className="space-y-3">
                          {story.tasks.map(task => (
                            <li key={task.id} className="flex items-center justify-between group">
                              <div className="flex items-center space-x-2 flex-grow">
                                {editingTaskId === task.id ? (
                                  <input
                                    type="text"
                                    value={task.text}
                                    className="flex-grow px-2 py-1 text-sm border rounded"
                                    onBlur={() => setEditingTaskId(null)}
                                    onKeyDown={e => e.key === 'Enter' && setEditingTaskId(null)}
                                  />
                                ) : (
                                  <span className="text-sm text-gray-600">{task.text}</span>
                                )}
                              </div>

                              <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button
                                  onClick={() => setEditingTaskId(task.id)}
                                  className="p-1 text-gray-400 hover:text-blue-500"
                                >
                                  <Edit2 className="w-4 h-4" />
                                </button>

                                <div className="flex items-center space-x-1">
                                  <button
                                    onClick={() => handleTaskVerification(story.id, task.id, true)}
                                    className={`p-1 rounded-full ${
                                      task.verified === true
                                        ? 'text-green-500 bg-green-50'
                                        : 'text-gray-400 hover:text-green-500'
                                    }`}
                                  >
                                    <ThumbsUp className="w-4 h-4" />
                                  </button>
                                  <button
                                    onClick={() => handleTaskVerification(story.id, task.id, false)}
                                    className={`p-1 rounded-full ${
                                      task.verified === false
                                        ? 'text-red-500 bg-red-50'
                                        : 'text-gray-400 hover:text-red-500'
                                    }`}
                                  >
                                    <ThumbsDown className="w-4 h-4" />
                                  </button>
                                </div>

                                {task.verified === true && !task.scheduled && (
                                  <div className="flex items-center space-x-1">
                                    <button
                                      onClick={() => {
                                        setSelectedTask(task);
                                        setShowCalendarModal(true);
                                      }}
                                      className="p-1 text-gray-400 hover:text-blue-500"
                                      title="Schedule Task"
                                    >
                                      <Calendar className="w-4 h-4" />
                                    </button>

                                    <button
                                      onClick={async () => {
                                        const slackDetails = await handleSlackNotify(
                                          task,
                                          'team-tasks'
                                        );
                                        // Update task with Slack details
                                      }}
                                      className="p-1 text-gray-400 hover:text-purple-500 group relative"
                                      title="Send to Slack"
                                    >
                                      <MessageSquare className="w-4 h-4" />
                                      {task.integrations?.slack?.notified && (
                                        <span className="absolute -top-1 -right-1 w-2 h-2 bg-purple-500 rounded-full" />
                                      )}
                                    </button>
                                  </div>
                                )}
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3"
        >
          <AlertCircle className="w-5 h-5 text-red-500 mt-0.5" />
          <div>
            <h3 className="text-red-800 font-medium">Error</h3>
            <p className="text-red-600">{error}</p>
          </div>
        </motion.div>
      )}

      {/* Task States */}
      <div className="space-y-4">
        {stories.map(story => (
          <div
            key={story.id}
            className={`p-4 rounded-lg border ${
              story.tasks.every(task => task.completed)
                ? 'bg-green-50 border-green-200'
                : story.tasks.every(task => task.verified)
                  ? 'bg-blue-50 border-blue-200'
                  : 'bg-gray-50 border-gray-200'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <span
                  className={`w-2 h-2 rounded-full ${
                    story.tasks.every(task => task.completed)
                      ? 'bg-green-500'
                      : story.tasks.every(task => task.verified)
                        ? 'bg-blue-500'
                        : 'bg-gray-400'
                  }`}
                />
                <span className="font-medium">{story.title}</span>
              </div>
              <div className="flex items-center space-x-2">
                {story.tasks.every(task => task.completed) ? (
                  <span className="text-sm text-green-600">Completed</span>
                ) : story.tasks.every(task => task.verified) ? (
                  <button
                    onClick={() => {
                      setSelectedTask(story.tasks.find(task => !task.completed) || null);
                      setShowCalendarModal(true);
                    }}
                    className="text-sm text-blue-600 hover:text-blue-700"
                  >
                    Schedule Now
                  </button>
                ) : (
                  <span className="text-sm text-gray-500">Needs Verification</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Calendar Modal */}
      {selectedTask && (
        <CalendarModal
          isOpen={showCalendarModal}
          onClose={() => {
            setShowCalendarModal(false);
            setSelectedTask(null);
          }}
          task={selectedTask}
          onSchedule={handleScheduleTask}
        />
      )}
    </div>
  );
};
