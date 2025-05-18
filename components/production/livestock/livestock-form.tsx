"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PriceUnitSelector, PRICE_UNITS, QUANTIDADE_LABELS } from "../common/price-unit-selector";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import {
  type Livestock,
  type LivestockFormValues,
  livestockFormSchema,
} from "@/schemas/production";
import {
  createLivestock,
  updateLivestock,
} from "@/lib/actions/production-actions";
import {
  formatCurrency,
  parseFormattedNumber,
  isNegativeValue,
} from "@/lib/utils/formatters";
import { cn } from "@/lib/utils";

// Define interface for the property entity
interface Property {
  id: string;
  nome: string;
  cidade?: string;
  estado?: string;
  [key: string]: any;
}

interface LivestockFormProps {
  properties: Property[];
  organizationId: string;
  livestock?: Livestock | null;
  onSuccess?: (livestock: Livestock) => void;
  onCancel?: () => void;
}

// Tipos de animais comuns no Brasil
const TIPOS_ANIMAIS = [
  "Bovino",
  "Suíno",
  "Ovino",
  "Caprino",
  "Equino",
  "Bubalino",
  "Aves",
  "Outro",
];

// Categorias por tipo de animal
const CATEGORIAS_POR_TIPO: Record<string, string[]> = {
  Bovino: [
    "Bezerro(a)",
    "Novilho(a)",
    "Boi",
    "Vaca",
    "Touro",
    "Matriz",
    "Garrote",
    "Boi Magro",
    "Boi Gordo",
    "Vaca de Leite",
    "Outro",
  ],
  Suíno: ["Leitão", "Porco de Engorda", "Matriz", "Reprodutor", "Outro"],
  Ovino: ["Cordeiro", "Ovelha", "Carneiro", "Matriz", "Reprodutor", "Outro"],
  Caprino: ["Cabrito", "Cabra", "Bode", "Matriz", "Reprodutor", "Outro"],
  Equino: ["Potro", "Potranca", "Cavalo", "Égua", "Garanhão", "Outro"],
  Bubalino: [
    "Bezerro(a)",
    "Novilho(a)",
    "Búfalo",
    "Búfala",
    "Reprodutor",
    "Outro",
  ],
  Aves: [
    "Frango de Corte",
    "Galinha Poedeira",
    "Matriz",
    "Reprodutor",
    "Outro",
  ],
  Outro: ["Outro"],
};

// Categorias genéricas para quando o tipo é "Outro"
const CATEGORIAS_GENERICAS = [
  "Filhote",
  "Jovem",
  "Adulto",
  "Reprodutor",
  "Matriz",
  "Outro",
];

// Componente reutilizável para campos de moeda
const CurrencyField = ({
  name,
  label,
  control,
  placeholder = "R$ 0,00",
  description,
  disabled = false,
}: {
  name: string;
  label: string;
  control: any;
  placeholder?: string;
  description?: string;
  disabled?: boolean;
}) => (
  <FormField
    control={control}
    name={name}
    render={({ field }) => {
      // Track input focus state
      const [isFocused, setIsFocused] = useState(false);

      return (
        <FormItem>
          <FormLabel className="text-sm font-medium">{label}</FormLabel>
          {description && (
            <FormDescription className="text-xs text-muted-foreground mt-0 mb-1.5">
              {description}
            </FormDescription>
          )}
          <FormControl>
            <input
              placeholder={placeholder}
              disabled={disabled}
              className={cn(
                "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
                isNegativeValue(field.value) &&
                  "text-red-600 focus:text-foreground"
              )}
              onChange={(e) => {
                // Allow continuous typing by preserving the raw input
                const rawValue = e.target.value.replace(/[^\d.,\-]/g, "");
                const numericValue = parseFormattedNumber(rawValue);
                field.onChange(numericValue);
              }}
              onBlur={(e) => {
                setIsFocused(false);
                field.onBlur();
                if (field.value !== undefined && field.value !== null) {
                  e.target.value = formatCurrency(field.value);
                }
              }}
              onFocus={(e) => {
                setIsFocused(true);
                if (field.value) {
                  // Show raw value without formatting for editing
                  e.target.value = String(Math.abs(field.value));
                } else {
                  e.target.value = "";
                }
              }}
              value={
                isFocused
                  ? field.value !== undefined && field.value !== null
                    ? String(Math.abs(field.value))
                    : ""
                  : field.value !== undefined && field.value !== null
                  ? formatCurrency(field.value)
                  : ""
              }
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      );
    }}
  />
);

