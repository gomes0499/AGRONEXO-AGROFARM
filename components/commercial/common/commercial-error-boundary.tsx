"use client";

import React from "react";

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class CommercialErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    // Definir estado inicial
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // Atualizar o state para que a próxima renderização mostre a UI alternativa (fallback)
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    // Você também pode registrar o erro em um serviço de relatório de erros
    console.error("Erro no módulo comercial:", error, errorInfo);
  }

  render(): React.ReactNode {
    const { hasError, error } = this.state;
    const { children, fallback } = this.props;

    if (hasError) {
      // Se o fallback for fornecido, use-o, caso contrário, use o padrão
      if (fallback) {
        return fallback;
      }

      return (
        <div className="bg-red-50 border border-red-100 p-6 rounded-lg">
          <h3 className="text-red-600 font-medium">Erro no módulo comercial</h3>
          <p className="text-sm text-red-500">
            {error ? error.message : "Ocorreu um erro inesperado."}
          </p>
        </div>
      );
    }

    return children;
  }
}

export default CommercialErrorBoundary;
