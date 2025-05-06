"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

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
import { personalInfoSchema } from "@/schemas/auth";

// Form de documentos
export function DocumentsForm({
  profile,
  onSubmit,
  onBack,
}: {
  profile: any;
  onSubmit: (data: any) => void;
  onBack: () => void;
}) {
  // Schema específico para este formulário
  const documentsSchema = personalInfoSchema.pick({
    inscricaoProdutorRural: true,
  });

  // Define the form values type based on schema
  type FormValues = z.infer<typeof documentsSchema>;

  // Valores iniciais
  const defaultValues: Partial<FormValues> = {
    inscricaoProdutorRural: profile?.inscricao_produtor_rural || "",
  };

  // Inicializa o formulário
  const form = useForm<FormValues>({
    resolver: zodResolver(documentsSchema),
    defaultValues,
  });

  // Handler para submissão do formulário
  const handleSubmit = (data: FormValues) => {
    onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <h3 className="text-lg font-semibold mb-4">Documentos</h3>

        <FormField
          control={form.control}
          name="inscricaoProdutorRural"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Inscrição de Produtor Rural</FormLabel>
              <FormControl>
                <Input
                  placeholder="Digite o número da inscrição"
                  value={field.value || ""}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  name={field.name}
                  ref={field.ref}
                />
              </FormControl>
              <FormDescription>
                Apenas necessário para produtores rurais
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-between pt-4">
          <Button type="button" variant="outline" onClick={onBack}>
            Voltar
          </Button>
          <Button type="submit">Avançar</Button>
        </div>
      </form>
    </Form>
  );
}
