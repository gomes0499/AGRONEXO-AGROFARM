"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
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
import { BarChart3 } from "lucide-react";
import { toast } from "sonner";
import {
  CreateRatingMetricSchema,
  type CreateRatingMetric,
  type RatingMetric,
  METRIC_CATEGORIES,
} from "@/schemas/rating";
import {
  createRatingMetric,
  updateRatingMetric,
} from "@/lib/actions/flexible-rating-actions";

interface RatingMetricFormProps {
  organizationId: string;
  metric?: RatingMetric | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function RatingMetricForm({
  organizationId,
  metric,
  isOpen,
  onClose,
  onSuccess,
}: RatingMetricFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const isEditing = !!metric;

  const form = useForm<CreateRatingMetric>({
    resolver: zodResolver(CreateRatingMetricSchema) as any,
    defaultValues: {
      organizacao_id: organizationId,
      nome: metric?.nome || "",
      codigo: metric?.codigo || "",
      tipo: metric?.tipo || "QUANTITATIVE",
      categoria: metric?.categoria || "",
      descricao: metric?.descricao || "",
      unidade: metric?.unidade || "",
      is_predefined: metric?.is_predefined || false,
      is_active: metric?.is_active ?? true,
    },
  });


  const onSubmit = async (data: CreateRatingMetric) => {
    try {
      setIsLoading(true);

      if (isEditing) {
        await updateRatingMetric(metric!.id!, data);
        toast.success("Métrica atualizada com sucesso");
      } else {
        await createRatingMetric(data);
        toast.success("Métrica criada com sucesso");
      }

      onSuccess();
    } catch (error) {
      console.error("Error saving rating metric:", error);
      toast.error("Erro ao salvar métrica");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[60%] max-w-3xl w-full max-h-[98vh] overflow-hidden p-0">
        <div className="flex flex-col h-full max-h-[98vh]">
          <div className="flex-shrink-0 p-6 border-b">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                {isEditing
                  ? "Editar Métrica de Rating"
                  : "Nova Métrica de Rating"}
              </DialogTitle>
              <DialogDescription>
                {isEditing
                  ? "Atualize as configurações da métrica de rating"
                  : "Crie uma nova métrica personalizada para seus modelos de rating"}
              </DialogDescription>
            </DialogHeader>
          </div>

          <div className="flex-1 overflow-y-auto p-6">
            <Form {...form}>
              <form
                onSubmit={form.handleSubmit(onSubmit as any)}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={form.control as any}
                    name="nome"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nome da Métrica</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Ex: Sustentabilidade Ambiental"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control as any}
                    name="codigo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Código</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Ex: SUSTENTABILIDADE_AMBIENTAL"
                            {...field}
                            onChange={(e) =>
                              field.onChange(
                                e.target.value
                                  .toUpperCase()
                                  .replace(/\s+/g, "_")
                              )
                            }
                          />
                        </FormControl>

                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="descricao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Descrição</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Descreva o que esta métrica avalia..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <FormField
                    control={form.control as any}
                    name="tipo"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o tipo" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="QUANTITATIVE">
                              Quantitativa
                            </SelectItem>
                            <SelectItem value="QUALITATIVE">
                              Qualitativa
                            </SelectItem>
                          </SelectContent>
                        </Select>

                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control as any}
                    name="categoria"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Categoria</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a categoria" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {METRIC_CATEGORIES.map((category) => (
                              <SelectItem key={category} value={category}>
                                {category}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control as any}
                    name="unidade"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Unidade</FormLabel>
                        <FormControl>
                          <Input placeholder="Ex: %, R$, ratio" {...field} />
                        </FormControl>

                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="is_active"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center justify-between">
                      <div className="space-y-0.5">
                        <FormLabel className="text-sm">Métrica Ativa</FormLabel>
                        <FormDescription className="text-xs">
                          Apenas métricas ativas podem ser usadas em modelos
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
              </form>
            </Form>
          </div>

          {/* Footer with Actions */}
          <div className="flex-shrink-0 p-6 border-t">
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button
                type="button"
                onClick={form.handleSubmit(onSubmit)}
                disabled={isLoading}
              >
                {isLoading
                  ? "Salvando..."
                  : isEditing
                    ? "Atualizar Métrica"
                    : "Criar Métrica"}
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
