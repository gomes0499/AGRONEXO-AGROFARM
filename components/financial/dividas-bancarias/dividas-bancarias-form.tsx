"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Building2, CalendarIcon, Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { createDividaBancaria, updateDividaBancaria } from "@/lib/actions/financial-actions/dividas-bancarias";
import { SafraFinancialEditorAllVisible } from "../common/safra-financial-editor-all-visible";
import { CurrencySelector } from "../common/currency-selector";
import { toast } from "sonner";
import { type Safra } from "@/lib/actions/financial-forms-data-actions";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface DividasBancariasFormClientProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  organizationId: string;
  existingDivida?: any;
  onSubmit: (data: any) => void;
  initialSafras: Safra[];
}

export function DividasBancariasForm({
  open,
  onOpenChange,
  organizationId,
  existingDivida,
  onSubmit,
  initialSafras,
}: DividasBancariasFormClientProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [datasIrregulares, setDatasIrregulares] = useState<Date[]>(
    existingDivida?.datas_pagamento_irregular?.map((d: string) => new Date(d)) || []
  );

  const form = useForm({
    defaultValues: {
      nome: existingDivida?.nome || "",
      categoria: existingDivida?.categoria || "CUSTEIO",
      tipo: existingDivida?.tipo || "BANCO",
      indexador: existingDivida?.indexador || "CDI",
      taxa_real: existingDivida?.taxa_real || 6.5,
      moeda: existingDivida?.moeda || "BRL",
      valores_por_safra: existingDivida?.valores_por_safra || {},
      // Novos campos de contrato
      numero_contrato: existingDivida?.numero_contrato || "",
      quantidade_parcelas: existingDivida?.quantidade_parcelas || "",
      periodicidade: existingDivida?.periodicidade || "",
      datas_pagamento_irregular: existingDivida?.datas_pagamento_irregular || [],
    },
  });

  const periodicidade = form.watch("periodicidade");

  // Reset form when modal opens/closes or existing data changes
  useEffect(() => {
    if (open && existingDivida) {
      form.reset({
        nome: existingDivida.nome,
        categoria: existingDivida.categoria,
        tipo: existingDivida.tipo || "BANCO",
        indexador: existingDivida.indexador || "CDI",
        taxa_real: existingDivida.taxa_real || 6.5,
        moeda: existingDivida.moeda || "BRL",
        valores_por_safra: existingDivida.valores_por_safra || {},
        numero_contrato: existingDivida.numero_contrato || "",
        quantidade_parcelas: existingDivida.quantidade_parcelas || "",
        periodicidade: existingDivida.periodicidade || "",
        datas_pagamento_irregular: existingDivida.datas_pagamento_irregular || [],
      });
      setDatasIrregulares(
        existingDivida.datas_pagamento_irregular?.map((d: string) => new Date(d)) || []
      );
    } else if (open && !existingDivida) {
      form.reset({
        nome: "",
        categoria: "CUSTEIO",
        tipo: "BANCO",
        indexador: "CDI",
        taxa_real: 6.5,
        moeda: "BRL",
        valores_por_safra: {},
        numero_contrato: "",
        quantidade_parcelas: "",
        periodicidade: "",
        datas_pagamento_irregular: [],
      });
      setDatasIrregulares([]);
    }
  }, [open, existingDivida, form]);

  const handleFormSubmit = async (data: any) => {
    setIsLoading(true);
    try {
      // Adicionar datas irregulares se a periodicidade for IRREGULAR
      const formData = {
        ...data,
        datas_pagamento_irregular: data.periodicidade === "IRREGULAR" 
          ? datasIrregulares.map(d => d.toISOString())
          : null,
      };
      
      let result;
      
      if (existingDivida) {
        // Atualizar dívida existente
        result = await updateDividaBancaria(existingDivida.id, formData, organizationId);
      } else {
        // Criar nova dívida
        result = await createDividaBancaria(formData, organizationId);
      }
      
      onSubmit(result);
      onOpenChange(false);
    } catch (error) {
      console.error("Erro ao salvar dívida bancária:", error);
      toast.error("Erro ao salvar dívida bancária");
    } finally {
      setIsLoading(false);
    }
  };

  // Categorias disponíveis
  const categorias = [
    { value: "CUSTEIO", label: "Custeio" },
    { value: "INVESTIMENTOS", label: "Investimentos" },
    { value: "OUTROS", label: "Outros" }
  ];
  
  // Tipos disponíveis
  const tipos = [
    { value: "BANCO", label: "Banco" },
    { value: "TRADING", label: "Trading" },
    { value: "OUTROS", label: "Outros" }
  ];
  
  // Indexadores disponíveis
  const indexadores = [
    { value: "CDI", label: "CDI" },
    { value: "SELIC", label: "SELIC" },
    { value: "IPCA", label: "IPCA" },
    { value: "PRE_FIXADO", label: "Pré-fixado" },
    { value: "DOLAR", label: "Dólar" }
  ];

  // Periodicidades disponíveis
  const periodicidades = [
    { value: "MENSAL", label: "Mensal" },
    { value: "BIMESTRAL", label: "Bimestral" },
    { value: "TRIMESTRAL", label: "Trimestral" },
    { value: "QUADRIMESTRAL", label: "Quadrimestral" },
    { value: "SEMESTRAL", label: "Semestral" },
    { value: "ANUAL", label: "Anual" },
    { value: "IRREGULAR", label: "Irregular" }
  ];

  // Funções para gerenciar datas irregulares
  const addDataIrregular = (date: Date | undefined) => {
    if (date) {
      setDatasIrregulares([...datasIrregulares, date]);
    }
  };

  const removeDataIrregular = (index: number) => {
    setDatasIrregulares(datasIrregulares.filter((_, i) => i !== index));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] p-0 overflow-hidden" style={{ width: "90vw", maxWidth: "800px" }}>
        <DialogHeader className="p-6 pb-2">
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-primary" />
            <DialogTitle className="text-xl font-semibold">
              {existingDivida ? "Editar" : "Nova"} Dívida Bancária
            </DialogTitle>
          </div>
          <DialogDescription className="text-muted-foreground mt-1">
            {existingDivida 
              ? "Edite os detalhes da dívida bancária."
              : "Cadastre uma nova dívida bancária."
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
                  <FormLabel>Nome da Instituição</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome da instituição bancária" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="categoria"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Modalidade</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione uma modalidade" />
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
                        {tipos.map((tipo) => (
                          <SelectItem key={tipo.value} value={tipo.value}>
                            {tipo.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="indexador"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Indexador</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o indexador" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {indexadores.map((item) => (
                          <SelectItem key={item.value} value={item.value}>
                            {item.label}
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
                name="taxa_real"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Taxa real (% a.a.)</FormLabel>
                    <FormControl>
                      <Input 
                        type="number" 
                        step="0.01" 
                        min="0" 
                        max="100"
                        placeholder="Taxa em % ao ano"
                        {...field}
                        onChange={(e) => field.onChange(parseFloat(e.target.value))}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="moeda"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <CurrencySelector
                      name="moeda"
                      label="Moeda"
                      control={form.control}
                      value={field.value}
                      onChange={field.onChange}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Seção de Informações do Contrato */}
            <div className="space-y-4 border-t pt-4">
              <h3 className="text-sm font-medium text-muted-foreground">Informações do Contrato</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="numero_contrato"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número do Contrato</FormLabel>
                      <FormControl>
                        <Input placeholder="Ex: 123456/2024" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="quantidade_parcelas"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantidade de Parcelas</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          min="1" 
                          placeholder="Ex: 12"
                          {...field}
                          onChange={(e) => field.onChange(e.target.value ? parseInt(e.target.value) : "")}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="periodicidade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Periodicidade dos Pagamentos</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      value={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a periodicidade" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {periodicidades.map((item) => (
                          <SelectItem key={item.value} value={item.value}>
                            {item.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Campo de datas irregulares - aparece apenas quando periodicidade é IRREGULAR */}
              {periodicidade === "IRREGULAR" && (
                <div className="space-y-3">
                  <FormLabel>Datas de Pagamento</FormLabel>
                  <FormDescription>
                    Adicione as datas específicas de cada pagamento
                  </FormDescription>
                  
                  <div className="flex gap-2">
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "w-full justify-start text-left font-normal",
                            !datasIrregulares.length && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          Adicionar data de pagamento
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0">
                        <Calendar
                          mode="single"
                          onSelect={addDataIrregular}
                          initialFocus
                          locale={ptBR}
                        />
                      </PopoverContent>
                    </Popover>
                  </div>

                  {/* Lista de datas adicionadas */}
                  {datasIrregulares.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm text-muted-foreground">
                        {datasIrregulares.length} data(s) adicionada(s):
                      </p>
                      <div className="max-h-32 overflow-y-auto space-y-1">
                        {datasIrregulares
                          .sort((a, b) => a.getTime() - b.getTime())
                          .map((date, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between p-2 bg-muted rounded-md"
                            >
                              <span className="text-sm">
                                {format(date, "dd/MM/yyyy", { locale: ptBR })}
                              </span>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => removeDataIrregular(index)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <FormField
              control={form.control}
              name="valores_por_safra"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <SafraFinancialEditorAllVisible
                      label="Valores por Safra"
                      description="Defina os valores da dívida para cada safra"
                      values={field.value || {}}
                      onChange={field.onChange}
                      safras={initialSafras}
                      disabled={isLoading}
                      currency={form.watch("moeda") as any}
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
                {isLoading ? "Salvando..." : existingDivida ? "Atualizar" : "Adicionar"}
              </Button>
            </div>
          </form>
        </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}