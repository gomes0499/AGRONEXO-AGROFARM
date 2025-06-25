"use client";

import { PropertyFormSteps } from "./property-form-steps";

interface PropertyFormProps {
  initialData?: any;
  organizationId: string;
  mode?: "create" | "edit";
  onSuccess?: () => void;
}

export function PropertyForm(props: PropertyFormProps) {
  return <PropertyFormSteps {...props} />;
}