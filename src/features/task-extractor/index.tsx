import React from 'react';
import { TaskExtractor } from './components/TaskExtractor';
import { logger } from '@/utils/logger';

// Wrap TaskExtractor with feature-level logic
const TaskExtractorWrapper: React.FC = () => {
  const handleChange = (value: string) => {
    logger.info('Text changed', { length: value.length });
  };

  const handleSubmit = () => {
    logger.info('Extracting tasks');
  };

  return <TaskExtractor onChange={handleChange} onSubmit={handleSubmit} />;
};

// Export the wrapped component as default
export default TaskExtractorWrapper;
