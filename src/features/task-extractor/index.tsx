import React from 'react';
import { TaskExtractor } from './components/TaskExtractor';
import { logger } from '@/utils/logger';

const TaskExtractorFeature: React.FC = () => {
  const handleChange = (value: string) => {
    logger.info('Text changed', { length: value.length });
  };

  const handleSubmit = () => {
    logger.info('Extracting tasks');
  };

  return <TaskExtractor onChange={handleChange} onSubmit={handleSubmit} />;
};

export default TaskExtractorFeature;
