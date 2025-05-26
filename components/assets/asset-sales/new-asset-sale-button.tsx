"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AssetFormModal } from "../common/asset-form-modal";

import { useRouter } from "next/navigation";
import { AssetSaleForm } from "./asset-sale-form";

interface NewAssetSaleButtonProps {
  organizationId: string;
}

export function NewAssetSaleButton({
  organizationId,
}: NewAssetSaleButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const router = useRouter();

  const handleSuccess = () => {
    setIsModalOpen(false);
    router.refresh();
  };

  return (
    <>
      <Button onClick={() => setIsModalOpen(true)}>
        <Plus className="h-4 w-4 mr-2" />
        Nova Venda
      </Button>

      <AssetFormModal
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
        title="Nova Venda de Ativo"
        description="Cadastre uma nova venda de ativo."
        showFooter={false}
        className="sm:max-w-[600px]"
      >
        <AssetSaleForm
          organizationId={organizationId}
          onSuccess={handleSuccess}
          onCancel={() => setIsModalOpen(false)}
        />
      </AssetFormModal>
    </>
  );
}
