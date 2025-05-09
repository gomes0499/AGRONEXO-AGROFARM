"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Building2,
  User,
  Mail,
  Phone,
  Globe,
  MapPin,
  Hash,
  CreditCard,
  FileText,
  Save,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";

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
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { createClient } from "@/lib/supabase/client";
import { UserRole } from "@/lib/auth/roles";
import { toast } from "sonner";
import { FormattedInput } from "@/components/ui/formatted-input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import {
  type CepData,
  unformat,
  formatCPF,
  formatCNPJ,
  formatCEP,
  formatPhone,
} from "@/lib/utils/format";

// Schema de validação para o formulário
const organizationSchema = z.object({
  nome: z.string().min(3, "Nome deve ter pelo menos 3 caracteres"),
  slug: z
    .string()
    .min(3, "Identificador deve ter pelo menos 3 caracteres")
    .max(30, "Identificador deve ter no máximo 30 caracteres")
    .regex(
      /^[a-z0-9-]+$/,
      "Identificador deve conter apenas letras minúsculas, números e hifens"
    ),
  email: z.string().email("Email inválido").optional().or(z.literal("")),
  telefone: z.string().optional().or(z.literal("")),
  website: z.string().optional().or(z.literal("")),
  cpf: z.string().optional().or(z.literal("")),
  cnpj: z.string().optional().or(z.literal("")),
  tipo: z.enum(["fisica", "juridica"]),
  endereco: z.string().optional().or(z.literal("")),
  numero: z.string().optional().or(z.literal("")),
  complemento: z.string().optional().or(z.literal("")),
  bairro: z.string().optional().or(z.literal("")),
  cidade: z.string().optional().or(z.literal("")),
  estado: z.string().optional().or(z.literal("")),
  cep: z.string().optional().or(z.literal("")),
  inscricao_estadual: z.string().optional().or(z.literal("")),
});

type OrganizationFormValues = z.infer<typeof organizationSchema>;

interface OrganizationFormProps {
  userId: string;
  organization?: any;
}

