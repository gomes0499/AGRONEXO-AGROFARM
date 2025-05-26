"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AssetFormModal } from "../common/asset-form-modal";
import { EquipmentForm } from "./equipment-form";
import { Equipment } from "@/schemas/patrimonio";

interface NewEquipmentButtonProps {
  organizationId: string;
  onSuccess?: (equipment: Equipment) => void;
}

export function NewEquipmentButton({
  organizationId,
  onSuccess,
}: NewEquipmentButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSuccess = (equipment: Equipment) => {
    setIsModalOpen(false);
    if (onSuccess) {
      onSuccess(equipment);
    }
  };

  return (
    <>
      <Button onClick={() => setIsModalOpen(true)}>
        <Plus className="h-4 w-4 mr-2" />
        Novo Equipamento
      </Button>

      <AssetFormModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        title="Novo Equipamento"
        description="Cadastre uma nova máquina ou equipamento."
        showFooter={false}
        className="sm:max-w-[700px]"
      >
        <EquipmentForm
          organizationId={organizationId}
          onSuccess={handleSuccess}
          onCancel={() => setIsModalOpen(false)}
        />
      </AssetFormModal>
    </>
  );
}