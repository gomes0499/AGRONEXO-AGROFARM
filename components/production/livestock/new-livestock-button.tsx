"use client";

import { useState } from "react";
import { Plus, Beef } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { LivestockForm } from "./livestock-form";
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

// Define interface for the property entity
interface Property {
  id: string;
  organizacao_id: string;
  nome: string;
  [key: string]: any;
}

interface NewLivestockButtonProps {
  properties: Property[];
  organizationId: string;
}

export function NewLivestockButton({
  properties,
  organizationId,
}: NewLivestockButtonProps) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const isMobile = useIsMobile();

  const handleSuccess = () => {
    setIsOpen(false);
  };

  if (isMobile) {
    return (
      <>
        <Button onClick={() => setIsOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Novo Animal
        </Button>

        <Drawer open={isOpen} onOpenChange={setIsOpen} direction="right">
          <DrawerContent className="h-full max-h-none">
            <DrawerHeader className="text-left">
              <DrawerTitle>Novo Animal</DrawerTitle>
              <DrawerDescription>
                Cadastre um novo registro de animal para o rebanho.
              </DrawerDescription>
            </DrawerHeader>
            <div className="px-4 overflow-y-auto flex-1">
              <LivestockForm
                properties={properties}
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
      <Button 
        onClick={() => setIsOpen(true)} 
        size="default" 
        className="gap-1"
      >
        <Plus className="h-4 w-4 mr-2" />
        Novo Animal
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-[500px] p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-2">
            <div className="flex items-center gap-2">
              <Beef className="h-5 w-5 text-primary" />
              <DialogTitle className="text-xl font-semibold">Novo Animal</DialogTitle>
            </div>
            <DialogDescription className="text-muted-foreground mt-1">
              Cadastre um novo registro de animal para o rebanho.
            </DialogDescription>
          </DialogHeader>
          <LivestockForm
            properties={properties}
            organizationId={organizationId}
            onSuccess={handleSuccess}
            onCancel={() => setIsOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
