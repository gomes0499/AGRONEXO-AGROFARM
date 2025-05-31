"use client";

import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { createOutraDespesa, updateOutraDespesa } from "@/lib/actions/financial-actions/outras-despesas";
import { OutrasDespesasListItem, OutrasDespesasFormValues, outrasDespesasFormSchema } from "@/schemas/financial/outras_despesas";
import { SafraValueEditor } from "../common/safra-value-editor";
import { toast } from "sonner";
import { getSafras } from "@/lib/actions/production-actions";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";

interface OutrasDespesasFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  existingItem?: OutrasDespesasListItem;
  onSubmit: (data: OutrasDespesasListItem) => void;
}

export function OutrasDespesasForm({
  open,
  onOpenChange,
  organizationId,
  existingItem,
  onSubmit,
}: OutrasDespesasFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [safras, setSafras] = useState<any[]>([]);
  const [isLoadingSafras, setIsLoadingSafras] = useState(false);

  // Carregar safras quando o modal abrir
  useEffect(() => {
    if (open && organizationId) {
      loadSafras();
    }
  }, [open, organizationId]);
  
  const loadSafras = async () => {
    try {
      setIsLoadingSafras(true);
      const safrasData = await getSafras(organizationId);
      setSafras(safrasData);
    } catch (error) {
      console.error("Erro ao carregar safras:", error);
      toast.error("Erro ao carregar safras");
    } finally {
      setIsLoadingSafras(false);
    }
  };

  const form = useForm<OutrasDespesasFormValues>({
    resolver: zodResolver(outrasDespesasFormSchema),
    defaultValues: {
      nome: existingItem?.nome || "",
      categoria: existingItem?.categoria || "OUTROS",
      valores_por_safra: existingItem?.valores_por_safra || {},
    },
  });

  useEffect(() => {
    if (open && existingItem) {
      form.reset({
        nome: existingItem.nome,
        categoria: existingItem.categoria,
        valores_por_safra: existingItem.valores_por_safra || {},
      });
    } else if (open && !existingItem) {
      form.reset({
        nome: "",
        categoria: "OUTROS",
        valores_por_safra: {},
      });
    }
  }, [open, existingItem, form]);

  const handleFormSubmit = async (data: OutrasDespesasFormValues) => {
    setIsLoading(true);
    try {
      let result;
      
      if (existingItem) {
        // Atualizar item existente
        result = await updateOutraDespesa(existingItem.id, data, organizationId);
      } else {
        // Criar novo item
        result = await createOutraDespesa(data, organizationId);
      }
      
      onSubmit(result);
      onOpenChange(false);
    } catch (error: any) {
      console.error("Erro ao salvar despesa:", error);
      
      // Exibir mensagem de erro mais específica se disponível
      if (error.message && (
          error.message.includes("Já existe uma despesa com a categoria") || 
          error.message.includes("categoria") ||
          error.message.includes("não é válida")
        )) {
        toast.error(error.message);
      } else {
        toast.error("Erro ao salvar despesa");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Categorias disponíveis - alinhadas com o enum do banco de dados
  const categorias = [
    { value: "PRO_LABORE", label: "Pró-Labore" },
    { value: "TRIBUTARIAS", label: "Tributárias" },
    { value: "OUTRAS_OPERACIONAIS", label: "Outras Operacionais" },
    { value: "DESPESAS_ADMINISTRATIVAS", label: "Despesas Administrativas" },
    { value: "DESPESAS_COMERCIAIS", label: "Despesas Comerciais" },
    { value: "DESPESAS_FINANCEIRAS", label: "Despesas Financeiras" },
    { value: "MANUTENCAO", label: "Manutenção" },
    { value: "SEGUROS", label: "Seguros" },
    { value: "CONSULTORIAS", label: "Consultorias" },
    { value: "OUTROS", label: "Outros" }
  ];
  
  // Estado para rastrear se a categoria atual é "OUTROS"
  const currentCategory = form.watch("categoria");
  const isOutrosCategory = currentCategory === "OUTROS";
  
  // Gerar subcategoria baseada no timestamp quando for OUTROS
  useEffect(() => {
    if (isOutrosCategory && !existingItem && open) {
      // Se for categoria OUTROS e for um novo item, gerar um identificador único para o nome
      const timestamp = new Date().getTime().toString().slice(-6); // últimos 6 dígitos do timestamp
      const defaultName = `Outros_${timestamp}`;
      
      // Só definir o nome se estiver vazio
      if (!form.getValues("nome")) {
        form.setValue("nome", defaultName);
      }
    }
  }, [isOutrosCategory, existingItem, open, form]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[500px] p-0 overflow-hidden">
        <DialogHeader className="p-6 pb-2">
          <div className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            <DialogTitle className="text-xl font-semibold">
              {existingItem ? "Editar" : "Nova"} Despesa
            </DialogTitle>
          </div>
          <DialogDescription className="text-muted-foreground mt-1">
            {existingItem 
              ? "Edite os detalhes da despesa."
              : "Cadastre uma nova despesa."
            }
          </DialogDescription>
        </DialogHeader>
        
        <div className="px-6 py-2 max-h-[70vh] overflow-y-auto">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome da despesa" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
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
                control={form.control}
                name="valores_por_safra"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valores por Safra</FormLabel>
                    <FormControl>
                      <SafraValueEditor
                        organizacaoId={organizationId}
                        values={field.value}
                        onChange={field.onChange}
                        safras={safras}
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