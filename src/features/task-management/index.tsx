import React from 'react';
import { TaskList } from './TaskList';

const TaskManagement = () => {
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Task Management</h1>
      <TaskList tasks={[]} groupBy="status" sortBy="priority" />
    </div>
  );
};

export default TaskManagement;
