"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Loader2,
  TrendingUp,
  CalendarIcon,
  Leaf,
  Settings,
  Scale,
  MapPin,
  Plus,
  Trash2,
  Save,
  Globe,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  FormDescription,
} from "@/components/ui/form";
import {
  type Productivity,
  type ProductivityFormValues,
  productivityFormSchema,
  type Culture,
  type System,
  type Harvest,
} from "@/schemas/production";
import {
  createProductivity,
  updateProductivity,
} from "@/lib/actions/production-actions";
import { parseFormattedNumber } from "@/lib/utils/formatters";

// Define interface for the property entity
// Use the same Property type as in production-actions.ts
interface Property {
  id: string;
  organizacao_id: string;
  nome: string;
  cidade?: string;
  estado?: string;
  [key: string]: any;
}

interface ProductivityFormProps {
  cultures: Culture[];
  systems: System[];
  harvests: Harvest[];
  organizationId: string;
  productivity?: Productivity | null;
  properties: Property[];
  onSuccess?: (productivity: Productivity) => void;
  onCancel?: () => void;
}

// Unidades de produtividade com descrições e conversões
const PRODUCTIVITY_UNITS = [
  {
    value: "sc/ha",
    label: "Sacas por Hectare",
    shortLabel: "sc/ha",
    conversionToKg: 60,
  },
  {
    value: "@/ha",
    label: "Arrobas por Hectare",
    shortLabel: "@/ha",
    conversionToKg: 15,
  },
  {
    value: "kg/ha",
    label: "Quilos por Hectare",
    shortLabel: "kg/ha",
    conversionToKg: 1,
  },
  {
    value: "ton/ha",
    label: "Toneladas por Hectare",
    shortLabel: "ton/ha",
    conversionToKg: 1000,
  },
];

