"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AssetFormModal } from "../common/asset-form-modal";
import { InvestmentForm } from "./investment-form";
import { Investment } from "@/schemas/patrimonio/investments";
import { type Safra } from "@/lib/actions/asset-forms-data-actions";

interface NewInvestmentButtonProps {
  organizationId: string;
  onSuccess?: (investment: Investment) => void;
  safras?: Safra[];
}

export function NewInvestmentButton({
  organizationId,
  onSuccess,
  safras = [],
}: NewInvestmentButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleSuccess = (investments: any[]) => {
    setIsModalOpen(false);
    if (onSuccess && investments.length > 0) {
      onSuccess(investments[0]); // Take the first investment for backward compatibility
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
        className="sm:max-w-[800px]"
      >
        <InvestmentForm
          organizationId={organizationId}
          onSuccess={handleSuccess}
          onCancel={() => setIsModalOpen(false)}
          initialSafras={safras}
        />
      </AssetFormModal>
    </>
  );
}
