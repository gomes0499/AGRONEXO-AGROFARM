"use client";

import { PropertyFormContainer } from "./property-form-container";

interface PropertyFormDrawerProps {
  children?: React.ReactNode;
  organizationId: string;
  propertyId?: string;
  isOpen?: boolean;
  open?: boolean;
  onClose?: () => void;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: () => void;
  mode?: "create" | "edit";
}

export function PropertyFormDrawer(props: PropertyFormDrawerProps) {
  return <PropertyFormContainer {...props} />;
}