export function OrganizationForm({
  userId,
  organization,
}: OrganizationFormProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("info");
  const [cepLoading, setCepLoading] = useState(false);
  const [cepSuccess, setCepSuccess] = useState(false);
  const supabase = createClient();

  // Inicializa o formulário com valores existentes ou padrões
  const form = useForm<OrganizationFormValues>({
    resolver: zodResolver(organizationSchema),
    defaultValues: organization
      ? {
          ...organization,
          tipo: organization.cnpj ? "juridica" : "fisica",
          // Formata os campos numéricos para exibição
          cpf: organization.cpf ? formatCPF(organization.cpf) : "",
          cnpj: organization.cnpj ? formatCNPJ(organization.cnpj) : "",
          cep: organization.cep ? formatCEP(organization.cep) : "",
          telefone: organization.telefone
            ? formatPhone(organization.telefone)
            : "",
        }
      : {
          nome: "",
          slug: "",
          email: "",
          telefone: "",
          website: "",
          cpf: "",
          cnpj: "",
          tipo: "fisica",
          endereco: "",
          numero: "",
          complemento: "",
          bairro: "",
          cidade: "",
          estado: "",
          cep: "",
          inscricao_estadual: "",
        },
  });

  const entityType = form.watch("tipo");
  const formValues = form.watch();

  // Handler para quando o CEP retornar um endereço
  const handleAddressFound = (data: CepData) => {
    setCepLoading(false);
    setCepSuccess(true);

    form.setValue("endereco", data.logradouro);
    form.setValue("bairro", data.bairro);
    form.setValue("cidade", data.localidade);
    form.setValue("estado", data.uf);

    // Foca o campo de número após autocompletar o endereço
    const numeroInput = document.querySelector(
      "[name='numero']"
    ) as HTMLInputElement;
    if (numeroInput) {
      numeroInput.focus();
    }

    toast.success("Endereço preenchido automaticamente!");

    // Reset success state after 3 seconds
    setTimeout(() => setCepSuccess(false), 3000);
  };

  const handleCepLookupStart = () => {
    setCepLoading(true);
  };

  const handleCepLookupError = () => {
    setCepLoading(false);
    toast.error("CEP não encontrado. Verifique o número e tente novamente.");
  };

  // Função para lidar com a submissão do formulário
  async function onSubmit(values: OrganizationFormValues) {
    setIsLoading(true);

    try {
      // Verifica se o slug já existe
      const { data: existingOrg } = await supabase
        .from("organizacoes")
        .select("id")
        .eq("slug", values.slug)
        .single();

      if (existingOrg && !organization) {
        form.setError("slug", {
          type: "manual",
          message: "Este identificador já está em uso",
        });
        setIsLoading(false);
        return;
      }

      // Prepara os dados da organização
      const organizationData = {
        nome: values.nome,
        slug: values.slug,
        email: values.email || null,
        telefone: values.telefone ? unformat(values.telefone) || null : null,
        website: values.website || null,
        cpf: values.tipo === "fisica" ? unformat(values.cpf) || null : null,
        cnpj: values.tipo === "juridica" ? unformat(values.cnpj) || null : null,
        endereco: values.endereco || null,
        numero: values.numero || null,
        complemento: values.complemento || null,
        bairro: values.bairro || null,
        cidade: values.cidade || null,
        estado: values.estado || null,
        cep: values.cep ? unformat(values.cep) || null : null,
        inscricao_estadual: values.inscricao_estadual || null,
      };

      if (organization) {
        // Atualiza organização existente
        const { error: updateError } = await supabase
          .from("organizacoes")
          .update(organizationData)
          .eq("id", organization.id);

        if (updateError) throw updateError;

        toast.success("Organização atualizada com sucesso");
        router.refresh();
      } else {
        // Cria nova organização
        const { data: newOrg, error: createError } = await supabase
          .from("organizacoes")
          .insert(organizationData)
          .select()
          .single();

        if (createError) throw createError;

        // Cria associação entre usuário e organização
        const { error: associationError } = await supabase
          .from("associacoes")
          .insert({
            usuario_id: userId,
            organizacao_id: newOrg.id,
            funcao: UserRole.PROPRIETARIO,
            eh_proprietario: true,
          });

        if (associationError) throw associationError;

        // Atualiza o perfil do usuário com a organização nos metadados
        const { error: updateUserError } = await supabase.auth.updateUser({
          data: {
            organizacao: {
              id: newOrg.id,
              nome: newOrg.nome,
              slug: newOrg.slug,
            },
          },
        });

        if (updateUserError) throw updateUserError;

        toast.success("Organização criada com sucesso");
        router.push("/dashboard");
      }
    } catch (error: any) {
      console.error("Erro ao salvar organização:", error);
      toast.error("Erro ao salvar organização: " + error.message);
    } finally {
      setIsLoading(false);
    }
  }

  // Função para gerar slug a partir do nome
  const generateSlug = () => {
    const nome = form.getValues("nome");
    if (!nome) return;

    const slug = nome
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-")
      .replace(/-+/g, "-")
      .trim();

    form.setValue("slug", slug);
  };

  // Função para verificar se o formulário está completo para a aba atual
  const isTabComplete = (tab: string) => {
    if (tab === "info") {
      const requiredFields = ["nome", "slug", "tipo"];
      const typeSpecificFields = entityType === "fisica" ? ["cpf"] : ["cnpj"];

      return (
        requiredFields.every(
          (field) => !!formValues[field as keyof OrganizationFormValues]
        ) && (entityType === "fisica" ? !!formValues.cpf : !!formValues.cnpj)
      );
    }

    if (tab === "address") {
      // Endereço não é obrigatório, mas se tiver CEP, deve ter os campos principais
      if (!formValues.cep) return true;
      return (
        !!formValues.endereco && !!formValues.cidade && !!formValues.estado
      );
    }

    return false;
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card className="border-muted/80 shadow-sm">
          <CardContent>
            <Tabs
              defaultValue="info"
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList className="grid grid-cols-2 mb-6">
                <TabsTrigger value="info" className="relative">
                  Informações Básicas
                  {isTabComplete("info") && (
                    <Badge
                      variant="outline"
                      className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center bg-green-100 text-green-800 border-green-300"
                    >
                      <CheckCircle2 className="h-3 w-3" />
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger value="address" className="relative">
                  Endereço
                  {isTabComplete("address") && (
                    <Badge
                      variant="outline"
                      className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center bg-green-100 text-green-800 border-green-300"
                    >
                      <CheckCircle2 className="h-3 w-3" />
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>

              <TabsContent value="info" className="space-y-6">
                <div className="flex items-center gap-2 mb-4">
                  <Building2 className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-medium">Dados da Organização</h2>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="nome"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1.5">
                          <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                          Nome da Organização*
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Ex: Fazenda São João"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="slug"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1.5">
                          <Hash className="h-3.5 w-3.5 text-muted-foreground" />
                          Identificador único*
                        </FormLabel>
                        <div className="flex gap-2">
                          <FormControl>
                            <Input
                              placeholder="Ex: fazenda-sao-joao"
                              {...field}
                            />
                          </FormControl>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={generateSlug}
                            className="whitespace-nowrap"
                          >
                            Gerar
                          </Button>
                        </div>

                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Separator className="my-2 " />

                <div className="space-y-4 mt-4">
                  <FormField
                    control={form.control}
                    name="tipo"
                    render={({ field }) => (
                      <FormItem className="space-y-1">
                        <FormControl>
                          <RadioGroup
                            onValueChange={field.onChange}
                            value={field.value}
                            className="flex flex-col sm:flex-row gap-4"
                          >
                            <div className="flex items-center space-x-2 border rounded-md p-3 hover:bg-muted/50 transition-colors cursor-pointer">
                              <RadioGroupItem value="fisica" id="fisica" />
                              <label
                                htmlFor="fisica"
                                className="cursor-pointer font-regular text-md"
                              >
                                Pessoa Física
                              </label>
                            </div>
                            <div className="flex items-center space-x-2 border rounded-md p-3 hover:bg-muted/50 transition-colors cursor-pointer">
                              <RadioGroupItem value="juridica" id="juridica" />
                              <label
                                htmlFor="juridica"
                                className="cursor-pointer font-regular text-md"
                              >
                                Pessoa Jurídica
                              </label>
                            </div>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid gap-6 md:grid-cols-2 mt-4">
                    {entityType === "fisica" ? (
                      <FormField
                        control={form.control}
                        name="cpf"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-1.5">
                              <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
                              CPF*
                            </FormLabel>
                            <FormControl>
                              <FormattedInput
                                field={field}
                                formatType="cpf"
                                placeholder="000.000.000-00"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    ) : (
                      <FormField
                        control={form.control}
                        name="cnpj"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-1.5">
                              <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
                              CNPJ*
                            </FormLabel>
                            <FormControl>
                              <FormattedInput
                                field={field}
                                formatType="cnpj"
                                placeholder="00.000.000/0000-00"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    {entityType === "juridica" && (
                      <FormField
                        control={form.control}
                        name="inscricao_estadual"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-1.5">
                              <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                              Inscrição Estadual
                            </FormLabel>
                            <FormControl>
                              <Input {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>
                </div>

                <Separator className="my-2 mb-4" />

                <div className="space-y-4 ">
                  <div className="grid gap-6 md:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-1.5">
                            <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                            Email de Contato
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="email"
                              placeholder="contato@exemplo.com"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="telefone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="flex items-center gap-1.5">
                            <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                            Telefone
                          </FormLabel>
                          <FormControl>
                            <FormattedInput
                              field={field}
                              formatType="phone"
                              placeholder="(00) 00000-0000"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="website"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1.5">
                          <Globe className="h-3.5 w-3.5 text-muted-foreground" />
                          Site
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="https://www.exemplo.com"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end mt-6">
                  <Button
                    type="button"
                    onClick={() => setActiveTab("address")}
                    className="gap-2"
                  >
                    Próximo
                  </Button>
                </div>
              </TabsContent>

              <TabsContent value="address" className="space-y-6">
                <div className="flex items-center gap-2 mb-4">
                  <MapPin className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-medium">Endereço</h2>
                </div>

                <Alert className="bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-900/20 dark:border-blue-900/30 dark:text-blue-300">
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>Dica</AlertTitle>
                  <AlertDescription>
                    Digite o CEP para preencher o endereço automaticamente
                  </AlertDescription>
                </Alert>

                <div className="grid gap-6 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="cep"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                          CEP
                        </FormLabel>
                        <div className="relative">
                          <FormControl>
                            <FormattedInput
                              field={field}
                              formatType="cep"
                              placeholder="00000-000"
                              onAddressFound={handleAddressFound}
                            />
                          </FormControl>
                          {cepLoading && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                            </div>
                          )}
                          {cepSuccess && (
                            <div className="absolute right-3 top-1/2 -translate-y-1/2">
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                            </div>
                          )}
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="endereco"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                        Endereço
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Rua, Avenida, Estrada..."
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid gap-6 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="numero"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1.5">
                          <Hash className="h-3.5 w-3.5 text-muted-foreground" />
                          Número
                        </FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="complemento"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                          Complemento
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Apto, Sala, Conjunto..."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="bairro"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                        Bairro
                      </FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid gap-6 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="cidade"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                          Cidade
                        </FormLabel>
                        <FormControl>
                          <Input {...field} />
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
                        <FormLabel className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                          Estado
                        </FormLabel>
                        <FormControl>
                          <Input {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-between mt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setActiveTab("info")}
                    className="gap-2"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    Voltar
                  </Button>
                  <Button type="submit" disabled={isLoading} className="gap-2">
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        {organization ? "Atualizando..." : "Criando..."}
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        {organization ? "Atualizar" : "Criar Organização"}
                      </>
                    )}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </form>
    </Form>
  );
}
