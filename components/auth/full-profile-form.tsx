"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useUser } from "@/components/auth/user-provider";
import { updateFullProfile } from "@/lib/auth/actions/auth-actions";
import { fullProfileSchema, type FullProfileFormValues } from "@/schemas/auth";

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
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/shared/datepicker";

export function FullProfileForm() {
  const { user } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  // Form com validação Zod
  const form = useForm<FullProfileFormValues>({
    resolver: zodResolver(fullProfileSchema),
    defaultValues: {
      // Dados básicos
      name: user?.user_metadata?.name || "",
      email: user?.email || "",
      phone: user?.user_metadata?.telefone || "",
      image: user?.user_metadata?.avatar_url || "",

      // Dados pessoais
      cpf: user?.user_metadata?.cpf || "",
      rg: user?.user_metadata?.rg || "",
      orgaoEmissor: user?.user_metadata?.orgaoEmissor || "",
      dataNascimento: user?.user_metadata?.dataNascimento || "",
      naturalidade: user?.user_metadata?.naturalidade || "",
      estadoCivil: user?.user_metadata?.estadoCivil || "",
      inscricaoProdutorRural: user?.user_metadata?.inscricaoProdutorRural || "",

      // Endereço
      cep: user?.user_metadata?.cep || "",
      endereco: user?.user_metadata?.endereco || "",
      numero: user?.user_metadata?.numero || "",
      complemento: user?.user_metadata?.complemento || "",
      bairro: user?.user_metadata?.bairro || "",
      cidade: user?.user_metadata?.cidade || "",
      estado: user?.user_metadata?.estado || "",

      // Dados do cônjuge
      nomeConjuge: user?.user_metadata?.nomeConjuge || "",
      cpfConjuge: user?.user_metadata?.cpfConjuge || "",
      rgConjuge: user?.user_metadata?.rgConjuge || "",
      orgaoEmissorConjuge: user?.user_metadata?.orgaoEmissorConjuge || "",
      dataNascimentoConjuge: user?.user_metadata?.dataNascimentoConjuge || "",
    },
  });

  // Função para submeter o formulário
  async function onSubmit(data: FullProfileFormValues) {
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const result = await updateFullProfile(data);

      if (!result.success) {
        throw new Error(
          result.error || "Ocorreu um erro ao atualizar o perfil."
        );
      }

      // Mostrar mensagem de sucesso
      setSuccess(true);

      // Atualizar a página após alguns segundos
      setTimeout(() => {
        router.refresh();
      }, 2000);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Não foi possível atualizar o perfil"
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert
          variant="default"
          className="bg-green-50 text-green-800 border-green-200"
        >
          <CheckCircle2 className="h-4 w-4" />
          <AlertDescription>Dados atualizados com sucesso!</AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          {/* Seção de Dados Pessoais */}
          <div className="space-y-4">
            <h4 className="font-medium">Dados Pessoais</h4>

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
                        disabled={isLoading}
                        {...field}
                        value={field.value || ""}
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
                        placeholder="00.000.000-0"
                        disabled={isLoading}
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="orgaoEmissor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Órgão Emissor</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="SSP/UF"
                        disabled={isLoading}
                        {...field}
                        value={field.value || ""}
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
                    <FormLabel>Data de Nascimento</FormLabel>
                    <FormControl>
                      <DatePicker
                        date={field.value ? new Date(field.value) : undefined}
                        onSelect={(date) =>
                          field.onChange(
                            date ? date.toISOString().split("T")[0] : ""
                          )
                        }
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="naturalidade"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Naturalidade</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Cidade/Estado"
                        disabled={isLoading}
                        {...field}
                        value={field.value || ""}
                      />
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
                    <FormLabel>Estado Civil</FormLabel>
                    <Select
                      disabled={isLoading}
                      onValueChange={field.onChange}
                      defaultValue={field.value || ""}
                    >
                      <FormControl>
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Selecione..." />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="solteiro">Solteiro(a)</SelectItem>
                        <SelectItem value="casado">Casado(a)</SelectItem>
                        <SelectItem value="separado">Separado(a)</SelectItem>
                        <SelectItem value="divorciado">
                          Divorciado(a)
                        </SelectItem>
                        <SelectItem value="viuvo">Viúvo(a)</SelectItem>
                        <SelectItem value="uniao_estavel">
                          União Estável
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="inscricaoProdutorRural"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Inscrição de Produtor Rural</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Número da inscrição"
                      disabled={isLoading}
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {/* Seção de Endereço */}
          <div className="space-y-4">
            <h4 className="font-medium">Endereço</h4>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="cep"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CEP</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="00000-000"
                        disabled={isLoading}
                        {...field}
                        value={field.value || ""}
                      />
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
                    <FormLabel>Endereço</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Rua, Avenida, etc."
                        disabled={isLoading}
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="numero"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Número"
                        disabled={isLoading}
                        {...field}
                        value={field.value || ""}
                      />
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
                      <Input
                        placeholder="Apto, Bloco, etc."
                        disabled={isLoading}
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <FormField
                control={form.control}
                name="bairro"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bairro</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Bairro"
                        disabled={isLoading}
                        {...field}
                        value={field.value || ""}
                      />
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
                      <Input
                        placeholder="Cidade"
                        disabled={isLoading}
                        {...field}
                        value={field.value || ""}
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
                    <FormLabel>Estado</FormLabel>
                    <Select
                      disabled={isLoading}
                      onValueChange={field.onChange}
                      defaultValue={field.value || ""}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="UF" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {[
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
                        ].map((uf) => (
                          <SelectItem key={uf} value={uf}>
                            {uf}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Seção de Cônjuge */}
          <div className="space-y-4">
            <h4 className="font-medium">Dados do Cônjuge</h4>
            <p className="text-xs text-muted-foreground">
              Preencha apenas se for casado(a) ou em união estável
            </p>

            <FormField
              control={form.control}
              name="nomeConjuge"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do Cônjuge</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Nome completo"
                      disabled={isLoading}
                      {...field}
                      value={field.value || ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="cpfConjuge"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CPF do Cônjuge</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="000.000.000-00"
                        disabled={isLoading}
                        {...field}
                        value={field.value || ""}
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
                    <FormLabel>RG do Cônjuge</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="00.000.000-0"
                        disabled={isLoading}
                        {...field}
                        value={field.value || ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="orgaoEmissorConjuge"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Órgão Emissor</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="SSP/UF"
                        disabled={isLoading}
                        {...field}
                        value={field.value || ""}
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
                    <FormLabel>Data de Nascimento</FormLabel>
                    <FormControl>
                      <DatePicker
                        date={field.value ? new Date(field.value) : undefined}
                        onSelect={(date) =>
                          field.onChange(
                            date ? date.toISOString().split("T")[0] : ""
                          )
                        }
                        disabled={isLoading}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </div>

          <div className="flex justify-end">
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : (
                "Salvar Alterações"
              )}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}
