import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { FormControl, FormField, FormItem } from "@/components/ui/form";
import type { UseFormReturn } from "react-hook-form";
import type { OrganizationFormValues } from "../schemas/organization-form-schema";

interface EntityTypeSelectorProps {
  form: UseFormReturn<OrganizationFormValues>;
}

export function EntityTypeSelector({ form }: EntityTypeSelectorProps) {
  return (
    <FormField
      control={form.control}
      name="tipo"
      render={({ field }) => (
        <FormItem>
          <FormControl>
            <RadioGroup
              onValueChange={field.onChange}
              value={field.value}
              className="grid grid-cols-1 lg:grid-cols-2 gap-3"
            >
              <div className="flex items-center space-x-2 border rounded-md p-3 hover:bg-muted/50 transition-colors cursor-pointer">
                <RadioGroupItem value="fisica" id="fisica" />
                <label
                  htmlFor="fisica"
                  className="cursor-pointer font-regular text-sm"
                >
                  Pessoa Física
                </label>
              </div>
              <div className="flex items-center space-x-2 border rounded-md p-3 hover:bg-muted/50 transition-colors cursor-pointer">
                <RadioGroupItem value="juridica" id="juridica" />
                <label
                  htmlFor="juridica"
                  className="cursor-pointer font-regular text-sm"
                >
                  Pessoa Jurídica
                </label>
              </div>
            </RadioGroup>
          </FormControl>
        </FormItem>
      )}
    />
  );
}