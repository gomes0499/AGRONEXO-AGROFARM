"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
import { DividasTerrasForm } from "./dividas-terras-form";
import { DividasTerrasListItem } from "@/schemas/financial/dividas_terras";
import { toast } from "sonner";

interface NewDividaTerraButtonProps {
  organizationId: string;
  onDividaCreated?: (divida: DividasTerrasListItem) => void;
}

export function NewDividaTerraButton({
  organizationId,
  onDividaCreated,
}: NewDividaTerraButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleDividaCreated = (divida: DividasTerrasListItem) => {
    toast.success("Dívida de terra criada com sucesso!");
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
        Nova Dívida de Terra
      </Button>

      <DividasTerrasForm
        open={isOpen}
        onOpenChange={setIsOpen}
        organizationId={organizationId}
        onSubmit={handleDividaCreated}
      />
    </>
  );
}