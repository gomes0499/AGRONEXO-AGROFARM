"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StockForm } from "./stock-form";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FormDrawer } from "@/components/production/common/form-drawer";

interface NewStockButtonProps {
  organizationId: string;
}

export function NewStockButton({ organizationId }: NewStockButtonProps) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const isMobile = useIsMobile();
  
  const handleSuccess = () => {
    setIsOpen(false);
    toast.success("Estoque registrado com sucesso!");
  };
  
  if (isMobile) {
    return (
      <>
        <Button onClick={() => setIsOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Estoque
        </Button>
        
        <FormDrawer
          open={isOpen}
          onOpenChange={setIsOpen}
          title="Novo Registro de Estoque"
          description="Adicione um novo registro de estoque de commodity"
        >
          <StockForm
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
        Novo Estoque
      </Button>
      
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Novo Registro de Estoque</DialogTitle>
            <DialogDescription>
              Adicione um novo registro de estoque de commodity
            </DialogDescription>
          </DialogHeader>
          <StockForm
            organizationId={organizationId}
            onSuccess={handleSuccess}
            onCancel={() => setIsOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}