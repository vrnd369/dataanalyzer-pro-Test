import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class AnalysisErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Analysis error:', error, errorInfo);
    // Enhanced error handling
    const errorDetails = {
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    // Log error details
    console.error('Detailed error:', errorDetails);

    // Store error for recovery
    sessionStorage.setItem('lastError', JSON.stringify(errorDetails));
  }

  private handleRetry = async () => {
    try {
      // Clear error state
      this.setState({ hasError: false, error: null });
      
      // Attempt to recover last state
      const lastError = sessionStorage.getItem('lastError');
      if (lastError) {
        console.log('Recovering from error:', JSON.parse(lastError));
        sessionStorage.removeItem('lastError');
      }
    } catch (error) {
      console.error('Recovery failed:', error);
      this.setState({ 
        hasError: true, 
        error: new Error('Recovery failed. Please refresh the page.') 
      });
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="glass-card flex items-center justify-center">
          <div className="text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2 text-black-500">Analysis Error</h2>
            <p className="text-gray-300 mb-4">
              {this.state.error?.message || 'The analysis encountered an unexpected error. Please try again.'}
            </p>
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={this.handleRetry}
                className="px-4 py-2 bg-red-600 text-white text-sm rounded-lg hover:bg-red-700 transition-colors shadow-sm"
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 border border-red-200 text-red-400 text-sm rounded-lg hover:bg-red-900/20 transition-colors shadow-sm"
              >
                Refresh Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}