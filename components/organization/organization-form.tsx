"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
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
import { CepData, unformat, formatCPF, formatCNPJ, formatCEP, formatPhone } from "@/lib/utils/format";

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
          telefone: organization.telefone ? formatPhone(organization.telefone) : "",
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

  // Handler para quando o CEP retornar um endereço
  const handleAddressFound = (data: CepData) => {
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

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Tabs defaultValue="info" className="w-full">
          <TabsList className="grid grid-cols-2 mb-6">
            <TabsTrigger value="info">Informações Básicas</TabsTrigger>
            <TabsTrigger value="address">Endereço</TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="nome"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome da Organização*</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Fazenda São João" {...field} />
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
                    <FormLabel>Identificador único*</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: fazenda-sao-joao" {...field} />
                    </FormControl>

                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 py-2">
              <FormField
                control={form.control}
                name="tipo"
                render={({ field }) => (
                  <FormItem className="space-y-1">
                    <FormLabel>Tipo de Pessoa*</FormLabel>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value}
                        className="flex gap-4"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="fisica" id="fisica" />
                          <label htmlFor="fisica">Pessoa Física</label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="juridica" id="juridica" />
                          <label htmlFor="juridica">Pessoa Jurídica</label>
                        </div>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {entityType === "fisica" ? (
                <FormField
                  control={form.control}
                  name="cpf"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>CPF</FormLabel>
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
                      <FormLabel>CNPJ</FormLabel>
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
                      <FormLabel>Inscrição Estadual</FormLabel>
                      <FormControl>
                        <Input {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email de Contato</FormLabel>
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
                    <FormLabel>Telefone</FormLabel>
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
                  <FormLabel>Site</FormLabel>
                  <FormControl>
                    <Input placeholder="https://www.exemplo.com" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </TabsContent>

          <TabsContent value="address" className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="cep"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CEP</FormLabel>
                    <FormControl>
                      <FormattedInput
                        field={field}
                        formatType="cep"
                        placeholder="00000-000"
                        onAddressFound={handleAddressFound}
                      />
                    </FormControl>
                    <FormDescription>
                      Digite o CEP para preencher o endereço automaticamente
                    </FormDescription>
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
                  <FormLabel>Endereço</FormLabel>
                  <FormControl>
                    <Input placeholder="Rua, Avenida, Estrada..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="numero"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número</FormLabel>
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
                    <FormLabel>Complemento</FormLabel>
                    <FormControl>
                      <Input {...field} />
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
                  <FormLabel>Bairro</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 md:grid-cols-2">
              <FormField
                control={form.control}
                name="cidade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Cidade</FormLabel>
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
                    <FormLabel>Estado</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end space-x-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isLoading}
          >
            Cancelar
          </Button>
          <Button type="submit" disabled={isLoading}>
            {isLoading
              ? "Salvando..."
              : organization
              ? "Atualizar"
              : "Criar Organização"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
