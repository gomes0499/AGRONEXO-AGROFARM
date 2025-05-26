"use client";

import { LeaseFormContainer } from "./lease-form-container";
import type { Lease } from "@/schemas/properties";

interface LeaseFormDrawerProps {
  children?: React.ReactNode;
  organizationId: string;
  propertyId: string;
  lease?: Lease;
  isOpen?: boolean;
  open?: boolean;
  onClose?: () => void;
  onOpenChange?: (open: boolean) => void;
  onSuccess?: () => void;
  mode?: "create" | "edit";
}

export function LeaseFormDrawer(props: LeaseFormDrawerProps) {
  return <LeaseFormContainer {...props} />;
}