import { User, Mail, Phone } from "lucide-react";
import { Input } from "@/components/ui/input";
import { DatePicker } from "@/components/shared/datepicker";
import { Separator } from "@/components/ui/separator";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { FormattedInput } from "@/components/shared/formatted-input";
import { RoleSelector } from "../components/role-selector";
import { MaritalStatusSelector } from "../components/marital-status-selector";
import type { UseFormReturn } from "react-hook-form";
import type { MemberFormValues } from "../schemas/member-form-schema";

interface BasicInfoStepProps {
  form: UseFormReturn<MemberFormValues>;
}

export function BasicInfoStep({ form }: BasicInfoStepProps) {
  return (
    <div className="space-y-6 ">
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2 ">
        <FormField
          control={form.control}
          name="nome"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-muted-foreground" />
                Nome Completo*
              </FormLabel>
              <FormControl>
                <Input placeholder="Ex: João Silva Santos" {...field} />
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
                  type="email"
                  placeholder="email@exemplo.com"
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

        <RoleSelector form={form} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField
          control={form.control}
          name="dataNascimento"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Data de Nascimento</FormLabel>
              <FormControl>
                <DatePicker
                  date={field.value}
                  onSelect={field.onChange}
                  placeholder="Selecione a data de nascimento"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <MaritalStatusSelector form={form} />
      </div>

      {/* Spouse Information */}
      {(form.watch("estadoCivil") === "casado" ||
        form.watch("estadoCivil") === "uniao_estavel") && (
        <>
          <Separator />
          <div className="space-y-4">
            <h4 className="text-sm font-medium">Informações do Cônjuge</h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="nomeConjuge"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Cônjuge</FormLabel>
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
                    <FormLabel>CPF do Cônjuge</FormLabel>
                    <FormControl>
                      <Input placeholder="000.000.000-00" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="rgConjuge"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>RG do Cônjuge</FormLabel>
                    <FormControl>
                      <Input placeholder="Digite o RG" {...field} />
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
                    <FormLabel>Órgão Emissor do Cônjuge</FormLabel>
                    <FormControl>
                      <Input placeholder="SSP, DETRAN, etc." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="dataNascimentoConjuge"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data de Nascimento do Cônjuge</FormLabel>
                  <FormControl>
                    <DatePicker
                      date={field.value}
                      onSelect={field.onChange}
                      placeholder="Selecione a data de nascimento"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </>
      )}
    </div>
  );
}
