"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
import { CaixaDisponibilidadesForm } from "./caixa-disponibilidades-form";
import { CaixaDisponibilidadesListItem } from "@/schemas/financial/caixa_disponibilidades";
import { toast } from "sonner";

interface NewCaixaDisponibilidadesButtonProps {
  organizationId: string;
  onItemCreated?: (item: CaixaDisponibilidadesListItem) => void;
}

export function NewCaixaDisponibilidadesButton({
  organizationId,
  onItemCreated,
}: NewCaixaDisponibilidadesButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleItemCreated = (item: CaixaDisponibilidadesListItem) => {
    toast.success("Item de caixa e disponibilidades criado com sucesso!");
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
        Novo Item de Caixa
      </Button>

      <CaixaDisponibilidadesForm
        open={isOpen}
        onOpenChange={setIsOpen}
        organizationId={organizationId}
        onSubmit={handleItemCreated}
      />
    </>
  );
}