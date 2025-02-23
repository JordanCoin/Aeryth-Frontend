import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import TaskManagement from '@/features/task-management';
import { TaskRadar } from '@/features/task-radar';
import { TaskCLI } from '@/features/task-cli/components/TaskCLI';

// Lazy load components for better performance
const TaskExtractorComponent = React.lazy(() => import('../features/task-extractor'));
const TaskManagementComponent = React.lazy(() => import('../features/task-management'));

// Loading component
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
  </div>
);

const AppRoutes = () => {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <Routes>
        {/* Home route */}
        <Route path="/" element={<Navigate to="/tasks" replace />} />

        {/* Main routes */}
        <Route path="/extract" element={<TaskRadar />} />
        <Route path="/tasks" element={<TaskManagement />} />
        <Route path="/cli" element={<TaskCLI />} />

        {/* Catch all route - redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
};

export default AppRoutes;
