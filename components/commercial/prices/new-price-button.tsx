"use client";

import { useState } from "react";
import { Plus, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PriceForm } from "./price-form";
import { toast } from "sonner";
import { useIsMobile } from "@/hooks/use-mobile";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FormDrawer } from "@/components/production/common/form-drawer";
import { Harvest } from "@/schemas/production";

interface NewPriceButtonProps {
  harvests: Harvest[];
  organizationId: string;
}

export function NewPriceButton({ harvests, organizationId }: NewPriceButtonProps) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const isMobile = useIsMobile();
  
  const handleSuccess = () => {
    setIsOpen(false);
    toast.success("Preço registrado com sucesso!");
  };
  
  if (isMobile) {
    return (
      <>
        <Button onClick={() => setIsOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Preço
        </Button>
        
        <FormDrawer
          open={isOpen}
          onOpenChange={setIsOpen}
          title="Novo Registro de Preço"
          description="Adicione um novo registro de preços de commodities"
        >
          <PriceForm
            harvests={harvests}
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
        Novo Preço
      </Button>
      
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Novo Registro de Preço</DialogTitle>
            <DialogDescription>
              Adicione um novo registro de preços de commodities
            </DialogDescription>
          </DialogHeader>
          <PriceForm
            harvests={harvests}
            organizationId={organizationId}
            onSuccess={handleSuccess}
            onCancel={() => setIsOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}