import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store';
import { Toaster } from 'react-hot-toast';
import { TaskNav } from '@/components/TaskNav';
import { TaskDetail } from '@/features/task-radar/components/TaskDetail';
import { TaskRadar } from '@/features/task-radar/components/TaskRadar';
import { TaskCLI } from '@/features/task-cli/components/TaskCLI';
import { TaskManagement } from '@/features/task-management/components/TaskManagement';

function App() {
  return (
    <Provider store={store}>
      <Router>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          <Routes>
            <Route path="/" element={<TaskManagement />} />
            <Route path="/tasks" element={<TaskManagement />} />
            <Route path="/radar" element={<TaskRadar />} />
            <Route path="/radar/task/:taskId" element={<TaskDetail />} />
            <Route path="/cli" element={<TaskCLI />} />
          </Routes>
          <TaskNav />
          <Toaster position="top-right" />
        </div>
      </Router>
    </Provider>
  );
}

export default App;
