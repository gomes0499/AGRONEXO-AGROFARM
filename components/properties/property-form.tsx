"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, useWatch, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { PropertyImageUpload } from "@/components/properties/property-image-upload";

import {
  type Property,
  type PropertyFormValues,
  propertyFormSchema,
} from "@/schemas/properties";
import { createProperty, updateProperty } from "@/lib/actions/property-actions";
import { uploadPropertyImage } from "@/lib/actions/upload-actions";
import {
  formatCurrency,
  formatArea,
  parseFormattedNumber,
  isNegativeValue,
} from "@/lib/utils/formatters";
import { cn } from "@/lib/utils";

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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Loader2, Building2Icon, AreaChartIcon, ImageIcon } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DatePicker } from "@/components/ui/datepicker";

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
          <FormLabel>{label}</FormLabel>
          {description && <FormDescription>{description}</FormDescription>}
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

export function PropertyForm({ property, organizationId }: PropertyFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState("informacoes-basicas");
  const [imageUrl, setImageUrl] = useState<string | null>(
    property?.imagem || null
  );
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
      data_inicio: property?.data_inicio || null,
      data_termino: property?.data_termino || null,
      tipo_anuencia: property?.tipo_anuencia || null,
      area_total: property?.area_total || 0,
      area_cultivada: property?.area_cultivada || null,
      valor_atual: property?.valor_atual || null,
      onus: property?.onus || null,
      avaliacao_banco: property?.avaliacao_banco || null,
      tipo: property?.tipo || "PROPRIO",
    },
  });

  // Observar mudanças no campo tipo para mostrar campos condicionais
  const propertyType = useWatch({
    control: form.control,
    name: "tipo",
  });

  // Atualizar campos ao mudar o tipo de propriedade
  useEffect(() => {
    if (propertyType === "PROPRIO") {
      // Se mudar para própria, limpar campos de arrendamento
      form.setValue("data_inicio", null);
      form.setValue("data_termino", null);
      form.setValue("tipo_anuencia", null);
    } else if (propertyType === "ARRENDADO") {
      // Se mudar para arrendada, limpar ano de aquisição
      form.setValue("ano_aquisicao", null);
    }
  }, [propertyType, form]);

  const onSubmit = async (values: PropertyFormValues) => {
    try {
      setIsSubmitting(true);

      // Adiciona a imagem às propriedades
      const dataWithImage = {
        ...values,
        imagem: imageUrl,
      };

      if (isEditing) {
        await updateProperty(property.id!, dataWithImage);
        toast.success("Propriedade atualizada com sucesso!");
        router.push(`/dashboard/properties/${property.id}`);
      } else {
        // Primeiro criamos a propriedade
        const newProperty = await createProperty(organizationId, dataWithImage);

        // Se temos uma URL de imagem temporária no estado, precisamos fazer o upload dela
        if (imageUrl && imageUrl.startsWith("blob:")) {
          try {
            // Localizar o componente de upload para obter o arquivo
            const uploadComponent = document.querySelector(
              '[data-property-upload="true"]'
            );
            if (uploadComponent) {
              // Pegar o arquivo da propriedade __temporaryImage
              const temporaryFile = (uploadComponent as any).__temporaryImage;

              if (temporaryFile && temporaryFile instanceof File) {
                // Criar FormData para o upload
                const formData = new FormData();
                formData.append("file", temporaryFile);

                // Fazer o upload usando a server action
                const uploadResult = await uploadPropertyImage(
                  newProperty.id,
                  formData
                );

                if (!uploadResult.success) {
                  console.error(
                    "Erro ao fazer upload da imagem:",
                    uploadResult.error
                  );
                  toast.error(
                    "A propriedade foi criada, mas houve um erro ao salvar a imagem."
                  );
                }
              }
            }
          } catch (uploadError) {
            console.error(
              "Erro ao processar upload da imagem temporária:",
              uploadError
            );
            toast.error(
              "A propriedade foi criada, mas houve um erro ao salvar a imagem."
            );
          }
        }

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
    if (activeTab === "informacoes-basicas") {
      setActiveTab("area-valores");
    } else if (activeTab === "area-valores") {
      setActiveTab("imagem");
    }
  };

  const handlePreviousTab = () => {
    if (activeTab === "area-valores") {
      setActiveTab("informacoes-basicas");
    } else if (activeTab === "imagem") {
      setActiveTab("area-valores");
    }
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
            <TabsList className="grid w-full grid-cols-3 mb-6">
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
              <TabsTrigger value="imagem" className="flex items-center gap-2">
                <ImageIcon size={16} />
                Imagem
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

                  <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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

                    {/* Condicional para mostrar ano de aquisição ou datas de arrendamento */}
                    {propertyType === "PROPRIO" ? (
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
                    ) : (
                      <FormField
                        control={form.control}
                        name="tipo_anuencia"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tipo de Anuência</FormLabel>
                            <Select
                              onValueChange={field.onChange}
                              defaultValue={field.value || ""}
                              value={field.value || ""}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione o tipo de anuência" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="COM_ANUENCIA">
                                  Com Anuência
                                </SelectItem>
                                <SelectItem value="SEM_ANUENCIA">
                                  Sem Anuência
                                </SelectItem>
                              </SelectContent>
                            </Select>

                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

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

                  {/* Datas de início e término para arrendamento */}
                  {propertyType === "ARRENDADO" && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="data_inicio"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Data de Início do Contrato</FormLabel>
                            <FormControl>
                              <Controller
                                name="data_inicio"
                                control={form.control}
                                render={({ field }) => (
                                  <DatePicker
                                    date={
                                      field.value
                                        ? new Date(field.value)
                                        : undefined
                                    }
                                    onSelect={(date) => field.onChange(date)}
                                    placeholder="Selecione a data de início"
                                  />
                                )}
                              />
                            </FormControl>
                            <FormDescription>
                              Data de início do arrendamento
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="data_termino"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Data de Término do Contrato</FormLabel>
                            <FormControl>
                              <Controller
                                name="data_termino"
                                control={form.control}
                                render={({ field }) => (
                                  <DatePicker
                                    date={
                                      field.value
                                        ? new Date(field.value)
                                        : undefined
                                    }
                                    onSelect={(date) => field.onChange(date)}
                                    placeholder="Selecione a data de término"
                                  />
                                )}
                              />
                            </FormControl>
                            <FormDescription>
                              Data de término do arrendamento
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  )}

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

                    <CurrencyField
                      name="valor_atual"
                      label="Valor Atual (R$)"
                      control={form.control}
                      placeholder="Digite o valor atual da propriedade"
                      disabled={isSubmitting}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <CurrencyField
                      name="avaliacao_banco"
                      label="Avaliação do Imóvel (R$)"
                      control={form.control}
                      placeholder="Digite o valor da avaliação do imóvel"
                      disabled={isSubmitting}
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
                      <Button type="button" onClick={handleNextTab}>
                        Próximo
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="imagem">
              <Card>
                <CardContent className="pt-6 pb-6">
                  <PropertyImageUpload
                    propertyId={isEditing ? property.id! : undefined}
                    currentImageUrl={imageUrl}
                    onSuccess={(url) => setImageUrl(url)}
                    onRemove={() => setImageUrl(null)}
                    isTemporary={!isEditing}
                  />

                  <div className="flex justify-between mt-6">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setActiveTab("area-valores")}
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
