import { useState } from 'react';
import { useExtractTasksMutation } from '../../services/api';
import { ExtractedTask } from '../../types/task.types';
import TaskList from './components/TaskList';
import TextInput from './components/TextInput';
import toast from 'react-hot-toast';

export default function TaskExtractor() {
  const [text, setText] = useState('');
  const [extractTasks, { isLoading }] = useExtractTasksMutation();
  const [tasks, setTasks] = useState<ExtractedTask[]>([]);

  const handleExtract = async () => {
    try {
      const result = await extractTasks({ text }).unwrap();
      setTasks(result);
      toast.success('Tasks extracted successfully!');
    } catch (error) {
      toast.error('Failed to extract tasks');
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Task Extractor</h1>

      <TextInput value={text} onChange={setText} onSubmit={handleExtract} isLoading={isLoading} />

      <TaskList tasks={tasks} />
    </div>
  );
}
