"use client";

import { PropertyFormDrawerContainer } from "./property-form-drawer-container";
import { getPropertyById } from "@/lib/actions/property-actions";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Property } from "@/schemas/properties";

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
  const { propertyId, mode } = props;
  const [property, setProperty] = useState<Property | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);

  // Fetch property data when opened in edit mode
  useEffect(() => {
    const fetchProperty = async () => {
      if (mode === "edit" && propertyId && props.isOpen) {
        try {
          setIsLoading(true);
          // Buscamos os dados da propriedade diretamente
          const data = await getPropertyById(propertyId);
          setProperty(data);
        } catch (error) {
          console.error("Error fetching property:", error);
          toast.error("Não foi possível carregar os dados da propriedade");
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchProperty();
  }, [propertyId, mode, props.isOpen]);

  return (
    <PropertyFormDrawerContainer 
      {...props} 
      property={property}
    />
  );
}