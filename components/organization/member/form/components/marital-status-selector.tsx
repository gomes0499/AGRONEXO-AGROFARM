import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
} from "@/components/ui/form";
import { User } from "lucide-react";
import type { UseFormReturn } from "react-hook-form";
import type { MemberFormValues } from "../schemas/member-form-schema";

interface MaritalStatusSelectorProps {
  form: UseFormReturn<MemberFormValues>;
}

export function MaritalStatusSelector({ form }: MaritalStatusSelectorProps) {
  const maritalStatusOptions = [
    { value: "solteiro", label: "Solteiro(a)" },
    { value: "casado", label: "Casado(a)" },
    { value: "divorciado", label: "Divorciado(a)" },
    { value: "viuvo", label: "Viúvo(a)" },
    { value: "uniao_estavel", label: "União Estável" },
    { value: "separado", label: "Separado(a)" },
  ];

  return (
    <FormField
      control={form.control}
      name="estadoCivil"
      render={({ field }) => (
        <FormItem>
          <FormLabel className="flex items-center gap-1.5">
            <User className="h-3.5 w-3.5 text-muted-foreground" />
            Estado Civil
          </FormLabel>
          <Select onValueChange={field.onChange} defaultValue={field.value}>
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o estado civil" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {maritalStatusOptions.map((status) => (
                <SelectItem key={status.value} value={status.value}>
                  {status.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormItem>
      )}
    />
  );
}
