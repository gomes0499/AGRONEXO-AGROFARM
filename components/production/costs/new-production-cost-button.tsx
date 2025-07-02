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
} from "@/components/ui/dialog";
import { ProductionCostForm } from "./production-cost-form";
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
import type {
  Culture,
  System,
  Cycle,
  Harvest,
  ProductionCost,
} from "@/schemas/production";

// Define interface for the property entity
interface Property {
  id: string;
  organizacao_id: string;
  nome: string;
  cidade?: string;
  estado?: string;
  [key: string]: any;
}

interface NewProductionCostButtonProps {
  cultures: Culture[];
  systems: System[];
  cycles: Cycle[];
  harvests: Harvest[];
  properties: Property[];
  organizationId: string;
  projectionId?: string;
  className?: string;
  variant?: "default" | "outline" | "secondary" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  onItemCreated?: () => void;
}

export function NewProductionCostButton({
  cultures,
  systems,
  cycles,
  harvests,
  properties,
  organizationId,
  projectionId,
  className,
  variant = "default",
  size = "default",
  onItemCreated,
}: NewProductionCostButtonProps) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const isMobile = useIsMobile();

  const handleSuccess = (cost: ProductionCost) => {
    setIsOpen(false);

    // Chamar o callback se fornecido
    if (onItemCreated) {
      onItemCreated();
    }
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
          Novo Custo
        </Button>

        <Drawer open={isOpen} onOpenChange={setIsOpen}>
          <DrawerContent className="h-[90%] max-h-none rounded-t-xl">
            <DrawerHeader className="text-left border-b pb-4">
              <div className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" />
                <DrawerTitle className="text-xl font-semibold">
                  Novo Custo
                </DrawerTitle>
              </div>
              <DrawerDescription className="text-muted-foreground mt-1">
                Cadastre um novo registro de custo para uma cultura, sistema e
                safra.
              </DrawerDescription>
            </DrawerHeader>
            <div className="px-4 py-2 overflow-y-auto flex-1">
              <ProductionCostForm
                cultures={cultures}
                systems={systems}
                cycles={cycles}
                harvests={harvests}
                properties={properties}
                organizationId={organizationId}
                projectionId={projectionId}
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
        Novo Custo
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="!max-w-[700px] p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-2">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-primary" />
              <DialogTitle className="text-xl font-semibold">
                Novo Custo
              </DialogTitle>
            </div>
            <DialogDescription className="text-muted-foreground mt-1">
              Cadastre um novo registro de custo para uma cultura, sistema e
              safra.
            </DialogDescription>
          </DialogHeader>
          <div className="px-6 py-2 max-h-[75vh] overflow-y-auto">
            <ProductionCostForm
              cultures={cultures}
              systems={systems}
              cycles={cycles}
              harvests={harvests}
              properties={properties}
              organizationId={organizationId}
              onSuccess={handleSuccess}
              onCancel={() => setIsOpen(false)}
            />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
