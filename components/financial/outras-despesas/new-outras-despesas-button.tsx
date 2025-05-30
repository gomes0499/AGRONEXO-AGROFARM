"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
import { OutrasDespesasForm } from "./outras-despesas-form";
import { OutrasDespesasListItem } from "@/schemas/financial/outras_despesas";
import { toast } from "sonner";

interface NewOutrasDespesasButtonProps {
  organizationId: string;
  onItemCreated?: (item: OutrasDespesasListItem) => void;
}

export function NewOutrasDespesasButton({
  organizationId,
  onItemCreated,
}: NewOutrasDespesasButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleItemCreated = (item: OutrasDespesasListItem) => {
    toast.success("Despesa criada com sucesso!");
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
        Nova Despesa
      </Button>

      <OutrasDespesasForm
        open={isOpen}
        onOpenChange={setIsOpen}
        organizationId={organizationId}
        onSubmit={handleItemCreated}
      />
    </>
  );
}