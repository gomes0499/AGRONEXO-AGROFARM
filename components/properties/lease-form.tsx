"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import {
  type Lease,
  type LeaseFormValues,
  leaseFormSchema,
  type Property,
} from "@/schemas/properties";
import {
  createLease,
  updateLease,
  getProperties,
  getPropertyById,
} from "@/lib/actions/property-actions";
import {
  formatArea,
  formatSacas,
  formatCurrency,
  parseFormattedNumber,
} from "@/lib/utils/formatters";
import { 
  CommodityType, 
  type CommodityTypeEnum,
  commodityDisplayNames,
} from "@/schemas/indicators/prices";
// Importar a ação especializada para o tenant GRUPO SAFRA BOA
import { getSafraCommodityPrices } from "@/lib/actions/indicator-actions/tenant-commodity-actions";

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
import { Textarea } from "@/components/ui/textarea";
import { DatePicker } from "@/components/shared/datepicker";
import { Card, CardContent } from "@/components/ui/card";
import {
  Loader2,
  FileTextIcon,
  CalculatorIcon,
  CalendarIcon,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface LeaseFormProps {
  lease?: Lease;
  organizationId: string;
  propertyId: string;
}

export function LeaseForm({
  lease,
  organizationId,
  propertyId,
}: LeaseFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [properties, setProperties] = useState<Property[]>([]);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(
    null
  );
  const [isLoadingProperties, setIsLoadingProperties] = useState(false);
  const [isLoadingCommodities, setIsLoadingCommodities] = useState(false);
  const [activeTab, setActiveTab] = useState("informacoes-contrato");
  const isEditing = !!lease?.id;
  
  // Estados para commodities e projeções
  const [commodities, setCommodities] = useState<any[]>([]);
  const [selectedCommodity, setSelectedCommodity] = useState<string>("SOJA_SEQUEIRO");
  const [projectionCosts, setProjectionCosts] = useState<{[year: string]: number}>({});
  
  // Determinar o ano atual e próximos 10 anos para projeção de custos
  const currentYear = new Date().getFullYear();
  const projectionYears = Array.from({ length: 5 }, (_, i) =>
    (currentYear + i).toString()
  );

  const form = useForm<LeaseFormValues>({
    resolver: zodResolver(leaseFormSchema),
    mode: "onSubmit", // Só validar quando o usuário submeter o formulário
    defaultValues: {
      propriedade_id: propertyId,
      numero_arrendamento: lease?.numero_arrendamento || "",
      area_fazenda: lease?.area_fazenda || 0,
      area_arrendada: lease?.area_arrendada || 0,
      nome_fazenda: lease?.nome_fazenda || "",
      arrendantes: lease?.arrendantes || "",
      data_inicio: lease?.data_inicio
        ? new Date(lease.data_inicio)
        : new Date(),
      data_termino: lease?.data_termino
        ? new Date(lease.data_termino)
        : new Date(new Date().setFullYear(new Date().getFullYear() + 5)),
      custo_hectare: lease?.custo_hectare || 0,
      custo_ano: lease?.custo_ano || 0,
      custos_projetados_anuais: lease?.custos_projetados_anuais || JSON.stringify({}),
    },
  });

  const onSubmit = async (values: LeaseFormValues) => {
    try {
      setIsSubmitting(true);
      
      // Garante que os custos projetados estão atualizados
      const currentCosts = projectionCosts;
      if (Object.keys(currentCosts).length > 0) {
        values.custos_projetados_anuais = JSON.stringify(currentCosts);
      }
      
      toast.info("Enviando formulário...");
      
      if (isEditing) {
        await updateLease(lease.id!, values);
        toast.success("Arrendamento atualizado com sucesso!");
      } else {
        await createLease(organizationId, values);
        toast.success("Arrendamento criado com sucesso!");
      }
      
      setTimeout(() => {
        router.push(`/dashboard/properties/${propertyId}`);
        router.refresh();
      }, 500);
    } catch (error) {
      toast.error("Ocorreu um erro ao salvar o arrendamento.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Função para calcular custo anual com base na área e custo por hectare
  const calculateAnnualCost = () => {
    const area = form.getValues("area_arrendada");
    const costPerHectare = form.getValues("custo_hectare");

    if (area && costPerHectare) {
      form.setValue("custo_ano", area * costPerHectare);
    }
  };

  // Buscar a lista de propriedades para o dropdown
  useEffect(() => {
    const fetchProperties = async () => {
      try {
        setIsLoadingProperties(true);
        const propertiesList = await getProperties(organizationId);
        setProperties(propertiesList);

        // Se for edição, use a propriedade atual
        if (isEditing && propertyId) {
          const currentProperty = propertiesList.find(
            (p) => p.id === propertyId
          );
          if (currentProperty) {
            setSelectedProperty(currentProperty);
          }
        }
        // Se for criação com propertyId pré-definido
        else if (propertyId) {
          try {
            const property = await getPropertyById(propertyId);
            setSelectedProperty(property);

            // Preencher automaticamente os campos relacionados à propriedade
            form.setValue("area_fazenda", property.area_total);
            form.setValue("nome_fazenda", property.nome);
          } catch (error) {
            toast.error("Erro ao buscar dados da propriedade");
          }
        }
      } catch (error) {
        toast.error("Erro ao carregar a lista de propriedades");
      } finally {
        setIsLoadingProperties(false);
      }
    };

    fetchProperties();
  }, [organizationId, propertyId, isEditing, form]);

  // Atualiza o custo anual quando a área ou o custo por hectare mudar
  useEffect(() => {
    calculateAnnualCost();
  }, [form.watch("area_arrendada"), form.watch("custo_hectare")]);

  // Função para atualizar a propriedade selecionada
  const handlePropertyChange = async (value: string) => {
    if (!value) return;

    form.setValue("propriedade_id", value);

    try {
      const property = await getPropertyById(value);
      setSelectedProperty(property);

      // Preencher automaticamente os campos relacionados à propriedade
      form.setValue("area_fazenda", property.area_total);
      form.setValue("nome_fazenda", property.nome);
    } catch (error) {
      toast.error("Erro ao buscar dados da propriedade");
    }
  };

  const handleNextTab = () => {
    setActiveTab("areas-custos");
  };

  const handlePreviousTab = () => {
    setActiveTab("informacoes-contrato");
  };

  const handleThirdTab = () => {
    setActiveTab("projecao-custos");
  };

  // Esta função foi removida para evitar a criação automática de commodities

  // Função para carregar preços de commodities usando a ação especializada
  const fetchCommodityPrices = async () => {
    try {
      setIsLoadingCommodities(true);
      
      // Usar a função especializada que sempre retorna os preços do GRUPO SAFRA BOA
      const commodityData = await getSafraCommodityPrices();
      
      if (commodityData.length > 0) {
        setCommodities(commodityData);
        
        // Pré-selecionar Soja Sequeiro se disponível
        const soja = commodityData.find(c => c.commodityType === "SOJA_SEQUEIRO");
        if (soja) {
          setSelectedCommodity("SOJA_SEQUEIRO");
        } else if (commodityData.length > 0) {
          setSelectedCommodity(commodityData[0].commodityType);
        }
      } else {
        toast.error("Erro ao carregar preços de commodities");
        setCommodities([]);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
      toast.error(`Erro ao carregar preços: ${errorMessage}`);
      setCommodities([]);
    } finally {
      setIsLoadingCommodities(false);
    }
  };

  // Apenas carregar commodities quando a página carregar
  useEffect(() => {
    if (organizationId || propertyId) {
      // Buscar os preços de commodities usando a função especializada para GRUPO SAFRA BOA
      fetchCommodityPrices();
    }
  }, [organizationId, propertyId]);
  
  // Adicionar uma função para recarregar preços quando a aba de projeção for selecionada
  useEffect(() => {
    if (activeTab === "projecao-custos" && organizationId) {
      fetchCommodityPrices();
    }
  }, [activeTab]);

  // Calcular os custos projetados com base no custo anual e preço da commodity
  useEffect(() => {
    const custo_ano = form.getValues("custo_ano");
    if (!custo_ano || commodities.length === 0) return;

    const selectedCommodityData = commodities.find(c => c.commodityType === selectedCommodity);
    if (!selectedCommodityData) return;

    const newProjectionCosts: {[year: string]: number} = {};
    
    // Ano atual - usando currentPrice
    newProjectionCosts[currentYear.toString()] = custo_ano * selectedCommodityData.currentPrice;
    
    // Anos futuros
    if (projectionYears.includes("2025")) 
      newProjectionCosts["2025"] = custo_ano * selectedCommodityData.price2025;
    if (projectionYears.includes("2026")) 
      newProjectionCosts["2026"] = custo_ano * selectedCommodityData.price2026;
    if (projectionYears.includes("2027")) 
      newProjectionCosts["2027"] = custo_ano * selectedCommodityData.price2027;
    if (projectionYears.includes("2028")) 
      newProjectionCosts["2028"] = custo_ano * selectedCommodityData.price2028;
    if (projectionYears.includes("2029")) 
      newProjectionCosts["2029"] = custo_ano * selectedCommodityData.price2029;

    setProjectionCosts(newProjectionCosts);
    
    // Atualizar o campo custos_projetados_anuais no formulário
    form.setValue("custos_projetados_anuais", JSON.stringify(newProjectionCosts));
  }, [form.watch("custo_ano"), selectedCommodity, commodities]);

  return (
    <div className="space-y-6">
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger
                value="informacoes-contrato"
                className="flex items-center gap-2"
              >
                <FileTextIcon size={16} />
                Informações do Contrato
              </TabsTrigger>
              <TabsTrigger
                value="areas-custos"
                className="flex items-center gap-2"
              >
                <CalculatorIcon size={16} />
                Áreas e Custos
              </TabsTrigger>
              <TabsTrigger
                value="projecao-custos"
                className="flex items-center gap-2"
              >
                <CalendarIcon size={16} />
                Projeção de Custos
              </TabsTrigger>
            </TabsList>

            <TabsContent value="informacoes-contrato">
              <Card>
                <CardContent className="pt-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Dropdown de Seleção de Propriedade */}
                    <FormField
                      control={form.control}
                      name="propriedade_id"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Propriedade Rural</FormLabel>
                          <Select
                            value={field.value}
                            onValueChange={handlePropertyChange}
                            disabled={
                              isEditing || isLoadingProperties || !!propertyId
                            }
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue
                                  placeholder={
                                    isLoadingProperties
                                      ? "Carregando..."
                                      : "Selecione uma propriedade"
                                  }
                                />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {properties.map((property) => (
                                <SelectItem
                                  key={property.id}
                                  value={property.id || ""}
                                >
                                  {property.nome} ({property.cidade}/
                                  {property.estado})
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            {selectedProperty
                              ? `Área total: ${selectedProperty.area_total} ha`
                              : "Escolha a propriedade para o arrendamento"}
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="numero_arrendamento"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Número do Contrato</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Número ou identificação do contrato"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="nome_fazenda"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome da Fazenda</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Nome da fazenda arrendada"
                              {...field}
                            />
                          </FormControl>
                          <FormDescription>
                            Preenchido automaticamente ao selecionar a
                            propriedade
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="arrendantes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Arrendantes</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Nome dos arrendantes/proprietários"
                            {...field}
                            className="resize-none"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="data_inicio"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Data de Início de Contrato</FormLabel>
                          <DatePicker
                            date={field.value}
                            setDate={field.onChange}
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
                          <FormLabel>Data de Término de Contrato</FormLabel>
                          <DatePicker
                            date={field.value}
                            setDate={field.onChange}
                          />
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex justify-end mt-6">
                    <Button type="button" onClick={handleNextTab}>
                      Próximo
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="areas-custos">
              <Card>
                <CardContent className="pt-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="area_fazenda"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Área Total da Fazenda (ha)</FormLabel>
                          <FormControl>
                            <Input
                              type="text"
                              placeholder="Digite a área total da fazenda"
                              {...field}
                              value={
                                field.value !== undefined &&
                                field.value !== null
                                  ? formatArea(field.value)
                                  : ""
                              }
                              disabled={true} // Somente leitura, preenchido automaticamente
                            />
                          </FormControl>
                          <FormDescription>
                            Em hectares (preenchido automaticamente)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="area_arrendada"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Área Arrendada (ha)</FormLabel>
                          <FormControl>
                            <Input
                              type="text"
                              placeholder="Digite a área arrendada"
                              {...field}
                              onChange={(e) => {
                                // Limpa a formatação e pega apenas números e vírgulas
                                const cleanValue = e.target.value.replace(
                                  /[^\d.,]/g,
                                  ""
                                );
                                // Converte para número para armazenar no form
                                const numericValue =
                                  parseFormattedNumber(cleanValue);
                                field.onChange(numericValue);
                                // Atualizar o custo anual após mudar a área
                                setTimeout(() => calculateAnnualCost(), 0);
                              }}
                              onBlur={(e) => {
                                field.onBlur();
                                // Se tiver um valor, formata ele ao sair do campo
                                if (field.value) {
                                  const formattedValue = formatArea(
                                    field.value
                                  );
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
                                field.value !== undefined &&
                                field.value !== null
                                  ? formatArea(field.value)
                                  : ""
                              }
                            />
                          </FormControl>
                          <FormDescription>Em hectares</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="custo_hectare"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Custo por Hectare (sacas)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="Digite o custo por hectare (ex: 13.50)"
                              {...field}
                              onChange={(e) => {
                                // Garantir que é um número válido
                                const value = parseFloat(e.target.value);
                                field.onChange(isNaN(value) ? 0 : value);
                                // Atualizar o custo anual após mudar o custo por hectare
                                setTimeout(() => calculateAnnualCost(), 0);
                              }}
                              onBlur={field.onBlur}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormDescription>Em sacas (utilize ponto para casas decimais)</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="custo_ano"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Custo Anual (sacas)</FormLabel>
                          <FormControl>
                            <Input
                              type="text"
                              placeholder="Calculado automaticamente"
                              {...field}
                              value={
                                field.value !== undefined &&
                                field.value !== null
                                  ? formatSacas(field.value)
                                  : ""
                              }
                              disabled={true} // Somente leitura, calculado automaticamente
                            />
                          </FormControl>
                          <FormDescription>
                            Custo total anual em sacas (calculado
                            automaticamente)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="flex justify-between mt-6">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handlePreviousTab}
                    >
                      Voltar
                    </Button>
                    <Button type="button" onClick={handleThirdTab}>
                      Próximo
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="projecao-custos">
              <Card>
                <CardContent className="pt-6 space-y-6">
                  <div>
                    <h3 className="text-sm font-medium mb-3">
                      Projeção de Custos Anuais
                    </h3>
                    
                    <div className="mb-4">
                      <div className="flex justify-between items-center mb-2">
                        <FormLabel className="block">Selecione a Commodity para Projeção</FormLabel>
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm" 
                          onClick={fetchCommodityPrices}
                          disabled={isLoadingCommodities}
                        >
                          {isLoadingCommodities ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Atualizando...
                            </>
                          ) : (
                            'Atualizar Preços'
                          )}
                        </Button>
                      </div>
                      {commodities.length === 0 ? (
                        <div className="rounded-md bg-yellow-50 p-4 mb-4">
                          <div className="flex">
                            <div className="flex-shrink-0">
                              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
                              </svg>
                            </div>
                            <div className="ml-3">
                              <h3 className="text-sm font-medium text-yellow-800">Preços de commodities não encontrados</h3>
                              <div className="mt-2 text-sm text-yellow-700">
                                <p className="mb-4">
                                  Não foram encontrados preços de commodities. É necessário inicializar os preços 
                                  para poder visualizar as projeções de custos.
                                </p>
                                <div className="flex space-x-2">
                                  <Button 
                                    type="button" 
                                    variant="outline"
                                    className="bg-white border-amber-300 hover:bg-amber-100"
                                    onClick={() => window.open('/dashboard/indicators', '_blank')}
                                  >
                                    Ir para Indicadores
                                  </Button>
                                  <Button 
                                    type="button" 
                                    variant="outline"
                                    className="bg-white border-amber-300 hover:bg-amber-100"
                                    disabled={isLoadingCommodities}
                                    onClick={async () => {
                                      try {
                                        setIsLoadingCommodities(true);
                                        
                                        // Apenas chamar a função de busca novamente, ela já inicializa automaticamente se necessário
                                        await fetchCommodityPrices();
                                        
                                        toast.success("Preços de commodities atualizados com sucesso!");
                                      } catch (error: any) {
                                        toast.error(`Erro inesperado: ${error.message || 'Desconhecido'}`);
                                      } finally {
                                        setIsLoadingCommodities(false);
                                      }
                                    }}
                                  >
                                    {isLoadingCommodities ? (
                                      <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Inicializando...
                                      </>
                                    ) : (
                                      'Inicializar Preços'
                                    )}
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <Select
                          value={selectedCommodity}
                          onValueChange={setSelectedCommodity}
                          disabled={isLoadingCommodities}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue
                                placeholder={
                                  isLoadingCommodities
                                    ? "Carregando commodities..."
                                    : "Selecione uma commodity"
                                }
                              />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {commodities.map((commodity) => (
                              <SelectItem
                                key={commodity.commodityType}
                                value={commodity.commodityType}
                              >
                                {commodityDisplayNames[commodity.commodityType as CommodityTypeEnum] || commodity.commodityType}
                                {' '} - {formatCurrency(commodity.currentPrice)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                      <FormDescription>
                        Os custos serão calculados com base nos preços projetados da commodity selecionada
                      </FormDescription>
                      <div className="mt-2 text-sm text-muted-foreground">
                        Atualize os preços usando o botão acima caso tenha feito alterações recentemente.
                      </div>
                    </div>

                    {commodities.length === 0 ? (
                      <div className="flex items-center justify-center p-6 border rounded-md bg-gray-50">
                        <div className="text-center">
                          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <h3 className="mt-2 text-sm font-medium text-gray-900">Não é possível calcular projeções</h3>
                          <p className="mt-1 text-sm text-gray-500">
                            É necessário inicializar os preços de commodities para o seu tenant 
                            antes de visualizar as projeções de custos.
                          </p>
                          <div className="mt-6 flex flex-col gap-3">
                            <Button 
                              type="button"
                              variant="outline"
                              onClick={() => window.open('/dashboard/indicators', '_blank')}
                            >
                              Ir para Indicadores
                            </Button>
                            <Button 
                              type="button"
                              variant="default"
                              disabled={isLoadingCommodities}
                              onClick={async () => {
                                try {
                                  setIsLoadingCommodities(true);
                                  
                                  // Usar a função especializada para buscar preços
                                  await fetchCommodityPrices();
                                  toast.success("Preços de commodities inicializados com sucesso!");
                                } catch (error) {
                                  const errorMessage = error instanceof Error ? error.message : 'Desconhecido';
                                  toast.error(`Erro inesperado: ${errorMessage}`);
                                } finally {
                                  setIsLoadingCommodities(false);
                                }
                              }}
                            >
                              {isLoadingCommodities ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Inicializando...
                                </>
                              ) : (
                                <>Inicializar Preços para {organizationId.substring(0, 8)}</>
                              )}
                            </Button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                        {projectionYears.map((year) => (
                          <div key={year} className="border rounded-md p-4">
                            <h4 className="text-sm font-medium mb-2">Ano {year}</h4>
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">Sacas:</span>
                                <span className="text-sm font-medium">{form.getValues("custo_ano") ? formatSacas(form.getValues("custo_ano")) : "0 sc"}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-sm text-muted-foreground">Preço saca:</span>
                                <span className="text-sm font-medium">
                                  {
                                    (() => {
                                      const commodity = commodities.find(c => c.commodityType === selectedCommodity);
                                      if (!commodity) return "--";
                                      
                                      let price = 0;
                                      if (year === currentYear.toString()) {
                                        price = commodity.currentPrice;
                                      } else if (year === "2025") {
                                        price = commodity.price2025;
                                      } else if (year === "2026") {
                                        price = commodity.price2026;
                                      } else if (year === "2027") {
                                        price = commodity.price2027;
                                      } else if (year === "2028") {
                                        price = commodity.price2028;
                                      } else if (year === "2029") {
                                        price = commodity.price2029;
                                      }
                                      
                                      return formatCurrency(price);
                                    })()
                                  }
                                </span>
                              </div>
                              <div className="pt-2 border-t">
                                <div className="flex justify-between items-center">
                                  <span className="text-sm font-medium">Total:</span>
                                  <span className="text-base font-bold">{formatCurrency(projectionCosts[year] || 0)}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                    </div>

                  <div className="flex justify-between mt-6">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleNextTab}
                    >
                      Voltar
                    </Button>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() =>
                          router.push(`/dashboard/properties/${propertyId}`)
                        }
                      >
                        Cancelar
                      </Button>
                      <Button 
                        type="submit" 
                        disabled={isSubmitting}
                        onClick={() => {
                          // Verificar erros no formulário (apenas para diagnóstico)
                          const errors = form.formState.errors;
                          if (Object.keys(errors).length > 0) {
                            toast.error(`Erros no formulário: ${Object.keys(errors).join(", ")}`);
                          }
                        }}
                      >
                        {isSubmitting && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        {isEditing
                          ? "Atualizar Arrendamento"
                          : "Criar Arrendamento"}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </form>
      </Form>
    </div>
  );
}
