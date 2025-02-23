import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { Provider } from 'react-redux';
import { store } from './store';
import { Toaster } from 'react-hot-toast';
import AppRoutes from './routes';
import { TaskExtractor } from '//.././/components/TaskExtractor';

function App() {
  return (
    <Provider store={store}>
      <Router>
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
          <TaskExtractor />
          <AppRoutes />
          <Toaster position="top-right" />
        </div>
      </Router>
    </Provider>
  );
}

export default App;
