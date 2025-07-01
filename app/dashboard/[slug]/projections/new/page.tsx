import { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { NewScenarioForm } from "@/components/projections/new-scenario-form";

export const metadata: Metadata = {
  title: "Novo Cenário de Projeção",
  description: "Crie um novo cenário de projeção",
};

interface NewProjectionPageProps {
  params: Promise<{ slug: string }>;
}

export default async function NewProjectionPage({ params }: NewProjectionPageProps) {
  const { slug } = await params;
  const supabase = await createClient();
  
  // Verificar autenticação
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  // Buscar organização
  const { data: org } = await supabase
    .from("organizations")
    .select("*, memberships!inner(user_id)")
    .eq("slug", slug)
    .eq("memberships.user_id", user.id)
    .single();

  if (!org) {
    redirect("/dashboard");
  }

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Novo Cenário de Projeção</h2>
          <p className="text-muted-foreground">
            Crie um novo cenário para análise what-if
          </p>
        </div>
      </div>

      <NewScenarioForm 
        organizationId={org.id} 
        organizationSlug={slug}
      />
    </div>
  );
}