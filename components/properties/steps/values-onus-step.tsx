import {
  DollarSign,
  Building2,
  Trees,
  Shield,
  Banknote,
  FileText,
  Upload,
  Calculator,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { CurrencyField } from "@/components/shared/currency-field";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import type { UseFormReturn } from "react-hook-form";
import type { PropertyFormValues } from "@/schemas/properties";
import { useWatch } from "react-hook-form";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { DocumentUpload } from "../document-upload";
import { useOrganization } from "@/components/auth/organization-provider";

// Type-safe wrapper for CurrencyField
const CurrencyFieldWrapper = CurrencyField as any;

interface ValuesOnusStepProps {
  form: UseFormReturn<PropertyFormValues>;
}

export function ValuesOnusStep({ form }: ValuesOnusStepProps) {
  const { organization } = useOrganization();
  // Watch values for automatic calculation
  const valorTerraNua = useWatch({
    control: form.control,
    name: "valor_terra_nua",
    defaultValue: null,
  });

  const valorBenfeitoria = useWatch({
    control: form.control,
    name: "valor_benfeitoria",
    defaultValue: null,
  });

  // Watch property type
  const propertyType = useWatch({
    control: form.control,
    name: "tipo",
    defaultValue: "PROPRIO",
  });

  // Calculate total value automatically
  useEffect(() => {
    const terraNua = valorTerraNua || 0;
    const benfeitoria = valorBenfeitoria || 0;
    const total = terraNua + benfeitoria;

    // Only update if the calculated value is different from current
    const currentValue = form.getValues("valor_atual");
    if (currentValue !== total) {
      form.setValue("valor_atual", total > 0 ? total : null, {
        shouldValidate: false,
        shouldDirty: true,
      });
    }
  }, [valorTerraNua, valorBenfeitoria, form]);


  return (
    <div className="space-y-6">
      {/* Valores da Propriedade */}
      <div className="space-y-4">
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
          {/* @ts-ignore */}
          <CurrencyFieldWrapper
            name="valor_terra_nua"
            label="Valor da Terra Nua"
            control={form.control as any}
            placeholder="R$ 0,00"
            icon={Trees}
            description="Valor da terra sem benfeitorias"
          />

          {/* @ts-ignore */}
          <CurrencyFieldWrapper
            name="valor_benfeitoria"
            label="Valor das Benfeitorias"
            control={form.control as any}
            placeholder="R$ 0,00"
            icon={Building2}
            description="Valor de todas as benfeitorias"
          />
        </div>

        <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
          {/* @ts-ignore */}
          <CurrencyFieldWrapper
            name="valor_atual"
            label="Valor Total"
            control={form.control as any}
            placeholder="R$ 0,00"
            icon={Calculator}
            description="Calculado automaticamente (Terra + Benfeitorias)"
            disabled={true}
          />

          {/* @ts-ignore */}
          <CurrencyFieldWrapper
            name="avaliacao_banco"
            label="Avaliação do Banco"
            control={form.control as any}
            placeholder="R$ 0,00"
            icon={Banknote}
            description="Valor de avaliação bancária"
          />
        </div>
      </div>

      <Separator />

      {/* Ônus e Gravames */}
      <div className="space-y-4">
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
          <FormField
            control={form.control as any}
            name="tipo_onus"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-1.5">
                  <Shield className="h-3.5 w-3.5 text-muted-foreground" />
                  Tipo de Ônus
                </FormLabel>
                <Select
                  onValueChange={field.onChange}
                  value={field.value || undefined}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o tipo de ônus" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="hipoteca">Hipoteca</SelectItem>
                    <SelectItem value="alienacao_fiduciaria">
                      Alienação Fiduciária
                    </SelectItem>
                    <SelectItem value="outros">Outros</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control as any}
            name="banco_onus"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-1.5">
                  <Banknote className="h-3.5 w-3.5 text-muted-foreground" />
                  Banco/Instituição do Ônus
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="Ex: Banco do Brasil"
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
          {/* @ts-ignore */}
          <CurrencyFieldWrapper
            name="valor_onus"
            label="Valor do Ônus"
            control={form.control as any}
            placeholder="R$ 0,00"
            icon={DollarSign}
            description="Valor total do gravame"
          />

          {/* @ts-ignore */}
          <CurrencyFieldWrapper
            name="avaliacao_terceiro"
            label="Avaliação de Terceiro"
            control={form.control as any}
            placeholder="R$ 0,00"
            icon={FileText}
            description="Valor de avaliação externa"
          />
        </div>

        <FormField
          control={form.control}
          name="onus"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                Observações sobre Ônus
              </FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Detalhes adicionais sobre o ônus ou gravame..."
                  className="min-h-[80px]"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="documento_onus_url"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-1.5">
                <Upload className="h-3.5 w-3.5 text-muted-foreground" />
                Documento do Ônus (Opcional)
              </FormLabel>
              <FormControl>
                {/* @ts-ignore */}
                <DocumentUpload
                  value={field.value || ""}
                  onChange={field.onChange}
                  organizationId={organization?.id || ""}
                  propertyId=""
                  placeholder="Nenhum documento anexado"
                />
              </FormControl>
              <FormDescription>
                Anexe documentos relacionados ao ônus (contratos, certidões,
                etc.)
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

    </div>
  );
}
