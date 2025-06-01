"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  ProjecaoConfigFormValues,
  projecaoConfigFormSchema,
} from "@/schemas/projections";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import {
  createProjecaoConfig,
  updateProjecaoConfig,
} from "@/lib/actions/projections-actions";
import { useState, useEffect } from "react";
import { toast } from "sonner";

interface ProjecaoConfig {
  id: string;
  nome: string;
  descricao?: string;
  periodo_inicio: number;
  periodo_fim: number;
  formato_safra: "SAFRA_COMPLETA" | "ANO_CIVIL";
  status: "ATIVA" | "INATIVA" | "ARQUIVADA";
  eh_padrao: boolean;
}

interface ProjectionConfigFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (config: ProjecaoConfig) => void;
  organizationId: string;
  initialData?: ProjecaoConfig | null;
}

export function ProjectionConfigForm({
  isOpen,
  onClose,
  onSuccess,
  organizationId,
  initialData,
}: ProjectionConfigFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const isEditing = !!initialData;

  const form = useForm({
    resolver: zodResolver(projecaoConfigFormSchema),
    defaultValues: {
      nome: "",
      descricao: "",
      periodo_inicio: new Date().getFullYear(),
      periodo_fim: new Date().getFullYear() + 5,
      formato_safra: "SAFRA_COMPLETA",
      status: "ATIVA",
      eh_padrao: false,
    },
  });

  useEffect(() => {
    if (initialData) {
      form.reset({
        nome: initialData.nome,
        descricao: initialData.descricao || "",
        periodo_inicio: initialData.periodo_inicio,
        periodo_fim: initialData.periodo_fim,
        formato_safra: initialData.formato_safra,
        status: initialData.status,
        eh_padrao: initialData.eh_padrao,
      });
    } else {
      form.reset({
        nome: "",
        descricao: "",
        periodo_inicio: new Date().getFullYear(),
        periodo_fim: new Date().getFullYear() + 5,
        formato_safra: "SAFRA_COMPLETA",
        status: "ATIVA",
        eh_padrao: false,
      });
    }
  }, [initialData, form]);

  const onSubmit = async (data: any) => {
    setIsLoading(true);
    try {
      let result;
      if (isEditing && initialData) {
        result = await updateProjecaoConfig(initialData.id, data);
      } else {
        result = await createProjecaoConfig(organizationId, data);
      }

      if ("error" in result) {
        console.error("Erro da action:", result.error);
        toast.error(result.error);
      } else {
        toast.success(
          isEditing
            ? "Configuração atualizada com sucesso"
            : "Configuração criada com sucesso"
        );
        onSuccess(result.data);
      }
    } catch (error) {
      console.error("Erro capturado:", error);
      toast.error("Erro ao salvar configuração");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Editar Configuração" : "Nova Configuração"}
          </DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome da Configuração</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: Projeção Safra 2024/25"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="descricao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição (Opcional)</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descreva o objetivo desta configuração..."
                      className="resize-none"
                      rows={3}
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="periodo_inicio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Período Início</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={2020}
                        max={2050}
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value))
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="periodo_fim"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Período Fim</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={2020}
                        max={2050}
                        {...field}
                        onChange={(e) =>
                          field.onChange(parseInt(e.target.value))
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="formato_safra"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Formato de Safra</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o formato" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="SAFRA_COMPLETA">
                          Safra Completa (Ex: 2023/24)
                        </SelectItem>
                        <SelectItem value="ANO_CIVIL">
                          Ano Civil (Ex: 2024)
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="ATIVA">Ativa</SelectItem>
                        <SelectItem value="INATIVA">Inativa</SelectItem>
                        <SelectItem value="ARQUIVADA">Arquivada</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="eh_padrao"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                  <div className="space-y-1 leading-none">
                    <FormLabel>Definir como configuração padrão</FormLabel>
                    <p className="text-xs text-muted-foreground">
                      Esta configuração será usada por padrão em novas projeções
                    </p>
                  </div>
                </FormItem>
              )}
            />

            <DialogFooter>
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Salvando..." : isEditing ? "Atualizar" : "Criar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
