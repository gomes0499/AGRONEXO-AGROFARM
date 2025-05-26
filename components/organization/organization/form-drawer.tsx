"use client";

import { OrganizationFormContainer } from "./form/organization-form-container";
import type { OrganizationFormProps } from "./form/schemas/organization-form-schema";

export function OrganizationFormDrawer(props: OrganizationFormProps) {
  return <OrganizationFormContainer {...props} />;
}
