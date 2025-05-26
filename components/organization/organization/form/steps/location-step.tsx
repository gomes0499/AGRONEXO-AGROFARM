import { useState } from "react";
import { CornerDownRight, Navigation, Map, Globe } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { toast } from "sonner";
import type { UseFormReturn } from "react-hook-form";
import type { OrganizationFormValues } from "../schemas/organization-form-schema";
import { MapPreviewDialog } from "../components/map-preview-dialog";

interface LocationStepProps {
  form: UseFormReturn<OrganizationFormValues>;
}

export function LocationStep({ form }: LocationStepProps) {
  const [mapOpen, setMapOpen] = useState(false);

  const handleViewMap = () => {
    const lat = form.getValues("latitude");
    const lng = form.getValues("longitude");

    if (lat && lng) {
      setMapOpen(true);
    } else {
      toast.warning("Preencha as coordenadas primeiro");
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-medium">Localização</h3>
        <p className="text-sm text-muted-foreground">
          Informações adicionais de localização (opcional)
        </p>
      </div>

      <FormField
        control={form.control}
        name="roteiro"
        render={({ field }) => (
          <FormItem>
            <FormLabel className="flex items-center gap-1.5">
              <CornerDownRight className="h-3.5 w-3.5 text-muted-foreground" />
              Roteiro de Acesso
            </FormLabel>
            <FormControl>
              <Textarea
                placeholder="Instruções para chegar ao escritório..."
                className="resize-none min-h-[100px]"
                {...field}
              />
            </FormControl>
            <FormDescription className="text-xs">
              Descreva o roteiro para chegar ao escritório (especialmente útil
              para escritórios em fazendas).
            </FormDescription>
            <FormMessage />
          </FormItem>
        )}
      />

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        <FormField
          control={form.control}
          name="latitude"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-1.5">
                <Navigation className="h-3.5 w-3.5 text-muted-foreground" />
                Latitude
              </FormLabel>
              <FormControl>
                <Input placeholder="Ex: -15.7801" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="longitude"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-1.5">
                <Navigation className="h-3.5 w-3.5 text-muted-foreground" />
                Longitude
              </FormLabel>
              <FormControl>
                <Input placeholder="Ex: -47.9292" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <div className="flex flex-col sm:flex-row sm:justify-between items-start sm:items-center mt-2">
        <FormDescription className="text-xs text-muted-foreground mb-2 sm:mb-0">
          Dica: Você pode encontrar coordenadas no Google Maps clicando com
          botão direito e selecionando "O que há aqui?"
        </FormDescription>

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-2"
          onClick={handleViewMap}
        >
          <Map className="h-4 w-4" />
          Visualizar no Mapa
        </Button>
      </div>

      <MapPreviewDialog
        isOpen={mapOpen}
        onClose={() => setMapOpen(false)}
        latitude={form.getValues("latitude") || ""}
        longitude={form.getValues("longitude") || ""}
      />
    </div>
  );
}