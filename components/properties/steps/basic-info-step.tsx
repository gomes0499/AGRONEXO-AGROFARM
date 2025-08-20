import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { DatePicker } from "@/components/shared/datepicker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import type { UseFormReturn } from "react-hook-form";
import type { PropertyFormValues, anuenciaTypeEnum } from "@/schemas/properties";
import { PropertyImageUpload } from "../property-image-upload";
import { OwnersManager } from "../owners-manager";
import { useWatch } from "react-hook-form";
import { useEffect, useState } from "react";
import { SafraFinancialEditorAllVisible } from "@/components/financial/common/safra-financial-editor-all-visible";
import { getSafras } from "@/lib/actions/property-actions";
import { getCommodityPriceProjections } from "@/lib/actions/production-prices-actions";
import { toast } from "sonner";
import { useOrganization } from "@/components/auth/organization-provider";

interface BasicInfoStepProps {
  form: UseFormReturn<PropertyFormValues>;
  imageUrl: string | null;
  onImageSuccess: (url: string) => void;
  onImageRemove: () => void;
}

const BRAZILIAN_STATES = [
  { value: "AC", label: "Acre" },
  { value: "AL", label: "Alagoas" },
  { value: "AP", label: "Amapá" },
  { value: "AM", label: "Amazonas" },
  { value: "BA", label: "Bahia" },
  { value: "CE", label: "Ceará" },
  { value: "DF", label: "Distrito Federal" },
  { value: "ES", label: "Espírito Santo" },
  { value: "GO", label: "Goiás" },
  { value: "MA", label: "Maranhão" },
  { value: "MT", label: "Mato Grosso" },
  { value: "MS", label: "Mato Grosso do Sul" },
  { value: "MG", label: "Minas Gerais" },
  { value: "PA", label: "Pará" },
  { value: "PB", label: "Paraíba" },
  { value: "PR", label: "Paraná" },
  { value: "PE", label: "Pernambuco" },
  { value: "PI", label: "Piauí" },
  { value: "RJ", label: "Rio de Janeiro" },
  { value: "RN", label: "Rio Grande do Norte" },
  { value: "RS", label: "Rio Grande do Sul" },
  { value: "RO", label: "Rondônia" },
  { value: "RR", label: "Roraima" },
  { value: "SC", label: "Santa Catarina" },
  { value: "SP", label: "São Paulo" },
  { value: "SE", label: "Sergipe" },
  { value: "TO", label: "Tocantins" },
];

