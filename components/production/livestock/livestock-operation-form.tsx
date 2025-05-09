"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Plus, Trash, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  type LivestockOperation,
  type LivestockOperationFormValues,
  livestockOperationFormSchema,
  type Harvest,
} from "@/schemas/production";
import {
  createLivestockOperation,
  updateLivestockOperation,
} from "@/lib/actions/production-actions";

// Define interface for the property entity
interface Property {
  id: string;
  nome: string;
  cidade?: string;
  estado?: string;
  [key: string]: any;
}

interface LivestockOperationFormProps {
  properties: Property[];
  harvests: Harvest[];
  organizationId: string;
  operation?: LivestockOperation | null;
  onSuccess?: (operation: LivestockOperation) => void;
  onCancel?: () => void;
}

interface VolumeEntry {
  harvestId: string;
  volume: number;
}

export function LivestockOperationForm({
  properties,
  harvests,
  organizationId,
  operation = null,
  onSuccess,
  onCancel,
}: LivestockOperationFormProps) {
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const isEditing = !!operation?.id;
  const [volumeEntries, setVolumeEntries] = useState<VolumeEntry[]>([]);
  const [selectedHarvests, setSelectedHarvests] = useState<string[]>([]);

  // Preparar o objeto volume_abate_por_safra
  useEffect(() => {
    if (isEditing && operation?.volume_abate_por_safra) {
      let volumeData: Record<string, number>;
      if (typeof operation.volume_abate_por_safra === "string") {
        try {
          volumeData = JSON.parse(operation.volume_abate_por_safra);
        } catch (e) {
          volumeData = {};
        }
      } else {
        volumeData = operation.volume_abate_por_safra as Record<string, number>;
      }

      const entries = Object.entries(volumeData).map(([harvestId, volume]) => ({
        harvestId,
        volume: Number(volume),
      }));

      setVolumeEntries(entries);
      setSelectedHarvests(entries.map((entry) => entry.harvestId));
    } else {
      // Adicionar uma entrada vazia por padrão
      setVolumeEntries([{ harvestId: "", volume: 0 }]);
    }
  }, [isEditing, operation]);

  const form = useForm<LivestockOperationFormValues>({
    resolver: zodResolver(livestockOperationFormSchema),
    defaultValues: {
      ciclo: operation?.ciclo || "CONFINAMENTO",
      origem: operation?.origem || "PROPRIO",
      propriedade_id: operation?.propriedade_id || "",
      volume_abate_por_safra: operation?.volume_abate_por_safra || {},
    },
  });

  // Função para adicionar nova entrada de volume
  const addVolumeEntry = () => {
    setVolumeEntries([...volumeEntries, { harvestId: "", volume: 0 }]);
  };

  // Função para remover entrada de volume
  const removeVolumeEntry = (index: number) => {
    const newEntries = [...volumeEntries];
    const removedEntry = newEntries[index];

    // Remover da lista de safras selecionadas
    if (removedEntry.harvestId) {
      setSelectedHarvests((prev) =>
        prev.filter((id) => id !== removedEntry.harvestId)
      );
    }

    newEntries.splice(index, 1);
    setVolumeEntries(newEntries);
  };

  // Função para atualizar entrada de volume
  const updateVolumeEntry = (
    index: number,
    field: keyof VolumeEntry,
    value: string | number
  ) => {
    const newEntries = [...volumeEntries];

    // Se estiver atualizando o harvestId, atualize a lista de safras selecionadas
    if (field === "harvestId") {
      const oldHarvestId = newEntries[index].harvestId;
      if (oldHarvestId) {
        setSelectedHarvests((prev) => prev.filter((id) => id !== oldHarvestId));
      }
      if (value) {
        setSelectedHarvests((prev) => [...prev, value as string]);
      }
    }

    newEntries[index] = { ...newEntries[index], [field]: value };
    setVolumeEntries(newEntries);
  };

  // Função para converter entradas de volume em objeto para salvar
  const prepareVolumeData = (): Record<string, number> => {
    const volumeData: Record<string, number> = {};
    volumeEntries.forEach((entry) => {
      if (entry.harvestId && entry.volume) {
        volumeData[entry.harvestId] = Number(entry.volume);
      }
    });
    return volumeData;
  };

  const onSubmit = async (values: LivestockOperationFormValues) => {
    try {
      setIsSubmitting(true);

      // Validar se há pelo menos uma entrada de volume válida
      const volumeData = prepareVolumeData();
      if (Object.keys(volumeData).length === 0) {
        toast.error("Adicione pelo menos um volume de abate por safra.");
        setIsSubmitting(false);
        return;
      }

      values.volume_abate_por_safra = volumeData;

      let result: LivestockOperation;

      if (isEditing && operation?.id) {
        // Atualizar item existente
        result = await updateLivestockOperation(operation.id, values);
        toast.success("Operação pecuária atualizada com sucesso!");
      } else {
        // Criar novo item
        result = await createLivestockOperation(organizationId, values);
        toast.success("Operação pecuária criada com sucesso!");
      }

      if (onSuccess) {
        onSuccess(result);
      }
    } catch (error) {
      console.error("Erro ao salvar operação pecuária:", error);
      toast.error("Ocorreu um erro ao salvar a operação pecuária.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Filtrar safras disponíveis (não selecionadas)
  const availableHarvests = harvests.filter(
    (harvest) => !selectedHarvests.includes(harvest.id || "")
  );

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="ciclo"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">Ciclo</FormLabel>
                <FormDescription className="text-xs text-muted-foreground mt-0 mb-1.5">
                  Tipo de ciclo da operação
                </FormDescription>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={isSubmitting}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione o ciclo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="CONFINAMENTO">Confinamento</SelectItem>
                    <SelectItem value="PASTO">Pasto</SelectItem>
                    <SelectItem value="SEMICONFINAMENTO">
                      Semiconfinamento
                    </SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="origem"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">Origem</FormLabel>
                <FormDescription className="text-xs text-muted-foreground mt-0 mb-1.5">
                  Origem dos animais
                </FormDescription>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={isSubmitting}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione a origem" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="PROPRIO">Próprio</SelectItem>
                    <SelectItem value="TERCEIRO">Terceiro</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="propriedade_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-sm font-medium">Propriedade</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
                disabled={isSubmitting}
              >
                <FormControl>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Selecione a propriedade" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {properties.map((property) => (
                    <SelectItem key={property.id} value={property.id}>
                      {property.nome}
                      {property.cidade && property.estado && (
                        <span className="text-muted-foreground ml-1">
                          ({property.cidade}/{property.estado})
                        </span>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <Separator className="my-4" />

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium">Volume de Abate por Safra</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Informe o volume de abate projetado para cada safra
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addVolumeEntry}
              disabled={isSubmitting || availableHarvests.length === 0}
              className={cn(
                "transition-all",
                availableHarvests.length > 0 &&
                  "hover:bg-primary/10 hover:text-primary ml-2"
              )}
            >
              <Plus className="h-4 w-4 mr-1" />
              Adicionar Safra
            </Button>
          </div>

          {volumeEntries.length === 0 && (
            <Alert variant="default" className="bg-muted/50 border-muted">
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
              <AlertDescription className="text-sm text-muted-foreground">
                Adicione pelo menos um volume de abate por safra.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-3">
            {volumeEntries.map((entry, index) => (
              <div
                key={index}
                className="flex items-end gap-2 p-3 rounded-md border bg-card/50"
              >
                <div className="flex-1">
                  <FormLabel className="text-xs">Safra</FormLabel>
                  <Select
                    value={entry.harvestId}
                    onValueChange={(value) =>
                      updateVolumeEntry(index, "harvestId", value)
                    }
                    disabled={isSubmitting}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a safra" />
                    </SelectTrigger>
                    <SelectContent>
                      {harvests
                        .filter(
                          (harvest) =>
                            !selectedHarvests.includes(harvest.id || "") ||
                            entry.harvestId === harvest.id
                        )
                        .map((harvest) => (
                          <SelectItem key={harvest.id} value={harvest.id || ""}>
                            {harvest.nome}
                            {harvest.ano_fim && (
                              <Badge
                                variant="outline"
                                className="ml-2 py-0 h-4"
                              >
                                {harvest.ano_fim}
                              </Badge>
                            )}
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="w-24">
                  <FormLabel className="text-xs">Volume</FormLabel>
                  <Input
                    type="number"
                    placeholder="Volume"
                    value={entry.volume}
                    onChange={(e) =>
                      updateVolumeEntry(index, "volume", e.target.value)
                    }
                    min={0}
                    disabled={isSubmitting}
                    className="w-full"
                  />
                </div>

                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => removeVolumeEntry(index)}
                  disabled={isSubmitting || volumeEntries.length === 1}
                  className="h-10 w-10 text-destructive hover:text-destructive/80 hover:bg-destructive/10"
                >
                  <Trash className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="min-w-[100px]"
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? "Atualizar" : "Criar"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
