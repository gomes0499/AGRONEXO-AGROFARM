"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Trash2, AlertTriangle } from "lucide-react";
import { deleteOrganization } from "@/lib/actions/organization-actions";

// Create schema with string validation
const deleteSchema = z.object({
  confirmacao: z.string().min(1, "Campo obrigatório"),
});

// Create the type
type DeleteForm = z.infer<typeof deleteSchema>;

interface OrganizationSettingsProps {
  organizationId: string;
}

export function OrganizationSettings({
  organizationId,
}: OrganizationSettingsProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<DeleteForm>({
    resolver: zodResolver(deleteSchema),
    defaultValues: {
      confirmacao: "",
    },
  });

  async function onSubmit(data: DeleteForm) {
    // Verify the confirmation text before proceeding
    if (data.confirmacao !== "CONFIRMAR") {
      form.setError("confirmacao", {
        message: "Você deve digitar exatamente CONFIRMAR para continuar",
      });
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("organizacaoId", organizationId);
      formData.append("confirmacao", data.confirmacao);

      const result = await deleteOrganization(formData);

      if (result && "error" in result) {
        setError(result.error || "Erro desconhecido");
        setIsSubmitting(false);
      } else if (result && "success" in result && "redirect" in result) {
        // Redirecionamento bem-sucedido
        window.location.href = result.redirect as string;
      }
    } catch (err) {
      setError("Ocorreu um erro ao excluir a organização. Tente novamente.");
      setIsSubmitting(false);
    }
  }

  return (
    <Card className="border-border/50 hover:shadow-md transition-shadow">
      <CardHeader className="bg-primary text-white rounded-t-lg pb-4">
        <div className="flex items-center gap-3">
          <div className="rounded-full p-2 bg-white/20">
            <Trash2 className="h-4 w-4 text-white" />
          </div>
          <div>
            <CardTitle className="text-white">
              Configurações da Organização
            </CardTitle>
            <CardDescription className="text-white/80">
              Gerencie as configurações da sua organização
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-6 space-y-6 mt-4">
        <div className="space-y-6">
          <h3 className="text-lg font-medium text-destructive">
            Alerta de Exclusão !
          </h3>

          <Alert variant="destructive" className="border-destructive">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive text-destructive-foreground shrink-0">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <AlertTitle className="mb-2">Excluir Organização</AlertTitle>
                <AlertDescription>
                  Esta ação é permanente e não pode ser desfeita. Todos os dados
                  da organização, incluindo propriedades, membros e
                  configurações, serão excluídos permanentemente.
                </AlertDescription>
              </div>
            </div>
          </Alert>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="confirmacao"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-destructive">
                      Confirmação
                    </FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Digite CONFIRMAR para excluir"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Para confirmar, digite CONFIRMAR em maiúsculas exatamente
                      como mostrado.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {error && <div className="text-sm text-destructive">{error}</div>}

              <Button
                type="submit"
                variant="destructive"
                disabled={isSubmitting}
                className="gap-2"
              >
                <Trash2 className="h-4 w-4" />
                Excluir Organização Permanentemente
              </Button>
            </form>
          </Form>
        </div>
      </CardContent>
    </Card>
  );
}
