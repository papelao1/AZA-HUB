import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-red-100 max-w-lg w-full">
            <h2 className="text-xl font-bold text-red-600 mb-4">Ops! Algo deu errado.</h2>
            <p className="text-gray-600 mb-4">
              Ocorreu um erro inesperado. Por favor, tente recarregar a página.
            </p>
            <pre className="bg-gray-100 p-4 rounded-lg text-sm text-gray-800 overflow-auto max-h-64 mb-4">
              {this.state.error?.message}
            </pre>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-[#CC0000] text-white py-2 rounded-lg font-medium hover:bg-[#AA0000] transition-colors"
            >
              Recarregar Página
            </button>
          </div>
        </div>
      );
    }

    return (this as any).props.children;
  }
}
