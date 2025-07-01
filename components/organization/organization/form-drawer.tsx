"use client";

import { OrganizationFormModal } from "./form/organization-form-modal";
import type { OrganizationFormProps } from "./form/schemas/organization-form-schema";

export function OrganizationFormDialog(props: OrganizationFormProps) {
  return <OrganizationFormModal {...props} />;
}

// Mantém o export antigo para compatibilidade
export const OrganizationFormDrawer = OrganizationFormDialog;