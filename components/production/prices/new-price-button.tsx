"use client";

import { useState } from "react";
import { Plus, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { PriceForm } from "./price-form";
// Define types with required id for component usage
type Culture = {
  id: string;
  nome: string;
  organizacao_id?: string;
};

type Harvest = {
  id: string;
  nome: string;
  ano_inicio: number;
  ano_fim: number;
  organizacao_id?: string;
};

type System = {
  id: string;
  nome: string;
  organizacao_id?: string;
};

type Cycle = {
  id: string;
  nome: string;
  organizacao_id?: string;
};

import type { ButtonProps } from "@/components/ui/button";

interface NewPriceButtonProps extends ButtonProps {
  cultures: Culture[];
  harvests: Harvest[];
  systems: System[];
  cycles: Cycle[];
  organizationId: string;
}

export function NewPriceButton({
  cultures,
  harvests,
  systems,
  cycles,
  organizationId,
  variant = "default",
  size = "default",
  className,
  ...props
}: NewPriceButtonProps) {
  const [open, setOpen] = useState(false);

  const handleSuccess = () => {
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant={variant} size={size} className={className} {...props}>
          <Plus className="mr-2 h-4 w-4" />
          Novo Preço
        </Button>
      </DialogTrigger>
      <DialogContent className="!max-w-[700px] p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-2">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            <DialogTitle className="text-xl font-semibold">
              Novo Preço
            </DialogTitle>
          </div>
          <DialogDescription className="text-muted-foreground mt-1">
            Cadastre um novo registro de preço para commodities ou câmbio.
          </DialogDescription>
        </DialogHeader>
        <div className="px-6 py-2 max-h-[75vh] overflow-y-auto">
          <PriceForm
            cultures={cultures}
            harvests={harvests}
            systems={systems}
            cycles={cycles}
            organizationId={organizationId}
            onSuccess={handleSuccess}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}