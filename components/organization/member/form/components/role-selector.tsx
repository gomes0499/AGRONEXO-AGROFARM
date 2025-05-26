import { UserCog, Shield, User } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { UserRole } from "@/lib/auth/roles";
import type { UseFormReturn } from "react-hook-form";
import type { MemberFormValues } from "../schemas/member-form-schema";

interface RoleSelectorProps {
  form: UseFormReturn<MemberFormValues>;
}

export function RoleSelector({ form }: RoleSelectorProps) {
  const roleOptions = [
    {
      value: UserRole.ADMINISTRADOR,
      label: "Administrador",
      description: "Pode gerenciar membros e configurações",
      icon: Shield,
    },
    {
      value: UserRole.MEMBRO,
      label: "Membro",
      description: "Acesso básico ao sistema",
      icon: User,
    },
  ];

  return (
    <FormField
      control={form.control}
      name="funcao"
      render={({ field }) => (
        <FormItem>
          <FormLabel className="flex items-center gap-1.5">
            <UserCog className="h-3.5 w-3.5 text-muted-foreground" />
            Função na Organização*
          </FormLabel>
          <Select onValueChange={field.onChange} defaultValue={field.value}>
            <FormControl>
              <SelectTrigger>
                <SelectValue placeholder="Selecione a função" />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {roleOptions.map((role) => (
                <SelectItem key={role.value} value={role.value}>
                  <div className="flex items-center gap-2">
                    <role.icon className="h-4 w-4" />
                    <div>
                      <div className="font-medium">{role.label}</div>
                      <div className="text-xs text-muted-foreground">
                        {role.description}
                      </div>
                    </div>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />
  );
}