"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { z } from "zod";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { addressSchema } from "@/schemas/auth";
import { Loader2 } from "lucide-react";
import { formatCEP, fetchAddressByCep } from "@/lib/utils/format";

// Form de endereço
export function AddressForm({
  profile,
  onSubmit,
  onBack,
}: {
  profile: any;
  onSubmit: (data: any) => void;
  onBack: () => void;
}) {
  const [isLoading, setIsLoading] = useState(false);

  // Define the form values type based on schema
  type FormValues = z.infer<typeof addressSchema>;

  // Valores iniciais
  const defaultValues: Partial<FormValues> = {
    cep: profile?.cep || "",
    endereco: profile?.endereco || "",
    numero: profile?.numero || "",
    complemento: profile?.complemento || "",
    bairro: profile?.bairro || "",
    cidade: profile?.cidade || "",
    estado: profile?.estado || "",
  };

  // Inicializa o formulário
  const form = useForm<FormValues>({
    resolver: zodResolver(addressSchema),
    defaultValues,
  });

  // Handler para consulta de CEP
  const handleCepBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
    const cep = e.target.value.replace(/\D/g, "");

    if (cep.length === 8) {
      setIsLoading(true);

      try {
        const data = await fetchAddressByCep(cep);

        if (data) {
          form.setValue("endereco", data.logradouro);
          form.setValue("bairro", data.bairro);
          form.setValue("cidade", data.localidade);
          form.setValue("estado", data.uf);

          // Foca o campo número após preencher o endereço
          document.getElementById("numero")?.focus();
        }
      } catch (error) {
        console.error("Erro ao consultar CEP:", error);
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Handler para submissão do formulário
  const handleSubmit = (data: FormValues) => {
    onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <h3 className="text-lg font-semibold mb-4">Endereço</h3>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="cep"
            render={({ field }) => (
              <FormItem>
                <FormLabel>CEP</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input
                      placeholder="00000-000"
                      value={formatCEP(field.value || "")}
                      onChange={(e) => {
                        // Mantém apenas os números no valor interno, mas mostra formatado
                        const rawValue = e.target.value.replace(/\D/g, "");
                        field.onChange(rawValue);
                      }}
                      onBlur={(e) => {
                        field.onBlur();
                        handleCepBlur(e);
                      }}
                      name={field.name}
                      ref={field.ref}
                      inputMode="numeric"
                      maxLength={9}
                    />
                    {isLoading && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                      </div>
                    )}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="numero"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Número</FormLabel>
                <FormControl>
                  <Input
                    id="numero"
                    placeholder="Número"
                    value={field.value || ""}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    name={field.name}
                    ref={field.ref}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="endereco"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Logradouro</FormLabel>
              <FormControl>
                <Input
                  placeholder="Rua, Avenida, etc."
                  value={field.value || ""}
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  name={field.name}
                  ref={field.ref}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="complemento"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Complemento</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Apto, Bloco, etc."
                    value={field.value || ""}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    name={field.name}
                    ref={field.ref}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="bairro"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Bairro</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Bairro"
                    value={field.value || ""}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    name={field.name}
                    ref={field.ref}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="cidade"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cidade</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Cidade"
                    value={field.value || ""}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    name={field.name}
                    ref={field.ref}
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
                <FormLabel>Estado</FormLabel>
                <FormControl>
                  <Input
                    placeholder="UF"
                    maxLength={2}
                    value={field.value || ""}
                    onChange={field.onChange}
                    onBlur={field.onBlur}
                    name={field.name}
                    ref={field.ref}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

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
