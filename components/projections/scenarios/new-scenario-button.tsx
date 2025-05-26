"use client";

import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

interface NewScenarioButtonProps {
  onClick: () => void;
  size?: "sm" | "md" | "lg";
}

export function NewScenarioButton({ 
  onClick, 
  size = "md" 
}: NewScenarioButtonProps) {
  return (
    <Button onClick={onClick} size={size === "sm" ? "sm" : "default"}>
      <Plus className="mr-2 h-4 w-4" />
      Novo Cenário
    </Button>
  );
}