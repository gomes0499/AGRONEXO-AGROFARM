"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Plus, Trash } from "lucide-react";
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
import {
  LivestockOperation,
  LivestockOperationFormValues,
  livestockOperationFormSchema,
  livestockOperationCycleEnum,
  livestockOperationOriginEnum,
  Harvest
} from "@/schemas/production";
import { createLivestockOperation, updateLivestockOperation } from "@/lib/actions/production-actions";

// Define interface for the property entity
interface Property {
  id: string;
  nome: string;
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
  
  // Preparar o objeto volume_abate_por_safra
  useEffect(() => {
    if (isEditing && operation?.volume_abate_por_safra) {
      let volumeData: Record<string, number>;
      if (typeof operation.volume_abate_por_safra === 'string') {
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
        volume: Number(volume)
      }));
      
      setVolumeEntries(entries);
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
    newEntries.splice(index, 1);
    setVolumeEntries(newEntries);
  };
  
  // Função para atualizar entrada de volume
  const updateVolumeEntry = (index: number, field: keyof VolumeEntry, value: string | number) => {
    const newEntries = [...volumeEntries];
    newEntries[index] = { ...newEntries[index], [field]: value };
    setVolumeEntries(newEntries);
  };
  
  // Função para converter entradas de volume em objeto para salvar
  const prepareVolumeData = (): Record<string, number> => {
    const volumeData: Record<string, number> = {};
    volumeEntries.forEach(entry => {
      if (entry.harvestId && entry.volume) {
        volumeData[entry.harvestId] = Number(entry.volume);
      }
    });
    return volumeData;
  };
  
  const onSubmit = async (values: LivestockOperationFormValues) => {
    try {
      setIsSubmitting(true);
      
      // Preparar dados de volume de abate
      const volumeData = prepareVolumeData();
      values.volume_abate_por_safra = volumeData;
      
      if (isEditing && operation?.id) {
        // Atualizar item existente
        const updatedItem = await updateLivestockOperation(operation.id, values);
        toast.success("Operação pecuária atualizada com sucesso!");
        onSuccess?.(updatedItem);
      } else {
        // Criar novo item
        const newItem = await createLivestockOperation(organizationId, values);
        toast.success("Operação pecuária criada com sucesso!");
        onSuccess?.(newItem);
      }
    } catch (error) {
      console.error("Erro ao salvar operação pecuária:", error);
      toast.error("Ocorreu um erro ao salvar a operação pecuária.");
    } finally {
      setIsSubmitting(false);
    }
  };
  
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="ciclo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Ciclo</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o ciclo" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="CONFINAMENTO">Confinamento</SelectItem>
                    <SelectItem value="PASTO">Pasto</SelectItem>
                    <SelectItem value="SEMICONFINAMENTO">Semiconfinamento</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>Tipo de ciclo da operação</FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="origem"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Origem</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione a origem" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="PROPRIO">Próprio</SelectItem>
                    <SelectItem value="TERCEIRO">Terceiro</SelectItem>
                  </SelectContent>
                </Select>
                <FormDescription>Origem dos animais</FormDescription>
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
              <FormLabel>Propriedade</FormLabel>
              <Select
                onValueChange={field.onChange}
                defaultValue={field.value}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a propriedade" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {properties.map((property) => (
                    <SelectItem key={property.id} value={property.id}>
                      {property.nome} ({property.cidade}/{property.estado})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <FormLabel>Volume de Abate por Safra</FormLabel>
            <Button 
              type="button" 
              variant="outline" 
              size="sm"
              onClick={addVolumeEntry}
            >
              <Plus className="h-4 w-4 mr-2" /> 
              Adicionar Safra
            </Button>
          </div>
          <FormDescription>
            Informe o volume de abate projetado para cada safra
          </FormDescription>
          
          {volumeEntries.map((entry, index) => (
            <div key={index} className="flex items-center gap-2">
              <div className="flex-1">
                <FormLabel className="sr-only">Safra</FormLabel>
                <Select
                  value={entry.harvestId}
                  onValueChange={(value) => updateVolumeEntry(index, 'harvestId', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a safra" />
                  </SelectTrigger>
                  <SelectContent>
                    {harvests.map((harvest) => (
                      <SelectItem key={harvest.id} value={harvest.id || ""}>
                        {harvest.nome}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="flex-1">
                <FormLabel className="sr-only">Volume</FormLabel>
                <Input
                  type="number"
                  placeholder="Volume de abate"
                  value={entry.volume}
                  onChange={(e) => updateVolumeEntry(index, 'volume', e.target.value)}
                />
              </div>
              
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => removeVolumeEntry(index)}
                disabled={volumeEntries.length === 1}
              >
                <Trash className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
        
        <div className="flex justify-end gap-2 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            )}
            {isEditing ? "Atualizar" : "Criar"}
          </Button>
        </div>
      </form>
    </Form>
  );
}