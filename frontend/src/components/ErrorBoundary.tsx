import { Component, ErrorInfo, ReactNode } from "react";
import { AlertTriangle, RotateCcw } from "lucide-react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error caught by ErrorBoundary:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center p-8 bg-surface-card border border-surface-border rounded-2xl max-w-md mx-auto my-8 text-center space-y-4 shadow-2xl">
          <div className="w-12 h-12 rounded-full bg-red-950/60 border border-red-800/60 flex items-center justify-center text-red-400">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-zinc-100">
              Something went wrong
            </h3>
            <p className="text-xs text-zinc-400">
              An unexpected render error occurred. Please refresh or try again.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
            className="flex items-center space-x-2 px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-400 text-black font-semibold text-xs transition-all shadow-md active:scale-95"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reload Application</span>
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
