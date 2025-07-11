"use client";

import { useState } from "react";
import { Check, ChevronsUpDown, Filter, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { cn } from "@/lib/utils";

// Definir interfaces localmente
interface Property {
  id: string;
  nome: string;
  cidade?: string;
  estado?: string;
}

interface Culture {
  id: string;
  nome: string;
}

interface System {
  id: string;
  nome: string;
}

interface Cycle {
  id: string;
  nome: string;
}

interface Safra {
  id: string;
  nome: string;
  ano_inicio?: number;
  ano_fim?: number;
}

interface DashboardGlobalFilterProps {
  properties: Property[];
  cultures: Culture[];
  systems: System[];
  cycles: Cycle[];
  safras: Safra[];
  selectedPropertyIds: string[];
  selectedCultureIds: string[];
  selectedSystemIds: string[];
  selectedCycleIds: string[];
  selectedSafraIds: string[];
  onPropertySelectionChange: (selectedIds: string[]) => void;
  onCultureSelectionChange: (selectedIds: string[]) => void;
  onSystemSelectionChange: (selectedIds: string[]) => void;
  onCycleSelectionChange: (selectedIds: string[]) => void;
  onSafraSelectionChange: (selectedIds: string[]) => void;
  onClearFilters: () => void;
}

interface MultiSelectFilterProps<T> {
  label: string;
  icon: React.ReactNode;
  items: T[];
  selectedIds: string[];
  onSelectionChange: (selectedIds: string[]) => void;
  getItemId: (item: T) => string;
  getItemLabel: (item: T) => string;
  getItemDescription?: (item: T) => string;
  placeholder: string;
  emptyMessage: string;
}

function MultiSelectFilter<T>({
  label,
  icon,
  items,
  selectedIds,
  onSelectionChange,
  getItemId,
  getItemLabel,
  getItemDescription,
  placeholder,
  emptyMessage,
}: MultiSelectFilterProps<T>) {
  const [open, setOpen] = useState(false);

  const allSelected = selectedIds.length === items.length;

  const handleSelectAll = () => {
    if (allSelected) {
      onSelectionChange([]);
    } else {
      onSelectionChange(items.map(getItemId));
    }
  };

  const handleToggleItem = (itemId: string) => {
    if (selectedIds.includes(itemId)) {
      onSelectionChange(selectedIds.filter((id) => id !== itemId));
    } else {
      onSelectionChange([...selectedIds, itemId]);
    }
  };

  const selectedCountText =
    selectedIds.length === 0
      ? `Nenhum(a) ${label.toLowerCase()} selecionado(a)`
      : selectedIds.length === items.length
      ? `Todos(as) ${label.toLowerCase()}s`
      : `${selectedIds.length} ${label.toLowerCase()}${
          selectedIds.length === 1 ? "" : "s"
        }`;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="justify-between min-w-[100px] h-8"
        >
          <div className="flex items-center gap-2 truncate">
            {icon}
            <span className="truncate">{selectedCountText}</span>
            {selectedIds.length > 0 && selectedIds.length < items.length && (
              <Badge variant="secondary" className="ml-1">
                {selectedIds.length}
              </Badge>
            )}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="p-0 w-[300px]">
        <Command>
          <CommandInput placeholder={placeholder} />
          <CommandEmpty>{emptyMessage}</CommandEmpty>
          <CommandGroup>
            <CommandItem
              onSelect={handleSelectAll}
              className="flex items-center gap-2"
            >
              <div
                className={cn(
                  "flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                  allSelected
                    ? "bg-primary text-primary-foreground"
                    : "opacity-50"
                )}
              >
                {allSelected && <Check className="h-3 w-3" />}
              </div>
              <span>Todos(as) {label.toLowerCase()}s</span>
            </CommandItem>
          </CommandGroup>
          <CommandGroup heading={label}>
            <ScrollArea className="h-72">
              {items.map((item) => {
                const itemId = getItemId(item);
                const isSelected = selectedIds.includes(itemId);
                return (
                  <CommandItem
                    key={itemId}
                    onSelect={() => handleToggleItem(itemId)}
                    className="flex items-center gap-2"
                  >
                    <div
                      className={cn(
                        "flex h-4 w-4 items-center justify-center rounded-sm border border-primary",
                        isSelected
                          ? "bg-primary text-primary-foreground"
                          : "opacity-50"
                      )}
                    >
                      {isSelected && <Check className="h-3 w-3" />}
                    </div>
                    <div className="flex flex-col">
                      <span>{getItemLabel(item)}</span>
                      {getItemDescription && (
                        <span className="text-xs text-muted-foreground">
                          {getItemDescription(item)}
                        </span>
                      )}
                    </div>
                  </CommandItem>
                );
              })}
            </ScrollArea>
          </CommandGroup>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export function DashboardGlobalFilter({
  properties,
  cultures,
  systems,
  cycles,
  safras,
  selectedPropertyIds,
  selectedCultureIds,
  selectedSystemIds,
  selectedCycleIds,
  selectedSafraIds,
  onPropertySelectionChange,
  onCultureSelectionChange,
  onSystemSelectionChange,
  onCycleSelectionChange,
  onSafraSelectionChange,
  onClearFilters,
}: DashboardGlobalFilterProps) {
  const activeFiltersCount = [
    selectedPropertyIds.length > 0 &&
    selectedPropertyIds.length < properties.length
      ? 1
      : 0,
    selectedCultureIds.length > 0 && selectedCultureIds.length < cultures.length
      ? 1
      : 0,
    selectedSystemIds.length > 0 && selectedSystemIds.length < systems.length
      ? 1
      : 0,
    selectedCycleIds.length > 0 && selectedCycleIds.length < cycles.length
      ? 1
      : 0,
    selectedSafraIds.length > 0 && selectedSafraIds.length < safras.length
      ? 1
      : 0,
  ].reduce((acc, val) => acc + val, 0);

  return (
    <div className="bg-muted/50 border-b px-4 py-2">
      <div className="flex flex-col space-y-2 lg:flex-row lg:items-center lg:justify-between lg:space-y-0">
        <div className="flex flex-wrap items-center gap-2">
          <MultiSelectFilter
            label="Propriedade"
            icon={<Filter className="h-4 w-4 shrink-0 opacity-50" />}
            items={properties}
            selectedIds={selectedPropertyIds}
            onSelectionChange={onPropertySelectionChange}
            getItemId={(item) => item.id}
            getItemLabel={(item) => item.nome}
            getItemDescription={(item) =>
              item.cidade && item.estado
                ? `${item.cidade}/${item.estado}`
                : ""
            }
            placeholder="Buscar propriedade..."
            emptyMessage="Nenhuma propriedade encontrada."
          />

          <MultiSelectFilter
            label="Cultura"
            icon={<Filter className="h-4 w-4 shrink-0 opacity-50" />}
            items={cultures}
            selectedIds={selectedCultureIds}
            onSelectionChange={onCultureSelectionChange}
            getItemId={(item) => item.id}
            getItemLabel={(item) => item.nome}
            placeholder="Buscar cultura..."
            emptyMessage="Nenhuma cultura encontrada."
          />

          <MultiSelectFilter
            label="Sistema"
            icon={<Filter className="h-4 w-4 shrink-0 opacity-50" />}
            items={systems}
            selectedIds={selectedSystemIds}
            onSelectionChange={onSystemSelectionChange}
            getItemId={(item) => item.id}
            getItemLabel={(item) => item.nome}
            placeholder="Buscar sistema..."
            emptyMessage="Nenhum sistema encontrado."
          />

          <MultiSelectFilter
            label="Ciclo"
            icon={<Filter className="h-4 w-4 shrink-0 opacity-50" />}
            items={cycles}
            selectedIds={selectedCycleIds}
            onSelectionChange={onCycleSelectionChange}
            getItemId={(item) => item.id}
            getItemLabel={(item) => item.nome}
            placeholder="Buscar ciclo..."
            emptyMessage="Nenhum ciclo encontrado."
          />

          <MultiSelectFilter
            label="Safra"
            icon={<Filter className="h-4 w-4 shrink-0 opacity-50" />}
            items={safras}
            selectedIds={selectedSafraIds}
            onSelectionChange={onSafraSelectionChange}
            getItemId={(item) => item.id}
            getItemLabel={(item) => item.nome}
            getItemDescription={(item) => `${item.ano_inicio}/${item.ano_fim}`}
            placeholder="Buscar safra..."
            emptyMessage="Nenhuma safra encontrada."
          />
        </div>

        <div className="flex items-center space-x-2">
          {activeFiltersCount > 0 && (
            <>
              <Badge variant="secondary" className="px-2">
                <Filter className="mr-1 h-3 w-3" />
                {activeFiltersCount} filtro{activeFiltersCount > 1 ? "s" : ""}
              </Badge>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClearFilters}
                className="h-7 px-2"
              >
                <X className="h-4 w-4" />
                Limpar
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
