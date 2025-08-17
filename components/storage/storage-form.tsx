"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Warehouse, Package, Wheat } from "lucide-react";
import { 
  createStorage, 
  updateStorage, 
  getPropertiesWithStorage,
  updatePropertyStorage 
} from "@/lib/actions/storage-actions";

const formSchema = z.object({
  propriedade_id: z.string().min(1, "Selecione uma propriedade"),
  tipo_armazenagem: z.enum(["graos", "algodao"], {
    required_error: "Selecione o tipo de armazenagem",
  }),
  capacidade_sacas: z.number().optional(),
  capacidade_fardos: z.number().optional(),
  possui_beneficiamento: z.boolean().default(false),
  observacoes: z.string().optional(),
}).refine(
  (data) => {
    if (data.tipo_armazenagem === "graos") {
      return data.capacidade_sacas && data.capacidade_sacas > 0;
    }
    if (data.tipo_armazenagem === "algodao") {
      return data.capacidade_fardos && data.capacidade_fardos > 0;
    }
    return false;
  },
  {
    message: "Informe a capacidade de armazenagem",
    path: ["capacidade_sacas"],
  }
);

type FormData = {
  propriedade_id: string;
  tipo_armazenagem: "graos" | "algodao";
  capacidade_sacas?: number;
  capacidade_fardos?: number;
  possui_beneficiamento: boolean;
  observacoes?: string;
};

interface StorageFormProps {
  organizationId: string;
  editingItem?: any;
  onSuccess: () => void;
  onCancel: () => void;
}

export function StorageForm({
  organizationId,
  editingItem,
  onSuccess,
  onCancel,
}: StorageFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [properties, setProperties] = useState<any[]>([]);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      propriedade_id: editingItem?.propriedade_id || "",
      tipo_armazenagem: editingItem?.tipo_armazenagem || "graos",
      capacidade_sacas: editingItem?.capacidade_sacas || 0,
      capacidade_fardos: editingItem?.capacidade_fardos || 0,
      possui_beneficiamento: editingItem?.possui_beneficiamento || false,
      observacoes: editingItem?.observacoes || "",
    },
  });

  const tipoArmazenagem = form.watch("tipo_armazenagem");

  useEffect(() => {
    loadProperties();
  }, [organizationId]);

  const loadProperties = async () => {
    try {
      const data = await getPropertiesWithStorage(organizationId);
      setProperties(data);
    } catch (error) {
      console.error("Erro ao carregar propriedades:", error);
      toast.error("Erro ao carregar propriedades");
    }
  };

  const onSubmit = async (data: FormData) => {
    setIsLoading(true);
    try {
      const storageData = {
        organizacao_id: organizationId,
        propriedade_id: data.propriedade_id,
        tipo_armazenagem: data.tipo_armazenagem,
        capacidade_sacas: data.tipo_armazenagem === "graos" ? (data.capacidade_sacas || 0) : undefined,
        capacidade_fardos: data.tipo_armazenagem === "algodao" ? (data.capacidade_fardos || 0) : undefined,
        possui_beneficiamento: data.possui_beneficiamento,
        observacoes: data.observacoes,
      };

      if (editingItem) {
        await updateStorage(editingItem.id, storageData);
        toast.success("Armazém atualizado com sucesso");
      } else {
        await createStorage(storageData);
        
        // Atualizar propriedade para indicar que possui armazém
        await updatePropertyStorage(data.propriedade_id, true);
        
        toast.success("Armazém cadastrado com sucesso");
      }

      onSuccess();
    } catch (error) {
      console.error("Erro ao salvar armazém:", error);
      toast.error("Erro ao salvar armazém");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open onOpenChange={onCancel}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Warehouse className="h-5 w-5" />
            {editingItem ? "Editar Armazém" : "Novo Armazém"}
          </DialogTitle>
          <DialogDescription>
            {editingItem 
              ? "Atualize as informações do armazém"
              : "Cadastre um novo armazém ou silo para armazenagem"
            }
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="propriedade_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Propriedade</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a propriedade" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {properties.length === 0 ? (
                        <div className="p-4 text-sm text-muted-foreground text-center">
                          <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p className="font-medium">Nenhuma propriedade disponível</p>
                          <p className="text-xs mt-1">
                            Apenas propriedades marcadas com "Possui Armazém" 
                            aparecem nesta lista.
                          </p>
                        </div>
                      ) : (
                        properties.map((prop) => (
                          <SelectItem key={prop.id} value={prop.id}>
                            {prop.nome}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Somente propriedades com "Possui Armazém" habilitado são listadas aqui
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="tipo_armazenagem"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo de Armazenagem</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="graos">
                        <div className="flex items-center gap-2">
                          <Wheat className="h-4 w-4" />
                          Grãos
                        </div>
                      </SelectItem>
                      <SelectItem value="algodao">
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4" />
                          Algodão
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormDescription>
                    Selecione o tipo de produto armazenado
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {tipoArmazenagem === "graos" ? (
              <FormField
                control={form.control}
                name="capacidade_sacas"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Capacidade (sacas)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0"
                        {...field}
                        value={field.value || 0}
                        onChange={(e) => field.onChange(Number(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormDescription>
                      Capacidade total em sacas de grãos
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ) : (
              <FormField
                control={form.control}
                name="capacidade_fardos"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Capacidade (fardos)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        placeholder="0"
                        {...field}
                        value={field.value || 0}
                        onChange={(e) => field.onChange(Number(e.target.value) || 0)}
                      />
                    </FormControl>
                    <FormDescription>
                      Capacidade total em fardos de algodão (1 fardo = 227kg)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            )}

            <FormField
              control={form.control}
              name="possui_beneficiamento"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">
                      Possui Beneficiamento
                    </FormLabel>
                    <FormDescription>
                      Indica se o armazém possui estrutura de beneficiamento
                    </FormDescription>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="observacoes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Observações adicionais..."
                      className="resize-none"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isLoading}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Salvando..." : editingItem ? "Atualizar" : "Cadastrar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}