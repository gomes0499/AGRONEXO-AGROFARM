"use client";

import { useState, useEffect, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { Property, PropertyFilter } from "./property-filter";

interface PropertyFilterClientProps {
  properties: Property[];
  defaultSelectedIds: string[];
}

export function PropertyFilterClient({ 
  properties, 
  defaultSelectedIds 
}: PropertyFilterClientProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  
  // Certifique-se de que o defaultSelectedIds sempre é um array para evitar problemas de hooks
  const defaultIds = Array.isArray(defaultSelectedIds) ? defaultSelectedIds : [];
  const [selectedPropertyIds, setSelectedPropertyIds] = useState<string[]>(defaultIds);

  const handleSelectionChange = (selectedIds: string[]) => {
    setSelectedPropertyIds(selectedIds);
    
    startTransition(() => {
      const params = new URLSearchParams(searchParams);
      
      if (selectedIds.length === 0 || selectedIds.length === properties.length) {
        // Se estiver vazio ou tiver todas selecionadas, removemos o parâmetro
        params.delete("property");
      } else {
        // Caso contrário, adicionamos os IDs selecionados
        params.set("property", selectedIds.join(","));
      }
      
      router.replace(`${pathname}?${params.toString()}`);
    });
  };

  return (
    <PropertyFilter
      properties={properties}
      selectedPropertyIds={selectedPropertyIds}
      onSelectionChange={handleSelectionChange}
    />
  );
}