export function LivestockForm({
  properties,
  organizationId,
  livestock = null,
  onSuccess,
  onCancel,
}: LivestockFormProps) {
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [totalValue, setTotalValue] = useState<number>(0);
  const [tipoAnimal, setTipoAnimal] = useState<string>(
    livestock?.tipo_animal || ""
  );
  const [outroTipoAnimal, setOutroTipoAnimal] = useState<string>("");
  const [outraCategoria, setOutraCategoria] = useState<string>("");
  const isEditing = !!livestock?.id;

  // Inicializar o tipo de animal e categoria personalizada se necessário
  useEffect(() => {
    if (livestock?.tipo_animal) {
      if (!TIPOS_ANIMAIS.includes(livestock.tipo_animal)) {
        setTipoAnimal("Outro");
        setOutroTipoAnimal(livestock.tipo_animal);
      } else {
        setTipoAnimal(livestock.tipo_animal);
      }
    }

    if (livestock?.categoria) {
      const categoriasDisponiveis =
        livestock.tipo_animal && TIPOS_ANIMAIS.includes(livestock.tipo_animal)
          ? CATEGORIAS_POR_TIPO[livestock.tipo_animal]
          : CATEGORIAS_GENERICAS;

      if (!categoriasDisponiveis.includes(livestock.categoria)) {
        setOutraCategoria(livestock.categoria);
      }
    }
  }, [livestock]);

  const form = useForm<LivestockFormValues>({
    resolver: zodResolver(livestockFormSchema),
    defaultValues: {
      tipo_animal: livestock?.tipo_animal || "",
      categoria: livestock?.categoria || "",
      quantidade: livestock?.quantidade || 0,
      preco_unitario: livestock?.preco_unitario || 0,
      unidade_preco: livestock?.unidade_preco || "CABECA",
      numero_cabecas: livestock?.numero_cabecas || livestock?.quantidade || 0, // Usar quantidade como fallback
      propriedade_id: livestock?.propriedade_id || "",
    },
  });

  // Calcular valor total quando quantidade ou preço unitário mudar
  useEffect(() => {
    const quantidade = form.watch("quantidade") || 0;
    const precoUnitario = form.watch("preco_unitario") || 0;
    setTotalValue(quantidade * precoUnitario);
  }, [form.watch("quantidade"), form.watch("preco_unitario"), form]);

  // Atualizar o tipo de animal no formulário quando mudar
  useEffect(() => {
    if (tipoAnimal === "Outro") {
      form.setValue("tipo_animal", outroTipoAnimal);
    } else {
      form.setValue("tipo_animal", tipoAnimal);
    }
  }, [tipoAnimal, outroTipoAnimal, form]);

  // Obter as categorias disponíveis com base no tipo de animal selecionado
  const getCategoriasDisponiveis = () => {
    if (tipoAnimal && tipoAnimal !== "Outro") {
      return CATEGORIAS_POR_TIPO[tipoAnimal];
    }
    return CATEGORIAS_GENERICAS;
  };

  const onSubmit = async (values: LivestockFormValues) => {
    try {
      setIsSubmitting(true);

      // Garantir que os valores personalizados sejam usados
      if (tipoAnimal === "Outro") {
        values.tipo_animal = outroTipoAnimal;
      }

      if (form.watch("categoria") === "Outro") {
        values.categoria = outraCategoria;
      }
      
      // Garantir que número de cabeças seja salvo corretamente
      if (values.unidade_preco === "CABECA") {
        // Se for em cabeças, a quantidade é o número de cabeças
        values.numero_cabecas = values.quantidade;
      } else if (!values.numero_cabecas || values.numero_cabecas === 0) {
        // Se não tiver número de cabeças definido, tentar usar um valor sensato
        // Este é um fallback para registros antigos que não têm esta informação
        values.numero_cabecas = 1;
      }

      if (isEditing && livestock?.id) {
        // Atualizar item existente
        const updatedItem = await updateLivestock(livestock.id, values);
        toast.success("Registro de rebanho atualizado com sucesso!");
        onSuccess?.(updatedItem);
      } else {
        // Criar novo item
        const newItem = await createLivestock(organizationId, values);
        toast.success("Registro de rebanho criado com sucesso!");
        onSuccess?.(newItem);
      }
    } catch (error) {
      console.error("Erro ao salvar registro de rebanho:", error);
      toast.error("Ocorreu um erro ao salvar o registro de rebanho.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Encontrar a propriedade selecionada
  const selectedProperty = properties.find(
    (p) => p.id === form.watch("propriedade_id")
  );

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-2">
            <FormField
              control={form.control}
              name="tipo_animal"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">
                    Tipo de Animal
                  </FormLabel>
                  <FormDescription className="text-xs text-muted-foreground mt-0 mb-1.5">
                    Tipo ou espécie do animal
                  </FormDescription>
                  <div className="space-y-3">
                    <Select
                      value={tipoAnimal}
                      onValueChange={(value) => {
                        setTipoAnimal(value);
                        // Resetar categoria quando mudar o tipo
                        form.setValue("categoria", "");
                      }}
                      disabled={isSubmitting}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Selecione o tipo de animal" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {TIPOS_ANIMAIS.map((tipo) => (
                          <SelectItem key={tipo} value={tipo}>
                            {tipo}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {tipoAnimal === "Outro" && (
                      <FormItem>
                        <FormControl>
                          <Input
                            placeholder="Especifique o tipo de animal"
                            value={outroTipoAnimal}
                            onChange={(e) => setOutroTipoAnimal(e.target.value)}
                            disabled={isSubmitting}
                            className="w-full"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="categoria"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">
                    Categoria
                  </FormLabel>
                  <FormDescription className="text-xs text-muted-foreground mt-0 mb-1.5">
                    Categoria, faixa etária ou sexo
                  </FormDescription>
                  <div className="space-y-3">
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled={isSubmitting || !tipoAnimal}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Selecione a categoria" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {getCategoriasDisponiveis().map((categoria) => (
                          <SelectItem key={categoria} value={categoria}>
                            {categoria}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    {field.value === "Outro" && (
                      <FormItem>
                        <FormControl>
                          <Input
                            placeholder="Especifique a categoria"
                            value={outraCategoria}
                            onChange={(e) => setOutraCategoria(e.target.value)}
                            disabled={isSubmitting}
                            className="w-full"
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Separator className="my-3" />

          <div className="grid gap-3">
            <FormField
              control={form.control}
              name="unidade_preco"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium">
                    Unidade de Preço
                  </FormLabel>
                  <FormDescription className="text-xs text-muted-foreground mt-0 mb-1.5">
                    Como o preço é calculado
                  </FormDescription>
                  <FormControl>
                    <PriceUnitSelector
                      value={field.value}
                      onChange={field.onChange}
                      disabled={isSubmitting}
                      className="w-full"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="quantidade"
                render={({ field }) => {
                  // Obter configuração baseada na unidade de preço
                  const unidadePreco = form.watch("unidade_preco") as keyof typeof QUANTIDADE_LABELS;
                  const config = QUANTIDADE_LABELS[unidadePreco] || QUANTIDADE_LABELS.CABECA;
                  
                  // Quando a unidade muda, atualizamos os valores relacionados
                  useEffect(() => {
                    // Se mudar de CABECA para outra unidade, guarde o número de cabeças original
                    if (unidadePreco !== "CABECA") {
                      const valorAtual = form.getValues("numero_cabecas");
                      if (!valorAtual || valorAtual === 0) {
                        form.setValue("numero_cabecas", field.value);
                      }
                    }
                    
                    // Se mudar para CABECA, restaure o número de cabeças
                    if (unidadePreco === "CABECA") {
                      const cabecas = form.getValues("numero_cabecas");
                      if (cabecas && cabecas > 0) {
                        field.onChange(cabecas);
                      }
                    }
                  }, [unidadePreco]);
                  
                  return (
                    <FormItem>
                      <FormLabel className="text-sm font-medium">
                        {config.label}
                      </FormLabel>
                      <FormDescription className="text-xs text-muted-foreground mt-0 mb-1.5">
                        {config.description}
                      </FormDescription>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          step={unidadePreco === "KG" ? "0.1" : "1"}
                          placeholder={config.placeholder}
                          {...field}
                          onChange={(e) => {
                            const value = e.target.value
                              ? parseFloat(e.target.value)
                              : 0;
                            field.onChange(value);
                          }}
                          value={field.value}
                          disabled={isSubmitting}
                          className="w-full"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />

              <CurrencyField
                name="preco_unitario"
                label="Preço Unitário (R$)"
                control={form.control}
                placeholder="Valor por unidade"
                description="Preço unitário conforme unidade selecionada"
                disabled={isSubmitting}
              />
            </div>
          </div>

          {totalValue > 0 && (
            <Card className="bg-muted/30 border-muted">
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium">Valor Total:</span>
                  <span className="text-lg font-semibold text-primary">
                    {formatCurrency(totalValue)}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {form.watch("unidade_preco") === "CABECA" 
                    ? `${form.watch("quantidade") || 0} ${form.watch("quantidade") === 1 ? "animal" : "animais"} × ${formatCurrency(form.watch("preco_unitario") || 0)}`
                    : form.watch("unidade_preco") === "KG" 
                      ? `${form.watch("quantidade") || 0} kg × ${formatCurrency(form.watch("preco_unitario") || 0)}/kg`
                      : form.watch("unidade_preco") === "ARROBA" 
                        ? `${form.watch("quantidade") || 0} @ × ${formatCurrency(form.watch("preco_unitario") || 0)}/@`
                        : `${form.watch("quantidade") || 0} ${form.watch("quantidade") === 1 ? "lote" : "lotes"} × ${formatCurrency(form.watch("preco_unitario") || 0)}`
                  }
                </p>
                {form.watch("unidade_preco") !== "CABECA" && form.watch("numero_cabecas") > 0 && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Total de {form.watch("numero_cabecas")} {form.watch("numero_cabecas") === 1 ? "cabeça" : "cabeças"}
                  </p>
                )}
              </CardContent>
            </Card>
          )}

          <FormField
            control={form.control}
            name="propriedade_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium">
                  Propriedade
                </FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value}
                  disabled={isSubmitting}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione a propriedade" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {properties.map((property: Property) => (
                      <SelectItem key={property.id} value={property.id}>
                        {property.nome}
                        {property.cidade && property.estado && (
                          <span className="text-muted-foreground ml-1">
                            ({property.cidade}/{property.estado})
                          </span>
                        )}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {selectedProperty && (
            <div className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-md border border-muted">
              <p className="font-medium text-foreground">
                Propriedade selecionada:
              </p>
              <p className="mt-1">
                {selectedProperty.nome}
                {selectedProperty.cidade && selectedProperty.estado && (
                  <span>
                    {" "}
                    - {selectedProperty.cidade}/{selectedProperty.estado}
                  </span>
                )}
              </p>
              {selectedProperty.area && (
                <p className="mt-1">Área: {selectedProperty.area} hectares</p>
              )}
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            Cancelar
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="min-w-[100px]"
          >
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditing ? "Atualizar" : "Criar"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
