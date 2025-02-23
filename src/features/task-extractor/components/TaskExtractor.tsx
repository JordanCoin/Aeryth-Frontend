import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Toaster, toast } from 'sonner';
import {
  ClipboardList,
  X,
  Calendar,
  MessageSquare,
  Loader2,
  CheckCircle2,
  RefreshCw,
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
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Task, TaskStatus, Priority } from '@/types/task.types';
import { logger } from '@/utils/logger';
import { SubscriptionModal } from '@/components/SubscriptionModal';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { isStripeConfigured } from '@/config/stripe';

interface TaskExtractorProps {
  onChange: (value: string) => void;
  onSubmit: () => void;
}

interface TaskAction {
  type: 'schedule' | 'share' | 'complete' | 'edit';
  taskId: string;
}

interface TaskCommand {
  command: string;
  description: string;
}

interface FileType {
  extension: string[];
  icon: React.ReactNode;
  name: string;
  extractPatterns: RegExp[];
}

interface CommandSuggestion {
  command: string;
  description: string;
  fullCommand: string;
}

interface EditableField {
  field: keyof Task;
  value: string;
  taskId: string;
}

interface TaskDeadline {
  date: Date;
  extracted: boolean; // Was this automatically extracted?
  confidence: number;
}

interface TaskMetadata {
  source: string;
  confidence: number;
  requires: string[];
  pipeline?: {
    type: 'ios' | 'android' | 'web';
    steps: string[];
    config: Record<string, unknown>;
  };
}

interface FileAttachment {
  id: string;
  name: string;
  type: string;
  size: number;
  url: string;
}

interface Task {
  id: string;
  title: string;
  text: string;
  description: string;
  status: TaskStatus;
  priority: Priority;
  createdAt: string;
  verified: boolean | null;
  scheduled: boolean;
  completed: boolean;
  commands?: TaskCommand[];
  type?: 'terminal' | 'git' | 'general' | 'file' | 'ci' | 'gitlab';
  extractedTasks?: string[];
  deadline?: TaskDeadline;
  metadata?: TaskMetadata;
  confirmationNeeded?: boolean;
  aiSuggestions?: string[];
  attachments?: FileAttachment[];
  assignee?: string;
  tags?: string[];
  estimate?: string;
  dueDate?: string;
  dependencies?: string[];
  forwards?: string[];
}

interface CITask extends Task {
  ciConfig?: {
    type: 'ios' | 'android' | 'web';
    stage: 'test' | 'build' | 'deploy' | 'production';
    file: '.gitlab-ci.yml';
    changes: {
      section: string;
      content: string;
      description: string;
    }[];
  };
}

const COMMAND_PREFIXES = {
  git: 'git:',
  npm: 'npm:',
  task: 't:',
  note: 'n:',
};

const COMMAND_SYMBOLS = {
  '@': 'mention/assign', // @user to assign
  '#': 'tag/label', // #frontend #urgent
  $: 'cost/estimate', // $4h for time estimate
  '!': 'priority', // !high for priority
  '^': 'dependency', // ^TASK-123 for dependencies
  '=': 'due-date', // =tomorrow, =2024-01-20
  '@>': 'forward', // @>team to forward/share
  '&': 'attach', // &file.pdf to attach
} as const;

// Add symbol suggestion interface
interface SymbolSuggestion {
  symbol: string;
  value: string;
  description: string;
  example: string;
}

// Add common suggestions for each symbol type
const SYMBOL_SUGGESTIONS: Record<string, SymbolSuggestion[]> = {
  '@': [
    { symbol: '@', value: 'john', description: 'Assign to John', example: '@john' },
    { symbol: '@', value: 'team', description: 'Assign to Team', example: '@team' },
    { symbol: '@>', value: 'dev', description: 'Forward to Dev Team', example: '@>dev' },
  ],
  '#': [
    { symbol: '#', value: 'urgent', description: 'High priority task', example: '#urgent' },
    { symbol: '#', value: 'bug', description: 'Bug fix task', example: '#bug' },
    { symbol: '#', value: 'feature', description: 'New feature', example: '#feature' },
  ],
  $: [
    { symbol: '$', value: '1h', description: '1 hour estimate', example: '$1h' },
    { symbol: '$', value: '4h', description: 'Half day estimate', example: '$4h' },
    { symbol: '$', value: '8h', description: 'Full day estimate', example: '$8h' },
  ],
  '!': [
    { symbol: '!', value: 'high', description: 'High priority', example: '!high' },
    { symbol: '!', value: 'medium', description: 'Medium priority', example: '!medium' },
    { symbol: '!', value: 'low', description: 'Low priority', example: '!low' },
  ],
  '^': [
    { symbol: '^', value: 'TASK-', description: 'Depends on task', example: '^TASK-123' },
    { symbol: '^', value: 'PR-', description: 'Depends on PR', example: '^PR-456' },
  ],
  '=': [
    { symbol: '=', value: 'today', description: 'Due today', example: '=today' },
    { symbol: '=', value: 'tomorrow', description: 'Due tomorrow', example: '=tomorrow' },
    { symbol: '=', value: 'next-week', description: 'Due next week', example: '=next-week' },
  ],
};

