"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AssetFormModal } from "../common/asset-form-modal";
import { InvestmentForm } from "./investment-form";
import { Investment } from "@/schemas/patrimonio/investments";

interface NewInvestmentButtonProps {
  organizationId: string;
  onSuccess?: (investment: Investment) => void;
}

export function NewInvestmentButton({
  organizationId,
  onSuccess,
}: NewInvestmentButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSuccess = (investment: Investment) => {
    setIsModalOpen(false);
    if (onSuccess) {
      onSuccess(investment);
    }
  };

  return (
    <>
      <Button onClick={() => setIsModalOpen(true)}>
        <Plus className="h-4 w-4 mr-2" />
        Novo Investimento
      </Button>

      <AssetFormModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        title="Novo Investimento"
        description="Cadastre um novo investimento realizado."
        showFooter={false}
        className="sm:max-w-[600px]"
      >
        <InvestmentForm
          organizationId={organizationId}
          onSuccess={handleSuccess}
          onCancel={() => setIsModalOpen(false)}
        />
      </AssetFormModal>
    </>
  );
}
