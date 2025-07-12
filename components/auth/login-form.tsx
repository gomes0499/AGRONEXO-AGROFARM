"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginFormValues } from "@/schemas/auth";
import { loginUser } from "@/lib/auth/actions/auth-actions";

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
import { Checkbox } from "@/components/ui/checkbox";
import { AlertCircle, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface LoginFormProps {
  email?: string;
  inviteToken?: string;
  redirectAfterLogin?: boolean;
}

export function LoginForm({
  email,
  inviteToken,
  redirectAfterLogin,
}: LoginFormProps = {}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

  // Form com validação Zod
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: email || "",
      password: "",
      rememberMe: false,
    },
  });

  // Função para submeter o formulário
  async function onSubmit(data: LoginFormValues) {
    setIsLoading(true);
    setError(null);

    try {
      const result = await loginUser(data);

      if (!result.success) {
        throw new Error(result.error || "Ocorreu um erro no login.");
      }

      // Redirecionar baseado no resultado do login
      if (inviteToken) {
        // Se temos um token de convite, vamos para a página de convite
        router.push(`/auth/invite?token=${inviteToken}`);
      } else if (result.needsOnboarding) {
        // Se precisa completar o onboarding
        router.push("/onboarding");
      } else {
        // Fluxo normal - vai para o dashboard ou callbackUrl
        router.push(callbackUrl);
      }

      router.refresh();
    } catch (error) {
      // Traduzir mensagens de erro comuns
      let errorMessage =
        error instanceof Error ? error.message : "Credenciais inválidas";

      // Mapeamento de erros comuns em inglês para português
      const errorMap: Record<string, string> = {
        "Invalid login credentials": "Credenciais de login inválidas",
        "Email not confirmed": "Email não confirmado",
        "Invalid email": "Email inválido",
        "Invalid password": "Senha inválida",
        "User not found": "Usuário não encontrado",
        "Invalid credentials": "Credenciais inválidas",
        "Email format is invalid": "Formato de email inválido",
        "Password should be at least 6 characters":
          "A senha deve ter pelo menos 6 caracteres",
        "Invalid or expired OTP": "Código de verificação inválido ou expirado",
        "Cannot sign up": "Não foi possível realizar o cadastro",
        "Rate limit exceeded":
          "Limite de tentativas excedido, tente novamente mais tarde",
        "User already registered": "Este usuário já está registrado",
        "Server error": "Erro no servidor, tente novamente mais tarde",
      };

      // Verificar se a mensagem de erro contém algum termo em inglês que precisa ser traduzido
      for (const [englishError, portugueseError] of Object.entries(errorMap)) {
        if (errorMessage.includes(englishError)) {
          errorMessage = portugueseError;
          break;
        }
      }

      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-md space-y-4">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">Login</h1>
        <p className="text-gray-500 dark:text-gray-400">
          Entre com sua conta da SR-Consultoria
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
                    className="bg-white"
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

          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Senha</FormLabel>
                <FormControl>
                  <Input
                    className="bg-white"
                    placeholder="••••••••"
                    type="password"
                    autoComplete="current-password"
                    disabled={isLoading}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="flex items-center justify-end">
            <Link
              href="/auth/forgot-password"
              className="text-sm font-medium text-primary hover:underline"
            >
              Esqueceu a senha?
            </Link>
          </div>

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Entrando...
              </>
            ) : (
              "Entrar"
            )}
          </Button>
        </form>
      </Form>
    </div>
  );
}
