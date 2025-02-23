import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import {
  Terminal,
  Copy,
  CheckCheck,
  Download,
  Command,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { logger } from '@/utils/logger';

const INSTALLATION_STEPS = [
  {
    id: 'npm',
    name: 'NPM Installation',
    command: 'npm install -g @task-cli/extractor',
    description: 'Install the task extractor CLI globally',
  },
  {
    id: 'yarn',
    name: 'Yarn Installation',
    command: 'yarn global add @task-cli/extractor',
    description: 'Alternative installation using Yarn',
  },
  {
    id: 'config',
    name: 'Configuration',
    command: 'task-ext config --init',
    description: 'Initialize configuration file',
  },
];

const USAGE_EXAMPLES = [
  {
    id: 'extract',
    name: 'Extract Tasks',
    command: 'task-ext extract "Meeting notes about API integration"',
    description: 'Extract tasks from text input',
    output: `📋 Extracted 2 tasks:
1. Implement API authentication
2. Update documentation with new endpoints`,
  },
  {
    id: 'git',
    name: 'Git Integration',
    command: 'task-ext git --branch feature/auth',
    description: 'Extract tasks from git branch',
    output: `🔍 Analyzing branch changes...
Found 3 tasks in modified files:
- Add OAuth2 flow
- Implement token refresh
- Add error handling`,
  },
  {
    id: 'watch',
    name: 'Watch Mode',
    command: 'task-ext watch ./docs',
    description: 'Watch directory for task updates',
    output: `👀 Watching ./docs for changes...
[12:45:23] Found new task in README.md
[12:46:01] Updated task status in CHANGELOG.md`,
  },
];

export const TaskCLI: React.FC = () => {
  const [copiedCommands, setCopiedCommands] = useState<string[]>([]);
  const [activeExample, setActiveExample] = useState<string | null>(null);

  const handleCopy = async (command: string) => {
    try {
      await navigator.clipboard.writeText(command);
      setCopiedCommands(prev => [...prev, command]);
      toast.success('Command copied to clipboard');

      setTimeout(() => {
        setCopiedCommands(prev => prev.filter(cmd => cmd !== command));
      }, 2000);
    } catch (error) {
      toast.error('Failed to copy command');
      logger.error('Copy command failed', { command, error });
    }
  };

  const handleDownload = () => {
    // Implement CLI download logic
    toast.info('Downloading CLI package...');
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">
            Task Extractor CLI
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Extract and manage tasks directly from your terminal
          </p>
          <div className="flex justify-center gap-4">
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg
                hover:bg-blue-600 transition-colors"
            >
              <Download className="w-5 h-5" />
              Download CLI
            </button>
            <a
              href="https://github.com/your-repo/task-extractor"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg
                hover:bg-gray-700 transition-colors"
            >
              View on GitHub
              <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* Installation */}
        <Card className="p-6 bg-white dark:bg-gray-800">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Terminal className="w-5 h-5" />
              Installation
            </h2>
            <div className="space-y-4">
              {INSTALLATION_STEPS.map(step => (
                <div key={step.id} className="space-y-2">
                  <div className="text-sm text-gray-600 dark:text-gray-400">{step.description}</div>
                  <div className="bg-gray-900 rounded-lg p-3 font-mono text-sm group relative">
                    <div className="flex items-center gap-2 text-green-400">
                      <ChevronRight className="w-4 h-4" />
                      <code>{step.command}</code>
                    </div>
                    <button
                      onClick={() => handleCopy(step.command)}
                      className="absolute right-3 top-3 opacity-0 group-hover:opacity-100
                        transition-opacity"
                    >
                      {copiedCommands.includes(step.command) ? (
                        <CheckCheck className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4 text-gray-400 hover:text-white" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Usage Examples */}
        <Card className="p-6 bg-white dark:bg-gray-800">
          <div className="space-y-4">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Command className="w-5 h-5" />
              Usage Examples
            </h2>
            <div className="space-y-6">
              {USAGE_EXAMPLES.map(example => (
                <div key={example.id} className="space-y-2">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    {example.description}
                  </div>
                  <div
                    className="bg-gray-900 rounded-lg p-3 font-mono text-sm cursor-pointer
                      hover:ring-2 hover:ring-blue-500 transition-all"
                    onClick={() =>
                      setActiveExample(activeExample === example.id ? null : example.id)
                    }
                  >
                    <div className="flex items-center gap-2 text-green-400">
                      <ChevronRight className="w-4 h-4" />
                      <code>{example.command}</code>
                    </div>
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{
                        height: activeExample === example.id ? 'auto' : 0,
                        opacity: activeExample === example.id ? 1 : 0,
                      }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="mt-3 pt-3 border-t border-gray-700 text-gray-300 whitespace-pre">
                        {example.output}
                      </div>
                    </motion.div>
                    <button
                      onClick={e => {
                        e.stopPropagation();
                        handleCopy(example.command);
                      }}
                      className="absolute right-3 top-3 opacity-0 group-hover:opacity-100
                        transition-opacity"
                    >
                      {copiedCommands.includes(example.command) ? (
                        <CheckCheck className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4 text-gray-400 hover:text-white" />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};
