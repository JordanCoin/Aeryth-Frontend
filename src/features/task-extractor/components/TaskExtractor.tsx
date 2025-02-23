import React, { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';

interface TaskExtractorProps {
  onChange: (value: string) => void;
  onSubmit: () => void;
}

export const TaskExtractor: React.FC<TaskExtractorProps> = ({ onChange, onSubmit }) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleExtract = useCallback(() => {
    setIsProcessing(true);
    onSubmit();
    setTimeout(() => setIsProcessing(false), 2000);
  }, [onSubmit]);

  const editor = useEditor({
    extensions: [StarterKit],
    editorProps: {
      attributes: {
        class: 'prose dark:prose-invert max-w-none min-h-[200px] focus:outline-none',
      },
    },
    onUpdate: ({ editor }) => {
      onChange(editor.getText());
      if (editor.isEmpty) setIsProcessing(false);
    },
  });

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 text-center"
      >
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-500 bg-clip-text text-transparent">
          Extract Tasks Intelligently
        </h1>
        <p className="text-gray-600 dark:text-gray-300 mt-2">
          Paste your notes, emails, or documents. We will identify your tasks.
        </p>
      </motion.div>

      {/* Main Editor */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 relative">
        <EditorContent editor={editor} />

        {/* Floating Action Button */}
        <motion.button
          onClick={handleExtract}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="absolute bottom-6 right-6 bg-blue-600 text-white px-6 py-3 rounded-full
                     shadow-lg flex items-center space-x-2 hover:bg-blue-700 transition-colors"
        >
          <span>Extract Tasks</span>
          {isProcessing && (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
            />
          )}
        </motion.button>
      </div>

      {/* Results Section */}
      <AnimatePresence>{/* Task results would render here */}</AnimatePresence>
    </div>
  );
};
