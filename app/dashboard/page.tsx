import { SiteHeader } from "@/components/dashboard/site-header";
// import { StatsCard } from "@/components/dashboard/stats-card";
import { ChartCard } from "@/components/dashboard/chart-card";
import { createClient } from "@/lib/supabase/server";
import { verifyUserPermission } from "@/lib/auth/verify-permissions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BarChart, Building2, Map, LineChart } from "lucide-react";
import { StatsCard } from "@/components/dashboard/stats-card";

export default async function DashboardPage() {
  // Verifica autenticação e obtém dados do usuário
  const user = await verifyUserPermission();

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
              <a
                href="/dashboard/organization/new"
                className="mt-4 inline-flex h-10 items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
              >
                Criar Organização
              </a>
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

  // Buscar dados para dashboard - se as tabelas existirem
  let propriedades = [];
  let culturas = [];
  let safras = [];

  try {
    // Tenta buscar dados da tabela propriedade
    const { data: propsData, error: propsError } = await supabase
      .from("propriedade")
      .select("*")
      .eq("organizacao_id", organizationId);

    if (!propsError) propriedades = propsData || [];

    // Tenta buscar dados da tabela cultura
    const { data: cultsData, error: cultsError } = await supabase
      .from("cultura")
      .select("*")
      .eq("organizacao_id", organizationId);

    if (!cultsError) culturas = cultsData || [];

    // Tenta buscar dados da tabela safra
    const { data: safrasData, error: safrasError } = await supabase
      .from("safra")
      .select("*")
      .eq("organizacao_id", organizationId);

    if (!safrasError) safras = safrasData || [];
  } catch (error) {
    console.error("Erro ao buscar dados para o dashboard:", error);
  }

  // Valores padrão para visualização - usar valores dummy se as tabelas não existirem
  const totalPropriedades = propriedades.length || 3;
  const totalCulturas = culturas.length || 2;
  const totalSafras = safras.length || 4;
  const areaTotal = propriedades.length
    ? propriedades.reduce((sum, prop) => sum + (prop.area_total || 0), 0)
    : 5280.5;

  return (
    <div className="flex flex-col">
      <SiteHeader title={`Dashboard - ${organizationName}`} />
      <main className="flex-1 p-6">
        <Tabs defaultValue="overview">
          <TabsList className="mb-6">
            <TabsTrigger value="overview">Visão Geral</TabsTrigger>
            <TabsTrigger value="production">Produção</TabsTrigger>
            <TabsTrigger value="financial">Financeiro</TabsTrigger>
          </TabsList>
          <TabsContent value="overview" className="space-y-6">
            {/* <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <StatsCard
                title="Propriedades"
                value={totalPropriedades.toString()}
                description="Total de fazendas"
                trend={{ value: 100, label: "100%", positive: true }}
                icon={Map}
                iconColor="text-blue-500"
              />
              <StatsCard
                title="Culturas"
                value={totalCulturas.toString()}
                description="Culturas cadastradas"
                trend={{ value: 100, label: "100%", positive: true }}
                icon={Building2}
                iconColor="text-green-500"
              />
              <StatsCard
                title="Safras"
                value={totalSafras.toString()}
                description="Safras gerenciadas"
                trend={{ value: 100, label: "100%", positive: true }}
                icon={LineChart}
                iconColor="text-purple-500"
              />
              <StatsCard
                title="Área Total"
                value={`${areaTotal.toFixed(2)} ha`}
                description="Área gerenciada"
                trend={{ value: 0, label: "0%", positive: true }}
                icon={BarChart}
                iconColor="text-amber-500"
              />
            </div> */}

            {/* <div className="grid gap-6 md:grid-cols-2">
              <ChartCard
                title="Distribuição de Culturas"
                description="Proporção de área por cultura na safra atual"
                type="pie"
                series={
                  culturas?.length
                    ? culturas.map((c) => Math.floor(Math.random() * 1000))
                    : [100, 200, 300]
                }
                options={
                  culturas?.map((c) => ({
                    value: c.nome,
                    label: c.nome,
                  })) || []
                }
              />
              <ChartCard
                title="Produtividade Histórica"
                description="Desempenho por safra (sc/ha)"
                type="bar"
                series={[
                  {
                    name: "Produtividade",
                    data: safras?.map((s) =>
                      Math.floor(Math.random() * 100)
                    ) || [55, 70, 65, 80],
                  },
                ]}
                categories={
                  safras?.map((s) => s.nome) || [
                    "2020/21",
                    "2021/22",
                    "2022/23",
                    "2023/24",
                  ]
                }
              />
            </div> */}
          </TabsContent>

          <TabsContent value="production" className="space-y-6">
            <div className="rounded-lg border p-6">
              <h3 className="text-lg font-medium">Dados de Produção</h3>
              <p className="text-muted-foreground">
                Gerenciando dados de produção para {totalCulturas} culturas em{" "}
                {totalSafras} safras.
              </p>

              <div className="mt-4 rounded-md border p-4">
                <h4 className="font-medium mb-2">Culturas</h4>
                <div className="grid gap-2 grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                  {culturas.length > 0
                    ? culturas.map((cultura, index) => (
                        <div
                          key={cultura.id || index}
                          className="bg-muted rounded p-2 text-sm"
                        >
                          {cultura.nome}
                        </div>
                      ))
                    : ["Soja", "Milho"].map((cultura, index) => (
                        <div
                          key={index}
                          className="bg-muted rounded p-2 text-sm"
                        >
                          {cultura}
                        </div>
                      ))}
                </div>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="financial" className="space-y-6">
            <div className="rounded-lg border p-6">
              <h3 className="text-lg font-medium">Dados Financeiros</h3>
              <p className="text-muted-foreground">
                Resultados financeiros da safra {new Date().getFullYear()}/
                {(new Date().getFullYear() + 1) % 100}
              </p>

              <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-md border p-3">
                  <h4 className="text-xs text-muted-foreground mb-1">
                    Receita Projetada
                  </h4>
                  <p className="font-medium">R$ 4.580.000,00</p>
                </div>
                <div className="rounded-md border p-3">
                  <h4 className="text-xs text-muted-foreground mb-1">
                    Custo de Produção
                  </h4>
                  <p className="font-medium">R$ 2.140.000,00</p>
                </div>
                <div className="rounded-md border p-3">
                  <h4 className="text-xs text-muted-foreground mb-1">
                    Margem Esperada
                  </h4>
                  <p className="font-medium text-green-600">R$ 2.440.000,00</p>
                </div>
                <div className="rounded-md border p-3">
                  <h4 className="text-xs text-muted-foreground mb-1">
                    ROI Estimado
                  </h4>
                  <p className="font-medium text-green-600">114%</p>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
