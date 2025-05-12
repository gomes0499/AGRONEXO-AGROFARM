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
  parseFormattedNumber,
} from "@/lib/utils/formatters";

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
import { DatePicker } from "@/components/ui/datepicker";
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
  const [activeTab, setActiveTab] = useState("informacoes-contrato");
  const isEditing = !!lease?.id;

  // Determinar o ano atual e próximos 10 anos para projeção de custos
  const currentYear = new Date().getFullYear();
  const projectionYears = Array.from({ length: 11 }, (_, i) =>
    (currentYear + i).toString()
  );

  // Converter o objeto JSONB de custos para objeto JavaScript
  const defaultCustos = isEditing
    ? typeof lease.custos_projetados_anuais === "string"
      ? JSON.parse(lease.custos_projetados_anuais)
      : lease.custos_projetados_anuais
    : projectionYears.reduce((acc, year) => ({ ...acc, [year]: 0 }), {});

  const form = useForm<LeaseFormValues>({
    resolver: zodResolver(leaseFormSchema),
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
      custos_projetados_anuais: defaultCustos,
    },
  });

  const onSubmit = async (values: LeaseFormValues) => {
    try {
      setIsSubmitting(true);
      if (isEditing) {
        await updateLease(lease.id!, values);
        toast.success("Arrendamento atualizado com sucesso!");
      } else {
        await createLease(organizationId, values);
        toast.success("Arrendamento criado com sucesso!");
      }
      router.push(`/dashboard/properties/${propertyId}`);
      router.refresh();
    } catch (error) {
      console.error("Erro ao salvar arrendamento:", error);
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
            console.error("Erro ao buscar propriedade:", error);
          }
        }
      } catch (error) {
        console.error("Erro ao buscar propriedades:", error);
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
      console.error("Erro ao buscar propriedade:", error);
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
                                  value={property.id}
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
                          <FormLabel>Data de Início</FormLabel>
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
                          <FormLabel>Data de Término</FormLabel>
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
                              type="text"
                              placeholder="Digite o custo por hectare"
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
                                // Atualizar o custo anual após mudar o custo por hectare
                                setTimeout(() => calculateAnnualCost(), 0);
                              }}
                              onBlur={(e) => {
                                field.onBlur();
                                // Se tiver um valor, formata ele ao sair do campo
                                if (field.value) {
                                  const formattedValue = formatSacas(
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
                                  ? formatSacas(field.value)
                                  : ""
                              }
                            />
                          </FormControl>
                          <FormDescription>Em sacas</FormDescription>
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
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {projectionYears.map((year) => (
                        <FormField
                          key={year}
                          control={form.control}
                          name={`custos_projetados_anuais.${year}`}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Ano {year}</FormLabel>
                              <FormControl>
                                <Input
                                  type="text"
                                  placeholder={`Sacas para ${year}`}
                                  onChange={(e) => {
                                    // Limpa a formatação e pega apenas números e vírgulas
                                    const cleanValue = e.target.value.replace(
                                      /[^\d.,]/g,
                                      ""
                                    );
                                    // Converte para número para armazenar no form
                                    const numericValue =
                                      parseFormattedNumber(cleanValue);

                                    // Atualiza o valor no objeto de custos projetados
                                    const custos = {
                                      ...form.getValues(
                                        "custos_projetados_anuais"
                                      ),
                                    };
                                    custos[year] = numericValue ?? 0;
                                    form.setValue(
                                      "custos_projetados_anuais",
                                      custos
                                    );
                                  }}
                                  onBlur={(e) => {
                                    // Se tiver um valor, formata ele ao sair do campo
                                    const custos = form.getValues(
                                      "custos_projetados_anuais"
                                    );
                                    const value = custos[year];
                                    if (value !== null && value !== undefined) {
                                      const formattedValue = formatSacas(value);
                                      e.target.value = formattedValue;
                                    }
                                  }}
                                  onFocus={(e) => {
                                    // Quando ganhar foco, mostra apenas o número sem formatação
                                    const custos = form.getValues(
                                      "custos_projetados_anuais"
                                    );
                                    const value = custos[year];
                                    if (value !== null && value !== undefined) {
                                      e.target.value = value.toString();
                                    }
                                  }}
                                  value={
                                    field.value !== undefined &&
                                    field.value !== null
                                      ? formatSacas(field.value)
                                      : ""
                                  }
                                />
                              </FormControl>
                              <FormDescription>Valor em sacas</FormDescription>
                            </FormItem>
                          )}
                        />
                      ))}
                    </div>
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
                      <Button type="submit" disabled={isSubmitting}>
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
