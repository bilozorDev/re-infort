"use client";

import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { Component, type ErrorInfo, type ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetKeys?: Array<string | number>;
  resetOnPropsChange?: boolean;
  isolate?: boolean;
  level?: "page" | "section" | "component";
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  resetCount: number;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      resetCount: 0,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log to console in development
    if (process.env.NODE_ENV === "development") {
      console.error("ErrorBoundary caught:", error, errorInfo);
    }

    // Report to error tracking service in production
    if (process.env.NODE_ENV === "production") {
      // TODO: Add error tracking service integration (e.g., Sentry)
      console.error("Production error:", {
        error,
        level: this.props.level || "component",
        componentStack: errorInfo.componentStack,
      });
    }

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    this.setState({
      errorInfo,
    });
  }

  componentDidUpdate(prevProps: Props) {
    const { resetKeys, resetOnPropsChange } = this.props;
    const { hasError, resetCount } = this.state;

    // Reset on prop changes if enabled
    if (hasError && resetOnPropsChange && prevProps.children !== this.props.children) {
      this.resetErrorBoundary();
      return;
    }

    // Reset when resetKeys change
    if (hasError && resetKeys && prevProps.resetKeys !== resetKeys) {
      const hasResetKeyChanged = resetKeys.some(
        (key, idx) => key !== prevProps.resetKeys?.[idx]
      );
      if (hasResetKeyChanged) {
        this.resetErrorBoundary();
      }
    }

    // Auto-retry with exponential backoff (max 3 retries)
    if (hasError && resetCount < 3 && this.props.level === "component") {
      const delay = Math.min(1000 * Math.pow(2, resetCount), 10000);
      setTimeout(() => {
        this.resetErrorBoundary();
      }, delay);
    }
  }

  resetErrorBoundary = () => {
    this.setState((prevState) => ({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      resetCount: prevState.resetCount + 1,
    }));
  };

  render() {
    const { hasError, error, resetCount } = this.state;
    const { children, fallback, isolate, level = "component" } = this.props;

    if (hasError && error) {
      // Use custom fallback if provided
      if (fallback) {
        return <>{fallback}</>;
      }

      // Default error UI based on level
      if (level === "page") {
        return (
          <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full space-y-8">
              <div className="text-center">
                <ExclamationTriangleIcon className="mx-auto h-16 w-16 text-red-500" />
                <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
                  Something went wrong
                </h2>
                <p className="mt-2 text-sm text-gray-600">
                  We encountered an unexpected error. Please try refreshing the page.
                </p>
                {process.env.NODE_ENV === "development" && (
                  <details className="mt-4 text-left">
                    <summary className="cursor-pointer text-sm text-gray-500 hover:text-gray-700">
                      Error details
                    </summary>
                    <pre className="mt-2 text-xs text-red-600 bg-red-50 p-2 rounded overflow-auto">
                      {error.toString()}
                      {error.stack}
                    </pre>
                  </details>
                )}
                <div className="mt-6 space-x-4">
                  <button
                    onClick={() => window.location.reload()}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700"
                  >
                    Refresh Page
                  </button>
                  {resetCount < 3 && (
                    <button
                      onClick={this.resetErrorBoundary}
                      className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      Try Again
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        );
      }

      if (level === "section") {
        return (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 m-4">
            <div className="flex">
              <ExclamationTriangleIcon className="h-6 w-6 text-red-400 flex-shrink-0" />
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">
                  This section couldn&apos;t be loaded
                </h3>
                <p className="mt-2 text-sm text-red-700">
                  {error.message || "An unexpected error occurred"}
                </p>
                {resetCount < 3 && (
                  <button
                    onClick={this.resetErrorBoundary}
                    className="mt-3 text-sm font-medium text-red-600 hover:text-red-500"
                  >
                    Try loading again
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      }

      // Component level error (minimal UI)
      if (isolate) {
        return (
          <div className="inline-flex items-center text-sm text-red-600 bg-red-50 px-2 py-1 rounded">
            <ExclamationTriangleIcon className="h-4 w-4 mr-1" />
            <span>Failed to load</span>
            {resetCount < 3 && (
              <button
                onClick={this.resetErrorBoundary}
                className="ml-2 underline hover:no-underline"
              >
                Retry
              </button>
            )}
          </div>
        );
      }

      // Default component error
      return (
        <div className="text-center py-4">
          <ExclamationTriangleIcon className="mx-auto h-8 w-8 text-red-400" />
          <p className="mt-2 text-sm text-gray-600">Failed to load this component</p>
          {resetCount < 3 && (
            <button
              onClick={this.resetErrorBoundary}
              className="mt-2 text-sm text-indigo-600 hover:text-indigo-500"
            >
              Try again
            </button>
          )}
        </div>
      );
    }

    return children;
  }
}

// Hook for using error boundary in functional components
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, "children">
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
}