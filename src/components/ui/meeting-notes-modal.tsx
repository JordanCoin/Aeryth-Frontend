import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FileText, CheckCircle } from 'lucide-react';
import { ZoomMeeting } from '@/types/task.types';

interface MeetingNotesModalProps {
  isOpen: boolean;
  onClose: () => void;
  meeting: ZoomMeeting;
  onActionItemsExtract?: (items: string[]) => void;
}

export const MeetingNotesModal: React.FC<MeetingNotesModalProps> = ({
  isOpen,
  onClose,
  meeting,
  onActionItemsExtract,
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl overflow-hidden"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b dark:border-gray-700">
            <div className="flex items-center space-x-2">
              <FileText className="w-5 h-5 text-blue-500" />
              <h2 className="text-lg font-semibold">Meeting Notes</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Summary</h3>
              <p className="text-gray-900 dark:text-gray-100">{meeting.notes?.summary}</p>
            </div>

            <div>
              <h3 className="text-sm font-medium text-gray-500 mb-2">Action Items</h3>
              <ul className="space-y-2">
                {meeting.notes?.actionItems.map((item, index) => (
                  <li key={index} className="flex items-start space-x-2">
                    <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                    <span className="text-gray-900 dark:text-gray-100">{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {onActionItemsExtract && (
              <button
                onClick={() => onActionItemsExtract(meeting.notes?.actionItems || [])}
                className="w-full mt-4 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg"
              >
                Extract as Tasks
              </button>
            )}
          </div>

          <div className="p-4 bg-gray-50 dark:bg-gray-900 text-xs text-gray-500">
            Last updated: {new Date(meeting.notes?.timestamp || '').toLocaleString()}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};
