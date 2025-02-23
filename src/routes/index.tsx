import React from 'react';
import { Routes, Route } from 'react-router-dom';
import TaskExtractor from '../features/task-extractor';
import TaskManagement from '../features/task-management';

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<TaskExtractor />} />
      <Route path="/tasks" element={<TaskManagement />} />
    </Routes>
  );
};

export default AppRoutes;
