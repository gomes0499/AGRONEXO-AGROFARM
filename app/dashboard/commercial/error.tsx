"use client";

import { useEffect } from "react";
import { CommercialMaintenance } from "@/components/commercial/commercial-maintenance";

export default function CommercialErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log do erro no console ou em um serviço de monitoramento
    console.error("Erro no módulo comercial:", error);
  }, [error]);

  return (
    <CommercialMaintenance
      title="Erro no Módulo Comercial"
      description="Ocorreu um problema ao carregar este módulo"
      message="Estamos enfrentando dificuldades técnicas ao carregar o módulo comercial. Nossa equipe já foi notificada e está trabalhando para resolver o problema."
      showHomeButton={true}
      showRetryButton={true}
    />
  );
}
