"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SeedSaleForm } from "./seed-sale-form";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FormDrawer } from "@/components/production/common/form-drawer";
import { Culture } from "@/schemas/production";

interface NewSeedSaleButtonProps {
  cultures: Culture[];
  organizationId: string;
}

export function NewSeedSaleButton({ cultures, organizationId }: NewSeedSaleButtonProps) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const isMobile = useIsMobile();
  
  const handleSuccess = () => {
    setIsOpen(false);
    toast.success("Venda de sementes registrada com sucesso!");
  };
  
  if (isMobile) {
    return (
      <>
        <Button onClick={() => setIsOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Venda
        </Button>
        
        <FormDrawer
          open={isOpen}
          onOpenChange={setIsOpen}
          title="Nova Venda de Sementes"
          description="Registre uma nova operação comercial de sementes"
        >
          <SeedSaleForm
            cultures={cultures}
            organizationId={organizationId}
            onSuccess={handleSuccess}
            onCancel={() => setIsOpen(false)}
          />
        </FormDrawer>
      </>
    );
  }
  
  return (
    <>
      <Button onClick={() => setIsOpen(true)}>
        <Plus className="h-4 w-4 mr-2" />
        Nova Venda
      </Button>
      
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Nova Venda de Sementes</DialogTitle>
            <DialogDescription>
              Registre uma nova operação comercial de sementes
            </DialogDescription>
          </DialogHeader>
          <SeedSaleForm
            cultures={cultures}
            organizationId={organizationId}
            onSuccess={handleSuccess}
            onCancel={() => setIsOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}