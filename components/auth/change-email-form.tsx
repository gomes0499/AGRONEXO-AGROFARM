"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { changeEmailSchema, ChangeEmailFormValues } from "@/schemas/auth";
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
import { changeUserEmail } from "@/lib/auth/actions/auth-actions";
import { toast } from "sonner";

export function ChangeEmailForm() {
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<ChangeEmailFormValues>({
    resolver: zodResolver(changeEmailSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  async function onSubmit(values: ChangeEmailFormValues) {
    setIsLoading(true);
    
    try {
      const result = await changeUserEmail(values);
      
      if (result.success) {
        toast.success(result.message || "Email atualizado com sucesso");
        form.reset();
      } else {
        toast.error(result.error || "Erro ao atualizar email");
      }
    } catch (error) {
      toast.error("Ocorreu um erro ao processar sua solicitação");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <div className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Novo Email</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="seu-novo-email@exemplo.com"
                    type="email"
                    autoComplete="email"
                    disabled={isLoading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Senha Atual (para confirmar)</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    placeholder="Sua senha atual"
                    type="password"
                    autoComplete="current-password"
                    disabled={isLoading}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="flex justify-end">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Atualizando..." : "Atualizar Email"}
          </Button>
        </div>
      </form>
    </Form>
  );
}