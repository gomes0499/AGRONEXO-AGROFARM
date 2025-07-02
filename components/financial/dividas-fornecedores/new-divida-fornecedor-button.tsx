"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
import { DividasFornecedoresForm } from "./dividas-fornecedores-form";
import { DividasFornecedoresListItem } from "@/schemas/financial/dividas_fornecedores";
import { toast } from "sonner";

interface NewDividaFornecedorButtonProps {
  organizationId: string;
  onDividaCreated?: (divida: DividasFornecedoresListItem) => void;
}

export function NewDividaFornecedorButton({
  organizationId,
  onDividaCreated,
}: NewDividaFornecedorButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleDividaCreated = (divida: DividasFornecedoresListItem) => {
    toast.success("Dívida de fornecedor criada com sucesso!");
    if (onDividaCreated) {
      onDividaCreated(divida);
    }
  };

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="gap-1"
      >
        <PlusIcon className="h-4 w-4" />
        Nova Dívida de Fornecedor
      </Button>

      <DividasFornecedoresForm
        open={isOpen}
        onOpenChange={setIsOpen}
        organizationId={organizationId}
        onSubmit={handleDividaCreated}
        initialSafras={[]}
      />
    </>
  );
}