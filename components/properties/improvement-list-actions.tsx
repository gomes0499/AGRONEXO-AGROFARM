"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { ImprovementModal } from "@/components/properties/improvement-modal";

interface ImprovementListActionsProps {
  propertyId: string;
  organizationId: string;
  useModal: boolean; // Mantido para compatibilidade, mas sempre será true
}

export function ImprovementListActions({
  propertyId,
  organizationId,
  useModal, // Não será mais usado, mas mantido para compatibilidade
}: ImprovementListActionsProps) {
  const [showModal, setShowModal] = useState(false);
  const router = useRouter();

  const handleButtonClick = () => {
    // Verifica se temos os IDs necessários antes de abrir o modal
    if (!propertyId || !organizationId) {
      console.error(
        "Erro: IDs inválidos para criar benfeitoria", 
        { propertyId, organizationId }
      );
      // Poderíamos usar um toast aqui também para notificar o usuário
      return;
    }
    
    // Sempre abre o modal, não redireciona mais
    setShowModal(true);
  };

  const handleSuccess = () => {
    setShowModal(false);
    router.refresh();
  };

  return (
    <>
      <Button onClick={handleButtonClick}>
        <PlusIcon className="h-4 w-4 mr-2" />
        Nova Benfeitoria
      </Button>

      {showModal && (
        <ImprovementModal
          propertyId={propertyId}
          organizationId={organizationId}
          open={showModal}
          onOpenChange={setShowModal}
          onSuccess={handleSuccess}
        />
      )}
    </>
  );
}
