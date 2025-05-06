"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  resetPasswordSchema,
  type ResetPasswordFormValues,
} from "@/schemas/auth";
import { resetPassword } from "@/lib/auth/actions/auth-actions";

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

export function ResetPasswordForm() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  // Form com validação Zod
  const form = useForm<ResetPasswordFormValues>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  // Função para submeter o formulário
  async function onSubmit(data: ResetPasswordFormValues) {
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const result = await resetPassword(data);

      if (!result.success) {
        throw new Error(
          result.error || "Ocorreu um erro ao redefinir a senha."
        );
      }

      // Mostrar mensagem de sucesso
      setSuccess(true);
      form.reset();

      // Redirecionar após alguns segundos
      setTimeout(() => {
        router.push("/auth/login");
      }, 5000);
    } catch (error) {
      setError(
        error instanceof Error
          ? error.message
          : "Não foi possível redefinir a senha"
      );
    } finally {
      setIsLoading(false);
    }
  }

  // Se a redefinição foi bem-sucedida, mostrar mensagem de confirmação
  if (success) {
    return (
      <div className="mx-auto w-full max-w-md space-y-4">
        <div className="flex flex-col items-center justify-center space-y-3 text-center">
          <CheckCircle2 className="h-12 w-12 text-green-500" />
          <h2 className="text-2xl font-semibold">Senha redefinida!</h2>
          <p className="text-muted-foreground">
            Sua senha foi redefinida com sucesso. Você será redirecionado para a
            página de login em instantes.
          </p>
          <Button asChild className="mt-4">
            <Link href="/auth/login">Ir para Login</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-md space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">Redefinir Senha</h1>
        <p className="text-gray-500 dark:text-gray-400">
          Escolha uma nova senha para sua conta
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
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nova Senha</FormLabel>
                <FormControl>
                  <Input
                    placeholder="••••••••"
                    type="password"
                    autoComplete="new-password"
                    disabled={isLoading}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirmar Nova Senha</FormLabel>
                <FormControl>
                  <Input
                    placeholder="••••••••"
                    type="password"
                    autoComplete="new-password"
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
                Processando...
              </>
            ) : (
              "Redefinir Senha"
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
