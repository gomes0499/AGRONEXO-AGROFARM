"use client";

import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { createCaixaDisponibilidades, updateCaixaDisponibilidades } from "@/lib/actions/financial-actions/caixa-disponibilidades";
import { CaixaDisponibilidadesListItem, CaixaDisponibilidadesFormValues, caixaDisponibilidadesFormSchema, caixaDisponibilidadesCategoriaEnum } from "@/schemas/financial/caixa_disponibilidades";
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

interface CaixaDisponibilidadesFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  existingItem?: CaixaDisponibilidadesListItem;
  onSubmit: (data: CaixaDisponibilidadesListItem) => void;
}

export function CaixaDisponibilidadesForm({
  open,
  onOpenChange,
  organizationId,
  existingItem,
  onSubmit,
}: CaixaDisponibilidadesFormProps) {
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

  // Modify the schema to remove the safra_id requirement
  const formSchema = caixaDisponibilidadesFormSchema.omit({ safra_id: true });

  const form = useForm<Omit<CaixaDisponibilidadesFormValues, "safra_id">>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      nome: existingItem?.nome || "",
      categoria: existingItem?.categoria || "CAIXA_BANCOS",
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
        categoria: "CAIXA_BANCOS",
        valores_por_safra: {},
      });
    }
  }, [open, existingItem, form]);

  const handleFormSubmit = async (data: Omit<CaixaDisponibilidadesFormValues, "safra_id">) => {
    setIsLoading(true);
    try {
      let result;
      
      // Since we removed safra_id from the form, we need to add a dummy value
      // for compatibility with the server action
      const formData = {
        ...data,
        safra_id: "00000000-0000-0000-0000-000000000000", // Dummy UUID
      };
      
      if (existingItem) {
        // Atualizar item existente
        result = await updateCaixaDisponibilidades(existingItem.id || "", formData);
      } else {
        // Criar novo item
        result = await createCaixaDisponibilidades(formData, organizationId);
      }
      
      onSubmit(result);
      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao salvar item de caixa e disponibilidades:", error);
      toast.error("Erro ao salvar item de caixa e disponibilidades");
    } finally {
      setIsLoading(false);
    }
  };

  // Mapear categorias para nomes mais amigáveis para o usuário
  const categoriaLabels: Record<string, string> = {
    CAIXA_BANCOS: "Caixa e Bancos",
    CLIENTES: "Clientes",
    ADIANTAMENTOS: "Adiantamentos",
    EMPRESTIMOS: "Empréstimos",
    ESTOQUE_DEFENSIVOS: "Estoque de Defensivos",
    ESTOQUE_FERTILIZANTES: "Estoque de Fertilizantes",
    ESTOQUE_ALMOXARIFADO: "Estoque de Almoxarifado",
    ESTOQUE_COMMODITIES: "Estoque de Commodities",
    SEMOVENTES: "Semoventes",
    ATIVO_BIOLOGICO: "Ativo Biológico"
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] p-0 overflow-hidden" style={{ width: "90vw", maxWidth: "800px" }}>
        <DialogHeader className="p-6 pb-2">
          <div className="flex items-center gap-2">
            <Wallet className="h-5 w-5 text-primary" />
            <DialogTitle className="text-xl font-semibold">
              {existingItem ? "Editar" : "Novo"} Item de Caixa e Disponibilidades
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
            <form onSubmit={form.handleSubmit(handleFormSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome do item" {...field} />
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
                        {caixaDisponibilidadesCategoriaEnum.options.map((cat) => (
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
                control={form.control}
                name="valores_por_safra"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valores por Safra</FormLabel>
                    <FormControl>
                      <SafraValueEditor
                        organizacaoId={organizationId}
                        values={typeof field.value === 'string' ? JSON.parse(field.value) : field.value || {}}
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