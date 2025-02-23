import React from 'react';
import { ArrowPathIcon } from '@heroicons/react/24/outline';

interface LoadingOverlayProps {
  message?: string;
  fullscreen?: boolean;
}

export default function LoadingOverlay({
  message = 'Loading...',
  fullscreen = false,
}: LoadingOverlayProps) {
  const overlayClasses = fullscreen
    ? 'fixed inset-0 bg-black/50 z-50'
    : 'absolute inset-0 bg-white/80 dark:bg-gray-900/80';

  return (
    <div className={`${overlayClasses} flex items-center justify-center`}>
      <div className="text-center">
        <ArrowPathIcon className="h-8 w-8 animate-spin text-indigo-600 dark:text-indigo-400 mx-auto" />
        <p className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">{message}</p>
      </div>
    </div>
  );
}
