import React from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  GitBranch,
  GitPullRequest,
  GitMerge,
  Check,
  X,
  Loader,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Task } from '@/types/task.types';

interface TaskStateProps {
  task: Task;
  onPause?: () => void;
  onResume?: () => void;
  onReset?: () => void;
}

type GitState = {
  branch?: string;
  pr?: string;
  status: 'creating' | 'updating' | 'merging' | 'success' | 'failed';
  progress: number;
  message?: string;
};

export const TaskState: React.FC<TaskStateProps> = ({ task, onPause, onResume, onReset }) => {
  const [gitState, setGitState] = React.useState<GitState>({
    status: 'creating',
    progress: 0,
  });

  const statusMessages = {
    creating: 'Creating Git branch...',
    updating: 'Updating project files...',
    merging: 'Merging changes...',
    success: 'Changes successfully merged',
    failed: 'Failed to complete operation',
  };

  const handleGitOperation = async () => {
    try {
      // Simulate Git operations
      setGitState({ status: 'creating', progress: 0 });
      await simulateProgress();

      setGitState(prev => ({
        ...prev,
        status: 'updating',
        branch: `task/${task.id}`,
        progress: 33,
      }));
      await simulateProgress();

      setGitState(prev => ({
        ...prev,
        status: 'merging',
        pr: `PR #${Math.floor(Math.random() * 1000)}`,
        progress: 66,
      }));
      await simulateProgress();

      setGitState(prev => ({
        ...prev,
        status: 'success',
        progress: 100,
      }));
    } catch (error) {
      setGitState(prev => ({
        ...prev,
        status: 'failed',
        message: error instanceof Error ? error.message : 'Operation failed',
      }));
    }
  };

  const simulateProgress = () => new Promise(resolve => setTimeout(resolve, 1500));

  return (
    <div className="bg-gray-900 rounded-lg p-6 space-y-4">
      {/* Task Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-100">Task Progress</h3>
        <div className="flex gap-2">
          {task.status === 'in_progress' ? (
            <Button
              size="sm"
              variant="ghost"
              onClick={onPause}
              className="text-yellow-400 hover:text-yellow-300"
            >
              <Pause className="w-4 h-4" />
            </Button>
          ) : (
            <Button
              size="sm"
              variant="ghost"
              onClick={onResume}
              className="text-green-400 hover:text-green-300"
            >
              <Play className="w-4 h-4" />
            </Button>
          )}
          <Button
            size="sm"
            variant="ghost"
            onClick={onReset}
            className="text-blue-400 hover:text-blue-300"
          >
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Git Status with Progress */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            {gitState.status === 'success' ? (
              <Check className="w-4 h-4 text-green-400" />
            ) : gitState.status === 'failed' ? (
              <X className="w-4 h-4 text-red-400" />
            ) : (
              <Loader className="w-4 h-4 text-blue-400 animate-spin" />
            )}
            <span className="text-gray-300">{statusMessages[gitState.status]}</span>
          </div>
          <span className="text-gray-500">{gitState.progress}%</span>
        </div>

        <Progress
          value={gitState.progress}
          className="h-1"
          style={{
            '--progress-color': gitState.status === 'failed'
              ? 'rgb(239 68 68)' // red-500
              : gitState.status === 'success'
                ? 'rgb(34 197 94)' // green-500
                : 'rgb(59 130 246)', // blue-500
          } as React.CSSProperties}
        />

        {/* Git Details */}
        <div className="grid grid-cols-2 gap-4 pt-2">
          {gitState.branch && (
            <div className="flex items-center gap-2 text-sm">
              <GitBranch className="w-4 h-4 text-purple-400" />
              <span className="text-gray-300">{gitState.branch}</span>
            </div>
          )}
          {gitState.pr && (
            <div className="flex items-center gap-2 text-sm">
              <GitPullRequest className="w-4 h-4 text-orange-400" />
              <span className="text-gray-300">{gitState.pr}</span>
            </div>
          )}
        </div>

        {gitState.message && <div className="text-sm text-red-400 mt-2">{gitState.message}</div>}
      </div>

      {/* Action Buttons */}
      <div className="flex justify-end gap-2 pt-4">
        <Button
          size="sm"
          variant="outline"
          onClick={handleGitOperation}
          disabled={gitState.status === 'creating' || gitState.status === 'updating'}
          className="text-gray-300"
        >
          {gitState.status === 'success' ? 'Create New Branch' : 'Start Git Process'}
        </Button>
      </div>
    </div>
  );
};
