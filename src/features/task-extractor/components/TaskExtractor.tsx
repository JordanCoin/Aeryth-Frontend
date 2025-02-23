import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Sparkles, ClipboardList, X, Check, BookOpen } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle } from '@/components/ui/alert';

interface Task {
  id: number;
  text: string;
  completed: boolean;
}

interface Story {
  id: number;
  timestamp: string;
  title: string;
  narrative: string;
  originalText: string;
  tasks: string[];
  tags: string[];
}

interface Analysis {
  summary: string;
  breakdown: string[];
  categories: Record<string, number>;
}

interface TaskExtractorProps {
  onChange: (value: string) => void;
  onSubmit: () => void;
}

export const TaskExtractor: React.FC<TaskExtractorProps> = ({ onChange, onSubmit }) => {
  const [inputText, setInputText] = useState('');
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [stories, setStories] = useState<Story[]>([]);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);

  const handleExtract = useCallback(() => {
    setIsProcessing(true);
    onSubmit();
    // Simulate API call until backend is ready
    setTimeout(() => {
      const newAnalysis = {
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

      const newTasks = [
        { id: 1, text: 'Schedule team meeting for project review', completed: false },
        { id: 2, text: 'Update client presentation by Friday', completed: false },
        { id: 3, text: 'Follow up with vendor regarding delivery', completed: false },
      ];

      setTasks(newTasks);
      setAnalysis(newAnalysis);
      setIsProcessing(false);
      setShowSuccess(true);
    }, 1500);
  }, [onSubmit]);

  const toggleTaskCompletion = (taskId: number) => {
    setTasks(
      tasks.map(task => (task.id === taskId ? { ...task, completed: !task.completed } : task))
    );
  };

  const removeTask = (taskId: number) => {
    setTasks(tasks.filter(task => task.id !== taskId));
    if (tasks.length <= 1) {
      setShowSuccess(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-4"
        >
          <h1 className="text-4xl font-bold text-gray-900">AI-Powered Task Extraction</h1>
          <p className="text-lg text-gray-600">Transform your text into actionable tasks</p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Input Card */}
          <div className="lg:col-span-4">
            <Card className="p-6 bg-white shadow-lg">
              <div className="space-y-6">
                <div className="flex items-center space-x-2 mb-4">
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
                  onClick={handleExtract}
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
                <div className="flex items-center space-x-2 mb-4">
                  <ClipboardList className="w-5 h-5 text-gray-600" />
                  <h2 className="text-lg font-medium text-gray-900">Analysis & Tasks</h2>
                </div>

                {!analysis && !showSuccess && (
                  <div className="text-center text-gray-500 py-8">
                    Extract tasks to see the analysis here
                  </div>
                )}

                {analysis && (
                  <div className="space-y-4">
                    <div className="bg-blue-50 rounded-lg p-4">
                      <h3 className="font-medium text-blue-900 mb-2">Content Analysis</h3>
                      <p className="text-blue-800 text-sm mb-3">{analysis.summary}</p>
                      <div className="space-y-2">
                        {analysis.breakdown.map((point, index) => (
                          <div key={index} className="flex items-center text-sm text-blue-700">
                            <span className="mr-2">•</span>
                            {point}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {showSuccess && tasks.length > 0 && (
                  <div className="space-y-4">
                    <Alert className="bg-green-50 border-green-200">
                      <AlertTitle className="text-green-800">
                        {tasks.length} Tasks Extracted
                      </AlertTitle>
                    </Alert>

                    <AnimatePresence>
                      {tasks.map(task => (
                        <motion.div
                          key={task.id}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -100 }}
                          className={`flex items-center justify-between p-3 bg-gray-50 rounded-md transition-all duration-200 ${
                            task.completed ? 'bg-gray-100' : ''
                          }`}
                        >
                          <div className="flex items-center space-x-3 flex-grow">
                            <button
                              onClick={() => toggleTaskCompletion(task.id)}
                              className={`w-6 h-6 rounded-full flex items-center justify-center border transition-colors duration-200 ${
                                task.completed
                                  ? 'bg-green-500 border-green-500'
                                  : 'border-gray-300 hover:border-blue-500'
                              }`}
                            >
                              {task.completed && <Check className="w-4 h-4 text-white" />}
                            </button>
                            <p
                              className={`text-gray-800 ${task.completed ? 'line-through text-gray-500' : ''}`}
                            >
                              {task.text}
                            </p>
                          </div>
                          <button
                            onClick={() => removeTask(task.id)}
                            className="ml-2 p-1 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};
