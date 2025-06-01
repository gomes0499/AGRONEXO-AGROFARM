"use client";

import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";

interface NewCultureProjectionButtonProps {
  organizationId: string;
  projecaoConfigId: string;
  onProjectionCreated: () => void;
  className?: string;
  size?: "sm" | "default" | "lg";
}

export function NewCultureProjectionButton({
  organizationId,
  projecaoConfigId,
  onProjectionCreated,
  className,
  size = "default",
}: NewCultureProjectionButtonProps) {
  const handleClick = () => {
    // TODO: Implementar modal/drawer de criação de projeção
    onProjectionCreated();
  };

  return (
    <Button onClick={handleClick} size={size} className={className}>
      <PlusIcon className="mr-2 h-4 w-4" />
      Nova Projeção
    </Button>
  );
}
