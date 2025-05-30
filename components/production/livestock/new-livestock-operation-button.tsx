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
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from "@/components/ui/drawer";
import { LivestockOperationForm } from "./livestock-operation-form";
import { useIsMobile } from "@/hooks/use-mobile";
import type { Harvest, LivestockOperation } from "@/schemas/production";
import { cn } from "@/lib/utils";

// Define interface for the property entity
interface Property {
  id: string;
  organizacao_id: string;
  nome: string;
  [key: string]: any;
}

interface NewLivestockOperationButtonProps {
  properties: Property[];
  harvests: Harvest[];
  organizationId: string;
  className?: string;
}

export function NewLivestockOperationButton({
  properties,
  harvests,
  organizationId,
  className,
}: NewLivestockOperationButtonProps) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const isMobile = useIsMobile();

  const handleSuccess = (operation: LivestockOperation) => {
    setIsOpen(false);
  };

  if (isMobile) {
    return (
      <>
        <Button
          onClick={() => setIsOpen(true)}
          className={cn("transition-all hover:scale-105", className)}
          size="sm"
        >
          <Plus className="h-4 w-4 mr-2" />
          Nova Operação
        </Button>

        <Drawer open={isOpen} onOpenChange={setIsOpen}>
          <DrawerContent className="h-[90%] max-h-none rounded-t-xl">
            <DrawerHeader className="text-left border-b pb-4">
              <DrawerTitle className="text-xl font-semibold">
                Nova Operação Pecuária
              </DrawerTitle>
              <DrawerDescription className="text-muted-foreground mt-1">
                Cadastre uma nova operação de confinamento ou abate.
              </DrawerDescription>
            </DrawerHeader>
            <div className="px-4 py-2 overflow-y-auto flex-1">
              <LivestockOperationForm
                properties={properties}
                harvests={harvests}
                organizationId={organizationId}
                onSuccess={handleSuccess}
                onCancel={() => setIsOpen(false)}
              />
            </div>
            <DrawerFooter className="pt-0">
              {/* Os botões estão no próprio formulário */}
            </DrawerFooter>
          </DrawerContent>
        </Drawer>
      </>
    );
  }

  return (
    <>
      <Button onClick={() => setIsOpen(true)} className={cn(className)}>
        <Plus className="h-4 w-4 mr-2" />
        Nova Operação
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-2">
            <DialogTitle className="text-xl font-semibold">
              Nova Operação Pecuária
            </DialogTitle>
            <DialogDescription className="text-muted-foreground mt-1">
              Cadastre uma nova operação de confinamento ou abate.
            </DialogDescription>
          </DialogHeader>
          <div className="px-6 py-2 max-h-[60vh] overflow-y-auto">
            <LivestockOperationForm
              properties={properties}
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
