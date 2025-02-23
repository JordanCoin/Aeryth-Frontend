import { Component, ErrorInfo, ReactNode } from 'react';
import { logger } from '../utils/logger';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
  key: number;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    key: 0,
  };

  public static getDerivedStateFromError(error: Error): Partial<State> {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error('Uncaught error:', {
      error: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
    });
  }

  private handleReset = () => {
    this.setState(state => ({
      hasError: false,
      error: undefined,
      key: state.key + 1,
    }));
  };

  public render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="p-6 bg-red-50 dark:bg-red-900 rounded-lg">
            <h2 className="text-red-800 dark:text-red-200 font-medium text-lg mb-2">
              Something went wrong
            </h2>
            <p className="text-red-600 dark:text-red-300 text-sm mb-4">
              {this.state.error?.message}
            </p>
            <button
              onClick={this.handleReset}
              className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700
                     transition-colors duration-200"
            >
              Try Again
            </button>
          </div>
        )
      );
    }

    return <div key={this.state.key}>{this.props.children}</div>;
  }
}
