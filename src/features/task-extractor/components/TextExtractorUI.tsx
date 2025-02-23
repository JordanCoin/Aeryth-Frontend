import React, { useState } from 'react';
import { Sparkles, ClipboardList, X, Check, BookOpen, Search } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

const TaskExtractorUI = () => {
  const [inputText, setInputText] = useState('');
  const [tasks, setTasks] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [stories, setStories] = useState([]);
  const [analysis, setAnalysis] = useState(null);

  const handleExtract = () => {
    setIsProcessing(true);
    setTimeout(() => {
      const newAnalysis = {
        summary:
          "I've analyzed your input and identified several actionable items. The text appears to be primarily focused on project management and client communications.",
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

      const newStory = {
        id: Date.now(),
        timestamp: new Date().toLocaleString(),
        title: 'Project Management Updates',
        narrative:
          "During our morning review, several key actions emerged from the team discussion. The client presentation needs attention before the end of the week, and we're coordinating with vendors on delivery timelines. The team's input will be crucial for the next phase.",
        originalText: inputText,
        tasks: newTasks.map(t => t.text),
        tags: ['Project Review', 'Client Work', 'Team Coordination'],
      };

      setTasks(newTasks);
      setAnalysis(newAnalysis);
      setStories([newStory, ...stories]);
      setIsProcessing(false);
      setShowSuccess(true);
    }, 1500);
  };

  const toggleTaskCompletion = taskId => {
    setTasks(
      tasks.map(task => (task.id === taskId ? { ...task, completed: !task.completed } : task))
    );
  };

  const removeTask = taskId => {
    setTasks(tasks.filter(task => task.id !== taskId));
    if (tasks.length <= 1) {
      setShowSuccess(false);
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
                    onChange={e => setInputText(e.target.value)}
                  />
                </div>

                <div className="flex justify-center">
                  <Button
                    onClick={handleExtract}
                    disabled={!inputText || isProcessing}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg flex items-center space-x-2 w-full justify-center"
                  >
                    <Sparkles className="w-5 h-5" />
                    <span>{isProcessing ? 'Extracting...' : 'Extract Tasks'}</span>
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          {/* Analysis and Tasks Card */}
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

                {/* Analysis Section */}
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

                {/* Tasks Section */}
                {showSuccess && tasks.length > 0 && (
                  <div className="space-y-4">
                    <Alert className="bg-green-50 border-green-200">
                      <AlertTitle className="text-green-800">
                        {tasks.length} Tasks Extracted
                      </AlertTitle>
                    </Alert>

                    <div className="space-y-3">
                      {tasks.map(task => (
                        <div
                          key={task.id}
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
                              className={`text-gray-800 ${
                                task.completed ? 'line-through text-gray-500' : ''
                              }`}
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
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Card>
          </div>

          {/* Stories Card */}
          <div className="lg:col-span-4">
            <Card className="p-6 bg-white shadow-lg">
              <div className="space-y-4">
                <div className="flex items-center space-x-2 mb-4">
                  <BookOpen className="w-5 h-5 text-gray-600" />
                  <h2 className="text-lg font-medium text-gray-900">Task Stories</h2>
                </div>

                {stories.length === 0 && (
                  <div className="text-center text-gray-500 py-8">No stories yet</div>
                )}

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
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Related Tasks:</h4>
                        <ul className="space-y-1">
                          {story.tasks.map((task, index) => (
                            <li key={index} className="text-sm text-gray-600 flex items-start">
                              <span className="mr-2">•</span>
                              <span>{task}</span>
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
    </div>
  );
};

export default TaskExtractorUI;
