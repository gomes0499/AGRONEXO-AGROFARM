"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";

import {
  type Property,
  type PropertyFormValues,
  propertyFormSchema,
} from "@/schemas/properties";
import { createProperty, updateProperty } from "@/lib/actions/property-actions";
import {
  formatCurrency,
  formatArea,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Loader2, Building2Icon, AreaChartIcon } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface PropertyFormProps {
  property?: Property;
  organizationId: string;
}

// Lista de estados brasileiros
const ESTADOS = [
  "AC",
  "AL",
  "AP",
  "AM",
  "BA",
  "CE",
  "DF",
  "ES",
  "GO",
  "MA",
  "MT",
  "MS",
  "MG",
  "PA",
  "PB",
  "PR",
  "PE",
  "PI",
  "RJ",
  "RN",
  "RS",
  "RO",
  "RR",
  "SC",
  "SP",
  "SE",
  "TO",
];

export function PropertyForm({ property, organizationId }: PropertyFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("informacoes-basicas");
  const isEditing = !!property?.id;

  const form = useForm<PropertyFormValues>({
    resolver: zodResolver(propertyFormSchema),
    defaultValues: {
      nome: property?.nome || "",
      ano_aquisicao: property?.ano_aquisicao || null,
      proprietario: property?.proprietario || "",
      cidade: property?.cidade || "",
      estado: property?.estado || "",
      numero_matricula: property?.numero_matricula || "",
      cartorio_registro: property?.cartorio_registro || null,
      numero_car: property?.numero_car || null,
      area_total: property?.area_total || 0,
      area_cultivada: property?.area_cultivada || null,
      valor_atual: property?.valor_atual || null,
      onus: property?.onus || null,
      avaliacao_banco: property?.avaliacao_banco || null,
      tipo: property?.tipo || "PROPRIO",
    },
  });

  const onSubmit = async (values: PropertyFormValues) => {
    try {
      setIsSubmitting(true);
      if (isEditing) {
        await updateProperty(property.id!, values);
        toast.success("Propriedade atualizada com sucesso!");
        router.push(`/dashboard/properties/${property.id}`);
      } else {
        const newProperty = await createProperty(organizationId, values);
        toast.success("Propriedade criada com sucesso!");
        router.push(`/dashboard/properties/${newProperty.id}`);
      }
    } catch (error) {
      console.error("Erro ao salvar propriedade:", error);
      toast.error("Ocorreu um erro ao salvar a propriedade.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNextTab = () => {
    setActiveTab("area-valores");
  };

  const handlePreviousTab = () => {
    setActiveTab("informacoes-basicas");
  };

  return (
    <div>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="w-full"
          >
            <TabsList className="grid w-full grid-cols-2 mb-6">
              <TabsTrigger
                value="informacoes-basicas"
                className="flex items-center gap-2"
              >
                <Building2Icon size={16} />
                Informações Básicas
              </TabsTrigger>
              <TabsTrigger
                value="area-valores"
                className="flex items-center gap-2"
              >
                <AreaChartIcon size={16} />
                Área e Valores
              </TabsTrigger>
            </TabsList>

            <TabsContent value="informacoes-basicas">
              <Card>
                <CardContent className="pt-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="nome"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome da Propriedade</FormLabel>
                          <FormControl>
                            <Input placeholder="Fazenda São João" {...field} />
                          </FormControl>
                          <FormDescription>
                            Nome ou denominação do imóvel rural
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="tipo"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo de Propriedade</FormLabel>
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
                              <SelectItem value="PROPRIO">Própria</SelectItem>
                              <SelectItem value="ARRENDADO">
                                Arrendada
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription>
                            Classificação da propriedade
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <FormField
                      control={form.control}
                      name="proprietario"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Proprietário</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Nome do proprietário"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="ano_aquisicao"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ano de Aquisição</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              placeholder="2020"
                              {...field}
                              onChange={(e) =>
                                field.onChange(
                                  e.target.value
                                    ? Number.parseInt(e.target.value)
                                    : ""
                                )
                              }
                              value={field.value ?? ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="numero_matricula"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Número da Matrícula</FormLabel>
                          <FormControl>
                            <Input placeholder="12345" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="cartorio_registro"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cartório de Registro (CRI)</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Nome do cartório de registro de imóvel"
                              {...field}
                              value={field.value || ""}
                              onChange={(e) =>
                                field.onChange(e.target.value || null)
                              }
                            />
                          </FormControl>
                          <FormDescription>
                            Cartório de Registro de Imóvel onde a propriedade
                            está registrada
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="numero_car"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Número do CAR</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Cadastro Ambiental Rural (CAR)"
                              {...field}
                              value={field.value || ""}
                              onChange={(e) =>
                                field.onChange(e.target.value || null)
                              }
                            />
                          </FormControl>
                          <FormDescription>
                            Número do Cadastro Ambiental Rural da propriedade
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Separator className="my-4" />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="cidade"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cidade</FormLabel>
                          <FormControl>
                            <Input placeholder="Cidade" {...field} />
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
                          <FormLabel>Estado</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o estado" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {ESTADOS.map((estado) => (
                                <SelectItem key={estado} value={estado}>
                                  {estado}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
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

            <TabsContent value="area-valores">
              <Card>
                <CardContent className="pt-6 space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <FormField
                      control={form.control}
                      name="area_total"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Área Total (ha)</FormLabel>
                          <FormControl>
                            <Input
                              type="text"
                              placeholder="Digite a área total em hectares"
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

                    <FormField
                      control={form.control}
                      name="area_cultivada"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Área Cultivável (ha)</FormLabel>
                          <FormControl>
                            <Input
                              type="text"
                              placeholder="Digite a área cultivada em hectares"
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
                          <FormDescription>
                            Em hectares (opcional)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="valor_atual"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Valor Atual (R$)</FormLabel>
                          <FormControl>
                            <Input
                              type="text"
                              placeholder="Digite o valor atual da propriedade"
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
                              }}
                              onBlur={(e) => {
                                field.onBlur();
                                // Se tiver um valor, formata ele ao sair do campo
                                if (field.value) {
                                  const formattedValue = formatCurrency(
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
                                  ? formatCurrency(field.value)
                                  : ""
                              }
                            />
                          </FormControl>
                          <FormDescription>
                            Valor de mercado (opcional)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="avaliacao_banco"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Avaliação Bancária (R$)</FormLabel>
                          <FormControl>
                            <Input
                              type="text"
                              placeholder="Digite o valor da avaliação bancária"
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
                              }}
                              onBlur={(e) => {
                                field.onBlur();
                                // Se tiver um valor, formata ele ao sair do campo
                                if (field.value) {
                                  const formattedValue = formatCurrency(
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
                                  ? formatCurrency(field.value)
                                  : ""
                              }
                            />
                          </FormControl>
                          <FormDescription>
                            Valor de avaliação bancária (opcional)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="onus"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Ônus/Gravames</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Descreva se há algum ônus sobre a propriedade"
                              {...field}
                              value={field.value || ""}
                              onChange={(e) =>
                                field.onChange(e.target.value || null)
                              }
                            />
                          </FormControl>
                          <FormDescription>
                            Hipotecas, penhoras, etc. (opcional)
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
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => router.push("/dashboard/properties")}
                      >
                        Cancelar
                      </Button>
                      <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting && (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        )}
                        {isEditing
                          ? "Atualizar Propriedade"
                          : "Criar Propriedade"}
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
