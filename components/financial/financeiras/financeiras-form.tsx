"use client";

import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { BanknoteIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { createFinanceiras, updateFinanceiras } from "@/lib/actions/financial-actions/financeiras";
import { FinanceirasListItem, FinanceirasFormValues, financeirasFormSchema, financeirasCategoriasEnum } from "@/schemas/financial/financeiras";
import { SafraFinancialEditorAllVisible } from "../common/safra-financial-editor-all-visible";
import { toast } from "sonner";
import { type Safra } from "@/lib/actions/financial-forms-data-actions";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

interface FinanceirasFormClientProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  existingItem?: FinanceirasListItem;
  onSubmit: (data: FinanceirasListItem) => void;
  initialSafras: Safra[];
}

export function FinanceirasForm({
  open,
  onOpenChange,
  organizationId,
  existingItem,
  onSubmit,
  initialSafras,
}: FinanceirasFormClientProps) {
  const [isLoading, setIsLoading] = useState(false);

  // Modify the schema to remove the safra_id requirement
  const formSchema = financeirasFormSchema.omit({ safra_id: true });

  const form = useForm<Omit<FinanceirasFormValues, "safra_id">>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      nome: existingItem?.nome || "",
      categoria: existingItem?.categoria || "OUTROS_CREDITOS",
      moeda: existingItem?.moeda || "BRL",
      valores_por_safra: existingItem?.valores_por_safra || {},
    },
  });

  useEffect(() => {
    if (open && existingItem) {
      form.reset({
        nome: existingItem.nome,
        categoria: existingItem.categoria,
        moeda: existingItem.moeda || "BRL",
        valores_por_safra: existingItem.valores_por_safra || {},
      });
    } else if (open && !existingItem) {
      form.reset({
        nome: "",
        categoria: "OUTROS_CREDITOS",
        moeda: "BRL",
        valores_por_safra: {},
      });
    }
  }, [open, existingItem, form]);

  const handleFormSubmit = async (data: Omit<FinanceirasFormValues, "safra_id">) => {
    setIsLoading(true);
    try {
      let result;
      
      // Since we removed safra_id from the form, we need to add a dummy value
      // for compatibility with the server action
      const formData = {
        ...data,
        safra_id: "00000000-0000-0000-0000-000000000000", // Dummy UUID
      };
      
      if (existingItem && existingItem.id) {
        // Atualizar item existente (garantir que id existe)
        result = await updateFinanceiras(existingItem.id, formData);
      } else {
        // Criar novo item
        result = await createFinanceiras(formData, organizationId);
      }
      
      onSubmit(result);
      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao salvar item financeiro:", error);
      toast.error("Erro ao salvar item financeiro");
    } finally {
      setIsLoading(false);
    }
  };

  // Mapear categorias para nomes mais amigáveis para o usuário
  const categoriaLabels: Record<string, string> = {
    OUTROS_CREDITOS: "Outros Créditos",
    REFINANCIAMENTO_BANCOS: "Refinanciamento - Bancos",
    REFINANCIAMENTO_CLIENTES: "Refinanciamento - Clientes",
    NOVAS_LINHAS_CREDITO: "Novas Linhas de Crédito"
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] p-0 overflow-hidden" style={{ width: "90vw", maxWidth: "800px" }}>
        <DialogHeader className="p-6 pb-2">
          <div className="flex items-center gap-2">
            <BanknoteIcon className="h-5 w-5 text-primary" />
            <DialogTitle className="text-xl font-semibold">
              {existingItem ? "Editar" : "Nova"} Operação Financeira
            </DialogTitle>
          </div>
          <DialogDescription className="text-muted-foreground mt-1">
            {existingItem 
              ? "Edite os detalhes da operação financeira."
              : "Cadastre uma nova operação financeira."
            }
          </DialogDescription>
        </DialogHeader>
        
        <div className="px-6 py-2 max-h-[70vh] overflow-y-auto">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleFormSubmit as any)} className="space-y-4">
              <FormField
                control={form.control as any}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome da operação financeira" {...field} />
                    </FormControl>
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
                          <SelectValue placeholder="Selecione uma categoria" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {financeirasCategoriasEnum.options.map((cat) => (
                          <SelectItem key={cat} value={cat}>
                            {categoriaLabels[cat] || cat}
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
                name="moeda"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Moeda</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a moeda" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="BRL">Real (R$)</SelectItem>
                        <SelectItem value="USD">Dólar (US$)</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control as any}
                name="valores_por_safra"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <SafraFinancialEditorAllVisible
                        label="Valores por Safra"
                        description="Defina os valores da operação financeira para cada safra"
                        values={typeof field.value === 'string' ? JSON.parse(field.value) : field.value || {}}
                        onChange={field.onChange}
                        safras={initialSafras}
                        disabled={isLoading}
                        currency={form.watch("moeda") as "BRL" | "USD"}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isLoading}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? "Salvando..." : existingItem ? "Atualizar" : "Adicionar"}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}