// Replace unescaped quotes with escaped versions
const HELP_TEXT = {
  AVAILABLE_COMMANDS: 'Type &apos;help&apos; to see all available commands',
  HELP_SPECIFIC: 'Type &apos;help [command]&apos; for more information about a specific command',
};

// Fix unnecessary escape in regex
const FILE_PATTERN = /\.(js|jsx|ts|tsx|md|txt)$/;

export const TaskExtractor: React.FC<TaskExtractorProps> = ({ onChange, onSubmit }) => {
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [extractedTasks, setExtractedTasks] = useState<Task[]>([]);
  const [loadingActions, setLoadingActions] = useState<TaskAction[]>([]);
  const [copiedCommands, setCopiedCommands] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<CommandSuggestion[]>([]);
  const [selectedSuggestion, setSelectedSuggestion] = useState<number>(-1);
  const [showCommands, setShowCommands] = useState(false);
  const [editingField, setEditingField] = useState<EditableField | null>(null);
  const [aiConfidence, setAiConfidence] = useState<Record<string, number>>({});
  const [attachments, setAttachments] = useState<FileAttachment[]>([]);
  const [symbolSuggestions, setSymbolSuggestions] = useState<SymbolSuggestion[]>([]);
  const [selectedSymbolSuggestion, setSelectedSymbolSuggestion] = useState<number>(-1);
  const [commandCount, setCommandCount] = useLocalStorage('command-count', 0);
  const [showSubscription, setShowSubscription] = useState(false);
  const taskLimit = 10; // Free tier limit

  const isActionLoading = (taskId: string, actionType: TaskAction['type']) => {
    return loadingActions.some(action => action.taskId === taskId && action.type === actionType);
  };

  const handleServiceAction = async (taskId: string, actionType: TaskAction['type']) => {
    setLoadingActions(prev => [...prev, { taskId, type: actionType }]);

    try {
      await toast.promise(new Promise(resolve => setTimeout(resolve, 2000)), {
        loading: `${actionType === 'schedule' ? 'Scheduling' : 'Sharing'} task...`,
        success: `Task ${actionType === 'schedule' ? 'scheduled' : 'shared'} successfully!`,
        error: `Failed to ${actionType} task`,
      });
    } catch (error) {
      logger.error(`Failed to ${actionType} task`, { taskId, error });
    } finally {
      setLoadingActions(prev =>
        prev.filter(action => !(action.taskId === taskId && action.type === actionType))
      );
    }
  };

  const handleCopyCommand = async (command: string) => {
    try {
      await navigator.clipboard.writeText(command);
      setCopiedCommands(prev => [...prev, command]);
      toast.success('Command copied to clipboard');

      setTimeout(() => {
        setCopiedCommands(prev => prev.filter(cmd => cmd !== command));
      }, 2000);
    } catch (error) {
      toast.error('Failed to copy command');
    }
  };

  const handleExtraction = async () => {
    if (!isStripeConfigured() || extractedTasks.length < taskLimit) {
      // Process normally if Stripe is not configured or under limit
      // ... existing extraction logic
    } else {
      // If Stripe is configured and over limit, show subscription modal
      setShowSubscription(true);
    }
  };

  const handleExtract = async () => {
    // Increment command count
    const newCount = commandCount + 1;
    setCommandCount(newCount);

    // Show subscription modal after 3 commands
    if (newCount >= 3 && !localStorage.getItem('subscribed')) {
      setShowSubscription(true);
      return;
    }

    if (!inputText.trim()) {
      toast.error('Please enter some text to extract tasks from');
      return;
    }

    setIsProcessing(true);

    try {
      await toast.promise(new Promise(resolve => setTimeout(resolve, 2000)), {
        loading: 'AI is analyzing your text...',
        success: 'Tasks extracted successfully!',
        error: 'Failed to extract tasks',
      });

      const newTasks: Task[] = [
        {
          id: 't1',
          title: 'Create New Git Branch',
          text: 'Set up feature branch for task extraction',
          description: 'Create and switch to a new feature branch for development',
          status: 'todo' as TaskStatus,
          priority: 'high' as Priority,
          createdAt: new Date().toISOString(),
          verified: null,
          scheduled: false,
          completed: false,
          type: 'git',
          commands: [
            {
              command: 'git checkout -b feature/task-extraction',
              description: 'Create and switch to new branch',
            },
            {
              command: 'git push -u origin feature/task-extraction',
              description: 'Push branch to remote',
            },
          ],
        },
        {
          id: 't2',
          title: 'Update Documentation',
          text: 'Review and update API documentation',
          description: 'Ensure all new endpoints are properly documented',
          status: 'todo' as TaskStatus,
          priority: 'medium' as Priority,
          createdAt: new Date().toISOString(),
          verified: null,
          scheduled: false,
          completed: false,
        },
      ];

      // Add confidence scores for new tasks
      const confidenceScores = newTasks.reduce(
        (acc, task) => ({
          ...acc,
          [task.id]: calculateConfidence(task),
        }),
        {}
      );

      setAiConfidence(confidenceScores);
      setExtractedTasks(newTasks);

      setLoadingActions([{ taskId: 't2', type: 'schedule' }]);

      setTimeout(() => {
        setLoadingActions(prev => prev.filter(action => action.taskId !== 't2'));
        toast.success('Task scheduled automatically');
      }, 3000);

      onSubmit();
      logger.info('Tasks extracted successfully', { count: newTasks.length });
    } catch (error) {
      toast.error('Failed to extract tasks. Please try again.');
      logger.error('Task extraction failed', { error });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTaskComplete = async (taskId: string) => {
    setLoadingActions(prev => [...prev, { taskId, type: 'complete' }]);

    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      setExtractedTasks(prev =>
        prev.map(task => (task.id === taskId ? { ...task, completed: !task.completed } : task))
      );
      logger.info('Task completion toggled', { taskId });
    } finally {
      setLoadingActions(prev =>
        prev.filter(action => !(action.taskId === taskId && action.type === 'complete'))
      );
    }
  };

  const showHelp = (command?: string) => {
    const helpContent = command ? (
      // Show specific command help
      COMMANDS[command as keyof typeof COMMANDS] ? (
        <div className="font-mono space-y-2">
          <div className="flex items-center space-x-2">
            <Terminal className="w-4 h-4 text-green-400" />
            <span className="text-green-400">Command: {command}</span>
          </div>
          <div className="text-gray-300">
            {COMMANDS[command as keyof typeof COMMANDS].description}
          </div>
          <div className="text-gray-500">Usage:</div>
          <div className="text-blue-400 ml-2">
            $ {COMMANDS[command as keyof typeof COMMANDS].usage}
          </div>
          <div className="text-gray-500">Examples:</div>
          {COMMANDS[command as keyof typeof COMMANDS].examples.map((ex, i) => (
            <div key={i} className="text-blue-400 ml-2">
              $ {ex}
            </div>
          ))}
        </div>
      ) : (
        <div className="text-red-400">
          Command not found: {command}
          <div className="text-gray-400 text-sm mt-1">{HELP_TEXT.AVAILABLE_COMMANDS}</div>
        </div>
      )
    ) : (
      // Show general help
      <div className="font-mono space-y-4">
        <div className="flex items-center space-x-2 mb-2">
          <Terminal className="w-4 h-4 text-green-400" />
          <span className="text-green-400">Available Commands</span>
        </div>
        {Object.entries(COMMANDS).map(([key, cmd]) => (
          <div key={key} className="space-y-1 border-l-2 border-gray-700 pl-3">
            <div className="text-green-400 font-bold">{cmd.prefix}</div>
            <div className="text-gray-400 ml-2">{cmd.description}</div>
            <div className="text-blue-400 ml-2 font-mono">$ {cmd.examples[0]}</div>
          </div>
        ))}
        <div className="text-gray-500 mt-4 pt-4 border-t border-gray-700">
          {HELP_TEXT.HELP_SPECIFIC}
        </div>
      </div>
    );

    toast.info(helpContent, {
      duration: 10000,
      className: 'bg-gray-900 text-gray-100 border border-gray-700',
      icon: <HelpCircle className="w-5 h-5 text-blue-400" />,
    });
  };

  const extractDeadline = (text: string): TaskDeadline | null => {
    const patterns = [
      /by\s+(next\s+)?([A-Za-z]+day)/i,
      /due\s+(?:on\s+)?([A-Za-z]+\s+\d{1,2}(?:st|nd|rd|th)?)/i,
      /until\s+(\d{1,2}\/\d{1,2}(?:\/\d{2,4})?)/i,
    ];

    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) {
        return {
          date: new Date(),
          extracted: true,
          confidence: 0.8,
        };
      }
    }
    return null;
  };

  const calculateConfidence = (task: Task): number => {
    let score = 1.0;

    // Reduce confidence based on various factors
    if (task.title.length < 10) score *= 0.8;
    if (!task.description) score *= 0.9;
    if (task.deadline?.extracted) score *= 0.95;

    return score;
  };

  const parseSymbols = (text: string) => {
    const symbols = {
      mentions: text.match(/@[\w-]+/g) || [],
      tags: text.match(/#[\w-]+/g) || [],
      estimates: text.match(/\$[\w\d]+/g) || [],
      priority: text.match(/![\w-]+/g) || [],
      dependencies: text.match(/\^[\w-]+/g) || [],
      dueDate: text.match(/=[\w-]+/g) || [],
      forwards: text.match(/@>[\w-]+/g) || [],
      attachments: text.match(/&[\w-\.]+/g) || [],
    };

    return {
      assignee: symbols.mentions[0]?.slice(1),
      tags: symbols.tags.map(t => t.slice(1)),
      estimate: symbols.estimates[0]?.slice(1),
      priority: symbols.priority[0]?.slice(1),
      dependencies: symbols.dependencies.map(d => d.slice(1)),
      dueDate: symbols.dueDate[0]?.slice(1),
      forwards: symbols.forwards.map(f => f.slice(3)),
      attachmentNames: symbols.attachments.map(a => a.slice(1)),
    };
  };

  const parseCommandInput = (input: string): Task | null => {
    const [firstLine, ...restLines] = input.trim().split('\n');

    // Parse symbols from input
    const symbols = parseSymbols(firstLine);

    // Add to task creation
    const baseTask = {
      assignee: symbols.assignee,
      tags: symbols.tags,
      estimate: symbols.estimate,
      priority: symbols.priority as Priority,
      dependencies: symbols.dependencies,
      dueDate: symbols.dueDate,
      forwards: symbols.forwards,
      attachments: attachments.filter(a => symbols.attachmentNames.includes(a.name)),
    };

    if (firstLine.startsWith('help')) {
      const command = firstLine.split(' ')[1];
      showHelp(command);
      return null;
    }

    if (firstLine.startsWith('extract')) {
      const [_, type, ...rest] = firstLine.split(' ');
      const fileType = Object.entries(FILE_TYPES).find(([key]) => key.startsWith(type))?.[1];

      if (fileType) {
        const text = rest.join(' ');
        const tasks: string[] = [];

        fileType.extractPatterns.forEach(pattern => {
          const matches = text.matchAll(pattern);
          for (const match of matches) {
            tasks.push(match[1]);
          }
        });

        return {
          id: `task-${Date.now()}`,
          title: `Extract from ${fileType.name}`,
          text: text.slice(0, 100) + '...',
          description: `Found ${tasks.length} tasks in ${fileType.name} content`,
          status: 'todo' as TaskStatus,
          priority: 'medium' as Priority,
          createdAt: new Date().toISOString(),
          verified: null,
          scheduled: false,
          completed: false,
          type: 'file',
          extractedTasks: tasks,
        };
      }
    }

    if (firstLine.startsWith(COMMAND_PREFIXES.git)) {
      const command = firstLine.substring(COMMAND_PREFIXES.git.length).trim();
      return {
        id: `task-${Date.now()}`,
        title: `Git: ${command.split(' ')[0]}`,
        text: command,
        description: restLines.join('\n') || 'Execute git command',
        status: 'todo' as TaskStatus,
        priority: 'medium' as Priority,
        createdAt: new Date().toISOString(),
        verified: null,
        scheduled: false,
        completed: false,
        type: 'git',
        commands: [
          {
            command,
            description: 'Git command to execute',
          },
        ],
      };
    }

    if (firstLine.startsWith(COMMAND_PREFIXES.task)) {
      const taskText = firstLine.substring(COMMAND_PREFIXES.task.length).trim();
      return {
        id: `task-${Date.now()}`,
        title: taskText,
        text: taskText,
        description: restLines.join('\n') || taskText,
        status: 'todo' as TaskStatus,
        priority: 'medium' as Priority,
        createdAt: new Date().toISOString(),
        verified: null,
        scheduled: false,
        completed: false,
      };
    }

    if (firstLine.startsWith('ios:')) {
      const [project, ..._config] = firstLine.substring(4).trim().split('|');
      return {
        id: `task-${Date.now()}`,
        title: `iOS Pipeline: ${project.trim()}`,
        text: firstLine.substring(4).trim(),
        description: `Pipeline configuration for ${project.trim()}`,
        status: 'todo' as TaskStatus,
        priority: 'medium' as Priority,
        createdAt: new Date().toISOString(),
        verified: null,
        scheduled: false,
        completed: false,
        type: 'ios',
        metadata: {
          source: 'pipeline',
          confidence: 1.0,
          requires: ['xcode', 'gitlab-ci'],
          pipeline: {
            type: 'ios',
            steps: ['setup', 'configure', 'test'],
            config: {
              project: project.trim(),
              coverage: true,
            },
          },
        },
      };
    }

    if (firstLine.startsWith('ci:')) {
      const [type, ..._config] = firstLine.substring(3).trim().split('|');
      const [platform, action] = type.trim().split(' ');

      return {
        id: `task-${Date.now()}`,
        title: `CI: ${platform} ${action}`,
        text: firstLine,
        description: `Configure ${platform} pipeline for ${action}`,
        status: 'todo' as TaskStatus,
        priority: 'high' as Priority,
        createdAt: new Date().toISOString(),
        verified: null,
        scheduled: false,
        completed: false,
        type: 'ci',
        ciConfig: {
          type: platform as 'ios',
          stage: action === 'coverage' ? 'test' : 'deploy',
          file: '.gitlab-ci.yml',
          changes: [
            {
              section: 'stages',
              content: action === 'coverage' ? 'test' : 'deploy',
              description: `Add ${action} stage to pipeline`,
            },
            {
              section: 'jobs',
              content: generateCIJobTemplate(platform, action),
              description: `Configure ${platform} ${action} job`,
            },
          ],
        },
      } as CITask;
    }

    if (firstLine.startsWith('gitlab:')) {
      const [action, ..._config] = firstLine.substring(7).trim().split('|');
      const [command, stage] = action.trim().split(' ');

      return {
        id: `task-${Date.now()}`,
        title: `GitLab: ${command} ${stage}`,
        text: firstLine,
        description: `Update .gitlab-ci.yml for ${stage}`,
        status: 'todo' as TaskStatus,
        priority: 'high' as Priority,
        createdAt: new Date().toISOString(),
        verified: null,
        scheduled: false,
        completed: false,
        type: 'gitlab',
        ciConfig: {
          type: 'ios',
          stage: stage as 'test',
          file: '.gitlab-ci.yml',
          changes: [
            {
              section: stage,
              content: generateGitLabConfig(command, stage),
              description: `${command} ${stage} configuration`,
            },
          ],
        },
      } as CITask;
    }

    return {
      ...baseTask,
      id: `task-${Date.now()}`,
      title: firstLine,
      text: firstLine,
      description: restLines.join('\n') || firstLine,
      status: 'todo' as TaskStatus,
      priority: baseTask.priority,
      createdAt: new Date().toISOString(),
      verified: null,
      scheduled: false,
      completed: false,
      type: 'general',
    };
  };

  const generateSuggestions = (input: string): CommandSuggestion[] => {
    const text = input.toLowerCase();
    if (!text) return [];

    const allSuggestions: CommandSuggestion[] = [
      ...Object.entries(COMMANDS).map(([key, cmd]) => ({
        command: cmd.prefix,
        description: cmd.description,
        fullCommand: cmd.examples[0],
      })),
      {
        command: 'zoom: standup',
        description: 'Extract from daily standup',
        fullCommand: 'zoom: Daily Standup | Updates discussed: ',
      },
      {
        command: 'zoom: planning',
        description: 'Extract from planning meeting',
        fullCommand: 'zoom: Sprint Planning | Tasks identified: ',
      },
      {
        command: 'slack: huddle',
        description: 'Extract from Slack huddle',
        fullCommand: 'slack: #team-huddle | Discussion points: ',
      },
      {
        command: 'slack: thread',
        description: 'Extract from thread',
        fullCommand: 'slack: #general | Thread summary: ',
      },
      {
        command: 'docs: readme',
        description: 'Extract from README',
        fullCommand: 'docs: md README.md | ',
      },
      {
        command: 'docs: spec',
        description: 'Extract from spec doc',
        fullCommand: 'docs: spec SPEC.md | ',
      },
    ];

    return allSuggestions.filter(s => s.command.toLowerCase().startsWith(text)).slice(0, 5);
  };

  const generateSymbolSuggestions = (text: string): SymbolSuggestion[] => {
    const lastWord = text.split(' ').pop() || '';
    const symbolKey = Object.keys(SYMBOL_SUGGESTIONS).find(key => lastWord.startsWith(key));

    if (!symbolKey) return [];

    const suggestions = SYMBOL_SUGGESTIONS[symbolKey];
    const searchText = lastWord.slice(symbolKey.length);

    return suggestions
      .filter(s => s.value.toLowerCase().startsWith(searchText.toLowerCase()))
      .slice(0, 5);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (symbolSuggestions.length > 0) {
      if (e.key === 'Tab' || e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();

        if (e.key === 'Tab' || e.key === 'ArrowDown') {
          setSelectedSymbolSuggestion(prev => (prev < symbolSuggestions.length - 1 ? prev + 1 : 0));
        } else if (e.key === 'ArrowUp') {
          setSelectedSymbolSuggestion(prev => (prev > 0 ? prev - 1 : symbolSuggestions.length - 1));
        }
        return;
      }

      if (e.key === 'Enter' && selectedSymbolSuggestion !== -1) {
        e.preventDefault();
        const words = inputText.split(' ');
        const lastWord = words.pop() || '';
        const symbolKey =
          Object.keys(SYMBOL_SUGGESTIONS).find(key => lastWord.startsWith(key)) || '';
        const suggestion = symbolSuggestions[selectedSymbolSuggestion];
        words.push(suggestion.example);
        setInputText(words.join(' ') + ' ');
        setSymbolSuggestions([]);
        setSelectedSymbolSuggestion(-1);
        return;
      }
    }

    if (suggestions.length > 0) {
      if (e.key === 'Tab' || e.key === 'ArrowDown' || e.key === 'ArrowUp') {
        e.preventDefault();

        if (e.key === 'Tab' || e.key === 'ArrowDown') {
          setSelectedSuggestion(prev => (prev < suggestions.length - 1 ? prev + 1 : 0));
        } else if (e.key === 'ArrowUp') {
          setSelectedSuggestion(prev => (prev > 0 ? prev - 1 : suggestions.length - 1));
        }
        return;
      }

      if (e.key === 'Enter' && selectedSuggestion !== -1) {
        e.preventDefault();
        setInputText(suggestions[selectedSuggestion].fullCommand);
        setSuggestions([]);
        setSelectedSuggestion(-1);
        return;
      }
    }

    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();

      const command = inputText.trim();

      if (command.startsWith('help')) {
        const args = command.split(' ');
        showHelp(args[1]);
        setInputText('');
        return;
      }

      const task = parseCommandInput(command);
      if (task) {
        setExtractedTasks(prev => [...prev, task]);
        setInputText('');
        toast.success('Task created from command');
      } else if (command) {
        handleExtract();
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setInputText(value);
    onChange(value);

    // Check for symbol suggestions first
    const symbolSugs = generateSymbolSuggestions(value);
    if (symbolSugs.length > 0) {
      setSymbolSuggestions(symbolSugs);
      setSelectedSymbolSuggestion(-1);
      setSuggestions([]); // Clear command suggestions
      return;
    }

    // Fall back to command suggestions
    const cmdSugs = generateSuggestions(value);
    setSuggestions(cmdSugs);
    setSelectedSymbolSuggestion(-1);
    setSymbolSuggestions([]);
  };

  const handleStartEdit = (taskId: string, field: keyof Task, value: string) => {
    setEditingField({ taskId, field, value });
  };

  const handleSaveEdit = async (taskId: string) => {
    if (!editingField) return;

    try {
      setLoadingActions(prev => [...prev, { taskId, type: 'edit' }]);
      await new Promise(resolve => setTimeout(resolve, 500));

      setExtractedTasks(prev =>
        prev.map(task =>
          task.id === taskId ? { ...task, [editingField.field]: editingField.value } : task
        )
      );

      setEditingField(null);
      toast.success('Task updated');
    } finally {
      setLoadingActions(prev =>
        prev.filter(action => !(action.taskId === taskId && action.type === 'edit'))
      );
    }
  };

  const generateCIJobTemplate = (platform: string, action: string): string => {
    switch (action) {
      case 'coverage':
        return `run_tests:
  stage: test
  script:
    - xcodebuild test -enableCodeCoverage YES
  artifacts:
    reports:
      coverage_report:
        coverage_format: cobertura
        path: coverage.xml`;
      case 'beta':
        return `deploy_testflight:
  stage: deploy
  script:
    - fastlane beta
  rules:
    - if: $CI_COMMIT_TAG =~ /^v\\d+\\.\\d+\\.\\d+$/`;
      default:
        return '';
    }
  };

  const generateGitLabConfig = (command: string, stage: string): string => {
    return `${stage}:
  script:
    - ${command}`;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const newAttachments = files.map(file => ({
      id: `file-${Date.now()}-${file.name}`,
      name: file.name,
      type: file.type,
      size: file.size,
      url: URL.createObjectURL(file),
    }));
    setAttachments(prev => [...prev, ...newAttachments]);

    // Add file references to input
    const fileRefs = newAttachments.map(a => `&${a.name}`).join(' ');
    setInputText(prev => `${prev} ${fileRefs}`);
  };

  const handleSubscribe = async (planId: string) => {
    try {
      // Redirect to Stripe checkout
      const response = await fetch('/api/create-checkout-session', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ planId }),
      });

      const { url } = await response.json();
      window.location.href = url;
    } catch (error) {
      toast.error('Failed to start subscription process');
      logger.error('Subscription error:', error);
    }
  };

  return (
    <>
      <div className="min-h-screen bg-gray-50 p-8">
        <Toaster position="top-right" expand={false} richColors />

        <div className="max-w-6xl mx-auto space-y-8">
          <div className="text-center space-y-4">
            <h1 className="text-4xl font-bold text-gray-900">AI Task Extraction</h1>
            <p className="text-lg text-gray-600">
              Transform your emails, notes, and documents into actionable tasks
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Card className="p-6 bg-gray-900 shadow-lg border border-gray-700">
              <div className="space-y-6">
                <div className="relative">
                  <div className="flex items-center text-gray-400 text-sm mb-2">
                    <span className="text-green-400 mr-2">$</span>
                    <span className="font-mono">user@machine:</span>
                    <span className="text-blue-400 ml-1">~/tasks</span>
                    <span className="ml-1">%</span>
                  </div>
                  <div className="relative">
                    <textarea
                      value={inputText}
                      onChange={handleInputChange}
                      onKeyDown={handleKeyDown}
                      className="w-full h-40 p-4 bg-gray-800 text-gray-100 border border-gray-700 rounded-lg 
                        focus:ring-2 focus:ring-green-500 focus:border-transparent resize-none font-mono 
                        placeholder-gray-500"
                      placeholder="Type a command (help to see all commands) or paste text to extract tasks..."
                      disabled={isProcessing}
                    />
                    {suggestions.length > 0 && (
                      <div className="absolute bottom-full left-0 w-full mb-1 bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
                        {suggestions.map((suggestion, index) => (
                          <div
                            key={suggestion.command}
                            className={`flex items-center px-4 py-2 cursor-pointer ${
                              index === selectedSuggestion
                                ? 'bg-gray-700 text-gray-100'
                                : 'text-gray-400 hover:bg-gray-700'
                            }`}
                            onClick={() => {
                              setInputText(suggestion.fullCommand);
                              setSuggestions([]);
                              setSelectedSuggestion(-1);
                            }}
                          >
                            <ChevronRight
                              className={`w-4 h-4 mr-2 ${
                                index === selectedSuggestion ? 'text-green-400' : 'text-gray-500'
                              }`}
                            />
                            <div className="flex-1">
                              <div className="font-mono text-sm">{suggestion.command}</div>
                              <div className="text-xs text-gray-500">{suggestion.description}</div>
                            </div>
                            <div className="text-xs text-gray-600">Tab to complete</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {inputText && (
                    <button
                      className="absolute top-2 right-2 p-1 bg-gray-700 rounded-full 
                        hover:bg-gray-600 text-gray-400 hover:text-gray-300"
                      onClick={() => setInputText('')}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <div className="flex items-center space-x-3 text-sm">
                  <button
                    onClick={() => setShowCommands(!showCommands)}
                    className="flex items-center space-x-2 text-gray-400 hover:text-gray-200"
                  >
                    {showCommands ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                    <span>Show Commands</span>
                  </button>
                  <div className="flex-1 flex items-center space-x-2 overflow-x-auto">
                    <button
                      onClick={() => setInputText('zoom: ')}
                      className="px-2 py-1 bg-gray-800 rounded text-blue-400 hover:bg-gray-700"
                    >
                      zoom:
                    </button>
                    <button
                      onClick={() => setInputText('slack: ')}
                      className="px-2 py-1 bg-gray-800 rounded text-purple-400 hover:bg-gray-700"
                    >
                      slack:
                    </button>
                    <button
                      onClick={() => setInputText('docs: ')}
                      className="px-2 py-1 bg-gray-800 rounded text-green-400 hover:bg-gray-700"
                    >
                      docs:
                    </button>
                    <button
                      onClick={() => setInputText('help')}
                      className="px-2 py-1 bg-gray-800 rounded text-gray-400 hover:bg-gray-700"
                    >
                      help
                    </button>
                  </div>
                </div>

                <AnimatePresence>
                  {showCommands && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="space-y-4 pt-4 border-t border-gray-700">
                        <div className="text-sm text-gray-400">Available Commands:</div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                          {Object.entries(COMMANDS).map(([key, cmd]) => (
                            <div
                              key={key}
                              className="p-2 bg-gray-800 rounded-lg border border-gray-700"
                            >
                              <div className="font-mono text-green-400">{cmd.prefix}</div>
                              <div className="text-gray-300 text-xs">{cmd.description}</div>
                              <div className="mt-1 text-gray-500 font-mono text-xs truncate">
                                $ {cmd.examples[0]}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="flex items-center space-x-2 mb-2">
                  <label className="relative cursor-pointer">
                    <input type="file" className="hidden" multiple onChange={handleFileSelect} />
                    <div className="p-2 bg-gray-800 rounded text-gray-400 hover:bg-gray-700 hover:text-gray-300">
                      <FileText className="w-4 h-4" />
                    </div>
                  </label>
                  {attachments.length > 0 && (
                    <div className="flex -space-x-2">
                      {attachments.map(file => (
                        <div
                          key={file.id}
                          className="px-2 py-1 bg-gray-800 rounded-full text-xs text-gray-300 flex items-center"
                        >
                          <span className="truncate max-w-[100px]">{file.name}</span>
                          <button
                            onClick={() => {
                              setAttachments(prev => prev.filter(a => a.id !== file.id));
                              setInputText(prev => prev.replace(`&${file.name}`, ''));
                            }}
                            className="ml-1 text-gray-500 hover:text-gray-300"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="text-xs text-gray-500 mt-2">
                  <div className="font-medium mb-1">Command Symbols:</div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                    <div>@user - Assign task</div>
                    <div>#tag - Add label</div>
                    <div>$4h - Time estimate</div>
                    <div>!high - Set priority</div>
                    <div>^TASK-123 - Add dependency</div>
                    <div>=tomorrow - Set due date</div>
                    <div>@{'>'}team - Forward task</div>
                    <div>&file.pdf - Attach file</div>
                  </div>
                </div>

                <Button
                  onClick={handleExtract}
                  disabled={!inputText.trim() || isProcessing}
                  className="w-full flex items-center justify-center space-x-2 bg-green-600 
                    hover:bg-green-700 text-white p-4 rounded-lg font-mono"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <Terminal className="w-5 h-5" />
                      <span>Execute Command</span>
                    </>
                  )}
                </Button>
              </div>
            </Card>

            <Card className="p-6 bg-white shadow-lg">
              <div className="space-y-6">
                <div className="flex items-center space-x-2">
                  <ClipboardList className="w-5 h-5 text-gray-600" />
                  <h2 className="text-lg font-medium text-gray-900">Task Dashboard</h2>
                </div>

                {extractedTasks.length === 0 ? (
                  <div className="text-center py-12 text-gray-500">
                    <p className="text-lg mb-2">No tasks extracted yet</p>
                    <p className="text-sm">
                      Paste some text and click &quot;Extract Tasks&quot; to begin
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {extractedTasks.map(task => (
                      <motion.div
                        key={task.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className={`p-4 bg-gray-50 rounded-lg border border-gray-200 transition-colors ${
                          task.completed ? 'bg-gray-100' : ''
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-3 flex-1">
                            <button
                              onClick={() => handleTaskComplete(task.id)}
                              disabled={isActionLoading(task.id, 'complete')}
                              className={`p-1 rounded-full transition-colors ${
                                isActionLoading(task.id, 'complete')
                                  ? 'bg-gray-100'
                                  : task.completed
                                    ? 'text-green-500 bg-green-50 hover:bg-green-100'
                                    : 'text-gray-400 hover:text-green-500 hover:bg-green-50'
                              }`}
                            >
                              {isActionLoading(task.id, 'complete') ? (
                                <RefreshCw className="w-5 h-5 animate-spin text-gray-400" />
                              ) : (
                                <CheckCircle2 className="w-5 h-5" />
                              )}
                            </button>
                            <div className="flex-1">
                              {editingField?.taskId === task.id &&
                              editingField.field === 'title' ? (
                                <input
                                  type="text"
                                  value={editingField.value}
                                  onChange={e =>
                                    setEditingField({ ...editingField, value: e.target.value })
                                  }
                                  onBlur={() => handleSaveEdit(task.id)}
                                  onKeyDown={e => e.key === 'Enter' && handleSaveEdit(task.id)}
                                  className="w-full bg-white px-2 py-1 rounded border border-gray-300 
                                    focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  autoFocus
                                />
                              ) : (
                                <div className="flex items-center group">
                                  <h3
                                    className={`font-medium text-gray-900 ${
                                      task.completed ? 'line-through text-gray-500' : ''
                                    }`}
                                  >
                                    {task.title}
                                  </h3>
                                  <button
                                    onClick={() => handleStartEdit(task.id, 'title', task.title)}
                                    className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <Edit2 className="w-4 h-4 text-gray-400 hover:text-gray-600" />
                                  </button>
                                </div>
                              )}

                              {editingField?.taskId === task.id &&
                              editingField.field === 'description' ? (
                                <textarea
                                  value={editingField.value}
                                  onChange={e =>
                                    setEditingField({ ...editingField, value: e.target.value })
                                  }
                                  onBlur={() => handleSaveEdit(task.id)}
                                  className="w-full mt-1 bg-white px-2 py-1 rounded border border-gray-300 
                                    focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                  rows={2}
                                  autoFocus
                                />
                              ) : (
                                <div className="flex items-start group">
                                  <p
                                    className={`text-sm ${
                                      task.completed
                                        ? 'text-gray-400 line-through'
                                        : 'text-gray-600'
                                    }`}
                                  >
                                    {task.description}
                                  </p>
                                  <button
                                    onClick={() =>
                                      handleStartEdit(task.id, 'description', task.description)
                                    }
                                    className="ml-2 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                                  >
                                    <Edit2 className="w-3 h-3 text-gray-400 hover:text-gray-600" />
                                  </button>
                                </div>
                              )}

                              {aiConfidence[task.id] && (
                                <div className="flex items-center mt-1 text-xs text-gray-500">
                                  <AlertCircle
                                    className={`w-3 h-3 mr-1 ${
                                      aiConfidence[task.id] > 0.8
                                        ? 'text-green-500'
                                        : 'text-yellow-500'
                                    }`}
                                  />
                                  <span>
                                    AI Confidence: {Math.round(aiConfidence[task.id] * 100)}%
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleServiceAction(task.id, 'schedule')}
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
                                <Calendar className="w-4 h-4" />
                              )}
                            </button>
                            <button
                              onClick={() => handleServiceAction(task.id, 'share')}
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
                        </div>
                        <div className="mt-2 flex items-center space-x-2 ml-9">
                          <select
                            value={task.priority}
                            onChange={e => {
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
                        {task.commands && task.commands.length > 0 && (
                          <div className="mt-3 space-y-2 bg-gray-900 rounded-lg p-3 font-mono text-sm">
                            <div className="flex items-center space-x-2 text-gray-400 mb-2">
                              <Terminal className="w-4 h-4" />
                              <span>Terminal Commands</span>
                            </div>
                            {task.commands.map((cmd, index) => (
                              <div
                                key={index}
                                className="flex items-center justify-between space-x-2 text-gray-200"
                              >
                                <div className="flex-1">
                                  <div className="flex items-center space-x-2">
                                    <span className="text-green-400">$</span>
                                    <code>{cmd.command}</code>
                                  </div>
                                  {cmd.description && (
                                    <p className="text-xs text-gray-500 mt-1">{cmd.description}</p>
                                  )}
                                </div>
                                <button
                                  onClick={() => handleCopyCommand(cmd.command)}
                                  className="p-1 hover:text-blue-400 transition-colors"
                                  title="Copy command"
                                >
                                  {copiedCommands.includes(cmd.command) ? (
                                    <CheckCheck className="w-4 h-4 text-green-400" />
                                  ) : (
                                    <Copy className="w-4 h-4" />
                                  )}
                                </button>
                              </div>
                            ))}
                          </div>
                        )}
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
                        {task.type === 'file' && task.extractedTasks && (
                          <div className="mt-3 space-y-2 bg-gray-50 rounded-lg p-3">
                            <div className="flex items-center space-x-2 text-gray-600">
                              <FileText className="w-4 h-4" />
                              <span>Extracted Items</span>
                            </div>
                            <div className="space-y-1">
                              {task.extractedTasks.map((item, index) => (
                                <div key={index} className="text-sm text-gray-700">
                                  • {item}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        {task.type === 'ci' && (task as CITask).ciConfig && (
                          <div className="mt-3 space-y-2 bg-gray-900 rounded-lg p-3 font-mono text-sm">
                            <div className="flex items-center space-x-2 text-gray-400 mb-2">
                              <GitBranch className="w-4 h-4" />
                              <span>CI Configuration Changes</span>
                            </div>
                            {(task as CITask).ciConfig.changes.map((change, index) => (
                              <div key={index} className="space-y-1">
                                <div className="text-blue-400">{`// ${change.description}`}</div>
                                <pre className="text-gray-200 bg-gray-800 p-2 rounded">
                                  {change.content}
                                </pre>
                              </div>
                            ))}
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>

      {isStripeConfigured() && (
        <SubscriptionModal
          isOpen={showSubscription}
          onClose={() => setShowSubscription(false)}
          onSubscribe={handleSubscribe}
        />
      )}
    </>
  );
};
