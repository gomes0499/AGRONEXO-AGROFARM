"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { UserRole } from "@/lib/auth/roles";
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
import { toast } from "sonner";
import { Loader2, Send } from "lucide-react";
import { createInvite } from "@/lib/auth/actions/auth-actions";
import { useUser } from "@/components/auth/user-provider";
import { useRouter } from "next/navigation";

// Schema de validação para o formulário
const inviteSchema = z.object({
  email: z.string().email("Email inválido"),
  funcao: z.enum([UserRole.ADMINISTRADOR, UserRole.MEMBRO], {
    required_error: "Selecione uma função",
  }),
});

type InviteFormValues = z.infer<typeof inviteSchema>;

interface InviteFormProps {
  organizationId: string;
  onSuccess?: () => void;
}

export function InviteForm({ organizationId, onSuccess }: InviteFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { user } = useUser();
  const router = useRouter();

  // Inicializa o formulário
  const form = useForm<InviteFormValues>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      email: "",
      funcao: UserRole.MEMBRO,
    },
  });

  // Função para lidar com a submissão do formulário
  async function onSubmit(values: InviteFormValues) {
    if (!user) {
      toast.error("Usuário não autenticado");
      return;
    }

    setIsLoading(true);

    try {
      const result = await createInvite(
        values.email,
        organizationId,
        values.funcao
      );

      console.log("Resultado do convite:", result);

      if (result.success) {
        toast.success(
          "Convite enviado com sucesso! Um email foi enviado para o usuário."
        );
        form.reset();

        // Se estiver em um diálogo, chama o callback de sucesso
        if (onSuccess) {
          onSuccess();
        } else {
          // Comportamento original: redirecionar para a aba de convites
          router.push(`/dashboard/organization/${organizationId}?tab=invites`);
        }

        // Atualiza a UI para refletir o novo convite
        router.refresh();
      } else if (
        result.error?.includes("já existe um convite pendente") ||
        result.error?.includes("already exists")
      ) {
        // Para convites duplicados, oferecer a opção de reenviar
        toast.error(
          `${result.error}. Você pode reenviar o convite na aba 'Convites'.`,
          {
            duration: 5000, // Mostrar por mais tempo
            action: {
              label: "Ver Convites",
              onClick: () => {
                if (onSuccess) {
                  onSuccess(); // Fecha o diálogo se estiver aberto
                }
                router.push(
                  `/dashboard/organization/${organizationId}?tab=invites`
                );
              },
            },
          }
        );
      } else if (result.error?.includes("já faz parte")) {
        // Para usuários que já são membros
        toast.error(
          `${result.error}. Você pode ver todos os membros na aba 'Membros'.`,
          {
            duration: 5000,
            action: {
              label: "Ver Membros",
              onClick: () => {
                if (onSuccess) {
                  onSuccess(); // Fecha o diálogo se estiver aberto
                }
                router.push(
                  `/dashboard/organization/${organizationId}?tab=members`
                );
              },
            },
          }
        );
      } else {
        toast.error(result.error || "Erro ao enviar convite");
      }
    } catch (error: any) {
      console.error("Erro ao enviar convite:", error);
      toast.error(
        "Erro ao enviar convite: " + (error.message || "Erro desconhecido")
      );
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email*</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="usuario@exemplo.com"
                  {...field}
                />
              </FormControl>
              <FormDescription>
                O convite será enviado para este email
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="funcao"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Função*</FormLabel>
              <FormControl>
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a função" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={UserRole.ADMINISTRADOR}>
                      Administrador
                    </SelectItem>
                    <SelectItem value={UserRole.MEMBRO}>Membro</SelectItem>
                  </SelectContent>
                </Select>
              </FormControl>
              <FormDescription>
                Administradores podem gerenciar membros, Membros têm acesso
                restrito
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2">
          {!onSuccess && (
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                router.push(`/dashboard/organization/${organizationId}`);
              }}
              disabled={isLoading}
            >
              Cancelar
            </Button>
          )}
          <Button type="submit" disabled={isLoading} className="gap-2">
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Enviar Convite
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
