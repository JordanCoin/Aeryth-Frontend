import { ArrowPathIcon } from '@heroicons/react/24/outline';
import { useState, useEffect } from 'react';

interface TextInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
}

export default function TextInput({ value, onChange, onSubmit, isLoading }: TextInputProps) {
  const [error, setError] = useState('');

  useEffect(() => {
    validateInput(value);
  }, [value]);

  const validateInput = (text: string) => {
    if (text.length > 5000) {
      setError('Text is too long (maximum 5000 characters)');
      return false;
    }
    if (text.trim().length < 10 && text.trim().length > 0) {
      setError('Text is too short (minimum 10 characters)');
      return false;
    }
    setError('');
    return true;
  };

  const handleSubmit = () => {
    if (validateInput(value)) {
      onSubmit();
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 mb-8">
      <textarea
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder="Describe your tasks here..."
        className={`w-full h-40 p-4 mb-4 rounded-lg border 
                   ${error ? 'border-red-500 dark:border-red-700' : 'border-gray-200 dark:border-gray-700'}
                   dark:bg-gray-900 dark:text-gray-100
                   focus:ring-2 focus:ring-indigo-500 focus:border-transparent`}
      />
      {error && <div className="text-red-500 dark:text-red-400 text-sm mb-4">{error}</div>}
      <div className="flex justify-end">
        <button
          onClick={handleSubmit}
          disabled={isLoading || !value.trim()}
          className="inline-flex items-center px-4 py-2 rounded-md
                     bg-indigo-600 text-white font-medium
                     hover:bg-indigo-700 focus:outline-none focus:ring-2
                     focus:ring-offset-2 focus:ring-indigo-500
                     disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? <ArrowPathIcon className="animate-spin -ml-1 mr-2 h-5 w-5" /> : null}
          Extract Tasks
        </button>
      </div>
    </div>
  );
}
