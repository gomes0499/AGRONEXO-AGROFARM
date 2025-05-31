"use client";

import { PropertyFormDrawerContainer } from "./property-form-drawer-container";

// Re-export the drawer container component
export function PropertyFormContainer(props: React.ComponentProps<typeof PropertyFormDrawerContainer>) {
  return <PropertyFormDrawerContainer {...props} />;
}