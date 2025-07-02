"use client";

import { useState, useEffect, useTransition, useMemo } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { createCaixaDisponibilidades, updateCaixaDisponibilidades } from "@/lib/actions/financial-actions/caixa-disponibilidades";
import { CaixaDisponibilidadesListItem, CaixaDisponibilidadesFormValues, caixaDisponibilidadesFormSchema, caixaDisponibilidadesCategoriaEnum } from "@/schemas/financial/caixa_disponibilidades";
import { SafraFinancialEditorAllVisible } from "../common/safra-financial-editor-all-visible";
import { toast } from "sonner";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

interface CaixaDisponibilidadesFormRefactoredProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  existingItem?: CaixaDisponibilidadesListItem;
  onSubmit: (data: CaixaDisponibilidadesListItem) => void;
  initialSafras: any[];
}

export function CaixaDisponibilidadesForm({
  open,
  onOpenChange,
  organizationId,
  existingItem,
  onSubmit,
  initialSafras,
}: CaixaDisponibilidadesFormRefactoredProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Categorias disponíveis
  const categorias = useMemo(() => [
    { value: "CAIXA_BANCOS", label: "Caixa e Bancos" },
    { value: "CLIENTES", label: "Clientes" },
    { value: "ADIANTAMENTOS", label: "Adiantamento a Fornecedores" },
    { value: "EMPRESTIMOS", label: "Empréstimos a Terceiros" },
    { value: "ESTOQUE_DEFENSIVOS", label: "Estoque de Defensivos" },
    { value: "ESTOQUE_FERTILIZANTES", label: "Estoque de Fertilizantes" },
    { value: "ESTOQUE_ALMOXARIFADO", label: "Almoxarifado" },
    { value: "ESTOQUE_COMMODITIES", label: "Estoque de Commodities" },
    { value: "ESTOQUE_SEMENTES", label: "Estoque de Sementes" },
    { value: "SEMOVENTES", label: "Semoventes (Rebanho)" },
    { value: "ATIVO_BIOLOGICO", label: "Ativo Biológico" }
  ], []);

  // Modify the schema to remove the safra_id requirement and ensure moeda is properly typed
  const formSchema = useMemo(() => caixaDisponibilidadesFormSchema.omit({ safra_id: true }).extend({
    moeda: z.enum(["BRL", "USD"]).default("BRL")
  }), []);

  const form = useForm<Omit<CaixaDisponibilidadesFormValues, "safra_id">>({
    resolver: zodResolver(formSchema) as any,
    defaultValues: {
      nome: existingItem?.nome || "",
      categoria: existingItem?.categoria || "CAIXA_BANCOS",
      moeda: existingItem?.moeda || "BRL",
      valores_por_safra: existingItem?.valores_por_safra || {},
    },
  });

  // Form reset when modal opens - no data fetching useEffect needed!
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
        categoria: "CAIXA_BANCOS",
        moeda: "BRL",
        valores_por_safra: {},
      });
    }
  }, [open, existingItem, form]);

  const handleFormSubmit = async (data: Omit<CaixaDisponibilidadesFormValues, "safra_id">) => {
    setIsLoading(true);
    
    startTransition(async () => {
      try {
        let result;
        
        // Since we removed safra_id from the form, we need to add a dummy value
        // for compatibility with the server action
        const formData: CaixaDisponibilidadesFormValues = {
          ...data,
          safra_id: "" // This will be handled by the server action
        };
        
        if (existingItem) {
          // Atualizar item existente
          result = await updateCaixaDisponibilidades(existingItem.id!, formData);
        } else {
          // Criar novo item
          result = await createCaixaDisponibilidades(formData, organizationId);
        }
        
        onSubmit(result);
        onOpenChange(false);
      } catch (error: any) {
        console.error("Erro ao salvar caixa e disponibilidades:", error);
        
        // Exibir mensagem de erro mais específica se disponível
        if (error.message && error.message.includes("duplicate key")) {
          toast.error("Já existe um item com esta categoria");
        } else {
          toast.error("Erro ao salvar caixa e disponibilidades");
        }
      } finally {
        setIsLoading(false);
      }
    });
  };

  // Categoria atual para verificar se é "OUTROS"
  const currentCategory = form.watch("categoria");
  const isOutrosCategory = false; // "OUTROS" is not a valid category in the enum

  // Gerar subcategoria baseada no timestamp quando for OUTROS
  useEffect(() => {
    if (isOutrosCategory && !existingItem && open) {
      const timestamp = new Date().getTime().toString().slice(-6);
      const defaultName = `Outros_${timestamp}`;
      
      if (!form.getValues("nome")) {
        form.setValue("nome", defaultName);
      }
    }
  }, [isOutrosCategory, existingItem, open, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] p-0 overflow-hidden" style={{ width: "90vw", maxWidth: "800px" }}>
        <DialogHeader className="p-6 pb-2">
          <div className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" />
            <DialogTitle className="text-xl font-semibold">
              {existingItem ? "Editar" : "Novo"} Caixa e Disponibilidades
            </DialogTitle>
          </div>
          <DialogDescription className="text-muted-foreground mt-1">
            {existingItem 
              ? "Edite os detalhes do item de caixa e disponibilidades."
              : "Cadastre um novo item de caixa e disponibilidades."
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
                    <FormLabel>Nome/Descrição</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome ou descrição do item" {...field} />
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
                        {categorias.map((cat) => (
                          <SelectItem key={cat.value} value={cat.value}>
                            {cat.label}
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
                        description="Defina os valores para cada safra"
                        values={typeof field.value === 'object' && field.value !== null ? field.value : {}}
                        onChange={field.onChange}
                        safras={initialSafras}
                        disabled={isLoading || isPending}
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
                  disabled={isLoading || isPending}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isLoading || isPending}>
                  {isLoading || isPending ? "Salvando..." : existingItem ? "Atualizar" : "Adicionar"}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}