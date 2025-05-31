"use client";

import { useState } from "react";
import { Plus, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ProductivityForm } from "./productivity-form";
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
  Harvest,
  Productivity,
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

interface NewProductivityButtonProps {
  cultures: Culture[];
  systems: System[];
  harvests: Harvest[];
  properties: Property[];
  organizationId: string;
  className?: string;
  variant?: "default" | "outline" | "secondary" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
}

export function NewProductivityButton({
  cultures,
  systems,
  harvests,
  properties,
  organizationId,
  className,
  variant = "default",
  size = "default",
}: NewProductivityButtonProps) {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const isMobile = useIsMobile();

  const handleSuccess = (productivity: Productivity) => {
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
          Nova Produtividade
        </Button>

        <Drawer open={isOpen} onOpenChange={setIsOpen}>
          <DrawerContent className="h-[90%] max-h-none rounded-t-xl">
            <DrawerHeader className="text-left border-b pb-4">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                <DrawerTitle className="text-xl font-semibold">
                  Nova Produtividade
                </DrawerTitle>
              </div>
              <DrawerDescription className="text-muted-foreground mt-1">
                Cadastre um novo registro de produtividade para uma cultura,
                sistema e safra.
              </DrawerDescription>
            </DrawerHeader>
            <div className="px-4 py-2 overflow-y-auto flex-1">
              <ProductivityForm
                cultures={cultures}
                systems={systems}
                harvests={harvests}
                properties={properties}
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
        Nova Produtividade
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="!max-w-[700px] p-0 overflow-hidden">
          <DialogHeader className="p-6 pb-2">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <DialogTitle className="text-xl font-semibold">
                Nova Produtividade
              </DialogTitle>
            </div>
            <DialogDescription className="text-muted-foreground mt-1">
              Cadastre um novo registro de produtividade para uma cultura,
              sistema e safra.
            </DialogDescription>
          </DialogHeader>
          <div className="px-6 py-2 max-h-[75vh] overflow-y-auto">
            <ProductivityForm
              cultures={cultures}
              systems={systems}
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