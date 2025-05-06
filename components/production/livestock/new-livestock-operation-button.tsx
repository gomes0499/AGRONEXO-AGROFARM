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
import { LivestockOperationForm } from "./livestock-operation-form";
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
import { Harvest } from "@/schemas/production";

// Define interface for the property entity
interface Property {
  id: string;
  nome: string;
  [key: string]: any;
}

interface NewLivestockOperationButtonProps {
  properties: Property[];
  harvests: Harvest[];
  organizationId: string;
}

export function NewLivestockOperationButton({
  properties,
  harvests,
  organizationId,
}: NewLivestockOperationButtonProps) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const isMobile = useIsMobile();
  
  const handleSuccess = () => {
    setIsOpen(false);
    toast.success("Operação pecuária criada com sucesso!");
  };
  
  if (isMobile) {
    return (
      <>
        <Button onClick={() => setIsOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Operação
        </Button>
        
        <Drawer open={isOpen} onOpenChange={setIsOpen} direction="right">
          <DrawerContent className="h-full max-h-none">
            <DrawerHeader className="text-left">
              <DrawerTitle>Nova Operação Pecuária</DrawerTitle>
              <DrawerDescription>
                Cadastre uma nova operação de confinamento ou abate.
              </DrawerDescription>
            </DrawerHeader>
            <div className="px-4 overflow-y-auto flex-1">
              <LivestockOperationForm
                properties={properties}
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
        Nova Operação
      </Button>
      
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Operação Pecuária</DialogTitle>
            <DialogDescription>
              Cadastre uma nova operação de confinamento ou abate.
            </DialogDescription>
          </DialogHeader>
          <LivestockOperationForm
            properties={properties}
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