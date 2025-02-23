import React, { useState, useEffect, useCallback } from 'react';
import Button from '../../../components/shared/Button';
import { logger } from '../../../utils/logger';

interface TextInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  isLoading?: boolean;
  maxLength?: number;
  minLength?: number;
  autoSave?: boolean;
}

export const TextInput: React.FC<TextInputProps> = ({
  value,
  onChange,
  onSubmit,
  isLoading = false,
  maxLength = 5000,
  minLength = 10,
  autoSave = true,
}) => {
  const [error, setError] = useState('');
  const [charCount, setCharCount] = useState(0);
  const [isSaved, setIsSaved] = useState(true);

  // Auto-save to localStorage
  useEffect(() => {
    if (autoSave && value.trim()) {
      localStorage.setItem('draft-text', value);
      setIsSaved(true);
      logger.info('Auto-saved text input');
    }
  }, [value, autoSave]);

  // Load saved draft
  useEffect(() => {
    const savedDraft = localStorage.getItem('draft-text');
    if (autoSave && savedDraft && !value) {
      onChange(savedDraft);
      logger.info('Loaded saved draft');
    }
  }, [autoSave, onChange, value]);

  // Character count update
  useEffect(() => {
    setCharCount(value.length);
  }, [value]);

  const validateInput = useCallback(
    (text: string) => {
      if (text.length > maxLength) {
        setError(`Text is too long (maximum ${maxLength} characters)`);
        return false;
      }
      if (text.trim().length < minLength && text.trim().length > 0) {
        setError(`Text is too short (minimum ${minLength} characters)`);
        return false;
      }
      setError('');
      return true;
    },
    [maxLength, minLength]
  );

  const handleSubmit = () => {
    if (validateInput(value)) {
      logger.info('Submitting text input', { length: value.length });
      onSubmit();
      localStorage.removeItem('draft-text');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      handleSubmit();
    }
  };

  const clearDraft = () => {
    localStorage.removeItem('draft-text');
    onChange('');
    setIsSaved(true);
    logger.info('Cleared draft');
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <textarea
          value={value}
          onChange={e => {
            onChange(e.target.value);
            validateInput(e.target.value);
            setIsSaved(false);
          }}
          onKeyDown={handleKeyDown}
          placeholder="Describe your tasks here..."
          className={`w-full min-h-[200px] p-4 rounded-lg border 
            ${error ? 'border-red-500' : 'border-gray-200 dark:border-gray-700'}
            dark:bg-gray-900 dark:text-gray-100
            focus:ring-2 focus:ring-indigo-500 focus:border-transparent`}
        />
        <div className="absolute bottom-2 right-2 text-sm text-gray-500 dark:text-gray-400">
          {charCount}/{maxLength}
        </div>
      </div>

      {error && (
        <div className="text-red-500 dark:text-red-400 text-sm" data-testid="error-message">
          {error}
        </div>
      )}

      <div className="flex justify-between items-center">
        <div className="flex gap-2">
          <Button onClick={clearDraft} variant="secondary" disabled={!value.trim()}>
            Clear
          </Button>
          {!isSaved && <span className="text-gray-500">•</span>}
        </div>
        <Button
          onClick={handleSubmit}
          disabled={isLoading || !value.trim() || !!error}
          isLoading={isLoading}
        >
          Extract Tasks
        </Button>
      </div>
    </div>
  );
};
