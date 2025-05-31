"use client";

import { useState } from "react";
import { Plus, Building2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { BankDebt } from "@/schemas/financial";
import { BankDebtFormInner } from "./bank-debt-form-inner";

interface NewBankDebtButtonWideProps {
  organization: { id: string; nome: string };
  className?: string;
  variant?: "default" | "outline" | "secondary" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
}

export function NewBankDebtButtonWide({
  organization,
  className,
  variant = "default",
  size = "default",
}: NewBankDebtButtonWideProps) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const isMobile = useIsMobile();

  const handleSuccess = (bankDebt: BankDebt) => {
    setIsOpen(false);
    toast.success("Dívida bancária criada com sucesso.");
  };

  if (isMobile) {
    return (
      <>
        <Button
          onClick={() => setIsOpen(true)}
          className={cn("transition-all hover:scale-105", className)}
          variant={variant}
          size={size}
        >
          <Plus className="h-4 w-4 mr-2" />
          Nova Dívida Bancária
        </Button>

        <Drawer open={isOpen} onOpenChange={setIsOpen}>
          <DrawerContent className="h-[90%] max-h-none rounded-t-xl">
            <DrawerHeader className="text-left border-b pb-4">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-primary" />
                <DrawerTitle className="text-xl font-semibold">
                  Nova Dívida Bancária
                </DrawerTitle>
              </div>
              <DrawerDescription className="text-muted-foreground mt-1">
                Cadastre uma nova dívida bancária ou financeira.
              </DrawerDescription>
            </DrawerHeader>
            <div className="px-4 py-2 overflow-y-auto flex-1">
              <BankDebtFormInner
                organizationId={organization.id}
                onSuccess={handleSuccess}
                onCancel={() => setIsOpen(false)}
              />
            </div>
          </DrawerContent>
        </Drawer>
      </>
    );
  }

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        className={cn(className)}
        variant={variant}
        size={size}
      >
        <Plus className="h-4 w-4 mr-2" />
        Nova Dívida Bancária
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="!max-w-[700px] p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-2">
            <div className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              <DialogTitle className="text-xl font-semibold">
                Nova Dívida Bancária
              </DialogTitle>
            </div>
            <DialogDescription className="text-muted-foreground mt-1">
              Cadastre uma nova dívida bancária ou financeira.
            </DialogDescription>
          </DialogHeader>
          <div className="px-6 py-2 max-h-[75vh] overflow-y-auto">
            <BankDebtFormInner
              organizationId={organization.id}
              onSuccess={handleSuccess}
              onCancel={() => setIsOpen(false)}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}