"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema, type LoginFormValues } from "@/schemas/auth";
import {
  loginUser,
  acceptInvite,
  checkUserExists,
} from "@/lib/auth/actions/auth-actions";
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
import { AlertCircle, Loader2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface AcceptInviteFormProps {
  token: string;
}

export function AcceptInviteForm({ token }: AcceptInviteFormProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [inviteData, setInviteData] = useState<{
    email?: string;
    organizacaoNome?: string;
    status?: string;
  } | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authEmail, setAuthEmail] = useState<string | null>(null);
  const router = useRouter();

  // Form com validação Zod para login
  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: inviteData?.email || "",
      password: "",
    },
  });

  // Verificar status do convite e autenticação atual
  useEffect(() => {
    async function checkInvite() {
      if (!token) {
        setError("Token de convite inválido ou não fornecido");
        return;
      }

      setIsLoading(true);

      try {
        // Verificar autenticação atual
        const supabase = createClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session?.user) {
          setIsAuthenticated(true);
          setAuthEmail(session.user.email || null);
        }

        // Obter detalhes do convite
        const { data: inviteDetails, error: inviteError } = await supabase
          .from("convites")
          .select("*, organizacao:organizacao_id(nome)")
          .eq("token", token)
          .single();

        if (inviteError || !inviteDetails) {
          throw new Error("Convite não encontrado ou expirado");
        }

        // Verificar se o convite ainda é válido
        if (inviteDetails.status !== "PENDENTE") {
          throw new Error(
            `Este convite já foi ${inviteDetails.status.toLowerCase()}`
          );
        }

        // Verificar se o convite não expirou
        const agora = new Date();
        const expiraEm = new Date(inviteDetails.expira_em);

        if (agora > expiraEm) {
          throw new Error("Este convite expirou");
        }

        // Armazenar dados do convite
        setInviteData({
          email: inviteDetails.email,
          organizacaoNome: inviteDetails.organizacao?.nome,
          status: inviteDetails.status,
        });

        // Se o usuário já está autenticado e o email corresponde, aceitar convite automaticamente
        if (session?.user && session.user.email === inviteDetails.email) {
          await handleAcceptInvite();
        } else if (!session?.user) {
          // Se o usuário não está autenticado, verificar se o email do convite existe no sistema
          const { exists, error: checkError } = await checkUserExists(
            inviteDetails.email
          );

          // Verificar se o usuário existe
          if (exists === false) {
            console.log("Usuário não existe, redirecionando para registro...");
            // Redirecionar para a página de registro com parâmetros
            // Use window.location.href para garantir um redirecionamento completo
            window.location.href = `/auth/register?email=${encodeURIComponent(
              inviteDetails.email
            )}&invite_token=${token}`;
            return; // Interrompe a execução aqui
          }
        }
      } catch (error) {
        setError(
          error instanceof Error ? error.message : "Erro ao verificar convite"
        );
      } finally {
        setIsLoading(false);
      }
    }

    checkInvite();
  }, [token, router]);

  // Função para fazer login e aceitar o convite
  async function onSubmit(data: LoginFormValues) {
    setIsLoading(true);
    setError(null);

    try {
      // Verificar se o email corresponde ao convite
      if (data.email !== inviteData?.email) {
        throw new Error(
          `Este convite foi enviado para ${inviteData?.email}, não para ${data.email}`
        );
      }

      // Verificar se o usuário existe primeiro
      const { exists } = await checkUserExists(data.email);
      
      // Se o usuário não existir, redirecionar para o registro
      if (exists === false) {
        console.log("Usuário não encontrado, redirecionando para registro");
        window.location.href = `/auth/register?email=${encodeURIComponent(
          data.email
        )}&invite_token=${token}`;
        return;
      }

      // Fazer login
      const loginResult = await loginUser(data);

      if (!loginResult.success) {
        // Se for erro de credenciais, tornar a mensagem mais clara
        if (loginResult.error?.includes("Credenciais") || 
            loginResult.error?.includes("senha")) {
          throw new Error("Senha incorreta. Por favor, tente novamente.");
        } else if (loginResult.userNotFound) {
          // Redirecionar para registro se o usuário não for encontrado
          window.location.href = `/auth/register?email=${encodeURIComponent(
            data.email
          )}&invite_token=${token}`;
          return;
        }
        
        throw new Error(loginResult.error || "Credenciais inválidas");
      }

      // Aceitar convite
      await handleAcceptInvite();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Erro no processo de login"
      );
    } finally {
      setIsLoading(false);
    }
  }

  // Função para aceitar o convite
  async function handleAcceptInvite() {
    setIsLoading(true);
    setError(null);

    try {
      const result = await acceptInvite(token);

      if (result && !result.success) {
        throw new Error(result.error || "Erro ao aceitar convite");
      }

      // Redirecionar para a URL correta (onboarding ou dashboard)
      if (result && result.redirectUrl) {
        router.push(result.redirectUrl);
      } else {
        // Fallback para dashboard se não tiver redirectUrl
        router.push("/dashboard");
      }
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Erro ao aceitar convite"
      );
      setIsLoading(false);
    }
  }

  // Se estiver carregando inicialmente, mostrar spinner
  if (isLoading && !inviteData) {
    return (
      <div className="mx-auto w-full max-w-md flex flex-col items-center justify-center space-y-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p>Verificando convite...</p>
      </div>
    );
  }

  // Se houver erro com o convite
  if (error && !inviteData) {
    return (
      <Card className="mx-auto w-full max-w-md">
        <CardHeader>
          <CardTitle>Convite Inválido</CardTitle>
          <CardDescription>
            Não foi possível verificar este convite
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button asChild className="w-full">
            <Link href="/auth/login">Ir para Login</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Se o usuário já está autenticado mas com email incorreto
  if (isAuthenticated && authEmail !== inviteData?.email) {
    return (
      <Card className="mx-auto w-full max-w-md">
        <CardHeader>
          <CardTitle>Email Incorreto</CardTitle>
          <CardDescription>
            Você está autenticado com um email diferente
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Você está logado como {authEmail}, mas este convite foi enviado
              para {inviteData?.email}. Por favor, saia e faça login com o email
              correto.
            </AlertDescription>
          </Alert>
          <Button asChild className="w-full">
            <Link href="/auth/logout">Sair da Conta</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Se o usuário já está autenticado com o email correto, mostrar botão para aceitar
  if (isAuthenticated && authEmail === inviteData?.email) {
    return (
      <Card className="mx-auto w-full max-w-md">
        <CardHeader>
          <CardTitle>Aceitar Convite</CardTitle>
          <CardDescription>
            Você foi convidado para {inviteData?.organizacaoNome}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p>
            Você já está logado como <strong>{authEmail}</strong>. Clique no
            botão abaixo para aceitar o convite e entrar na organização.
          </p>
          <Button
            onClick={handleAcceptInvite}
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processando...
              </>
            ) : (
              "Aceitar Convite"
            )}
          </Button>
        </CardContent>
      </Card>
    );
  }

  // Formulário de login para aceitar o convite
  return (
    <div className="mx-auto w-full max-w-md space-y-6">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-bold">Aceitar Convite</h1>
        <p className="text-gray-500 dark:text-gray-400">
          Faça login para aceitar o convite para {inviteData?.organizacaoNome}
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
                    onChange={(e) => {
                      // Manter o email do convite
                      e.target.value = inviteData?.email || "";
                      field.onChange(e);
                    }}
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

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processando...
              </>
            ) : (
              "Entrar e Aceitar Convite"
            )}
          </Button>
        </form>
      </Form>

      <div className="text-center space-y-3">
        <p className="text-sm">
          Não tem uma conta?
        </p>
        <Button 
          variant="outline" 
          asChild 
          className="w-full"
        >
          <Link
            href={`/auth/register?email=${encodeURIComponent(inviteData?.email || "")}&invite_token=${token}`}
          >
            Criar uma nova conta
          </Link>
        </Button>
      </div>
    </div>
  );
}
