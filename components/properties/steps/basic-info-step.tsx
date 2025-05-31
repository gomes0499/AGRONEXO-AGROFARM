import {
  Building,
  User,
  Calendar,
  Tag,
  MapPin,
  Hash,
  DollarSign,
  Ruler,
  FileText,
  UserCheck,
  ClipboardSignature,
  FileCheck,
  Clock,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { CurrencyField } from "@/components/shared/currency-field";
import { DatePicker } from "@/components/shared/datepicker";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import type { UseFormReturn } from "react-hook-form";
import type { PropertyFormValues, anuenciaTypeEnum } from "@/schemas/properties";
import { PropertyImageUpload } from "../property-image-upload";
import { useWatch } from "react-hook-form";
import { useEffect } from "react";

interface BasicInfoStepProps {
  form: UseFormReturn<PropertyFormValues>;
  imageUrl: string | null;
  onImageSuccess: (url: string) => void;
  onImageRemove: () => void;
}

const BRAZILIAN_STATES = [
  { value: "AC", label: "Acre" },
  { value: "AL", label: "Alagoas" },
  { value: "AP", label: "Amapá" },
  { value: "AM", label: "Amazonas" },
  { value: "BA", label: "Bahia" },
  { value: "CE", label: "Ceará" },
  { value: "DF", label: "Distrito Federal" },
  { value: "ES", label: "Espírito Santo" },
  { value: "GO", label: "Goiás" },
  { value: "MA", label: "Maranhão" },
  { value: "MT", label: "Mato Grosso" },
  { value: "MS", label: "Mato Grosso do Sul" },
  { value: "MG", label: "Minas Gerais" },
  { value: "PA", label: "Pará" },
  { value: "PB", label: "Paraíba" },
  { value: "PR", label: "Paraná" },
  { value: "PE", label: "Pernambuco" },
  { value: "PI", label: "Piauí" },
  { value: "RJ", label: "Rio de Janeiro" },
  { value: "RN", label: "Rio Grande do Norte" },
  { value: "RS", label: "Rio Grande do Sul" },
  { value: "RO", label: "Rondônia" },
  { value: "RR", label: "Roraima" },
  { value: "SC", label: "Santa Catarina" },
  { value: "SP", label: "São Paulo" },
  { value: "SE", label: "Sergipe" },
  { value: "TO", label: "Tocantins" },
];

export function BasicInfoStep({
  form,
  imageUrl,
  onImageSuccess,
  onImageRemove,
}: BasicInfoStepProps) {
  // Watch the property type to conditionally render fields
  const propertyType = useWatch({
    control: form.control,
    name: "tipo",
    defaultValue: "PROPRIO"
  });

  const isLeased = propertyType === "ARRENDADO";
  
  // Quando o tipo mudar para arrendado, limpar o ano de aquisição
  // e quando mudar para próprio, limpar os campos de arrendamento
  useEffect(() => {
    if (isLeased) {
      // Se for arrendado, limpar o ano de aquisição
      form.setValue("ano_aquisicao", null, { shouldValidate: false });
    } else {
      // Se for próprio, limpar os campos específicos de arrendamento
      form.setValue("data_inicio", null, { shouldValidate: false });
      form.setValue("data_termino", null, { shouldValidate: false });
      form.setValue("tipo_anuencia", "", { shouldValidate: false });
    }
  }, [isLeased, form]);
  
  return (
    <div className="space-y-6">
      <div className="flex justify-start">
        <PropertyImageUpload
          currentImageUrl={imageUrl}
          onSuccess={onImageSuccess}
          onRemove={onImageRemove}
          isTemporary={true}
          variant="avatar"
          size="sm"
        />
      </div>

      {/* Informações Básicas */}
      <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
        <FormField
          control={form.control}
          name="nome"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-1.5">
                <Building className="h-3.5 w-3.5 text-muted-foreground" />
                Nome da Propriedade*
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="Ex: Fazenda São João"
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
          name="proprietario"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-1.5">
                <User className="h-3.5 w-3.5 text-muted-foreground" />
                Proprietário*
              </FormLabel>
              <FormControl>
                <Input
                  placeholder="Nome do proprietário"
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
          name="tipo"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-1.5">
                <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                Tipo de Propriedade*
              </FormLabel>
              <Select onValueChange={field.onChange} value={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="PROPRIO">Própria</SelectItem>
                  <SelectItem value="ARRENDADO">Arrendada</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>

      <Separator />

      {/* Localização */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-muted-foreground">Localização</h4>
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
          <FormField
            control={form.control}
            name="cidade"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                  Cidade*
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="Nome da cidade"
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
            name="estado"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                  Estado*
                </FormLabel>
                <Select onValueChange={field.onChange} value={field.value || undefined}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o estado" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {BRAZILIAN_STATES.map((state) => (
                      <SelectItem key={state.value} value={state.value}>
                        {state.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="numero_matricula"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-1.5">
                  <Hash className="h-3.5 w-3.5 text-muted-foreground" />
                  Número da Matrícula*
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="Ex: 12345"
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
      </div>

      <Separator />

      {/* Áreas e Valores */}
      <div className="space-y-4">
        <h4 className="text-sm font-medium text-muted-foreground">Áreas e Valores</h4>
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
          <FormField
            control={form.control}
            name="area_total"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-1.5">
                  <Ruler className="h-3.5 w-3.5 text-muted-foreground" />
                  Área Total (ha)*
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    {...field}
                    value={field.value ?? ""}
                    onChange={(e) => {
                      const value = e.target.value === "" ? null : parseFloat(e.target.value);
                      field.onChange(value);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="area_cultivada"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-1.5">
                  <Ruler className="h-3.5 w-3.5 text-muted-foreground" />
                  Área Cultivada (ha)
                </FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    step="0.01"
                    placeholder="0.00"
                    {...field}
                    value={field.value ?? ""}
                    onChange={(e) => {
                      const value = e.target.value === "" ? null : parseFloat(e.target.value);
                      field.onChange(value);
                    }}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name={isLeased ? "cartorio_registro" : "ano_aquisicao"}
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-1.5">
                  {isLeased ? (
                    <>
                      <FileCheck className="h-3.5 w-3.5 text-muted-foreground" />
                      Cartório de Registro
                    </>
                  ) : (
                    <>
                      <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                      Ano de Aquisição*
                    </>
                  )}
                </FormLabel>
                <FormControl>
                  {isLeased ? (
                    <Input
                      placeholder="Nome do cartório"
                      {...field}
                      value={field.value ?? ""}
                    />
                  ) : (
                    <Input
                      type="number"
                      placeholder="2024"
                      {...field}
                      value={field.value ?? ""}
                      onChange={(e) => {
                        const value = e.target.value === "" ? null : parseInt(e.target.value);
                        field.onChange(value);
                      }}
                    />
                  )}
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
          <FormField
            control={form.control}
            name="numero_car"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="flex items-center gap-1.5">
                  <Hash className="h-3.5 w-3.5 text-muted-foreground" />
                  Número do CAR
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder="Cadastro Ambiental Rural"
                    {...field}
                    value={field.value ?? ""}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        {isLeased && (
          <div className="grid gap-4 grid-cols-1 lg:grid-cols-3">
            <FormField
              control={form.control}
              name="data_inicio"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                    Data de Início*
                  </FormLabel>
                  <DatePicker
                    date={field.value ? new Date(field.value) : undefined}
                    onSelect={field.onChange}
                    disabled={false}
                    placeholder="Data de início"
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="data_termino"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel className="flex items-center gap-1.5">
                    <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
                    Data de Término*
                  </FormLabel>
                  <DatePicker
                    date={field.value ? new Date(field.value) : undefined}
                    onSelect={field.onChange}
                    disabled={false}
                    placeholder="Data de término"
                  />
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="tipo_anuencia"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                    Tipo de Anuência*
                  </FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    value={field.value || ""}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="COM_ANUENCIA">Com Anuência</SelectItem>
                      <SelectItem value="SEM_ANUENCIA">Sem Anuência</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        )}
        

        <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
          <CurrencyField
            name="valor_atual"
            label="Valor Atual"
            control={form.control}
            placeholder="R$ 0,00"
          />

          <CurrencyField
            name="avaliacao_banco"
            label="Avaliação do Banco"
            control={form.control}
            placeholder="R$ 0,00"
          />
        </div>

        <FormField
          control={form.control}
          name="onus"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                Ônus (Observações)
              </FormLabel>
              <FormControl>
                <Textarea
                  placeholder="Descreva qualquer ônus ou observação sobre a propriedade..."
                  className="min-h-[80px]"
                  {...field}
                  value={field.value ?? ""}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  );
}