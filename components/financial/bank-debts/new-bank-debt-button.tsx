"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Building2, Plus } from "lucide-react";
import { BankDebtForm } from "./bank-debt-form";
import { BankDebt } from "@/schemas/financial";
import { toast } from "sonner";

interface NewBankDebtButtonProps {
  organization: { id: string; nome: string };
}

export function NewBankDebtButton({ organization }: NewBankDebtButtonProps) {
  const [open, setOpen] = useState(false);

  const handleOpenChange = (open: boolean) => {
    setOpen(open);
  };

  const handleSubmit = (bankDebt: BankDebt) => {
    toast.success("Dívida bancária criada com sucesso.");
  };

  return (
    <>
      <Button 
        onClick={() => setOpen(true)}
        size="default"
        className="gap-1"
      >
        <Plus className="h-4 w-4 mr-2" />
        Nova Dívida Bancária
      </Button>
      
      <BankDebtForm
        organizationId={organization.id}
        open={open}
        onOpenChange={handleOpenChange}
        onSubmit={handleSubmit}
      />
    </>
  );
}