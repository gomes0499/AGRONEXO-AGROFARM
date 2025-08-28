import Link from "next/link";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";

export default function AuthErrorPage() {
  return (
    <div className="mx-auto w-full max-w-md space-y-4">
      <div className="flex flex-col items-center justify-center space-y-3 text-center">
        <AlertCircle className="h-12 w-12 text-red-500" />
        <h2 className="text-2xl font-semibold">Erro de Autenticação</h2>
        <p className="text-muted-foreground">
          O link pode ter expirado ou já ter sido usado. Por favor, solicite um novo link de redefinição de senha.
        </p>
        <div className="flex gap-4 mt-4">
          <Button asChild>
            <Link href="/auth/forgot-password">Solicitar novo link</Link>
          </Button>
          <Button asChild variant="outline">
            <Link href="/auth/login">Ir para Login</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}