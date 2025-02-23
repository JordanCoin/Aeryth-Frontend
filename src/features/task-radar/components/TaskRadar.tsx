import React, { useState } from 'react';
import {
  Radar,
  Terminal,
  Copy,
  CheckCheck,
  FileText,
  GitBranch,
  FileCode,
  Book,
  HelpCircle,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Edit2,
  AlertCircle,
  Github,
  Video,
  Mail,
  Calendar,
  CheckCircle2,
  Calendar as CalendarIcon,
  MessageSquare,
  Loader2,
  RefreshCw,
  ClipboardList,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Task, TaskStatus, Priority } from '@/types/task.types';
import { logger } from '@/utils/logger';
import { SubscriptionModal } from '@/components/SubscriptionModal';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { isStripeConfigured } from '@/config/stripe';
import { toast } from 'sonner';
import { TaskState } from './TaskState';
import { useNavigate } from 'react-router-dom';
import { STORAGE_KEYS } from '@/constants/storage';
import { motion } from 'framer-motion';

// Keep existing interfaces but rename TaskExtractorProps to TaskRadarProps
interface TaskRadarProps {
  onChange?: (value: string) => void;
  onSubmit?: () => void;
}

// Keep all existing interfaces and types
interface CommandSuggestion {
  command: string;
  description: string;
  fullCommand: string;
}

// Add symbol definitions
interface TaskSymbol {
  value: string;
  description: string;
  category: 'git' | 'code' | 'task' | 'priority';
  example: string;
}

// Add new interface for integration options
interface IntegrationOption {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  description: string;
}

// Fix integration type error
interface TaskIntegration {
  enabled: boolean;
  addedAt: string;
}

interface TaskIntegrations {
  [key: string]: TaskIntegration;
}

// Update Task interface
interface Task {
  // ... other properties
  integrations?: TaskIntegrations;
}

const SYMBOLS: TaskSymbol[] = [
  {
    value: '!',
    description: 'High priority task',
    category: 'priority',
    example: '! Urgent security fix needed',
  },
  {
    value: '@',
    description: 'Assign to user',
    category: 'task',
    example: '@john Fix login flow',
  },
  {
    value: '#',
    description: 'Tag or category',
    category: 'task',
    example: '#backend API optimization',
  },
  {
    value: 'feat:',
    description: 'New feature',
    category: 'git',
    example: 'feat: add dark mode support',
  },
  {
    value: 'fix:',
    description: 'Bug fix',
    category: 'git',
    example: 'fix: resolve login timeout',
  },
  {
    value: 'TODO:',
    description: 'Code todo marker',
    category: 'code',
    example: 'TODO: add error handling',
  },
  {
    value: 'FIXME:',
    description: 'Code fix needed',
    category: 'code',
    example: 'FIXME: memory leak in loop',
  },
];

// Keep existing command definitions but update descriptions
const COMMANDS = {
  extract: {
    prefix: 'extract',
    description: 'Scan content for tasks using Task Radar',
    usage: 'extract <type> <content>',
    examples: [
      'extract git "feat: implement user auth"',
      'extract code "// TODO: add error handling"',
    ],
  },
  help: {
    prefix: 'help',
    description: 'Show help information',
    usage: 'help [command]',
    examples: ['help', 'help extract'],
  },
  clear: {
    prefix: 'clear',
    description: 'Clear the terminal',
    usage: 'clear',
    examples: ['clear'],
  },
};

// Add integration options constant
const INTEGRATIONS: IntegrationOption[] = [
  {
    id: 'github',
    name: 'GitHub',
    icon: <Github className="w-4 h-4" />,
    color: 'bg-gray-800 text-white',
    description: 'Create GitHub issue',
  },
  {
    id: 'google',
    name: 'Google Tasks',
    icon: <Mail className="w-4 h-4" />,
    color: 'bg-blue-500 text-white',
    description: 'Add to Google Tasks',
  },
  {
    id: 'zoom',
    name: 'Zoom',
    icon: <Video className="w-4 h-4" />,
    color: 'bg-blue-600 text-white',
    description: 'Create Zoom task',
  },
  {
    id: 'gitlab',
    name: 'GitLab',
    icon: <GitBranch className="w-4 h-4" />,
    color: 'bg-orange-600 text-white',
    description: 'Create GitLab issue',
  },
  {
    id: 'appstore',
    name: 'App Store',
    icon: <Calendar className="w-4 h-4" />,
    color: 'bg-gray-900 text-white',
    description: 'Create App Store task',
  },
];

