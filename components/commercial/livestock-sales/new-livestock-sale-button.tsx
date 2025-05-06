"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LivestockSaleForm } from "./livestock-sale-form";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FormDrawer } from "@/components/production/common/form-drawer";

interface NewLivestockSaleButtonProps {
  organizationId: string;
}

export function NewLivestockSaleButton({ organizationId }: NewLivestockSaleButtonProps) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const isMobile = useIsMobile();
  
  const handleSuccess = () => {
    setIsOpen(false);
    toast.success("Venda pecuária registrada com sucesso!");
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
          title="Nova Venda Pecuária"
          description="Registre uma nova operação comercial pecuária"
        >
          <LivestockSaleForm
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
            <DialogTitle>Nova Venda Pecuária</DialogTitle>
            <DialogDescription>
              Registre uma nova operação comercial pecuária
            </DialogDescription>
          </DialogHeader>
          <LivestockSaleForm
            organizationId={organizationId}
            onSuccess={handleSuccess}
            onCancel={() => setIsOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}