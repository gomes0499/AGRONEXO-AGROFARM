"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
import { FinanceirasForm } from "./financeiras-form";
import { FinanceirasListItem } from "@/schemas/financial/financeiras";
import { toast } from "sonner";

interface NewFinanceirasButtonProps {
  organizationId: string;
  onItemCreated?: (item: FinanceirasListItem) => void;
}

export function NewFinanceirasButton({
  organizationId,
  onItemCreated,
}: NewFinanceirasButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleItemCreated = (item: FinanceirasListItem) => {
    toast.success("Operação financeira criada com sucesso!");
    if (onItemCreated) {
      onItemCreated(item);
    }
  };

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className="gap-1"
      >
        <PlusIcon className="h-4 w-4" />
        Nova Operação Financeira
      </Button>

      <FinanceirasForm
        open={isOpen}
        onOpenChange={setIsOpen}
        organizationId={organizationId}
        onSubmit={handleItemCreated}
      />
    </>
  );
}