"use client";

import { CommercialNavClient } from "./commercial-nav-client";

interface CommercialSafeWrapperProps {
  seedsComponent?: React.ReactNode;
  livestockComponent?: React.ReactNode;
}

/**
 * Este componente serve como um simples wrapper para o módulo comercial,
 * seguindo a mesma estrutura do módulo de produção.
 */
export function CommercialSafeWrapper({
  seedsComponent,
  livestockComponent,
}: CommercialSafeWrapperProps) {
  // Renderiza o componente diretamente, sem verificações adicionais
  return (
    <CommercialNavClient
      seedsComponent={seedsComponent}
      livestockComponent={livestockComponent}
    />
  );
}