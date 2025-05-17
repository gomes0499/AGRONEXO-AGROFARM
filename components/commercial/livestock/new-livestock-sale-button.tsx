"use client";

import { useState } from "react";
import { LivestockSale } from "@/schemas/commercial";
import { Button } from "@/components/ui/button";
import { Harvest } from "@/schemas/production";
import { Property } from "@/schemas/properties";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { LivestockSaleForm } from "@/components/commercial/livestock/livestock-sale-form";
import { Plus } from "lucide-react";

interface NewLivestockSaleButtonProps {
  organizationId: string;
  properties: Property[];
  harvests: Harvest[];
  onSaleCreated?: (sale: LivestockSale) => void;
  className?: string;
  variant?: "default" | "outline" | "secondary" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
}

export function NewLivestockSaleButton({
  organizationId,
  properties,
  harvests,
  onSaleCreated,
  className,
  variant = "default",
  size = "default",
}: NewLivestockSaleButtonProps) {
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const handleSuccess = (newSale: LivestockSale) => {
    setIsDialogOpen(false);
    if (onSaleCreated) {
      onSaleCreated(newSale);
    }
    // Refresh the page to show the new sale
    window.location.reload();
  };

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button className={className} variant={variant} size={size}>
          <Plus className="h-4 w-4 mr-2" />
          Nova Venda Pecuária
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[650px]">
        <DialogHeader>
          <DialogTitle>Nova Venda Pecuária</DialogTitle>
          <DialogDescription>
            Adicione os dados financeiros da venda pecuária
          </DialogDescription>
        </DialogHeader>
        <LivestockSaleForm
          organizationId={organizationId}
          properties={properties}
          harvests={harvests}
          onSuccess={handleSuccess}
          onCancel={() => setIsDialogOpen(false)}
        />
      </DialogContent>
    </Dialog>
  );
}
