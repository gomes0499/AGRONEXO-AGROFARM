"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UseFormReturn } from "react-hook-form";
import { OrganizationFormValues } from "../schemas/organization-form-schema";
import { ChartColorsStep } from "./chart-colors-step";

interface BrandingStepProps {
  form: UseFormReturn<OrganizationFormValues>;
}

export function BrandingStep({ form }: BrandingStepProps) {
  const corPrimaria = form.watch("cor_primaria") || "#0066FF";
  const corSecundaria = form.watch("cor_secundaria") || "#FF6B00";
  const corFundo = form.watch("cor_fundo") || "#FFFFFF";
  const corTexto = form.watch("cor_texto") || "#000000";

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Cores da Marca</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="cor-primaria">Cor Primária</Label>
              <div className="flex items-center gap-3">
                <Input
                  id="cor-primaria"
                  type="color"
                  {...form.register("cor_primaria")}
                  className="w-20 h-10 p-1 cursor-pointer"
                />
                <Input
                  type="text"
                  value={corPrimaria}
                  onChange={(e) => form.setValue("cor_primaria", e.target.value)}
                  placeholder="#0066FF"
                  className="flex-1"
                />
              </div>
              {form.formState.errors.cor_primaria && (
                <p className="text-sm text-red-500">{form.formState.errors.cor_primaria.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="cor-secundaria">Cor Secundária</Label>
              <div className="flex items-center gap-3">
                <Input
                  id="cor-secundaria"
                  type="color"
                  {...form.register("cor_secundaria")}
                  className="w-20 h-10 p-1 cursor-pointer"
                />
                <Input
                  type="text"
                  value={corSecundaria}
                  onChange={(e) => form.setValue("cor_secundaria", e.target.value)}
                  placeholder="#FF6B00"
                  className="flex-1"
                />
              </div>
              {form.formState.errors.cor_secundaria && (
                <p className="text-sm text-red-500">{form.formState.errors.cor_secundaria.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="cor-fundo">Cor de Fundo</Label>
              <div className="flex items-center gap-3">
                <Input
                  id="cor-fundo"
                  type="color"
                  {...form.register("cor_fundo")}
                  className="w-20 h-10 p-1 cursor-pointer"
                />
                <Input
                  type="text"
                  value={corFundo}
                  onChange={(e) => form.setValue("cor_fundo", e.target.value)}
                  placeholder="#FFFFFF"
                  className="flex-1"
                />
              </div>
              {form.formState.errors.cor_fundo && (
                <p className="text-sm text-red-500">{form.formState.errors.cor_fundo.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="cor-texto">Cor de Texto</Label>
              <div className="flex items-center gap-3">
                <Input
                  id="cor-texto"
                  type="color"
                  {...form.register("cor_texto")}
                  className="w-20 h-10 p-1 cursor-pointer"
                />
                <Input
                  type="text"
                  value={corTexto}
                  onChange={(e) => form.setValue("cor_texto", e.target.value)}
                  placeholder="#000000"
                  className="flex-1"
                />
              </div>
              {form.formState.errors.cor_texto && (
                <p className="text-sm text-red-500">{form.formState.errors.cor_texto.message}</p>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pré-visualização</CardTitle>
        </CardHeader>
        <CardContent>
          <div 
            className="p-6 rounded-lg space-y-4"
            style={{ backgroundColor: corFundo }}
          >
            <h3 
              className="text-2xl font-bold"
              style={{ color: corPrimaria }}
            >
              {form.watch("nome") || "Nome da Organização"}
            </h3>
            <p style={{ color: corTexto }}>
              Este é um exemplo de como as cores da sua marca aparecerão no sistema.
            </p>
            <div className="flex gap-3">
              <button
                className="px-4 py-2 rounded font-medium transition-colors"
                style={{ 
                  backgroundColor: corPrimaria, 
                  color: corFundo,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.12)'
                }}
              >
                Botão Primário
              </button>
              <button
                className="px-4 py-2 rounded font-medium transition-colors"
                style={{ 
                  backgroundColor: corSecundaria, 
                  color: corFundo,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.12)'
                }}
              >
                Botão Secundário
              </button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Chart Colors Section */}
      <ChartColorsStep form={form} />
    </div>
  );
}