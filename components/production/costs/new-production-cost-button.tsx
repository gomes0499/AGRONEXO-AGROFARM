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
import { ProductionCostForm } from "./production-cost-form";
import { toast } from "sonner";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from "@/components/ui/drawer";
import { useIsMobile } from "@/hooks/use-mobile";
import { Culture, System, Harvest } from "@/schemas/production";

interface NewProductionCostButtonProps {
  cultures: Culture[];
  systems: System[];
  harvests: Harvest[];
  organizationId: string;
}

export function NewProductionCostButton({
  cultures,
  systems,
  harvests,
  organizationId,
}: NewProductionCostButtonProps) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const isMobile = useIsMobile();

  const handleSuccess = () => {
    setIsOpen(false);
    toast.success("Registro de custo criado com sucesso!");
  };

  if (isMobile) {
    return (
      <>
        <Button onClick={() => setIsOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Custo
        </Button>

        <Drawer 
          open={isOpen} 
          onOpenChange={setIsOpen}
          direction="right"
        >
          <DrawerContent className="h-full max-h-none">
            <DrawerHeader className="text-left">
              <DrawerTitle>Novo Custo</DrawerTitle>
              <DrawerDescription>
                Cadastre um novo registro de custo para uma cultura, sistema e
                safra.
              </DrawerDescription>
            </DrawerHeader>
            <div className="px-4 overflow-y-auto flex-1">
              <ProductionCostForm
                cultures={cultures}
                systems={systems}
                harvests={harvests}
                organizationId={organizationId}
                onSuccess={handleSuccess}
                onCancel={() => setIsOpen(false)}
              />
            </div>
            <DrawerFooter className="pt-2">
              <DrawerClose asChild>
                <Button variant="outline">Cancelar</Button>
              </DrawerClose>
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      </>
    );
  }

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>
        <Plus className="h-4 w-4 mr-2" />
        Novo Custo
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Novo Custo</DialogTitle>
            <DialogDescription>
              Cadastre um novo registro de custo para uma cultura, sistema e
              safra.
            </DialogDescription>
          </DialogHeader>
          <ProductionCostForm
            cultures={cultures}
            systems={systems}
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
