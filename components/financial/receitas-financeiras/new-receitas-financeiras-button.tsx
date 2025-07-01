"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ReceitasFinanceirasForm } from "./receitas-financeiras-form";

interface NewReceitasFinanceirasButtonProps {
  organizationId: string;
  safras: Array<{ id: string; nome: string }>;
  onSuccess?: () => void;
  variant?: "default" | "secondary" | "outline" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
}

export function NewReceitasFinanceirasButton({
  organizationId,
  safras,
  onSuccess,
  variant = "secondary",
  size = "default",
}: NewReceitasFinanceirasButtonProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        variant={variant}
        size={size}
        className="bg-white text-black hover:bg-white/90"
      >
        <Plus className="h-4 w-4 mr-2" />
        Nova Receita
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>Nova Receita Financeira</DialogTitle>
            <DialogDescription>
              Adicione uma nova receita financeira para controle
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto px-1">
            <ReceitasFinanceirasForm
              organizationId={organizationId}
              safras={safras}
              onSuccess={() => {
                setIsOpen(false);
                onSuccess?.();
              }}
              onCancel={() => setIsOpen(false)}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