export const TaskRadar: React.FC<TaskRadarProps> = ({ onChange, onSubmit }) => {
  // Keep all existing state and handlers
  const [input, setInput] = useState('');
  const [extractedTasks, setExtractedTasks] = useState<Task[]>([]);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [showSubscription, setShowSubscription] = useState(false);
  const [commandCount, setCommandCount] = useLocalStorage('command-count', 0);
  const [suggestions, setSuggestions] = useState<TaskSymbol[]>([]);
  const [selectedSuggestion, setSelectedSuggestion] = useState(-1);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [selectedIntegrations, setSelectedIntegrations] = useState<string[]>([]);
  const [actionLoadingStates, setActionLoadingStates] = useState<{
    [key: string]: { [key: string]: boolean };
  }>({});

  // Add TaskExtractor state
  const [editingField, setEditingField] = useState<{
    taskId: string;
    field: 'title' | 'description';
    value: string;
  } | null>(null);

  const [aiConfidence, setAiConfidence] = useState<{ [key: string]: number }>({});

  const navigate = useNavigate();

  // Keep existing handlers but update logging
  const handleExtract = async () => {
    try {
      logger.info('Task Radar scan initiated', { input });
      const newTask: Task = {
        id: `task-${Date.now()}`,
        title: input,
        text: input,
        description: 'Extracted by Task Radar',
        status: 'todo',
        priority: 'medium',
        source: 'radar',
        createdAt: new Date().toISOString(),
        verified: true,
        scheduled: false,
        completed: false,
        metadata: {
          confidence: 0.85,
          source: 'radar',
          radarScore: 0.9,
        },
        integrations: selectedIntegrations.reduce((acc, id) => ({
          ...acc,
          [id]: {
            enabled: true,
            addedAt: new Date().toISOString(),
          },
        }), {}),
      };

      // Update both local state and storage
      setExtractedTasks(prev => [...prev, newTask]);
      
      // Get existing tasks from storage
      const existingTasks = JSON.parse(localStorage.getItem(STORAGE_KEYS.TASKS) || '[]');
      const updatedTasks = [...existingTasks, newTask];
      
      // Save to shared storage
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(updatedTasks));
      
      setCommandHistory(prev => [...prev, input]);
      setInput('');
      toast.success('Task extracted successfully');
      onSubmit?.();

      // Create tasks in selected integrations
      for (const integrationId of selectedIntegrations) {
        try {
          await createIntegrationTask(integrationId, newTask);
        } catch (error) {
          logger.error(`Failed to create task in ${integrationId}`, { error });
          toast.error(`Failed to create task in ${integrationId}`);
        }
      }
    } catch (error) {
      logger.error('Task Radar scan failed', { error });
      toast.error('Failed to scan for tasks');
    }
  };

  const handleSubscribe = async () => {
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Subscription activated');
      setShowSubscription(false);
    } catch (error) {
      toast.error('Failed to process subscription');
      logger.error('Subscription error', { error });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInput(value);
    onChange?.(value);

    // Show suggestions when typing a symbol
    const lastWord = value.split(' ').pop() || '';
    if (lastWord.length > 0) {
      const matchingSymbols = SYMBOLS.filter(symbol =>
        symbol.value.toLowerCase().startsWith(lastWord.toLowerCase())
      );
      setSuggestions(matchingSymbols);
      setSelectedSuggestion(matchingSymbols.length > 0 ? 0 : -1);
    } else {
      setSuggestions([]);
      setSelectedSuggestion(-1);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (suggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedSuggestion(prev => (prev < suggestions.length - 1 ? prev + 1 : 0));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedSuggestion(prev => (prev > 0 ? prev - 1 : suggestions.length - 1));
      } else if (e.key === 'Tab' || e.key === 'Enter') {
        e.preventDefault();
        if (selectedSuggestion >= 0) {
          const symbol = suggestions[selectedSuggestion];
          const words = input.split(' ');
          words[words.length - 1] = symbol.value;
          setInput(words.join(' ') + ' ');
          setSuggestions([]);
        }
      }
    } else if (e.key === 'Enter') {
      handleExtract();
    }
  };

  // Add task interaction handlers
  const handleTaskClick = (task: Task) => {
    navigate(`/radar/task/${task.id}`);
  };

  const handleTaskPause = () => {
    if (selectedTask) {
      setExtractedTasks(prev =>
        prev.map(t => (t.id === selectedTask.id ? { ...t, status: 'paused' as TaskStatus } : t))
      );
    }
  };

  const handleTaskResume = () => {
    if (selectedTask) {
      setExtractedTasks(prev =>
        prev.map(t =>
          t.id === selectedTask.id ? { ...t, status: 'in_progress' as TaskStatus } : t
        )
      );
    }
  };

  const handleTaskReset = () => {
    if (selectedTask) {
      setExtractedTasks(prev =>
        prev.map(t => (t.id === selectedTask.id ? { ...t, status: 'todo' as TaskStatus } : t))
      );
      setSelectedTask(null);
    }
  };

  const toggleIntegration = (integrationId: string) => {
    setSelectedIntegrations(prev =>
      prev.includes(integrationId)
        ? prev.filter(id => id !== integrationId)
        : [...prev, integrationId]
    );
  };

  const createIntegrationTask = async (integrationId: string, task: Task) => {
    const response = await fetch(`/api/v1/integrations/${integrationId}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(task),
    });

    if (!response.ok) {
      throw new Error(`Failed to create task in ${integrationId}`);
    }

    return response.json();
  };

  const isActionLoading = (taskId: string, action: string) => {
    return actionLoadingStates[taskId]?.[action] || false;
  };

  const handleServiceAction = async (taskId: string, action: 'schedule' | 'share') => {
    setActionLoadingStates(prev => ({
      ...prev,
      [taskId]: { ...prev[taskId], [action]: true },
    }));

    try {
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      toast.success(`Task ${action}d successfully`);
      
      // Update task state based on action
      setExtractedTasks(prev =>
        prev.map(task =>
          task.id === taskId
            ? {
                ...task,
                [action === 'schedule' ? 'scheduled' : 'shared']: true,
              }
            : task
        )
      );
    } catch (error) {
      toast.error(`Failed to ${action} task`);
      logger.error(`Task ${action} failed`, { taskId, error });
    } finally {
      setActionLoadingStates(prev => ({
        ...prev,
        [taskId]: { ...prev[taskId], [action]: false },
      }));
    }
  };

  // Add TaskExtractor handlers
  const handleStartEdit = (taskId: string, field: 'title' | 'description', value: string) => {
    setEditingField({ taskId, field, value });
  };

  const handleSaveEdit = async (taskId: string) => {
    if (!editingField) return;

    try {
      const updatedTasks = extractedTasks.map(task =>
        task.id === taskId
          ? { ...task, [editingField.field]: editingField.value }
          : task
      );

      setExtractedTasks(updatedTasks);
      localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(updatedTasks));
      setEditingField(null);
      toast.success('Task updated successfully');
    } catch (error) {
      logger.error('Failed to update task', { taskId, error });
      toast.error('Failed to update task');
    }
  };

  // Update the task rendering to include inline editing
  const renderTask = (task: Task) => (
    <motion.div
      key={task.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-gray-800 rounded-lg p-4 border-l-4 border-blue-500 
        cursor-pointer transition-colors hover:bg-gray-700
        ${selectedTask?.id === task.id ? 'ring-2 ring-blue-400' : ''}`}
      onClick={() => handleTaskClick(task)}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          {editingField?.taskId === task.id && editingField.field === 'title' ? (
            <input
              type="text"
              value={editingField.value}
              onChange={e => setEditingField({ ...editingField, value: e.target.value })}
              onBlur={() => handleSaveEdit(task.id)}
              onKeyDown={e => e.key === 'Enter' && handleSaveEdit(task.id)}
              className="w-full bg-gray-700 px-2 py-1 rounded border border-gray-600 
                focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-100"
              autoFocus
            />
          ) : (
            <div className="flex items-center group">
              <h3 className="text-lg font-medium text-gray-100">{task.title}</h3>
              <button
                onClick={e => {
                  e.stopPropagation();
                  handleStartEdit(task.id, 'title', task.title);
                }}
                className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Edit2 className="w-4 h-4 text-gray-400 hover:text-gray-200" />
              </button>
            </div>
          )}

          {editingField?.taskId === task.id && editingField.field === 'description' ? (
            <textarea
              value={editingField.value}
              onChange={e => setEditingField({ ...editingField, value: e.target.value })}
              onBlur={() => handleSaveEdit(task.id)}
              className="w-full mt-1 bg-gray-700 px-2 py-1 rounded border border-gray-600 
                focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-100 resize-none"
              rows={2}
              autoFocus
            />
          ) : (
            <div className="flex items-start group">
              <p className="text-sm text-gray-400">{task.description}</p>
              <button
                onClick={e => {
                  e.stopPropagation();
                  handleStartEdit(task.id, 'description', task.description);
                }}
                className="ml-2 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Edit2 className="w-3 h-3 text-gray-400 hover:text-gray-200" />
              </button>
            </div>
          )}

          {/* Add integration badges */}
          {Object.entries(task.integrations || {}).map(([id]) => {
            const integrationConfig = INTEGRATIONS.find(i => i.id === id);
            return integrationConfig ? (
              <span
                key={id}
                className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${integrationConfig.color}`}
              >
                {integrationConfig.icon}
                {integrationConfig.name}
              </span>
            ) : null;
          })}

          <div className="mt-2 flex items-center gap-2 text-sm">
            <span className="text-blue-400">
              Confidence: {(task.metadata?.confidence || 0) * 100}%
            </span>
            <span className="text-green-400">
              Radar Score: {(task.metadata?.radarScore || 0) * 100}%
            </span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleServiceAction(task.id, 'schedule');
              }}
              disabled={task.completed || isActionLoading(task.id, 'schedule')}
              className={`p-1 transition-colors ${
                isActionLoading(task.id, 'schedule')
                  ? 'text-blue-300'
                  : task.completed
                    ? 'text-gray-300'
                    : 'text-gray-400 hover:text-blue-500'
              }`}
              title="Schedule Task"
            >
              {isActionLoading(task.id, 'schedule') ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <CalendarIcon className="w-4 h-4" />
              )}
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleServiceAction(task.id, 'share');
              }}
              disabled={task.completed || isActionLoading(task.id, 'share')}
              className={`p-1 transition-colors ${
                isActionLoading(task.id, 'share')
                  ? 'text-purple-300'
                  : task.completed
                    ? 'text-gray-300'
                    : 'text-gray-400 hover:text-purple-500'
              }`}
              title="Share Task"
            >
              {isActionLoading(task.id, 'share') ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <MessageSquare className="w-4 h-4" />
              )}
            </button>
          </div>

          <div className="mt-2 flex items-center space-x-2 ml-9">
            <select
              value={task.priority}
              onChange={(e) => {
                const newPriority = e.target.value as Priority;
                setExtractedTasks(prev =>
                  prev.map(t =>
                    t.id === task.id ? { ...t, priority: newPriority } : t
                  )
                );
              }}
              className={`px-2 py-1 rounded-full text-xs border-0 cursor-pointer ${
                task.completed
                  ? 'bg-gray-100 text-gray-400'
                  : task.priority === 'high'
                    ? 'bg-red-100 text-red-800 hover:bg-red-200'
                    : task.priority === 'medium'
                      ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                      : 'bg-green-100 text-green-800 hover:bg-green-200'
              }`}
            >
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
            {task.completed && (
              <span className="text-xs text-gray-400">Completed</span>
            )}
          </div>

          {task.type && (
            <span
              className={`text-xs px-2 py-1 rounded-full ${
                task.type === 'git'
                  ? 'bg-purple-100 text-purple-800'
                  : task.type === 'terminal'
                    ? 'bg-gray-100 text-gray-800'
                    : 'bg-blue-100 text-blue-800'
              }`}
            >
              {task.type}
            </span>
          )}
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="text-gray-400 hover:text-gray-100"
          onClick={e => {
            e.stopPropagation();
            handleTaskClick(task);
          }}
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </motion.div>
  );

  // Update UI with new branding but keep existing functionality
  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="bg-gray-900 text-gray-100 p-6">
        <div className="flex items-center gap-3 mb-6">
          <Radar className="w-6 h-6 text-blue-400" />
          <div>
            <h2 className="text-xl font-bold">Task Radar</h2>
            <p className="text-sm text-gray-400">Intelligent Task Discovery & Organization</p>
          </div>
        </div>

        {/* Add integration options before the terminal */}
        <div className="mb-4 flex flex-wrap gap-2">
          {INTEGRATIONS.map(integration => (
            <button
              key={integration.id}
              onClick={() => toggleIntegration(integration.id)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-colors
                ${
                  selectedIntegrations.includes(integration.id)
                    ? integration.color
                    : 'bg-gray-800 text-gray-400 hover:text-gray-100'
                }`}
              title={integration.description}
            >
              {integration.icon}
              <span className="text-sm">{integration.name}</span>
              {selectedIntegrations.includes(integration.id) && (
                <CheckCircle2 className="w-4 h-4 ml-1" />
              )}
            </button>
          ))}
        </div>

        {/* Keep existing terminal UI */}
        <div className="bg-gray-950 rounded-lg p-4 font-mono">
          <div className="relative flex items-center gap-2">
            <Terminal className="w-4 h-4 text-green-400" />
            <input
              type="text"
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              className="flex-1 bg-transparent border-none outline-none text-gray-100"
              placeholder="Type 'help' for commands or use symbols like !, @, #"
            />

            {/* Symbol suggestions */}
            {suggestions.length > 0 && (
              <div className="absolute top-full left-0 mt-1 w-full bg-gray-800 rounded-lg shadow-lg border border-gray-700 z-10">
                {suggestions.map((symbol, index) => (
                  <div
                    key={symbol.value}
                    className={`p-2 hover:bg-gray-700 cursor-pointer ${
                      index === selectedSuggestion ? 'bg-gray-700' : ''
                    }`}
                    onClick={() => {
                      const words = input.split(' ');
                      words[words.length - 1] = symbol.value;
                      setInput(words.join(' ') + ' ');
                      setSuggestions([]);
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-blue-400 font-mono">{symbol.value}</span>
                      <span className="text-xs text-gray-400">{symbol.category}</span>
                    </div>
                    <p className="text-sm text-gray-300">{symbol.description}</p>
                    {symbol.example && (
                      <code className="text-xs text-gray-500 mt-1 block">
                        Example: {symbol.example}
                      </code>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Keep existing task display */}
        <div className="mt-6 space-y-4">
          {extractedTasks.map(task => renderTask(task))}
        </div>

        {/* Keep existing command help */}
        <div className="mt-6 border-t border-gray-800 pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {Object.entries(COMMANDS).map(([key, cmd]) => (
              <div key={key} className="bg-gray-800 rounded-lg p-4">
                <h3 className="text-lg font-medium text-gray-100">{cmd.prefix}</h3>
                <p className="text-sm text-gray-400">{cmd.description}</p>
                <code className="mt-2 block text-sm text-blue-400">$ {cmd.examples[0]}</code>
              </div>
            ))}
          </div>
        </div>
      </Card>

      {/* Keep subscription modal */}
      {isStripeConfigured() && (
        <SubscriptionModal
          isOpen={showSubscription}
          onClose={() => setShowSubscription(false)}
          onSubscribe={handleSubscribe}
        />
      )}
    </div>
  );
};
