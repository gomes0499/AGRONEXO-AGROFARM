"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { AlertCircle, Loader2, X } from "lucide-react";
import { UserRole } from "@/lib/auth/roles";
import { createMemberAccount } from "@/lib/actions/invitation-actions";
import { fetchAddressByCep } from "@/lib/utils/format";
import {
  formatCPF,
  formatRG,
  formatCEP,
  formatPhone,
} from "@/lib/utils/format";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { DatePicker } from "@/components/ui/datepicker";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Schema para formulário de adição de membro
const addMemberSchema = z.object({
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

type AddMemberFormValues = z.infer<typeof addMemberSchema>;

interface AddMemberFormProps {
  organizationId: string;
  organizationName?: string;
  trigger?: React.ReactNode;
}

export function AddMemberForm({
  organizationId,
  organizationName = "Organização",
  trigger,
}: AddMemberFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSpouseFields, setShowSpouseFields] = useState(false);
  const [isCepLoading, setIsCepLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");
  const router = useRouter();

  // Valores padrão do formulário
  const defaultValues: Partial<AddMemberFormValues> = {
    funcao: UserRole.MEMBRO,
    estadoCivil: "SOLTEIRO",
  };

  // Inicializar formulário
  const form = useForm<AddMemberFormValues>({
    resolver: zodResolver(addMemberSchema),
    defaultValues,
    mode: "onChange",
  });

  // Observar mudanças no campo estadoCivil
  const watchEstadoCivil = form.watch("estadoCivil");

  // Atualizar visibilidade dos campos de cônjuge quando o estado civil mudar
  const updateSpouseFields = () => {
    const isCoupled =
      watchEstadoCivil === "CASADO" || watchEstadoCivil === "UNIAO_ESTAVEL";
    setShowSpouseFields(isCoupled);
  };

  // Função para consultar CEP
  const handleCepBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    const cep = e.target.value.replace(/\D/g, "");

    if (cep.length === 8) {
      setIsCepLoading(true);

      try {
        const data = await fetchAddressByCep(cep);

        if (data) {
          form.setValue("endereco", data.logradouro);
          form.setValue("bairro", data.bairro);
          form.setValue("cidade", data.localidade);
          form.setValue("estado", data.uf);
        }
      } catch (error) {
        console.error("Erro ao consultar CEP:", error);
      } finally {
        setIsCepLoading(false);
      }
    }
  };

  // Função para submeter o formulário
  const onSubmit = async (values: AddMemberFormValues) => {
    try {
      setIsSubmitting(true);

      // Função que chama a action do servidor para criar a conta
      const result = await createMemberAccount(values, organizationId);

      if (result.success) {
        toast.success(result.message || "Membro adicionado com sucesso!");
        setIsOpen(false);
        form.reset(defaultValues);
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
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="default" size="sm">
            Criar Conta Membro
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Adicionar Novo Membro</DialogTitle>
          <DialogDescription>
            Preencha os dados do novo membro para criar uma conta completa. Um
            email com as credenciais será enviado automaticamente.
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="flex-1 flex flex-col overflow-hidden"
        >
          <TabsList className="grid grid-cols-4 mb-4">
            <TabsTrigger value="basic">Básico</TabsTrigger>
            <TabsTrigger value="personal">Dados Pessoais</TabsTrigger>
            <TabsTrigger value="address">Endereço</TabsTrigger>
            <TabsTrigger value="documents">Documentos</TabsTrigger>
          </TabsList>

          <ScrollArea className="flex-1 pr-4">
            <Form {...form}>
              <form
                id="member-form"
                onSubmit={form.handleSubmit(onSubmit)}
                className="space-y-6"
              >
                {/* Tab: Informações Básicas */}
                <TabsContent value="basic" className="space-y-6 mt-0">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="nome"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome completo</FormLabel>
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
                          <FormLabel>Email</FormLabel>
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
                          <FormLabel>Telefone</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="(00) 00000-0000"
                              value={formatPhone(field.value || "")}
                              onChange={(e) => {
                                const rawValue = e.target.value.replace(
                                  /\D/g,
                                  ""
                                );
                                field.onChange(rawValue);
                              }}
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
                          <FormLabel>Função</FormLabel>
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
                </TabsContent>

                {/* Tab: Dados Pessoais */}
                <TabsContent value="personal" className="space-y-6 mt-0">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="cpf"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>CPF</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="000.000.000-00"
                              value={formatCPF(field.value || "")}
                              onChange={(e) => {
                                const rawValue = e.target.value.replace(
                                  /\D/g,
                                  ""
                                );
                                field.onChange(rawValue);
                              }}
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
                          <FormLabel>Data de nascimento</FormLabel>
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
                          <FormLabel>RG</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="0.000.000"
                              value={formatRG(field.value || "")}
                              onChange={(e) => {
                                const rawValue = e.target.value.replace(
                                  /[^\dXx]/g,
                                  ""
                                );
                                field.onChange(rawValue);
                              }}
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
                          <FormLabel>Órgão emissor</FormLabel>
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
                          <FormLabel>Naturalidade</FormLabel>
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
                          <FormLabel>Estado civil</FormLabel>
                          <Select
                            onValueChange={(value) => {
                              field.onChange(value);
                              // Atualizar campos do cônjuge quando o estado civil mudar
                              setTimeout(() => updateSpouseFields(), 0);
                            }}
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
                              <FormLabel>Nome do cônjuge</FormLabel>
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
                              <FormLabel>CPF do cônjuge</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="000.000.000-00"
                                  value={formatCPF(field.value || "")}
                                  onChange={(e) => {
                                    const rawValue = e.target.value.replace(
                                      /\D/g,
                                      ""
                                    );
                                    field.onChange(rawValue);
                                  }}
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
                              <FormLabel>Data de nascimento</FormLabel>
                              <FormControl>
                                <DatePicker
                                  date={
                                    field.value
                                      ? new Date(field.value)
                                      : undefined
                                  }
                                  onSelect={(date) =>
                                    field.onChange(
                                      date
                                        ? date.toISOString().split("T")[0]
                                        : ""
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
                              <FormLabel>RG do cônjuge</FormLabel>
                              <FormControl>
                                <Input
                                  placeholder="0.000.000"
                                  value={formatRG(field.value || "")}
                                  onChange={(e) => {
                                    const rawValue = e.target.value.replace(
                                      /[^\dXx]/g,
                                      ""
                                    );
                                    field.onChange(rawValue);
                                  }}
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
                              <FormLabel>Órgão emissor</FormLabel>
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
                </TabsContent>

                {/* Tab: Endereço */}
                <TabsContent value="address" className="space-y-6 mt-0">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <FormField
                      control={form.control}
                      name="cep"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>CEP</FormLabel>
                          <FormControl>
                            <div className="relative">
                              <Input
                                placeholder="00000-000"
                                value={formatCEP(field.value || "")}
                                onChange={(e) => {
                                  const rawValue = e.target.value.replace(
                                    /\D/g,
                                    ""
                                  );
                                  field.onChange(rawValue);
                                }}
                                onBlur={handleCepBlur}
                              />
                              {isCepLoading && (
                                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                                  <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                </div>
                              )}
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="endereco"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Logradouro</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Rua, Avenida, etc."
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="numero"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Número</FormLabel>
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
                          <FormLabel>Complemento</FormLabel>
                          <FormControl>
                            <Input placeholder="Apto, Bloco, etc." {...field} />
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
                          <FormLabel>Bairro</FormLabel>
                          <FormControl>
                            <Input placeholder="Bairro" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

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
                          <FormControl>
                            <Input placeholder="UF" maxLength={2} {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>

                {/* Tab: Documentos Adicionais */}
                <TabsContent value="documents" className="space-y-6 mt-0">
                  <div>
                    <FormField
                      control={form.control}
                      name="inscricaoProdutorRural"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Inscrição de Produtor Rural</FormLabel>
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

                  <div className="mt-6 p-4 rounded-md border bg-amber-50 border-amber-200 flex items-start gap-2">
                    <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
                    <div>
                      <p className="text-sm text-amber-800">
                        Uma senha será gerada automaticamente e enviada por
                        email para o novo membro. O usuário poderá alterá-la
                        após o primeiro acesso.
                      </p>
                    </div>
                  </div>
                </TabsContent>
              </form>
            </Form>
          </ScrollArea>
        </Tabs>

        <DialogFooter className="border-t pt-4 mt-4">
          <Button
            form="member-form"
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Adicionando...
              </>
            ) : (
              "Adicionar Membro"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
