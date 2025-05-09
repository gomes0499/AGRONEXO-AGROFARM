"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import {
  type Improvement,
  type ImprovementFormValues,
  improvementFormSchema,
} from "@/schemas/properties";
import {
  createImprovement,
  updateImprovement,
} from "@/lib/actions/property-actions";
import { formatCurrency, parseFormattedNumber } from "@/lib/utils/formatters";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Loader2 } from "lucide-react";
import Link from "next/link";

interface ImprovementFormProps {
  improvement?: Improvement;
  organizationId: string;
  propertyId: string;
  isModal?: boolean;
  onSuccess?: () => void;
}

export function ImprovementForm({
  improvement,
  organizationId,
  propertyId,
  isModal = false,
  onSuccess,
}: ImprovementFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!improvement?.id;

  const form = useForm<ImprovementFormValues>({
    resolver: zodResolver(improvementFormSchema),
    defaultValues: {
      propriedade_id: propertyId || "",
      descricao: improvement?.descricao || "",
      dimensoes: improvement?.dimensoes || "",
      valor: improvement?.valor || 0,
    },
  });

  const onSubmit = async (values: ImprovementFormValues) => {
    try {
      setIsSubmitting(true);
      if (isEditing) {
        await updateImprovement(improvement.id!, values);
        toast.success("Benfeitoria atualizada com sucesso!");
      } else {
        await createImprovement(organizationId, values);
        toast.success("Benfeitoria criada com sucesso!");
      }

      // Se estiver em um modal e tiver callback de sucesso, chama ele
      if (isModal && onSuccess) {
        onSuccess();
      } else {
        // Caso contrário, navega de volta para a página da propriedade
        router.push(`/dashboard/properties/${propertyId}`);
        router.refresh();
      }
    } catch (error) {
      console.error("Erro ao salvar benfeitoria:", error);
      toast.error("Ocorreu um erro ao salvar a benfeitoria.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Renderização condicional baseada no modo (modal ou página)
  if (isModal) {
    return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="descricao"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descrição</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Ex: Casa sede, galpão, curral, etc."
                    {...field}
                  />
                </FormControl>
                <FormDescription>
                  Tipo e descrição da benfeitoria
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="dimensoes"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Dimensões</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Ex: 200m², 10x15m, etc."
                    {...field}
                    value={field.value || ""}
                  />
                </FormControl>
                <FormDescription>
                  Tamanho ou dimensões da benfeitoria (opcional)
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="valor"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Valor (R$)</FormLabel>
                <FormControl>
                  <Input
                    type="text"
                    placeholder="Digite o valor da benfeitoria"
                    {...field}
                    onChange={(e) => {
                      // Limpa a formatação e pega apenas números e vírgulas
                      const cleanValue = e.target.value.replace(/[^\d.,]/g, "");
                      // Converte para número para armazenar no form
                      const numericValue = parseFormattedNumber(cleanValue);
                      field.onChange(numericValue);
                    }}
                    onBlur={(e) => {
                      field.onBlur();
                      // Se tiver um valor, formata ele ao sair do campo
                      if (field.value) {
                        const formattedValue = formatCurrency(field.value);
                        e.target.value = formattedValue;
                      }
                    }}
                    onFocus={(e) => {
                      // Quando ganhar foco, mostra apenas o número sem formatação
                      if (field.value) {
                        e.target.value = field.value.toString();
                      }
                    }}
                    value={
                      field.value !== undefined && field.value !== null
                        ? formatCurrency(field.value)
                        : ""
                    }
                  />
                </FormControl>
                <FormDescription>
                  Valor de mercado ou custo da benfeitoria
                </FormDescription>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex justify-end gap-2 pt-2">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {isEditing ? "Atualizar" : "Salvar"} Benfeitoria
            </Button>
          </div>
        </form>
      </Form>
    );
  }

  // Versão para página completa
  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle>Informações da Benfeitoria</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <FormField
                control={form.control}
                name="descricao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex: Casa sede, galpão, curral, etc."
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Tipo e descrição da benfeitoria
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="dimensoes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dimensões</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex: 200m², 10x15m, etc."
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormDescription>
                      Tamanho ou dimensões da benfeitoria (opcional)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="valor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor (R$)</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        placeholder="Digite o valor da benfeitoria"
                        {...field}
                        onChange={(e) => {
                          // Limpa a formatação e pega apenas números e vírgulas
                          const cleanValue = e.target.value.replace(
                            /[^\d.,]/g,
                            ""
                          );
                          // Converte para número para armazenar no form
                          const numericValue = parseFormattedNumber(cleanValue);
                          field.onChange(numericValue);
                        }}
                        onBlur={(e) => {
                          field.onBlur();
                          // Se tiver um valor, formata ele ao sair do campo
                          if (field.value) {
                            const formattedValue = formatCurrency(field.value);
                            e.target.value = formattedValue;
                          }
                        }}
                        onFocus={(e) => {
                          // Quando ganhar foco, mostra apenas o número sem formatação
                          if (field.value) {
                            e.target.value = field.value.toString();
                          }
                        }}
                        value={
                          field.value !== undefined && field.value !== null
                            ? formatCurrency(field.value)
                            : ""
                        }
                      />
                    </FormControl>
                    <FormDescription>
                      Valor de mercado ou custo da benfeitoria
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </CardContent>
          </Card>

          <div className="flex gap-2 justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push(`/dashboard/properties/${propertyId}`)}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              {isEditing ? "Atualizar Benfeitoria" : "Criar Benfeitoria"}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
