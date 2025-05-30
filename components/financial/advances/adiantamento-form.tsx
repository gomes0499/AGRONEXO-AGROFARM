"use client";

import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
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
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import {
  Adiantamento,
  adiantamentoFormSchema,
} from "@/schemas/financial/adiantamentos";
import {
  createAdiantamento,
  updateAdiantamento,
  deleteAdiantamento,
} from "@/lib/actions/financial-actions/adiantamentos";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CurrencyField } from "@/components/shared/currency-field";

interface AdiantamentoFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  existingAdiantamento?: Adiantamento;
  onSubmit: (adiantamento: Adiantamento) => void;
  safras: { id: string; nome: string }[];
}

export function AdiantamentoForm({
  open,
  onOpenChange,
  organizationId,
  existingAdiantamento,
  onSubmit,
  safras,
}: AdiantamentoFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedSafra, setSelectedSafra] = useState<string>(
    safras[0]?.id || ""
  );
  const [safraValues, setSafraValues] = useState<Record<string, number>>(
    existingAdiantamento?.valores_por_safra || {}
  );

  // Definir valores iniciais do formulário
  const defaultValues = existingAdiantamento
    ? {
        nome: existingAdiantamento.nome,
      }
    : {
        nome: "",
      };

  // Configurar formulário com validação zod
  const form = useForm<z.infer<typeof adiantamentoFormSchema>>({
    resolver: zodResolver(adiantamentoFormSchema),
    defaultValues,
  });

  // Adicionar valor para uma safra
  const addSafraValue = (safraId: string, value: number) => {
    setSafraValues((prev) => ({
      ...prev,
      [safraId]: value,
    }));
  };

  // Remover valor de uma safra
  const removeSafraValue = (safraId: string) => {
    const newValues = { ...safraValues };
    delete newValues[safraId];
    setSafraValues(newValues);
  };

  // Função para lidar com a submissão do formulário
  const handleSubmit = async (
    values: z.infer<typeof adiantamentoFormSchema>
  ) => {
    try {
      setIsSubmitting(true);

      // Verificar se temos valores para pelo menos uma safra
      if (Object.keys(safraValues).length === 0) {
        form.setError("root", {
          message: "Adicione pelo menos um valor para uma safra",
        });
        setIsSubmitting(false);
        return;
      }

      const adiantamentoData = {
        ...values,
        organizacao_id: organizationId,
        valores_por_safra: safraValues,
      };

      // Criar ou atualizar o adiantamento
      let result;
      if (existingAdiantamento) {
        result = await updateAdiantamento(
          existingAdiantamento.id!,
          adiantamentoData
        );
      } else {
        result = await createAdiantamento(adiantamentoData);
      }

      // Notificar o componente pai sobre o sucesso
      onSubmit(result);

      // Resetar o formulário e fechar o modal
      form.reset();
      setSafraValues({});
      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao salvar adiantamento:", error);
      form.setError("root", {
        message: `Erro ao salvar: ${
          error instanceof Error ? error.message : "erro desconhecido"
        }`,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Lidar com o fechamento do diálogo
  const handleOpenChange = (open: boolean) => {
    if (!open) {
      form.reset();
      setSafraValues(existingAdiantamento?.valores_por_safra || {});
    }
    onOpenChange(open);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {existingAdiantamento ? "Editar Adiantamento" : "Novo Adiantamento"}
          </DialogTitle>
          <DialogDescription>
            {existingAdiantamento
              ? "Edite os detalhes do adiantamento selecionado"
              : "Adicione um novo adiantamento ao sistema"}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(handleSubmit)}
            className="space-y-4"
          >
            {/* Campo de nome */}
            <FormField
              control={form.control}
              name="nome"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome/Descrição</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Ex: Pagamentos - Bancos" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Campos para valores por safra */}
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Valores por Safra</h3>

              {/* Lista de valores por safra já adicionados */}
              {Object.keys(safraValues).length > 0 && (
                <div className="rounded-md border p-3 space-y-2">
                  {Object.entries(safraValues).map(([safraId, value]) => {
                    const safra = safras.find((s) => s.id === safraId);
                    return (
                      <div
                        key={safraId}
                        className="flex items-center justify-between text-sm"
                      >
                        <span>{safra?.nome || "Safra desconhecida"}</span>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {new Intl.NumberFormat("pt-BR", {
                              style: "currency",
                              currency: "BRL",
                            }).format(value)}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => removeSafraValue(safraId)}
                          >
                            Remover
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Interface para adicionar novos valores por safra */}
              <div className="flex items-end gap-2">
                <div className="flex-1">
                  <FormLabel>Safra</FormLabel>
                  <Select
                    value={selectedSafra}
                    onValueChange={setSelectedSafra}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione uma safra" />
                    </SelectTrigger>
                    <SelectContent>
                      {safras.map((safra) => (
                        <SelectItem key={safra.id} value={safra.id}>
                          {safra.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex-1">
                  <FormLabel>Valor</FormLabel>
                  <CurrencyField
                    id="safra-value"
                    placeholder="R$ 0,00"
                    onChange={(value: any) => {
                      // Nada a fazer aqui, vamos usar o valor apenas no botão adicionar
                    }}
                  />
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    const valueInput = document.getElementById(
                      "safra-value"
                    ) as HTMLInputElement;
                    if (valueInput && selectedSafra) {
                      // Remover formatação e converter para número
                      const rawValue = valueInput.value
                        .replace(/[^\d,]/g, "")
                        .replace(",", ".");
                      const value = parseFloat(rawValue);

                      if (!isNaN(value) && value > 0) {
                        addSafraValue(selectedSafra, value);
                        valueInput.value = "";
                      }
                    }
                  }}
                >
                  Adicionar
                </Button>
              </div>
            </div>

            {/* Mensagem de erro geral */}
            {form.formState.errors.root && (
              <p className="text-sm text-destructive">
                {form.formState.errors.root.message}
              </p>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {existingAdiantamento ? "Atualizar" : "Salvar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
