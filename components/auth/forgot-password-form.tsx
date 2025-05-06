"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  forgotPasswordSchema,
  type ForgotPasswordFormValues,
} from "@/schemas/auth";
import { forgotPassword } from "@/lib/auth/actions/auth-actions";

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
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

export function ForgotPasswordForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Form com validação Zod
  const form = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: {
      email: "",
    },
  });

  // Função para submeter o formulário
  async function onSubmit(data: ForgotPasswordFormValues) {
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const result = await forgotPassword(data);

      if (!result.success) {
        throw new Error(
          result.error || "Ocorreu um erro ao processar a solicitação."
        );
      }

      // Mostrar mensagem de sucesso
      setSuccess(true);
      form.reset();
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Não foi possível processar a solicitação"
      );
    } finally {
      setIsLoading(false);
    }
  }

  // Se a solicitação foi bem-sucedida, mostrar mensagem de confirmação
  if (success) {
    return (
      <div className="mx-auto w-full max-w-md space-y-6">
        <div className="flex flex-col items-center justify-center space-y-3 text-center">
          <CheckCircle2 className="h-12 w-12 text-green-500" />
          <h2 className="text-2xl font-semibold">Email enviado!</h2>
          <p className="text-muted-foreground">
            Se o email informado estiver cadastrado em nossa plataforma, você
            receberá instruções para redefinir sua senha. Por favor, verifique
            sua caixa de entrada.
          </p>
          <Button asChild className="mt-4">
            <Link href="/auth/login">Voltar para Login</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-md space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">Recuperar Senha</h1>
        <p className="text-gray-500 dark:text-gray-400">
          Informe seu email para receber as instruções de recuperação
        </p>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    placeholder="seuemail@exemplo.com"
                    type="email"
                    autoComplete="email"
                    disabled={isLoading}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Enviando...
              </>
            ) : (
              "Enviar Instruções"
            )}
          </Button>
        </form>
      </Form>

      <div className="text-center text-sm">
        <p>
          Lembrou sua senha?{" "}
          <Link
            href="/auth/login"
            className="font-medium text-primary hover:underline"
          >
            Voltar para login
          </Link>
        </p>
      </div>
    </div>
  );
}
