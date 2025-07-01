import { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProjectionsView } from "@/components/projections/projections-view";

export const metadata: Metadata = {
  title: "Projeções e Cenários",
  description: "Gerencie cenários de projeção e análise what-if",
};

interface ProjectionsPageProps {
  params: Promise<{ slug: string }>;
}

export default async function ProjectionsPage({ params }: ProjectionsPageProps) {
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

  // Buscar dados necessários para projeções
  const [harvestsResult, culturesResult, scenariosResult] = await Promise.all([
    supabase
      .from("harvests")
      .select("*")
      .eq("organization_id", org.id)
      .order("start_year", { ascending: false }),
    
    supabase
      .from("cultures")
      .select("*")
      .eq("organization_id", org.id)
      .order("name"),
    
    supabase
      .from("projection_scenarios")
      .select("*")
      .eq("organization_id", org.id)
      .eq("is_active", true)
      .order("created_at", { ascending: false })
  ]);

  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">Projeções e Cenários</h2>
          <p className="text-muted-foreground">
            Crie e compare diferentes cenários de projeção para sua operação
          </p>
        </div>
      </div>

      <ProjectionsView
        organizationId={org.id}
        organizationSlug={slug}
        harvests={harvestsResult.data || []}
        cultures={culturesResult.data || []}
        scenarios={scenariosResult.data || []}
      />
    </div>
  );
}