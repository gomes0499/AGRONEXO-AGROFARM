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
      >
        <Plus className="h-4 w-4 mr-2" />
        Nova Receita
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Nova Receita Financeira</DialogTitle>
            <DialogDescription>
              Adicione uma nova receita financeira para controle
            </DialogDescription>
          </DialogHeader>
          <ReceitasFinanceirasForm
            organizationId={organizationId}
            safras={safras}
            onSuccess={() => {
              setIsOpen(false);
              onSuccess?.();
            }}
            onCancel={() => setIsOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}