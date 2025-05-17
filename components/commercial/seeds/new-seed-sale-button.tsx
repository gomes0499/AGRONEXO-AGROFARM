"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Sprout } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SeedSaleForm } from "@/components/commercial/seeds/seed-sale-form";
import { Culture, Harvest } from "@/schemas/production";
import { Property } from "@/schemas/properties";
import { SeedSale } from "@/schemas/commercial";

interface NewSeedSaleButtonProps {
  cultures: Culture[];
  properties: Property[];
  organizationId: string;
  className?: string;
  variant?: "default" | "outline" | "secondary" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  onSeedSaleCreated?: () => void;
  harvests: Harvest[];
}

export function NewSeedSaleButton({
  cultures,
  properties,
  organizationId,
  className,
  variant = "default",
  size = "default",
  onSeedSaleCreated,
  harvests,
}: NewSeedSaleButtonProps) {
  const [open, setOpen] = useState(false);

  const handleSuccess = (seedSale: SeedSale) => {
    setOpen(false);
    if (onSeedSaleCreated) {
      onSeedSaleCreated();
    }
  };

  return (
    <>
      <Button
        variant={variant}
        size={size}
        onClick={() => setOpen(true)}
        className={className}
      >
        <Sprout className="mr-2 h-4 w-4" />
        Nova Venda Semente
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[650px]">
          <DialogHeader>
            <DialogTitle>Registrar Nova Venda de Sementes</DialogTitle>
            <DialogDescription>
              Preencha os dados financeiros desta venda de sementes
            </DialogDescription>
          </DialogHeader>

          <SeedSaleForm
            cultures={cultures}
            properties={properties}
            harvests={harvests}
            organizationId={organizationId}
            onSuccess={handleSuccess}
            onCancel={() => setOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
}
