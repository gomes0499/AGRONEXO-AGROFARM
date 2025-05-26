"use client";

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface NewProjectionConfigButtonProps {
  onClick: () => void;
  size?: "sm" | "md" | "lg";
}

export function NewProjectionConfigButton({ 
  onClick, 
  size = "md" 
}: NewProjectionConfigButtonProps) {
  return (
    <Button onClick={onClick} size={size === "sm" ? "sm" : "default"}>
      <Plus className="mr-2 h-4 w-4" />
      Nova Configuração
    </Button>
  );
}