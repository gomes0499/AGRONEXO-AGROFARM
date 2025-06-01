"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema, type RegisterFormValues } from "@/schemas/auth";
import { registerUser, acceptInvite } from "@/lib/auth/actions/auth-actions";
import { createClient } from "@/lib/supabase/client";

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
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface RegisterFormProps {
  email?: string;
  inviteToken?: string;
}

export function RegisterForm({ email, inviteToken }: RegisterFormProps = {}) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const router = useRouter();

  // Form com validação Zod
  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: email || "",
      password: "",
      confirmPassword: "",
      acceptTerms: false,
    },
  });

  // Função para submeter o formulário
  async function onSubmit(data: RegisterFormValues) {
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const result = await registerUser(data, inviteToken);

      if (!result) {
        setError("Erro de comunicação com o servidor. Tente novamente.");
        return;
      }

      // Se não for bem-sucedido, mostrar o erro
      if (!result.success) {
        setError(
          result.error ||
            "Não foi possível criar a conta. O email pode já estar em uso."
        );
        return;
      }

      // Se for bem-sucedido mas não tiver userId, também é um erro
      if (!result.userId) {
        setError("Erro ao criar conta. Por favor, tente novamente.");
        return;
      }

      // Sucesso
      setSuccess(true);
      form.reset();

      // Se veio de um convite, sempre redirecionar para a página de login com o token
      if (inviteToken) {
        setTimeout(() => {
          // Redirecionar para a página de convite com o token
          router.push(`/auth/invite?token=${inviteToken}`);
        }, 3000);
      } else {
        // Se não veio de um convite, apenas redireciona para login
        setTimeout(() => {
          router.push("/auth/login");
        }, 3000);
      }
    } catch (error) {
      console.error("Exceção no registro:", error);
      setError(
        error instanceof Error
          ? error.message
          : "Não foi possível criar a conta. Tente novamente mais tarde."
      );
    } finally {
      setIsLoading(false);
    }
  }

  // Se o registro foi bem-sucedido, mostrar mensagem de confirmação
  if (success) {
    return (
      <div className="mx-auto w-full max-w-md space-y-6">
        <div className="flex flex-col items-center justify-center space-y-3 text-center">
          <CheckCircle2 className="h-12 w-12 text-green-500" />
          <h2 className="text-2xl font-semibold">Registro concluído!</h2>

          {inviteToken ? (
            <>
              <p className="text-muted-foreground">
                Sua conta foi criada com sucesso! Agora você será redirecionado
                para fazer login e aceitar o convite.
              </p>
              <p className="text-sm font-medium text-primary">
                Aguarde enquanto redirecionamos você...
              </p>
            </>
          ) : (
            <p className="text-muted-foreground">
              Sua conta foi criada com sucesso! Agora você pode fazer login no
              sistema.
            </p>
          )}

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
        <h1 className="text-3xl font-bold">Criar Conta</h1>
        {inviteToken ? (
          <p className="text-gray-500 dark:text-gray-400">
            Você recebeu um convite! Crie sua conta para participar.
          </p>
        ) : (
          <p className="text-gray-500 dark:text-gray-400">
            Registre-se na plataforma SR-Consultoria
          </p>
        )}
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
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Nome Completo</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Seu nome completo"
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
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Email</FormLabel>
                <FormControl>
                  <Input
                    placeholder="seuemail@exemplo.com"
                    type="email"
                    autoComplete="email"
                    disabled={isLoading || (!!inviteToken && !!email)}
                    {...field}
                  />
                </FormControl>
                {inviteToken && email && (
                  <p className="text-xs text-muted-foreground">
                    Este é o email associado ao seu convite. Não pode ser
                    alterado.
                  </p>
                )}
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
                <FormLabel>Confirmar Senha</FormLabel>
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
            name="acceptTerms"
            render={({ field }) => (
              <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                <FormControl>
                  <Checkbox
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={isLoading}
                  />
                </FormControl>
                <div className="space-y-1 leading-none">
                  <FormLabel className="text-sm font-medium leading-none">
                    Eu aceito os{" "}
                    <Link
                      href="/terms"
                      className="text-primary underline"
                      target="_blank"
                    >
                      termos de serviço
                    </Link>{" "}
                    e{" "}
                    <Link
                      href="/privacy"
                      className="text-primary underline"
                      target="_blank"
                    >
                      política de privacidade
                    </Link>
                  </FormLabel>
                  <FormMessage />
                </div>
              </FormItem>
            )}
          />

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Registrando...
              </>
            ) : (
              "Criar Conta"
            )}
          </Button>
        </form>
      </Form>

      <div className="text-center text-sm">
        <p>
          Já tem uma conta?{" "}
          <Link
            href="/auth/login"
            className="font-medium text-primary hover:underline"
          >
            Faça login
          </Link>
        </p>
      </div>
    </div>
  );
}
