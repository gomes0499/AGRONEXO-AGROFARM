"use client";

import { useState } from "react";
import { Check, ChevronsUpDown, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export interface Property {
  id: string;
  organizacao_id: string;
  nome: string;
  cidade?: string | null;
  estado?: string | null;
  area_total?: number | null;
}

interface PropertyFilterProps {
  properties: Property[];
  selectedPropertyIds: string[];
  onSelectionChange: (selectedIds: string[]) => void;
}

export function PropertyFilter({
  properties,
  selectedPropertyIds,
  onSelectionChange,
}: PropertyFilterProps) {
  const [open, setOpen] = useState(false);
  
  const allSelected = selectedPropertyIds.length === properties.length;
  
  const handleSelectAll = () => {
    if (allSelected) {
      onSelectionChange([]);
    } else {
      onSelectionChange(properties.map(p => p.id));
    }
  };

  const handleToggleProperty = (propertyId: string) => {
    if (selectedPropertyIds.includes(propertyId)) {
      onSelectionChange(selectedPropertyIds.filter(id => id !== propertyId));
    } else {
      onSelectionChange([...selectedPropertyIds, propertyId]);
    }
  };

  const selectedCountText = selectedPropertyIds.length === 0 
    ? "Nenhuma propriedade selecionada" 
    : selectedPropertyIds.length === properties.length 
      ? "Todas as propriedades" 
      : `${selectedPropertyIds.length} ${selectedPropertyIds.length === 1 ? 'propriedade' : 'propriedades'}`;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="justify-between min-w-[250px]"
        >
          <div className="flex items-center gap-2 truncate">
            <MapPin className="h-4 w-4 shrink-0 opacity-50" />
            <span className="truncate">{selectedCountText}</span>
            {selectedPropertyIds.length > 0 && selectedPropertyIds.length < properties.length && (
              <Badge variant="secondary" className="ml-1">
                {selectedPropertyIds.length}
              </Badge>
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-[300px]">
        <Command>
          <CommandInput placeholder="Buscar propriedade..." />
          <CommandEmpty>Nenhuma propriedade encontrada.</CommandEmpty>
          <CommandGroup>
            <CommandItem 
              onSelect={handleSelectAll}
              className="flex items-center gap-2"
            >
              <div className={cn(
                "flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                allSelected ? "bg-primary text-primary-foreground" : "opacity-50"
              )}>
                {allSelected && <Check className="h-3 w-3" />}
              </div>
              <span>Todas as propriedades</span>
            </CommandItem>
          </CommandGroup>
          <CommandGroup heading="Propriedades">
            <ScrollArea className="h-72">
              {properties.map((property) => (
                <CommandItem
                  key={property.id}
                  onSelect={() => handleToggleProperty(property.id)}
                  className="flex items-center gap-2"
                >
                  <div className={cn(
                    "flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                    selectedPropertyIds.includes(property.id) ? "bg-primary text-primary-foreground" : "opacity-50"
                  )}>
                    {selectedPropertyIds.includes(property.id) && <Check className="h-3 w-3" />}
                  </div>
                  <div className="flex flex-col">
                    <span>{property.nome}</span>
                    {property.cidade && property.estado && (
                      <span className="text-xs text-muted-foreground">
                        {property.cidade}/{property.estado}
                      </span>
                    )}
                  </div>
                </CommandItem>
              ))}
            </ScrollArea>
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}