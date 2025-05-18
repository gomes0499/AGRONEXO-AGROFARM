"use client";

import React from "react";
import { CommercialNavClient } from "./commercial-nav-client";

interface CommercialSafeWrapperProps {
  seedsComponent?: React.ReactNode;
  livestockComponent?: React.ReactNode;
}

/**
 * Este componente serve como um simples wrapper para o módulo comercial,
 * seguindo a mesma estrutura do módulo de produção.
 */
export function CommercialSafeWrapper(props: CommercialSafeWrapperProps) {
  // Evitando desestruturação
  const seedsComponent = props.seedsComponent;
  const livestockComponent = props.livestockComponent;

  try {
    return (
      <CommercialNavClient
        seedsComponent={seedsComponent}
        livestockComponent={livestockComponent}
      />
    );
  } catch (error) {
    // Fallback em caso de erro
    const errorMessage = error instanceof Error ? error.message : String(error);

    return (
      <div className="bg-red-50 border border-red-100 p-6 rounded-lg">
        <h3 className="text-red-600 font-medium">
          Erro no wrapper do módulo comercial
        </h3>
        <p className="text-sm text-red-500">Erro específico: {errorMessage}</p>
      </div>
    );
  }
}
