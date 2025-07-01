"use client";

import { Palette } from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { OrganizationFormValues } from "../schemas/organization-form-schema";
import { DEFAULT_CHART_COLORS } from "@/lib/constants/chart-colors";

interface ChartColorsStepProps {
  form: UseFormReturn<OrganizationFormValues>;
}

const colorLabels = {
  primary: "Cor Primária",
  secondary: "Cor Secundária",
  tertiary: "Cor Terciária",
  quaternary: "Cor Quaternária",
  quinary: "Cor Quinária",
  senary: "Cor Senária",
  septenary: "Cor Setenária",
  octonary: "Cor Octonária",
  nonary: "Cor Nonária",
  denary: "Cor Denária",
};

export function ChartColorsStep({ form }: ChartColorsStepProps) {
  const resetToDefaults = () => {
    form.setValue("chart_colors", DEFAULT_CHART_COLORS);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-medium flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Cores dos Gráficos
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Personalize as cores utilizadas nos gráficos e dashboards
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={resetToDefaults}
        >
          Restaurar Padrões
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {Object.entries(colorLabels).map(([key, label]) => (
          <FormField
            key={key}
            control={form.control}
            name={`chart_colors.${key as keyof typeof colorLabels}`}
            render={({ field }) => (
              <FormItem>
                <FormLabel>{label}</FormLabel>
                <div className="flex gap-2">
                  <FormControl>
                    <Input
                      type="color"
                      className="w-16 h-10 p-1 cursor-pointer"
                      {...field}
                    />
                  </FormControl>
                  <FormControl>
                    <Input
                      type="text"
                      placeholder="#000000"
                      {...field}
                      className="flex-1"
                    />
                  </FormControl>
                </div>
                <FormMessage />
              </FormItem>
            )}
          />
        ))}
      </div>

      <div className="bg-muted/50 rounded-lg p-4">
        <h4 className="font-medium mb-3">Pré-visualização</h4>
        <div className="flex gap-2 flex-wrap">
          {Object.entries(form.watch("chart_colors") || DEFAULT_CHART_COLORS).map(([key, color]) => (
            <div
              key={key}
              className="flex flex-col items-center gap-1"
            >
              <div
                className="w-12 h-12 rounded-md border shadow-sm"
                style={{ backgroundColor: color as string }}
              />
              <span className="text-xs text-muted-foreground capitalize">
                {key}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}