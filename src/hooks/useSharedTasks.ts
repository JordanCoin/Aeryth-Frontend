import { useState, useEffect } from 'react';
import { Task } from '@/types/task.types';
import { STORAGE_KEYS } from '@/constants/storage';
import { logger } from '@/utils/logger';

export const useSharedTasks = () => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTasks = () => {
      try {
        const storedTasks = localStorage.getItem(STORAGE_KEYS.TASKS);
        if (storedTasks) {
          setTasks(JSON.parse(storedTasks));
        }
      } catch (error) {
        logger.error('Failed to load shared tasks', { error });
      } finally {
        setLoading(false);
      }
    };

    loadTasks();

    // Listen for storage changes from other components
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEYS.TASKS && e.newValue) {
        setTasks(JSON.parse(e.newValue));
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  const updateTasks = (newTasks: Task[]) => {
    setTasks(newTasks);
    localStorage.setItem(STORAGE_KEYS.TASKS, JSON.stringify(newTasks));
  };

  const addTask = (task: Task) => {
    const newTasks = [...tasks, task];
    updateTasks(newTasks);
  };

  const updateTask = (updatedTask: Task) => {
    const newTasks = tasks.map(t => 
      t.id === updatedTask.id ? updatedTask : t
    );
    updateTasks(newTasks);
  };

  return {
    tasks,
    loading,
    addTask,
    updateTask,
    updateTasks,
  };
}; 