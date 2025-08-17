import { SiteHeader } from "@/components/dashboard/site-header";
import { createClient } from "@/lib/supabase/server";
import { verifyUserPermission } from "@/lib/auth/verify-permissions";
import { DashboardHeaderContent } from "@/components/dashboard/dashboard-header-content";
import { NewOrganizationButton } from "@/components/organization/organization/new-button";
import { fetchDashboardData } from "@/lib/actions/dashboard/dashboard-actions";
import { getCashPolicyConfig } from "@/lib/actions/financial-actions/cash-policy-actions";

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ projection?: string }>;
}) {
  // Verifica autenticação e obtém dados do usuário
  const user = await verifyUserPermission();
  const params = await searchParams;
  const projectionId = params.projection;

  // Verifica se o usuário é super admin
  const isSuperAdmin = user.app_metadata?.is_super_admin === true;

  // Obtém dados da organização associada
  const supabase = await createClient();
  const { data: userData } = await supabase
    .from("users")
    .select("*, organizacao:organizacao_id(*)")
    .eq("id", user.id)
    .single();

  // Buscar associações do usuário
  const { data: associacoes } = await supabase
    .from("associacoes")
    .select("*, organizacao:organizacao_id(*)")
    .eq("usuario_id", user.id);

  // Verificar se existe organização nos metadados do usuário autenticado
  let organizacaoMetadata = null;
  if (user.user_metadata?.organizacao?.id) {
    const { data: orgData } = await supabase
      .from("organizacoes")
      .select("*")
      .eq("id", user.user_metadata.organizacao.id)
      .single();

    if (orgData) {
      organizacaoMetadata = orgData;
    }
  }

  // Verifica se o usuário tem organização associada ou associações
  const hasOrganization = !!organizacaoMetadata || !!userData?.organizacao;
  const hasAssociations = associacoes && associacoes.length > 0;

  // Se não tiver organização nem associações, mostra um estado vazio
  if (!hasOrganization && !hasAssociations) {
    return (
      <div className="flex flex-col">
        <SiteHeader title="Dashboard" />
        <div className="flex flex-1 flex-col items-center justify-center p-6">
          <div className="mx-auto max-w-md text-center">
            <h2 className="text-2xl font-semibold">
              Bem-vindo à SR Consultoria
            </h2>
            <p className="mt-2 text-muted-foreground">
              Você ainda não está associado a uma organização.
              {isSuperAdmin
                ? "Crie uma organização para começar."
                : "Aguarde um convite para começar."}
            </p>
            {isSuperAdmin && (
              <div className="mt-4">
                <NewOrganizationButton userId={user.id} />
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Determinar qual organização usar para o dashboard
  let organizationId;
  let organizationName;

  // Prioridade 1: Usar a organização dos metadados (selecionada pelo usuário)
  if (organizacaoMetadata) {
    organizationId = organizacaoMetadata.id;
    organizationName = organizacaoMetadata.nome || "Minha Organização";
  }
  // Prioridade 2: Usar a organização associada ao perfil
  else if (userData?.organizacao) {
    organizationId = userData.organizacao.id;
    organizationName = userData.organizacao.nome || "Minha Organização";
  }
  // Prioridade 3: Usar a primeira associação
  else if (hasAssociations) {
    organizationId = associacoes[0].organizacao_id;
    organizationName = associacoes[0].organizacao?.nome || "Minha Organização";
  }
  // Fallback
  else {
    organizationId = null;
    organizationName = "Minha Organização";
  }

  // Buscar TODOS os dados do dashboard se organizationId está disponível
  let dashboardData = null;
  let cashPolicy = null;
  if (organizationId) {
    try {
      dashboardData = await fetchDashboardData(organizationId, projectionId);
      cashPolicy = await getCashPolicyConfig(organizationId);
    } catch (error) {
      console.error("Erro ao carregar dados do dashboard:", error);
    }
  }

  if (!organizationId) {
    return (
      <div className="flex flex-col">
        <SiteHeader title={`Dashboard - ${organizationName}`} />
        <div className="flex flex-1 flex-col items-center justify-center p-6">
          <div className="mx-auto max-w-md text-center">
            <h2 className="text-2xl font-semibold">
              Bem-vindo à SR Consultoria
            </h2>
            <p className="mt-2 text-muted-foreground">
              Selecione ou crie uma organização para visualizar o dashboard.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Se não há dados, retornar dashboard sem dados
  if (!dashboardData) {
    return (
      <div className="flex flex-col">
        <SiteHeader title={`Dashboard - ${organizationName}`} />
        <main className="flex-1 p-6">
          <div className="flex flex-1 flex-col items-center justify-center">
            <div className="mx-auto max-w-md text-center">
              <h2 className="text-2xl font-semibold">Dados não disponíveis</h2>
              <p className="mt-2 text-muted-foreground">
                Não foi possível carregar os dados necessários para o dashboard.
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Importar DashboardClient dinamicamente para evitar problemas de hidratação
  const DashboardClient = (await import("@/components/dashboard/dashboard-client")).DashboardClient;

  return (
    <div className="flex flex-col">
      <SiteHeader 
        title={`Dashboard - ${organizationName}`} 
        rightContent={
          organizationId ? (
            <DashboardHeaderContent 
              organizationId={organizationId}
              projectionId={projectionId}
            />
          ) : undefined
        }
      />
      
      <DashboardClient
        organizationId={organizationId}
        organizationName={organizationName}
        projectionId={projectionId}
        initialData={dashboardData}
        isSuperAdmin={isSuperAdmin}
        cashPolicy={cashPolicy}
      />
    </div>
  );
}
