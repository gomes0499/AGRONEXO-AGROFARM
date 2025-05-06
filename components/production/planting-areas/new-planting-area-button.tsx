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
import { PlantingAreaForm } from "./planting-area-form";
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
import { Culture, System, Cycle, Harvest } from "@/schemas/production";

// Define interface for the property entity
interface Property {
  id: string;
  nome: string;
  [key: string]: any;
}

interface NewPlantingAreaButtonProps {
  properties: Property[];
  cultures: Culture[];
  systems: System[];
  cycles: Cycle[];
  harvests: Harvest[];
  organizationId: string;
}

export function NewPlantingAreaButton({
  properties,
  cultures,
  systems,
  cycles,
  harvests,
  organizationId,
}: NewPlantingAreaButtonProps) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const isMobile = useIsMobile();
  
  const handleSuccess = () => {
    setIsOpen(false);
    toast.success("Área de plantio criada com sucesso!");
  };
  
  if (isMobile) {
    return (
      <>
        <Button onClick={() => setIsOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Área
        </Button>
        
        <Drawer 
          open={isOpen} 
          onOpenChange={setIsOpen}
          direction="right"
        >
          <DrawerContent className="h-full max-h-none">
            <DrawerHeader className="text-left">
              <DrawerTitle>Nova Área de Plantio</DrawerTitle>
              <DrawerDescription>
                Cadastre uma nova área de plantio associada a uma propriedade, cultura e safra.
              </DrawerDescription>
            </DrawerHeader>
            <div className="px-4 overflow-y-auto flex-1">
              <PlantingAreaForm
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
        Nova Área
      </Button>
      
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Área de Plantio</DialogTitle>
            <DialogDescription>
              Cadastre uma nova área de plantio associada a uma propriedade, cultura e safra.
            </DialogDescription>
          </DialogHeader>
          <PlantingAreaForm
            properties={properties}
            cultures={cultures}
            systems={systems}
            cycles={cycles}
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