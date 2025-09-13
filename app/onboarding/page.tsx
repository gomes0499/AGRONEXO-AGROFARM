import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

import { OnboardingStepper } from "@/components/onboarding/onboarding-stepper";
import Image from "next/image";

export default async function OnboardingPage() {
  const supabase = await createClient();

  // Verifica se o usuário está autenticado
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    redirect("/auth/login");
  }

  // Obtém o perfil atual do usuário dos metadados
  const profile = user.user_metadata;
  const currentStep = profile?.onboarding_step || 0;
  const isComplete = profile?.onboarding_complete || false;

  // Se onboarding já estiver completo, redireciona para o dashboard
  if (isComplete) {
    redirect("/dashboard");
  }

  return (
    <div className="mx-auto space-y-6">
      <div className="space-y-2 text-center">
        <Image
          src="/logo.svg"
          alt="AGROFARM Logo"
          width={300}
          height={300}
          priority
          className="mx-auto"
          quality={100}
        />
        <h1 className="text-3xl font-bold">Complete seu perfil</h1>
        <p className="text-muted-foreground">
          Complete as informações abaixo para começar a usar o sistema.
        </p>
      </div>

      <OnboardingStepper initialStep={currentStep} profile={profile} />
    </div>
  );
}
