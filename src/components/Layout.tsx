import { PropsWithChildren } from 'react';

export default function Layout({ children }: PropsWithChildren) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <nav className="bg-white dark:bg-gray-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div className="text-xl font-bold text-indigo-600 dark:text-indigo-400">Aeryth</div>
          </div>
        </div>
      </nav>
      <main className="container mx-auto py-8 px-4">{children}</main>
    </div>
  );
}
