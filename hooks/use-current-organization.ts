"use client";

import { useOrganization, type Organization } from "@/components/auth/organization-provider";

export function useCurrentOrganization(): Organization | null {
  const { organization } = useOrganization();
  return organization;
}