import {
  Building2,
  Mail,
  Phone,
  Globe,
  Hash,
  CreditCard,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Separator } from "@/components/ui/separator";
import { FormattedInput } from "@/components/shared/formatted-input";
import type { UseFormReturn } from "react-hook-form";
import type { OrganizationFormValues } from "../schemas/organization-form-schema";
import { EntityTypeSelector } from "../components/entity-type-selector";
import { LogoUploadSection } from "../components/logo-upload-section";

interface BasicInfoStepProps {
  form: UseFormReturn<OrganizationFormValues>;
  entityType: "fisica" | "juridica";
  logoUrl: string | null;
  onLogoSuccess: (url: string) => void;
  onLogoRemove: () => void;
  onGenerateSlug: () => void;
}

export function BasicInfoStep({
  form,
  entityType,
  logoUrl,
  onLogoSuccess,
  onLogoRemove,
  onGenerateSlug,
}: BasicInfoStepProps) {
  return (
    <div className="space-y-6">
      {/* Upload de logo */}
      <LogoUploadSection
        logoUrl={logoUrl}
        onSuccess={onLogoSuccess}
        onRemove={onLogoRemove}
      />

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
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
                <Input placeholder="Ex: Grupo Safra S.A." {...field} />
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
                  <Input placeholder="Ex: fazenda-sao-joao" {...field} />
                </FormControl>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={onGenerateSlug}
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

      <Separator />

      <EntityTypeSelector form={form} />

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
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
          <>
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
          </>
        )}
      </div>

      <Separator />

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
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

        <div className="lg:col-span-2">
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
                  <Input placeholder="https://www.exemplo.com" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>
    </div>
  );
}