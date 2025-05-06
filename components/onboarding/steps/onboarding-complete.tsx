"use client";

import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import { redirect } from "next/navigation";

// Tela de conclusão do onboarding
export function OnboardingComplete() {
  return (
    <div className="flex flex-col items-center justify-center py-8 text-center space-y-6">
      <CheckCircle2 className="h-16 w-16 text-primary" />

      <div className="space-y-2">
        <h3 className="text-2xl font-bold">Tudo pronto!</h3>
        <p className="text-muted-foreground">
          Seu perfil está completo e você já pode começar a utilizar o sistema.
        </p>
      </div>

      <Button
        onClick={() => {
          // Redirecionar para o dashboard
          redirect("/dashboard");
        }}
        className="mt-4"
      >
        Ir para o Dashboard
      </Button>
    </div>
  );
}