export function ProductivityForm({
  cultures,
  systems,
  harvests,
  organizationId,
  productivity = null,
  properties,
  onSuccess,
  onCancel,
}: ProductivityFormProps) {
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [selectedUnit, setSelectedUnit] = useState<string>("");
  const [equivalentValues, setEquivalentValues] = useState<
    Record<string, number>
  >({});
  const isEditing = !!productivity?.id;

  // Get the first safra from harvests for the initial form state
  const defaultHarvestId = harvests.length > 0 ? harvests[0].id || "" : "";
  
  const form = useForm<ProductivityFormValues>({
    resolver: zodResolver(productivityFormSchema),
    defaultValues: {
      cultura_id: productivity?.cultura_id || "",
      sistema_id: productivity?.sistema_id || "",
      propriedade_id: productivity?.propriedade_id || "",
      produtividades_por_safra: productivity?.produtividades_por_safra || {},
      observacoes: productivity?.observacoes || "",
    },
  });
  
  // Create state to track the currently selected safra
  const [selectedSafraId, setSelectedSafraId] = useState<string>(defaultHarvestId);
  // State for currently editing productivity value
  const [currentProductivity, setCurrentProductivity] = useState<number>(0);
  // State for currently editing unit
  const [currentUnit, setCurrentUnit] = useState<string>("sc/ha");

  // Initialize productivity and unit from form data if available
  useEffect(() => {
    if (productivity && selectedSafraId && productivity.produtividades_por_safra?.[selectedSafraId]) {
      const safraData = productivity.produtividades_por_safra[selectedSafraId];
      setCurrentProductivity(safraData.produtividade || 0);
      setCurrentUnit(safraData.unidade || "sc/ha");
      setSelectedUnit(safraData.unidade || "sc/ha");
      calculateEquivalentValues(safraData.produtividade || 0, safraData.unidade || "sc/ha");
    }
  }, [productivity, selectedSafraId]);
  
  // Watch for changes in the selected safra
  useEffect(() => {
    // Load existing data for the selected safra if available
    const produtividades = form.getValues("produtividades_por_safra");
    if (selectedSafraId && produtividades && produtividades[selectedSafraId]) {
      const safraData = produtividades[selectedSafraId];
      setCurrentProductivity(safraData.produtividade);
      setCurrentUnit(safraData.unidade);
      setSelectedUnit(safraData.unidade);
      calculateEquivalentValues(safraData.produtividade, safraData.unidade);
    } else {
      // Reset values if no data exists for this safra
      setCurrentProductivity(0);
      setCurrentUnit("sc/ha");
      setSelectedUnit("sc/ha");
      setEquivalentValues({});
    }
  }, [selectedSafraId, form]);

  // Calcular valores equivalentes em outras unidades
  const calculateEquivalentValues = (value: number, unit: string) => {
    if (!value || !unit) return;

    const selectedUnitInfo = PRODUCTIVITY_UNITS.find((u) => u.value === unit);
    if (!selectedUnitInfo) return;

    // Converter para kg/ha primeiro
    const valueInKg = value * selectedUnitInfo.conversionToKg;

    // Calcular para todas as outras unidades
    const equivalents: Record<string, number> = {};
    PRODUCTIVITY_UNITS.forEach((unitInfo) => {
      if (unitInfo.value !== unit) {
        equivalents[unitInfo.value] = valueInKg / unitInfo.conversionToKg;
      }
    });

    setEquivalentValues(equivalents);
  };

  // Encontrar detalhes da cultura, sistema e safra selecionados
  const selectedCulture = cultures.find(
    (c) => c.id === form.watch("cultura_id")
  );
  const selectedSystem = systems.find((s) => s.id === form.watch("sistema_id"));
  const selectedHarvest = harvests.find((h) => h.id === selectedSafraId);
  const selectedProperty = properties.find(
    (p) => p.id === form.watch("propriedade_id")
  );

  const onSubmit = async (values: ProductivityFormValues) => {
    try {
      setIsSubmitting(true);
      
      // Get the current state of produtividades_por_safra
      const produtividades = values.produtividades_por_safra;
      
      // Check if there's any productivity data to save
      if (!produtividades || Object.keys(produtividades).length === 0) {
        toast.error("Adicione pelo menos uma produtividade por safra");
        setIsSubmitting(false);
        return;
      }
      
      // Validate that required fields are selected
      if (!values.cultura_id) {
        toast.error("Selecione uma cultura");
        setIsSubmitting(false);
        return;
      }
      
      if (!values.sistema_id) {
        toast.error("Selecione um sistema");
        setIsSubmitting(false);
        return;
      }
      
      // Make sure all productivity values are positive
      const hasInvalidValues = Object.values(produtividades).some(
        data => data.produtividade <= 0
      );
      
      if (hasInvalidValues) {
        toast.error("Todas as produtividades devem ser maiores que zero");
        setIsSubmitting(false);
        return;
      }
      
      // Create or update the productivity record
      if (isEditing && productivity?.id) {
        // Update existing item
        const updatedItem = await updateProductivity(productivity.id, values);
        toast.success("Registro de produtividade atualizado com sucesso!");
        onSuccess?.(updatedItem);
      } else {
        // Create new item
        // Se selecionou "all", passar undefined para propriedade_id
        const propriedadeId = values.propriedade_id === "all" ? undefined : values.propriedade_id;
        
        const dataWithOrgId = {
          ...values,
          propriedade_id: propriedadeId,
          organizacao_id: organizationId
        };
        const newItem = await createProductivity(dataWithOrgId);
        toast.success(
          values.propriedade_id === "all" 
            ? "Produtividade média criada para todas as propriedades!" 
            : "Registro de produtividade criado com sucesso!"
        );
        onSuccess?.(newItem);
      }
    } catch (error) {
      console.error("Erro ao salvar registro de produtividade:", error);
      toast.error("Ocorreu um erro ao salvar o registro de produtividade.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          <FormItem>
            <FormLabel className="text-sm font-medium flex items-center gap-1.5">
              <CalendarIcon className="h-4 w-4 text-muted-foreground" />
              Safra
            </FormLabel>
            <Select
              onValueChange={(value) => {
                setSelectedSafraId(value);
                
                // Get the productivity data for this safra if it exists
                const produtividades = form.getValues("produtividades_por_safra");
                if (produtividades && produtividades[value]) {
                  const safraData = produtividades[value];
                  setCurrentProductivity(safraData.produtividade);
                  setCurrentUnit(safraData.unidade);
                  setSelectedUnit(safraData.unidade);
                  calculateEquivalentValues(safraData.produtividade, safraData.unidade);
                } else {
                  // Reset values if no data exists for this safra
                  setCurrentProductivity(0);
                  setCurrentUnit("sc/ha");
                  setSelectedUnit("sc/ha");
                  setEquivalentValues({});
                }
              }}
              value={selectedSafraId}
              disabled={isSubmitting}
            >
              <FormControl>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Selecione a safra" />
                </SelectTrigger>
              </FormControl>
              <SelectContent>
                {harvests.map((harvest) => {
                  // Check if this harvest already has productivity data
                  const produtividades = form.getValues("produtividades_por_safra");
                  const hasData = produtividades && produtividades[harvest.id || ""];
                  
                  return (
                    <SelectItem key={harvest.id} value={harvest.id || ""}>
                      <div className="flex items-center justify-between w-full">
                        <span>{harvest.nome}</span>
                        {hasData ? (
                          <Badge variant="default" className="ml-2 py-0 h-4 bg-green-100 text-green-800">
                            Configurada
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="ml-2 py-0 h-4">
                            Pendente
                          </Badge>
                        )}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
            <FormMessage />
          </FormItem>

          <FormField
            control={form.control}
            name="propriedade_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-sm font-medium flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-muted-foreground" />
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
                    <SelectItem value="all">
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-primary" />
                        <span className="font-medium">Todas as Propriedades</span>
                      </div>
                    </SelectItem>
                    <Separator className="my-1" />
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

          {(selectedProperty || form.watch("propriedade_id") === "all") && (
            <div className="text-sm text-muted-foreground bg-muted/30 p-3 rounded-md border border-muted">
              <p className="font-medium text-foreground">
                Propriedade selecionada:
              </p>
              <p className="mt-1">
                {form.watch("propriedade_id") === "all" 
                  ? "Todas as Propriedades (Valores Médios)" 
                  : selectedProperty?.nome}
                {selectedProperty && selectedProperty.cidade && selectedProperty.estado && (
                  <span>
                    {" "}
                    - {selectedProperty.cidade}/{selectedProperty.estado}
                  </span>
                )}
              </p>
              {selectedProperty?.areaTotal && (
                <p className="mt-1">
                  Área total: {selectedProperty.areaTotal} hectares
                </p>
              )}
              {form.watch("propriedade_id") === "all" && (
                <FormDescription className="text-xs mt-2">
                  A produtividade será calculada como média consolidada de todas as propriedades
                </FormDescription>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="cultura_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium flex items-center gap-1.5">
                    <Leaf className="h-4 w-4 text-muted-foreground" />
                    Cultura
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isSubmitting}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecione a cultura" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {cultures.map((culture) => (
                        <SelectItem key={culture.id} value={culture.id || ""}>
                          {culture.nome}
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
              name="sistema_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-sm font-medium flex items-center gap-1.5">
                    <Settings className="h-4 w-4 text-muted-foreground" />
                    Sistema
                  </FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={isSubmitting}
                  >
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecione o sistema" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {systems.map((system) => (
                        <SelectItem key={system.id} value={system.id || ""}>
                          {system.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <Separator className="my-2" />

          <div className="border rounded-md p-4 bg-muted/20">
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-sm font-medium flex items-center gap-1.5">
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
                Produtividade para {selectedHarvest?.nome || "Safra Selecionada"}
              </h4>
              
              {selectedSafraId && (
                <Button 
                  type="button" 
                  size="sm" 
                  variant="outline"
                  className="h-8"
                  onClick={() => {
                    if (!selectedSafraId) {
                      toast.error("Selecione uma safra primeiro");
                      return;
                    }
                    
                    if (currentProductivity <= 0) {
                      toast.error("Informe uma produtividade válida");
                      return;
                    }
                    
                    // Update the form's produtividades_por_safra field
                    const currentValues = form.getValues("produtividades_por_safra") || {};
                    // Ensure we're using proper type casting for the unit
                    const unitValue = currentUnit as "sc/ha" | "@/ha" | "kg/ha";
                    form.setValue("produtividades_por_safra", {
                      ...currentValues,
                      [selectedSafraId]: {
                        produtividade: currentProductivity,
                        unidade: unitValue
                      }
                    });
                    
                    toast.success(`Produtividade salva para ${selectedHarvest?.nome || "safra selecionada"}`);
                  }}
                  disabled={isSubmitting || !selectedSafraId || currentProductivity <= 0}
                >
                  <Save className="h-4 w-4 mr-1" />
                  Salvar para esta Safra
                </Button>
              )}
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-2">
              <FormItem>
                <FormLabel className="text-sm font-medium flex items-center gap-1.5">
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  Produção total
                </FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      type="text"
                      placeholder="Digite a produtividade"
                      value={
                        currentProductivity !== undefined && currentProductivity !== null
                          ? currentProductivity.toString()
                          : ""
                      }
                      onChange={(e) => {
                        // Limpa a formatação e pega apenas números e vírgulas
                        const cleanValue = e.target.value.replace(
                          /[^\d.,]/g,
                          ""
                        );
                        // Converte para número para armazenar no state
                        const numericValue = parseFormattedNumber(cleanValue);
                        // Handle null values
                        setCurrentProductivity(numericValue !== null ? numericValue : 0);
                        
                        // Calculate equivalent values
                        calculateEquivalentValues(numericValue !== null ? numericValue : 0, currentUnit);
                      }}
                      onBlur={(e) => {
                        // Format with 2 decimal places on blur
                        if (currentProductivity) {
                          e.target.value = currentProductivity.toFixed(2);
                        }
                      }}
                      onFocus={(e) => {
                        // Show just the number without formatting when focused
                        if (currentProductivity) {
                          e.target.value = currentProductivity.toString();
                        }
                      }}
                      disabled={isSubmitting || !selectedSafraId}
                      className="w-full"
                    />
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>

              <FormItem>
                <FormLabel className="text-sm font-medium flex items-center gap-1.5">
                  <Scale className="h-4 w-4 text-muted-foreground" />
                  Unidade
                </FormLabel>
                <Select
                  onValueChange={(value) => {
                    setCurrentUnit(value);
                    setSelectedUnit(value);
                    
                    // Calculate equivalent values
                    calculateEquivalentValues(currentProductivity, value);
                  }}
                  value={currentUnit}
                  disabled={isSubmitting || !selectedSafraId}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue placeholder="Selecione a unidade" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {PRODUCTIVITY_UNITS.map((unit) => (
                      <SelectItem key={unit.value} value={unit.value}>
                        {unit.label} ({unit.shortLabel})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            </div>
          </div>

          {/* Resumo e conversões */}
          {currentProductivity > 0 &&
            Object.keys(equivalentValues).length > 0 && (
              <Card className="mt-2 bg-muted/30 border-muted">
                <CardContent className="p-3">
                  <div className="flex flex-wrap gap-x-4 gap-y-2">
                    {selectedProperty && (
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-muted-foreground">
                          Propriedade:
                        </span>
                        <span className="text-sm font-medium">
                          {selectedProperty.nome}
                        </span>
                      </div>
                    )}

                    {selectedCulture && (
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-muted-foreground">
                          Cultura:
                        </span>
                        <span className="text-sm font-medium">
                          {selectedCulture.nome}
                        </span>
                      </div>
                    )}

                    {selectedHarvest && (
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-muted-foreground">
                          Safra:
                        </span>
                        <span className="text-sm font-medium">
                          {selectedHarvest.nome}
                        </span>
                      </div>
                    )}

                    {selectedSystem && (
                      <div className="flex items-center gap-1">
                        <span className="text-xs text-muted-foreground">
                          Sistema:
                        </span>
                        <span className="text-sm font-medium">
                          {selectedSystem.nome}
                        </span>
                      </div>
                    )}
                  </div>

                  <Separator className="my-2" />

                  <div className="text-xs font-medium text-muted-foreground mb-1.5">
                    Equivalente a:
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(equivalentValues).map(([unit, value]) => {
                      const unitInfo = PRODUCTIVITY_UNITS.find(
                        (u) => u.value === unit
                      );
                      return (
                        <Badge
                          key={unit}
                          variant="outline"
                          className="font-normal"
                        >
                          {value.toFixed(2)} {unitInfo?.shortLabel}
                        </Badge>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}

          {/* Resumo das produtividades configuradas */}
          {Object.keys(form.watch("produtividades_por_safra") || {}).length > 0 && (
            <Card className="mt-4 bg-muted/30 border-muted">
              <CardContent className="p-3">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-sm font-medium">Produtividades Configuradas</h4>
                  <span className="text-xs text-muted-foreground">
                    {Object.keys(form.watch("produtividades_por_safra") || {}).length} safra(s)
                  </span>
                </div>
                
                <div className="space-y-2 mt-2">
                  {Object.entries(form.watch("produtividades_por_safra") || {}).map(([safraId, data]) => {
                    const safra = harvests.find(h => h.id === safraId);
                    if (!safra) return null;
                    
                    return (
                      <div key={safraId} className="flex justify-between items-center p-2 bg-background rounded border">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="py-0 h-5">
                            {safra.nome}
                          </Badge>
                          <span className="text-sm font-medium">
                            {data.produtividade.toFixed(2)} {data.unidade}
                          </span>
                        </div>
                        
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                          onClick={() => {
                            // Remove this safra from produtividades_por_safra
                            const currentValues = {...form.getValues("produtividades_por_safra")};
                            delete currentValues[safraId];
                            form.setValue("produtividades_por_safra", currentValues);
                            
                            // If this is the currently selected safra, reset values
                            if (selectedSafraId === safraId) {
                              setCurrentProductivity(0);
                              setCurrentUnit("sc/ha");
                              setEquivalentValues({});
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
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
