"use client";

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface NewCashFlowProjectionButtonProps {
  onClick: () => void;
  size?: "sm" | "md" | "lg";
}

export function NewCashFlowProjectionButton({ 
  onClick, 
  size = "md" 
}: NewCashFlowProjectionButtonProps) {
  return (
    <Button onClick={onClick} size={size === "sm" ? "sm" : "default"}>
      <Plus className="mr-2 h-4 w-4" />
      Nova Projeção de Fluxo de Caixa
    </Button>
  );
}