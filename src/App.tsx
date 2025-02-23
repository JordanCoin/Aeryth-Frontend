import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import TaskExtractor from './features/task-extractor/TaskExtractor';
import Layout from './components/Layout';
import { ErrorBoundary } from './components/ErrorBoundary';
import NetworkStatus from './components/NetworkStatus';

function App() {
  return (
    <Router>
      <Toaster position="top-right" />
      <ErrorBoundary>
        <Layout>
          <Routes>
            <Route path="/" element={<TaskExtractor />} />
          </Routes>
        </Layout>
      </ErrorBoundary>
      <NetworkStatus />
    </Router>
  );
}

export default App;
