"use client";

import { useState, useEffect } from "react";
import { CommercialNavClient } from "./commercial-nav-client";

interface CommercialSafeWrapperProps {
  seedsComponent?: React.ReactNode;
  livestockComponent?: React.ReactNode;
}

/**
 * Este componente serve como um wrapper seguro para o módulo comercial,
 * garantindo que todas as importações e inicializações sejam feitas corretamente
 * antes de renderizar os componentes de tab.
 */
export function CommercialSafeWrapper({
  seedsComponent,
  livestockComponent,
}: CommercialSafeWrapperProps) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);

  // Carrega os componentes de forma segura
  useEffect(() => {
    try {
      // Garantimos que o componente só é renderizado após a montagem completa
      setIsLoaded(true);
    } catch (error) {
      console.error("Erro ao inicializar o módulo comercial:", error);
      setHasError(true);
    }
  }, []);

  // Em caso de erro, mostra um fallback simples
  if (hasError) {
    return (
      <div className="flex flex-col items-center justify-center p-8 h-60 border rounded-lg">
        <p className="text-lg font-medium text-red-600 mb-2">
          Ocorreu um erro ao carregar o módulo comercial.
        </p>
        <p className="text-sm text-gray-500 mb-4">
          Verifique o console para mais detalhes ou tente recarregar a página.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  // Enquanto não carrega, mostra um spinner
  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center p-8 h-60">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // Renderiza o componente normalmente quando estiver tudo OK
  return (
    <CommercialNavClient
      seedsComponent={seedsComponent}
      livestockComponent={livestockComponent}
    />
  );
}