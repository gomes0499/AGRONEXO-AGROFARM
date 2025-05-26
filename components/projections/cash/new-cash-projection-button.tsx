"use client";

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface NewCashProjectionButtonProps {
  onClick: () => void;
  size?: "sm" | "md" | "lg";
}

export function NewCashProjectionButton({ 
  onClick, 
  size = "md" 
}: NewCashProjectionButtonProps) {
  return (
    <Button onClick={onClick} size={size === "sm" ? "sm" : "default"}>
      <Plus className="mr-2 h-4 w-4" />
      Nova Projeção de Caixa
    </Button>
  );
}