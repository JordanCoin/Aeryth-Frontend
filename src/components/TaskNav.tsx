import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Terminal, LayoutDashboard, Command, Radar } from 'lucide-react';

const NAV_ITEMS = [
  {
    path: '/tasks',
    name: 'Task Dashboard',
    icon: LayoutDashboard,
    description: 'Manage and track tasks',
  },
  {
    path: '/radar',
    name: 'Task Radar',
    icon: Radar,
    description: 'AI-powered task discovery & extraction',
  },
  {
    path: '/cli',
    name: 'CLI Tools',
    icon: Command,
    description: 'Terminal commands and tools',
  },
];

export const TaskNav: React.FC = () => {
  const location = useLocation();

  const isActivePath = (path: string) => {
    return location.pathname.startsWith(path);
  };

  return (
    <div
      className="fixed bottom-8 left-1/2 transform -translate-x-1/2 
      bg-white dark:bg-gray-800 rounded-full shadow-lg p-2 border 
      border-gray-200 dark:border-gray-700"
    >
      <div className="flex items-center gap-2">
        {NAV_ITEMS.map(item => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center gap-2 px-4 py-2 rounded-full transition-colors
              ${
                isActivePath(item.path)
                  ? 'bg-blue-500 text-white'
                  : 'hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
          >
            <item.icon className="w-5 h-5" />
            <span className="hidden md:inline">{item.name}</span>
          </Link>
        ))}
      </div>
    </div>
  );
};
