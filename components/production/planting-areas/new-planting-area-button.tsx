"use client";

import { useState } from "react";
import { Plus, Map as MapIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { MultiSafraPlantingAreaForm } from "./multi-safra-planting-area-form";
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
  PlantingArea,
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

interface NewPlantingAreaButtonProps {
  properties: Property[];
  cultures: Culture[];
  systems: System[];
  cycles: Cycle[];
  harvests: Harvest[];
  organizationId: string;
  className?: string;
  variant?: "default" | "outline" | "secondary" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
}

export function NewPlantingAreaButton({
  properties,
  cultures,
  systems,
  cycles,
  harvests,
  organizationId,
  className,
  variant = "default",
  size = "default",
}: NewPlantingAreaButtonProps) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const isMobile = useIsMobile();

  const handleSuccess = (plantingArea: PlantingArea) => {
    setIsOpen(false);
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
          Nova Área
        </Button>

        <Drawer open={isOpen} onOpenChange={setIsOpen}>
          <DrawerContent className="h-[90%] max-h-none rounded-t-xl">
            <DrawerHeader className="text-left border-b pb-4">
              <div className="flex items-center gap-2">
                <MapIcon className="h-5 w-5 text-primary" />
                <DrawerTitle className="text-xl font-semibold">
                  Nova Área de Plantio
                </DrawerTitle>
              </div>
              <DrawerDescription className="text-muted-foreground mt-1">
                Cadastre uma nova área de plantio associada a uma propriedade,
                cultura e safra.
              </DrawerDescription>
            </DrawerHeader>
            <div className="px-4 py-2 overflow-y-auto flex-1">
              <MultiSafraPlantingAreaForm
                properties={properties}
                cultures={cultures}
                systems={systems}
                cycles={cycles}
                harvests={harvests}
                organizationId={organizationId}
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
        Nova Área
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-[500px] p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-2">
            <div className="flex items-center gap-2">
              <MapIcon className="h-5 w-5 text-primary" />
              <DialogTitle className="text-xl font-semibold">
                Nova Área de Plantio
              </DialogTitle>
            </div>
            <DialogDescription className="text-muted-foreground mt-1">
              Cadastre uma nova área de plantio associada a uma propriedade,
              cultura e safra.
            </DialogDescription>
          </DialogHeader>
          <div className="px-6 py-2 max-h-[65vh] overflow-y-auto">
            <MultiSafraPlantingAreaForm
              properties={properties}
              cultures={cultures}
              systems={systems}
              cycles={cycles}
              harvests={harvests}
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
