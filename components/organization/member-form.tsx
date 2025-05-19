"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
  User,
  Mail,
  Phone,
  UserCog,
  CreditCard,
  FileText,
  MapPin,
  Hash,
  CalendarIcon,
  Save,
  Loader2,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { UserRole } from "@/lib/auth/roles";
import { createMemberAccount } from "@/lib/actions/invitation-actions";

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
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/shared/datepicker";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { FormattedInput } from "@/components/shared/formatted-input";

// Schema para formulário de adição de membro
const memberSchema = z.object({
  // Dados básicos
  email: z.string().email({ message: "Email inválido" }),
  nome: z
    .string()
    .min(3, { message: "O nome deve ter pelo menos 3 caracteres" }),
  telefone: z.string().optional(),
  funcao: z.enum([UserRole.ADMINISTRADOR, UserRole.MEMBRO]),

  // Dados pessoais
  cpf: z.string().optional(),
  rg: z.string().optional(),
  orgaoEmissor: z.string().optional(),
  dataNascimento: z.string().optional(),
  naturalidade: z.string().optional(),
  estadoCivil: z.string().optional(),

  // Campos do cônjuge (opcionais)
  nomeConjuge: z.string().optional(),
  cpfConjuge: z.string().optional(),
  rgConjuge: z.string().optional(),
  orgaoEmissorConjuge: z.string().optional(),
  dataNascimentoConjuge: z.string().optional(),

  // Endereço
  cep: z.string().optional(),
  endereco: z.string().optional(),
  numero: z.string().optional(),
  complemento: z.string().optional(),
  bairro: z.string().optional(),
  cidade: z.string().optional(),
  estado: z.string().optional(),

  // Documentos adicionais
  inscricaoProdutorRural: z.string().optional(),
});

type MemberFormValues = z.infer<typeof memberSchema>;

interface MemberFormProps {
  organizationId: string;
  organizationName?: string;
}