export function BasicInfoStep({
  form,
  imageUrl,
  onImageSuccess,
  onImageRemove,
}: BasicInfoStepProps) {
  const { organization } = useOrganization();
  const [safras, setSafras] = useState<any[]>([]);
  const [commodityPrices, setCommodityPrices] = useState<any[]>([]);
  
  // Watch the property type to conditionally render fields
  const propertyType = useWatch({
    control: form.control,
    name: "tipo",
    defaultValue: "PROPRIO"
  });

  const isLeased = propertyType === "ARRENDADO" || propertyType === "PARCERIA_AGRICOLA";
  
  // Watch area and cost for automatic calculation
  const areaTotal = useWatch({
    control: form.control,
    name: "area_total",
  });
  
  const custoHectare = useWatch({
    control: form.control,
    name: "custo_hectare",
  });
  
  // Controlar se é a primeira renderização para não limpar campos ao carregar
  const [isFirstRender, setIsFirstRender] = useState(true);
  
  // Quando o tipo mudar para arrendado, limpar o ano de aquisição
  // e quando mudar para próprio, limpar os campos de arrendamento
  useEffect(() => {
    // Não executar na primeira renderização (quando carrega os dados)
    if (isFirstRender) {
      setIsFirstRender(false);
      return;
    }
    
    if (isLeased) {
      // Se for arrendado, limpar o ano de aquisição
      form.setValue("ano_aquisicao", null, { shouldValidate: false });
    } else {
      // Se for próprio, limpar os campos específicos de arrendamento
      form.setValue("data_inicio", null, { shouldValidate: false });
      form.setValue("data_termino", null, { shouldValidate: false });
      form.setValue("tipo_anuencia", "", { shouldValidate: false });
      form.setValue("arrendantes", "", { shouldValidate: false });
      form.setValue("custo_hectare", null, { shouldValidate: false });
      form.setValue("tipo_pagamento", "SACAS", { shouldValidate: false });
      form.setValue("custos_por_safra", {}, { shouldValidate: false });
    }
  }, [isLeased]);
  
  // Buscar safras quando o tipo for arrendado
  useEffect(() => {
    const fetchSafras = async () => {
      if (isLeased && organization?.id) {
        try {
          const safrasList = await getSafras(organization.id);
          setSafras(safrasList);
        } catch (error) {
          console.error("Erro ao buscar safras:", error);
        }
      }
    };
    
    fetchSafras();
  }, [isLeased, organization?.id]);
  
  // Buscar preços de commodities
  useEffect(() => {
    const fetchCommodityPrices = async () => {
      if (isLeased) {
        try {
          const result = await getCommodityPriceProjections();
          if (result.data) {
            setCommodityPrices(result.data);
          }
        } catch (error) {
          console.error("Erro ao buscar preços:", error);
        }
      }
    };
    
    fetchCommodityPrices();
  }, [isLeased]);
  
  // Calcular valores por safra automaticamente (apenas se não existirem valores)
  useEffect(() => {
    // Só calcular se não houver valores já preenchidos
    const currentCustos = form.getValues("custos_por_safra");
    const hasExistingValues = currentCustos && Object.keys(currentCustos).length > 0 && 
                             Object.values(currentCustos).some(v => v > 0);
    
    if (isLeased && areaTotal && custoHectare && safras.length > 0 && 
        Array.isArray(commodityPrices) && !hasExistingValues) {
      const custosPorSafra: Record<string, number> = {};
      const sacasTotal = areaTotal * custoHectare;
      
      // Buscar preços de soja
      const sojaPrices = commodityPrices.find(p => 
        p.commodity_type === "SOJA_SEQUEIRO" || 
        (p.cultura && p.cultura.nome === "SOJA" && p.sistema && p.sistema.nome === "SEQUEIRO")
      );
      
      safras.forEach(safra => {
        if (safra.id) {
          let precoSafra = 150; // Preço padrão
          
          if (sojaPrices && sojaPrices.precos_por_ano) {
            // Tentar buscar preço por ID da safra
            precoSafra = sojaPrices.precos_por_ano[safra.id] || 
                        sojaPrices.precos_por_ano[safra.ano_inicio?.toString()] || 
                        sojaPrices.current_price || 
                        150;
          }
          
          custosPorSafra[safra.id] = sacasTotal * precoSafra;
        }
      });
      
      form.setValue("custos_por_safra", custosPorSafra, { shouldValidate: false });
    }
  }, [isLeased, areaTotal, custoHectare, safras, commodityPrices, form]);
  
  return (
    <div className="space-y-6">
      <div className="flex justify-start">
        <PropertyImageUpload
          currentImageUrl={imageUrl}
          onSuccess={onImageSuccess}
          onRemove={onImageRemove}
          isTemporary={true}
          variant="avatar"
          size="sm"
        />
      </div>

      {/* Informações Básicas */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
        <FormField
          control={form.control}
          name="nome"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Nome da Propriedade*
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="Ex: Fazenda São João"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Campo de proprietário único será mantido mas oculto */}
        <FormField
          control={form.control}
          name="proprietario"
          render={({ field }) => (
            <FormItem className="hidden">
              <FormControl>
                <Input {...field} value={field.value ?? ""} />
              </FormControl>
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="tipo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>
                Tipo de Propriedade*
              </FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="PROPRIO">Própria</SelectItem>
                  <SelectItem value="ARRENDADO">Arrendada</SelectItem>
                  <SelectItem value="PARCERIA_AGRICOLA">Parceria Agrícola</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <Separator />

      {/* Múltiplos Proprietários */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-muted-foreground">Proprietários</h4>
        <FormField
          control={form.control}
          name="proprietarios"
          render={({ field }) => (
            <FormItem>
              <FormControl>
                <OwnersManager 
                  form={form}
                  owners={field.value || []}
                  onChange={(owners) => {
                    field.onChange(owners);
                    // Atualizar o campo proprietario com o primeiro nome para compatibilidade
                    if (owners.length > 0) {
                      form.setValue("proprietario", owners[0].nome);
                    } else {
                      form.setValue("proprietario", null);
                    }
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <Separator />

      {/* Localização */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-muted-foreground">Localização</h4>
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
          <FormField
            control={form.control}
            name="cidade"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Cidade*
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="Nome da cidade"
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="estado"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Estado*
                </FormLabel>
                <Select onValueChange={field.onChange} value={field.value || undefined}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o estado" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {BRAZILIAN_STATES.map((state) => (
                      <SelectItem key={state.value} value={state.value}>
                        {state.label}
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
            name="numero_matricula"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Número da Matrícula*
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="Ex: 12345"
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>

      <Separator />

      {/* Áreas e Valores */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-muted-foreground">Áreas e Valores</h4>
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
          <FormField
            control={form.control}
            name="area_total"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Área Total (ha)*
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    {...field}
                    value={field.value ?? ""}
                    onChange={(e) => {
                      const value = e.target.value === "" ? null : parseFloat(e.target.value);
                      field.onChange(value);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="area_cultivada"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Área Cultivada (ha)
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    {...field}
                    value={field.value ?? ""}
                    onChange={(e) => {
                      const value = e.target.value === "" ? null : parseFloat(e.target.value);
                      field.onChange(value);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="area_pecuaria"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Área de Pecuária (ha)
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    {...field}
                    value={field.value ?? ""}
                    onChange={(e) => {
                      const value = e.target.value === "" ? null : parseFloat(e.target.value);
                      field.onChange(value);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
          <FormField
            control={form.control}
            name={isLeased ? "cartorio_registro" : "ano_aquisicao"}
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  {isLeased ? "Cartório de Registro" : "Ano de Aquisição*"}
                </FormLabel>
                <FormControl>
                  {isLeased ? (
                    <Input
                      placeholder="Nome do cartório"
                      {...field}
                      value={field.value ?? ""}
                    />
                  ) : (
                    <Input
                      type="number"
                      placeholder="2024"
                      {...field}
                      value={field.value ?? ""}
                      onChange={(e) => {
                        const value = e.target.value === "" ? null : parseInt(e.target.value);
                        field.onChange(value);
                      }}
                    />
                  )}
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="grid gap-4 grid-cols-1">
          <FormField
            control={form.control}
            name="numero_car"
            render={({ field }) => (
              <FormItem>
                <FormLabel>
                  Número do CAR
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="Cadastro Ambiental Rural"
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="possui_armazem"
            render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                <div className="space-y-0.5">
                  <FormLabel className="text-base">
                    Possui Armazém
                  </FormLabel>
                  <div className="text-sm text-muted-foreground">
                    Indica se a propriedade possui estrutura de armazenagem
                  </div>
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
        </div>
        
        {isLeased && (
          <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
            <FormField
              control={form.control}
              name="data_inicio"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>
                    Data de Início*
                  </FormLabel>
                  <DatePicker
                    date={field.value ? new Date(field.value) : undefined}
                    onSelect={field.onChange}
                    disabled={false}
                    placeholder="Data de início"
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="data_termino"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>
                    Data de Término*
                  </FormLabel>
                  <DatePicker
                    date={field.value ? new Date(field.value) : undefined}
                    onSelect={field.onChange}
                    disabled={false}
                    placeholder="Data de término"
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="tipo_anuencia"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>
                    Tipo de Anuência*
                  </FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    value={field.value || ""}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="COM_ANUENCIA">Com Anuência</SelectItem>
                      <SelectItem value="SEM_ANUENCIA">Sem Anuência</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}
        
        {isLeased && (
          <>
          {/* Campos adicionais de arrendamento */}
          <Separator className="my-4" />
          
          <div className="space-y-4">
            <h4 className="text-sm font-medium text-muted-foreground">Dados do Arrendamento</h4>
            
            <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
              <FormField
                control={form.control}
                name="arrendantes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>
                      Arrendantes*
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Nome dos arrendantes/proprietários"
                        {...field}
                        value={field.value ?? ""}
                        className="resize-none"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid gap-4 grid-cols-1">
                <FormField
                  control={form.control}
                  name="tipo_pagamento"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Tipo de Pagamento*
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || "SACAS"}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo de pagamento" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="SACAS">Sacas</SelectItem>
                          <SelectItem value="DINHEIRO">Dinheiro</SelectItem>
                          <SelectItem value="MISTO">Misto</SelectItem>
                          <SelectItem value="PERCENTUAL_PRODUCAO">% da Produção</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="custo_hectare"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Custo por Hectare (sacas)*
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="Ex: 13.50"
                          {...field}
                          value={field.value ?? ""}
                          onChange={(e) => {
                            const value = e.target.value === "" ? null : parseFloat(e.target.value);
                            field.onChange(value);
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>
            
            {/* Editor de custos por safra */}
            <FormField
              control={form.control}
              name="custos_por_safra"
              render={({ field }) => (
                <FormItem>
                  <SafraFinancialEditorAllVisible
                    label="Custos do Arrendamento por Safra"
                    description="Valores calculados automaticamente: Custo/ha × Área × Preço da Soja"
                    values={field.value || {}}
                    onChange={field.onChange}
                    safras={safras}
                    disabled={true}
                    currency="BRL"
                  />
                  {(!areaTotal || !custoHectare) && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Preencha a área total e o custo por hectare para calcular os valores
                    </p>
                  )}
                </FormItem>
              )}
            />
          </div>
          </>
        )}
      </div>
    </div>
  );
}