"use client";

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface NewDebtProjectionButtonProps {
  onClick: () => void;
  size?: "sm" | "md" | "lg";
}

export function NewDebtProjectionButton({ 
  onClick, 
  size = "md" 
}: NewDebtProjectionButtonProps) {
  return (
    <Button onClick={onClick} size={size === "sm" ? "sm" : "default"}>
      <Plus className="mr-2 h-4 w-4" />
      Nova Projeção de Dívida
    </Button>
  );
}