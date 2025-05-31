"use client";

import { Button } from "@/components/ui/button";
import { Pencil } from "lucide-react";
import { EditPropertyDrawer } from "./edit-property-drawer";

interface EditPropertyButtonProps {
  propertyId: string;
  organizationId: string;
  variant?: "default" | "outline" | "secondary" | "ghost" | "link" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
  onSuccess?: () => void;
}

export function EditPropertyButton({
  propertyId,
  organizationId,
  variant = "outline",
  size = "sm",
  onSuccess,
}: EditPropertyButtonProps) {
  return (
    <EditPropertyDrawer propertyId={propertyId} organizationId={organizationId} onSuccess={onSuccess}>
      <Button variant={variant} size={size}>
        <Pencil className="h-4 w-4 mr-1" /> Editar
      </Button>
    </EditPropertyDrawer>
  );
}