"use client";

import React, { useState } from "react";
import { Filter, X, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

interface FilterOption {
  value: string;
  label: string;
  count?: number;
}

interface FilterGroup {
  id: string;
  label: string;
  type: "checkbox" | "radio";
  options: FilterOption[];
}

interface MobileFiltersProps {
  filters: FilterGroup[];
  values: Record<string, string | string[]>;
  onChange: (filterId: string, value: string | string[]) => void;
  onReset?: () => void;
  className?: string;
}

export function MobileFilters({
  filters,
  values,
  onChange,
  onReset,
  className,
}: MobileFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  const isMobile = useIsMobile();

  const activeFiltersCount = Object.values(values).reduce((count, value) => {
    if (Array.isArray(value)) {
      return count + value.length;
    }
    return value ? count + 1 : count;
  }, 0);

  const handleCheckboxChange = (filterId: string, optionValue: string, checked: boolean) => {
    const currentValues = (values[filterId] as string[]) || [];
    const newValues = checked
      ? [...currentValues, optionValue]
      : currentValues.filter((v) => v !== optionValue);
    onChange(filterId, newValues);
  };

  const handleRadioChange = (filterId: string, value: string) => {
    onChange(filterId, value);
  };

  const handleReset = () => {
    onReset?.();
    setIsOpen(false);
  };

  if (!isMobile) {
    // Desktop filters - render inline
    return (
      <div className={cn("space-y-6", className)}>
        {filters.map((filter) => (
          <div key={filter.id} className="space-y-3">
            <h3 className="font-medium text-sm">{filter.label}</h3>
            {filter.type === "checkbox" ? (
              <div className="space-y-2">
                {filter.options.map((option) => {
                  const isChecked = (values[filter.id] as string[] || []).includes(option.value);
                  return (
                    <label
                      key={option.value}
                      className="flex items-center space-x-2 cursor-pointer"
                    >
                      <Checkbox
                        checked={isChecked}
                        onCheckedChange={(checked) =>
                          handleCheckboxChange(filter.id, option.value, checked as boolean)
                        }
                      />
                      <span className="text-sm">{option.label}</span>
                      {option.count !== undefined && (
                        <span className="text-xs text-muted-foreground">({option.count})</span>
                      )}
                    </label>
                  );
                })}
              </div>
            ) : (
              <RadioGroup
                value={values[filter.id] as string}
                onValueChange={(value) => handleRadioChange(filter.id, value)}
              >
                {filter.options.map((option) => (
                  <label
                    key={option.value}
                    className="flex items-center space-x-2 cursor-pointer"
                  >
                    <RadioGroupItem value={option.value} />
                    <span className="text-sm">{option.label}</span>
                    {option.count !== undefined && (
                      <span className="text-xs text-muted-foreground">({option.count})</span>
                    )}
                  </label>
                ))}
              </RadioGroup>
            )}
          </div>
        ))}
        {onReset && activeFiltersCount > 0 && (
          <Button variant="ghost" size="sm" onClick={onReset} className="w-full">
            Limpar filtros
          </Button>
        )}
      </div>
    );
  }

  // Mobile filters - render as sheet
  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className={cn("gap-2", className)}
      >
        <Filter className="h-4 w-4" />
        Filtros
        {activeFiltersCount > 0 && (
          <Badge variant="secondary" className="ml-1">
            {activeFiltersCount}
          </Badge>
        )}
      </Button>

      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md">
          <SheetHeader>
            <SheetTitle>Filtros</SheetTitle>
          </SheetHeader>

          <ScrollArea className="flex-1 -mx-6 px-6 mt-6">
            <div className="space-y-6 pb-6">
              {filters.map((filter, index) => (
                <div key={filter.id}>
                  {index > 0 && <Separator className="mb-6" />}
                  <div className="space-y-3">
                    <h3 className="font-medium text-sm">{filter.label}</h3>
                    {filter.type === "checkbox" ? (
                      <div className="space-y-3">
                        {filter.options.map((option) => {
                          const isChecked = (values[filter.id] as string[] || []).includes(
                            option.value
                          );
                          return (
                            <label
                              key={option.value}
                              className="flex items-center justify-between cursor-pointer py-1"
                            >
                              <div className="flex items-center space-x-3">
                                <Checkbox
                                  checked={isChecked}
                                  onCheckedChange={(checked) =>
                                    handleCheckboxChange(filter.id, option.value, checked as boolean)
                                  }
                                />
                                <span className="text-sm">{option.label}</span>
                              </div>
                              {option.count !== undefined && (
                                <span className="text-xs text-muted-foreground">
                                  {option.count}
                                </span>
                              )}
                            </label>
                          );
                        })}
                      </div>
                    ) : (
                      <RadioGroup
                        value={values[filter.id] as string}
                        onValueChange={(value) => handleRadioChange(filter.id, value)}
                      >
                        {filter.options.map((option) => (
                          <label
                            key={option.value}
                            className="flex items-center justify-between cursor-pointer py-1"
                          >
                            <div className="flex items-center space-x-3">
                              <RadioGroupItem value={option.value} />
                              <span className="text-sm">{option.label}</span>
                            </div>
                            {option.count !== undefined && (
                              <span className="text-xs text-muted-foreground">
                                {option.count}
                              </span>
                            )}
                          </label>
                        ))}
                      </RadioGroup>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>

          <SheetFooter className="gap-2 sm:gap-0">
            {onReset && activeFiltersCount > 0 && (
              <Button variant="outline" onClick={handleReset}>
                Limpar filtros
              </Button>
            )}
            <Button onClick={() => setIsOpen(false)}>
              Aplicar filtros
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  );
}

// Helper component for displaying active filters as chips
export function ActiveFilters({
  filters,
  values,
  onRemove,
  className,
}: {
  filters: FilterGroup[];
  values: Record<string, string | string[]>;
  onRemove: (filterId: string, value: string) => void;
  className?: string;
}) {
  const activeFilters: { filterId: string; filterLabel: string; value: string; label: string }[] = [];

  filters.forEach((filter) => {
    const filterValues = values[filter.id];
    if (!filterValues) return;

    const valueArray = Array.isArray(filterValues) ? filterValues : [filterValues];
    valueArray.forEach((value) => {
      const option = filter.options.find((opt) => opt.value === value);
      if (option) {
        activeFilters.push({
          filterId: filter.id,
          filterLabel: filter.label,
          value: value,
          label: option.label,
        });
      }
    });
  });

  if (activeFilters.length === 0) return null;

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {activeFilters.map((filter, index) => (
        <Badge
          key={`${filter.filterId}-${filter.value}-${index}`}
          variant="secondary"
          className="gap-1 pr-1"
        >
          <span className="text-xs">{filter.filterLabel}:</span>
          {filter.label}
          <button
            onClick={() => onRemove(filter.filterId, filter.value)}
            className="ml-1 rounded-full p-0.5 hover:bg-muted"
          >
            <X className="h-3 w-3" />
          </button>
        </Badge>
      ))}
    </div>
  );
}