export function MemberForm({
  organizationId,
  organizationName = "Organização",
}: MemberFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSpouseFields, setShowSpouseFields] = useState(false);
  const [isCepLoading, setIsCepLoading] = useState(false);
  const [cepSuccess, setCepSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");
  const router = useRouter();

  // Valores padrão do formulário
  const defaultValues: Partial<MemberFormValues> = {
    funcao: UserRole.MEMBRO,
    estadoCivil: "SOLTEIRO",
  };

  // Inicializar formulário
  const form = useForm<MemberFormValues>({
    resolver: zodResolver(memberSchema),
    defaultValues,
    mode: "onChange",
  });

  // Observar mudanças no campo estadoCivil
  const watchEstadoCivil = form.watch("estadoCivil");

  // Atualizar visibilidade dos campos de cônjuge quando o estado civil mudar
  useEffect(() => {
    if (watchEstadoCivil === "CASADO" || watchEstadoCivil === "UNIAO_ESTAVEL") {
      setShowSpouseFields(true);
    } else {
      setShowSpouseFields(false);
    }
  }, [watchEstadoCivil]);

  // Handler para quando o CEP retornar um endereço
  const handleAddressFound = (data: any) => {
    setIsCepLoading(false);
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
    setIsCepLoading(true);
  };

  const handleCepLookupError = () => {
    setIsCepLoading(false);
    toast.error("CEP não encontrado. Verifique o número e tente novamente.");
  };

  // Função para submeter o formulário
  async function onSubmit(values: MemberFormValues) {
    try {
      setIsSubmitting(true);

      // Função que chama a action do servidor para criar a conta
      const result = await createMemberAccount(values, organizationId);

      if (result.success) {
        toast.success(result.message || "Membro adicionado com sucesso!");
        router.push(`/dashboard/organization/${organizationId}`);
        router.refresh();
      } else {
        toast.error(result.error || "Erro ao adicionar membro");
      }
    } catch (error) {
      console.error("Erro ao adicionar membro:", error);
      toast.error("Ocorreu um erro ao adicionar o membro");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card className="border-muted/80 shadow-sm">
          <CardContent>
            <Tabs
              defaultValue="basic"
              value={activeTab}
              onValueChange={setActiveTab}
              className="w-full"
            >
              <TabsList>
                <TabsTrigger value="basic" className="relative">
                  Informações Básicas
                </TabsTrigger>
                <TabsTrigger value="personal" className="relative">
                  Dados Pessoais
                </TabsTrigger>
                <TabsTrigger value="address" className="relative">
                  Endereço
                </TabsTrigger>
                <TabsTrigger value="documents" className="relative">
                  Documentos
                </TabsTrigger>
              </TabsList>

              {/* Tab: Informações Básicas */}
              <TabsContent value="basic" className="space-y-6 mt-6">
                <div className="flex items-center gap-2 mb-4">
                  <User className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-medium">Dados do Membro</h2>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="nome"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5 text-muted-foreground" />
                          Nome completo*
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Digite o nome completo"
                            {...field}
                            required
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="email"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1.5">
                          <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                          Email*
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="email@exemplo.com"
                            type="email"
                            {...field}
                            required
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

                  <FormField
                    control={form.control}
                    name="funcao"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1.5">
                          <UserCog className="h-3.5 w-3.5 text-muted-foreground" />
                          Função*
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione uma função" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value={UserRole.ADMINISTRADOR}>
                              Administrador
                            </SelectItem>
                            <SelectItem value={UserRole.MEMBRO}>
                              Membro
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Alert className="mt-6 bg-amber-50 text-amber-800 border-amber-200">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <AlertTitle className="text-amber-800">Importante</AlertTitle>
                  <AlertDescription className="text-amber-700">
                    Uma senha será gerada automaticamente e enviada por email
                    para o novo membro. O usuário poderá alterá-la após o
                    primeiro acesso.
                  </AlertDescription>
                </Alert>

                <div className="flex justify-end mt-6">
                  <Button
                    type="button"
                    onClick={() => setActiveTab("personal")}
                    className="gap-2"
                  >
                    Próximo
                  </Button>
                </div>
              </TabsContent>

              {/* Tab: Dados Pessoais */}
              <TabsContent value="personal" className="space-y-6 mt-6">
                <div className="flex items-center gap-2 mb-4">
                  <User className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-medium">Dados Pessoais</h2>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="cpf"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1.5">
                          <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
                          CPF
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

                  <FormField
                    control={form.control}
                    name="dataNascimento"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1.5">
                          <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground" />
                          Data de nascimento
                        </FormLabel>
                        <FormControl>
                          <DatePicker
                            date={
                              field.value ? new Date(field.value) : undefined
                            }
                            onSelect={(date) =>
                              field.onChange(
                                date ? date.toISOString().split("T")[0] : ""
                              )
                            }
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="rg"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1.5">
                          <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                          RG
                        </FormLabel>
                        <FormControl>
                          <FormattedInput
                            field={field}
                            formatType="rg"
                            placeholder="0.000.000"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="orgaoEmissor"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1.5">
                          <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                          Órgão emissor
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="SSP" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="naturalidade"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                          Naturalidade
                        </FormLabel>
                        <FormControl>
                          <Input placeholder="Cidade/UF" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="estadoCivil"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1.5">
                          <User className="h-3.5 w-3.5 text-muted-foreground" />
                          Estado civil
                        </FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          defaultValue={field.value}
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o estado civil" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="SOLTEIRO">
                              Solteiro(a)
                            </SelectItem>
                            <SelectItem value="CASADO">Casado(a)</SelectItem>
                            <SelectItem value="DIVORCIADO">
                              Divorciado(a)
                            </SelectItem>
                            <SelectItem value="VIUVO">Viúvo(a)</SelectItem>
                            <SelectItem value="UNIAO_ESTAVEL">
                              União estável
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Campos do cônjuge - exibidos apenas se casado ou união estável */}
                {showSpouseFields && (
                  <div className="mt-6 p-4 border rounded-md border-primary/20">
                    <h4 className="font-medium mb-4">Dados do Cônjuge</h4>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <FormField
                        control={form.control}
                        name="nomeConjuge"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-1.5">
                              <User className="h-3.5 w-3.5 text-muted-foreground" />
                              Nome do cônjuge
                            </FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Nome completo do cônjuge"
                                {...field}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="cpfConjuge"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-1.5">
                              <CreditCard className="h-3.5 w-3.5 text-muted-foreground" />
                              CPF do cônjuge
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

                      <FormField
                        control={form.control}
                        name="dataNascimentoConjuge"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-1.5">
                              <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground" />
                              Data de nascimento
                            </FormLabel>
                            <FormControl>
                              <DatePicker
                                date={
                                  field.value
                                    ? new Date(field.value)
                                    : undefined
                                }
                                onSelect={(date) =>
                                  field.onChange(
                                    date ? date.toISOString().split("T")[0] : ""
                                  )
                                }
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="rgConjuge"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-1.5">
                              <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                              RG do cônjuge
                            </FormLabel>
                            <FormControl>
                              <FormattedInput
                                field={field}
                                formatType="rg"
                                placeholder="0.000.000"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="orgaoEmissorConjuge"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel className="flex items-center gap-1.5">
                              <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                              Órgão emissor
                            </FormLabel>
                            <FormControl>
                              <Input placeholder="SSP" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </div>
                )}

                <div className="flex justify-between mt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setActiveTab("basic")}
                    className="gap-2"
                  >
                    Voltar
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setActiveTab("address")}
                    className="gap-2"
                  >
                    Próximo
                  </Button>
                </div>
              </TabsContent>

              {/* Tab: Endereço */}
              <TabsContent value="address" className="space-y-6 mt-6">
                <div className="flex items-center gap-2 mb-4">
                  <MapPin className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-medium">Endereço</h2>
                </div>

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
                          {isCepLoading && (
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
                        <FormDescription className="text-xs text-muted-foreground">
                          Digite o CEP para preencher o endereço automaticamente
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

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
                          <Input placeholder="Ex: São Paulo" {...field} />
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
                          <Select
                            onValueChange={field.onChange}
                            value={field.value}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o estado" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="AC">Acre</SelectItem>
                              <SelectItem value="AL">Alagoas</SelectItem>
                              <SelectItem value="AP">Amapá</SelectItem>
                              <SelectItem value="AM">Amazonas</SelectItem>
                              <SelectItem value="BA">Bahia</SelectItem>
                              <SelectItem value="CE">Ceará</SelectItem>
                              <SelectItem value="DF">
                                Distrito Federal
                              </SelectItem>
                              <SelectItem value="ES">Espírito Santo</SelectItem>
                              <SelectItem value="GO">Goiás</SelectItem>
                              <SelectItem value="MA">Maranhão</SelectItem>
                              <SelectItem value="MT">Mato Grosso</SelectItem>
                              <SelectItem value="MS">
                                Mato Grosso do Sul
                              </SelectItem>
                              <SelectItem value="MG">Minas Gerais</SelectItem>
                              <SelectItem value="PA">Pará</SelectItem>
                              <SelectItem value="PB">Paraíba</SelectItem>
                              <SelectItem value="PR">Paraná</SelectItem>
                              <SelectItem value="PE">Pernambuco</SelectItem>
                              <SelectItem value="PI">Piauí</SelectItem>
                              <SelectItem value="RJ">Rio de Janeiro</SelectItem>
                              <SelectItem value="RN">
                                Rio Grande do Norte
                              </SelectItem>
                              <SelectItem value="RS">
                                Rio Grande do Sul
                              </SelectItem>
                              <SelectItem value="RO">Rondônia</SelectItem>
                              <SelectItem value="RR">Roraima</SelectItem>
                              <SelectItem value="SC">Santa Catarina</SelectItem>
                              <SelectItem value="SP">São Paulo</SelectItem>
                              <SelectItem value="SE">Sergipe</SelectItem>
                              <SelectItem value="TO">Tocantins</SelectItem>
                            </SelectContent>
                          </Select>
                        </FormControl>
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
                        Logradouro
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
                        <Input placeholder="Bairro" {...field} />
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
                          <Input placeholder="Número" {...field} />
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
                          <Input placeholder="Apto, Bloco, etc." {...field} />
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
                    onClick={() => setActiveTab("personal")}
                    className="gap-2"
                  >
                    Voltar
                  </Button>
                  <Button
                    type="button"
                    onClick={() => setActiveTab("documents")}
                    className="gap-2"
                  >
                    Próximo
                  </Button>
                </div>
              </TabsContent>

              {/* Tab: Documentos */}
              <TabsContent value="documents" className="space-y-6 mt-6">
                <div className="flex items-center gap-2 mb-4">
                  <FileText className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-medium">Documentos Adicionais</h2>
                </div>

                <div>
                  <FormField
                    control={form.control}
                    name="inscricaoProdutorRural"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="flex items-center gap-1.5">
                          <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                          Inscrição de Produtor Rural
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Digite o número da inscrição"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Apenas necessário para produtores rurais
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Alert className="mt-6 bg-amber-50 text-amber-800 border-amber-200">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                  <AlertTitle className="text-amber-800">Importante</AlertTitle>
                  <AlertDescription className="text-amber-700">
                    Uma senha será gerada automaticamente e enviada por email
                    para o novo membro. O usuário poderá alterá-la após o
                    primeiro acesso.
                  </AlertDescription>
                </Alert>

                <div className="flex justify-between mt-6">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setActiveTab("address")}
                    className="gap-2"
                  >
                    Voltar
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Adicionando...
                      </>
                    ) : (
                      <>
                        <Save className="h-4 w-4" />
                        Adicionar Membro
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
