import React, { useEffect, useState } from 'react';
import { XMarkIcon, WifiIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';

export default function NetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowReconnected(true);
      toast.success('Connection restored');
      setTimeout(() => setShowReconnected(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.error('Connection lost - Working offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline && !showReconnected) return null;

  return (
    <div
      className={`fixed bottom-4 right-4 p-4 rounded-lg shadow-lg ${
        isOnline ? 'bg-green-50 dark:bg-green-900' : 'bg-red-50 dark:bg-red-900'
      }`}
    >
      <div className="flex items-center space-x-2">
        {isOnline ? (
          <WifiIcon className="h-5 w-5 text-green-600 dark:text-green-400" />
        ) : (
          <XMarkIcon className="h-5 w-5 text-red-600 dark:text-red-400" />
        )}
        <span
          className={`text-sm font-medium ${
            isOnline ? 'text-green-800 dark:text-green-200' : 'text-red-800 dark:text-red-200'
          }`}
        >
          {isOnline ? 'Connection Restored' : 'Working Offline'}
        </span>
      </div>
    </div>
  );
}
