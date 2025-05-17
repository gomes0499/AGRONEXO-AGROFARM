"use client";

import { Button } from "@/components/ui/button";
import { Warehouse } from "lucide-react";

interface NewCommodityStockButtonProps {
  organizationId: string;
  className?: string;
  variant?: "default" | "outline" | "secondary" | "ghost";
  size?: "default" | "sm" | "lg" | "icon";
  onStockCreated?: () => void;
}

export function NewCommodityStockButton({
  organizationId,
  className,
  variant = "default",
  size = "default",
  onStockCreated,
}: NewCommodityStockButtonProps) {
  return (
    <Button
      variant={variant}
      size={size}
      onClick={() => alert("Funcionalidade em desenvolvimento")}
      className={className}
      disabled
    >
      <Warehouse className="mr-2 h-4 w-4" />
      Novo Estoque
    </Button>
  );
}
