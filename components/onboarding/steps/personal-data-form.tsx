"use client";

import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useState, useEffect } from "react";

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DatePicker } from "@/components/shared/datepicker";
import { personalInfoSchema, spouseSchema } from "@/schemas/auth";
import { formatCPF, formatRG } from "@/lib/utils/format";
import { Card } from "@/components/ui/card";

// Define a custom type for the form
type PersonalDataFormValues = {
  name: string;
  cpf: string;
  rg: string;
  orgaoEmissor: string;
  dataNascimento: string;
  naturalidade: string;
  estadoCivil: string;
  // Campos do cônjuge
  nomeConjuge?: string;
  cpfConjuge?: string;
  rgConjuge?: string;
  orgaoEmissorConjuge?: string;
  dataNascimentoConjuge?: string;
};

// Form de dados pessoais
export function PersonalDataForm({
  profile,
  onSubmit,
}: {
  profile: any;
  onSubmit: (data: any) => void;
}) {
  // Estados para controlar visibilidade dos campos e estado de submissão
  const [showSpouseFields, setShowSpouseFields] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Schema para validação do formulário - versão mais permissiva para o onboarding
  const personalDataSchema = z.object({
    name: z
      .string()
      .min(3, { message: "O nome deve ter pelo menos 3 caracteres" }),
    cpf: z.string().optional(),
    rg: z.string().optional(),
    orgaoEmissor: z.string().optional(),
    dataNascimento: z.string().optional(),
    naturalidade: z.string().optional(),
    estadoCivil: z.string().optional(),
    // Campos do cônjuge são todos opcionais
    nomeConjuge: z.string().optional(),
    cpfConjuge: z.string().optional(),
    rgConjuge: z.string().optional(),
    orgaoEmissorConjuge: z.string().optional(),
    dataNascimentoConjuge: z.string().optional(),
  });

  // Define the actual form values type based on schema
  type FormValues = z.infer<typeof personalDataSchema> & {
    name: string;
  };

  // Valores iniciais
  const defaultValues: Partial<FormValues> = {
    name: profile?.nome || "",
    cpf: profile?.cpf || "",
    rg: profile?.rg || "",
    orgaoEmissor: profile?.orgao_emissor || "",
    dataNascimento: profile?.data_nascimento
      ? new Date(profile.data_nascimento).toISOString().split("T")[0]
      : "",
    naturalidade: profile?.naturalidade || "",
    estadoCivil: profile?.estado_civil || "",
    // Campos do cônjuge
    nomeConjuge: profile?.nome_conjuge || "",
    cpfConjuge: profile?.cpf_conjuge || "",
    rgConjuge: profile?.rg_conjuge || "",
    orgaoEmissorConjuge: profile?.orgao_emissor_conjuge || "",
    dataNascimentoConjuge: profile?.data_nascimento_conjuge
      ? new Date(profile.data_nascimento_conjuge).toISOString().split("T")[0]
      : "",
  };

  // Inicializa o formulário
  const form = useForm<FormValues>({
    resolver: zodResolver(personalDataSchema),
    defaultValues,
    mode: "onChange",
  });

  // Observar mudanças no campo estadoCivil
  const estadoCivil = useWatch({
    control: form.control,
    name: "estadoCivil",
  });

  // Atualizar visibilidade dos campos do cônjuge com base no estado civil
  useEffect(() => {
    setShowSpouseFields(
      estadoCivil === "CASADO" || estadoCivil === "UNIAO_ESTAVEL"
    );
  }, [estadoCivil]);

  // Handler para submissão do formulário
  const handleSubmit = async (data: FormValues) => {
    try {
      setIsSubmitting(true);
      await onSubmit(data);
    } catch (error) {
      console.error("Erro ao submeter formulário:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <h3 className="text-lg font-semibold mb-4">Dados Pessoais</h3>

        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Nome completo</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  placeholder="Digite seu nome completo"
                  required
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
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
                      // Mantém apenas os números no valor interno, mas mostra formatado
                      const rawValue = e.target.value.replace(/\D/g, "");
                      field.onChange(rawValue);
                    }}
                    onBlur={field.onBlur}
                    name={field.name}
                    ref={field.ref}
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
                    date={field.value ? new Date(field.value) : undefined}
                    onSelect={(date) =>
                      field.onChange(
                        date ? date.toISOString().split("T")[0] : ""
                      )
                    }
                    disabled={isSubmitting}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="rg"
            render={({ field }) => (
              <FormItem>
                <FormLabel>RG</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Digite seu RG"
                    value={formatRG(field.value || "")}
                    onChange={(e) => {
                      // Mantém apenas os números e X no valor interno, mas mostra formatado
                      const rawValue = e.target.value.replace(/[^\dX]/g, "");
                      field.onChange(rawValue);
                    }}
                    onBlur={field.onBlur}
                    name={field.name}
                    ref={field.ref}
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
                  <Input
                    placeholder="SSP"
                    value={field.value || ""}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    name={field.name}
                    ref={field.ref}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="naturalidade"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Naturalidade</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Cidade/UF"
                    value={field.value || ""}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    name={field.name}
                    ref={field.ref}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="estadoCivil"
            render={({ field }) => {
              // Convert null to undefined for the select component
              const value = field.value === null ? undefined : field.value;

              return (
                <FormItem>
                  <FormLabel>Estado civil</FormLabel>
                  <Select onValueChange={field.onChange} value={value}>
                    <FormControl>
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Selecione..." />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="SOLTEIRO">Solteiro(a)</SelectItem>
                      <SelectItem value="CASADO">Casado(a)</SelectItem>
                      <SelectItem value="DIVORCIADO">Divorciado(a)</SelectItem>
                      <SelectItem value="VIUVO">Viúvo(a)</SelectItem>
                      <SelectItem value="UNIAO_ESTAVEL">
                        União estável
                      </SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              );
            }}
          />
        </div>

        {/* Campos do cônjuge - exibidos apenas se casado ou união estável */}
        {showSpouseFields && (
          <Card className="p-4 mt-4 border border-primary/20">
            <h4 className="text-base font-medium mb-4">Dados do Cônjuge</h4>

            <FormField
              control={form.control}
              name="nomeConjuge"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome do cônjuge</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Nome completo do cônjuge"
                      value={field.value || ""}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      name={field.name}
                      ref={field.ref}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4 mt-4">
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
                          const rawValue = e.target.value.replace(/\D/g, "");
                          field.onChange(rawValue);
                        }}
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
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
                        date={field.value ? new Date(field.value) : undefined}
                        onSelect={(date) =>
                          field.onChange(
                            date ? date.toISOString().split("T")[0] : ""
                          )
                        }
                        disabled={isSubmitting}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-2 gap-4 mt-4">
              <FormField
                control={form.control}
                name="rgConjuge"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>RG do cônjuge</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Digite o RG do cônjuge"
                        value={formatRG(field.value || "")}
                        onChange={(e) => {
                          // Mantém apenas os números e X no valor interno, mas mostra formatado
                          const rawValue = e.target.value.replace(
                            /[^\dX]/g,
                            ""
                          );
                          field.onChange(rawValue);
                        }}
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
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
                      <Input
                        placeholder="SSP"
                        value={field.value || ""}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        name={field.name}
                        ref={field.ref}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </Card>
        )}

        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <svg
                  className="mr-2 h-4 w-4 animate-spin"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Salvando...
              </>
            ) : (
              "Avançar"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
