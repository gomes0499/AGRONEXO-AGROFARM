import { SiteHeader } from "@/components/dashboard/site-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { createClient } from "@/lib/supabase/server";
import { verifyUserPermission } from "@/lib/auth/verify-permissions";
import { UserRole } from "@/lib/auth/roles";
import { notFound, redirect } from "next/navigation";

// Componentes da organização
import { OrganizationDetailInfo } from "@/components/organization/organization-detail-info";
import { OrganizationDetailMembers } from "@/components/organization/organization-detail-members";
import { OrganizationDetailInvites } from "@/components/organization/organization-detail-invites";
import { OrganizationDetailEdit } from "@/components/organization/organization-detail-edit";
import { OrganizationSettings } from "@/components/organization/organization-settings";

// Define a member type to fix the implicit any type error
interface Member {
  id: string;
  usuario_id: string;
  organizacao_id: string;
  funcao: string;
  eh_proprietario: boolean;
  ultimo_login?: string;
  data_adicao?: string;
  created_at: string;
  updated_at: string;
  user: {
    id: string;
    email: string;
    nome: string;
    avatar?: string;
  };
}

export default async function ManageOrganizationPage({
  params,
  searchParams,
}: {
  params: any;
  searchParams: any;
}) {
  // Verifica autenticação e obtém dados do usuário
  const user = await verifyUserPermission();

  // Verifica se o usuário é super admin
  const isSuperAdmin = user.app_metadata?.is_super_admin === true;

  // Garantir que os parâmetros são resolvidos antes de usá-los
  const paramsResolved = await Promise.resolve(params);
  const searchParamsResolved = await Promise.resolve(searchParams);

  // Salvar em constantes para uso no componente
  const organizationId = paramsResolved.id;
  const activeTab = searchParamsResolved.tab || "info";

  // Obtém dados da organização específica
  const supabase = await createClient();
  const { data: organization, error } = await supabase
    .from("organizacoes")
    .select("*")
    .eq("id", organizationId)
    .single();

  // Se não encontrar a organização, retorna 404
  if (error || !organization) {
    return notFound();
  }

  // Se não for super admin, verifica se tem permissão para acessar esta organização
  if (!isSuperAdmin) {
    const { data: membership } = await supabase
      .from("associacoes")
      .select("*")
      .eq("usuario_id", user.id)
      .eq("organizacao_id", organizationId)
      .single();

    // Se não for membro da organização, redireciona
    if (!membership) {
      return redirect("/dashboard");
    }

    // Verifica se tem permissão de proprietário ou admin
    const canManage =
      membership.funcao === UserRole.PROPRIETARIO ||
      membership.funcao === UserRole.ADMINISTRADOR;

    if (!canManage) {
      return redirect("/dashboard/organization");
    }
  }

  // Buscar todos os membros da organização
  let members: Member[] = [];

  try {
    // Obter todas as associações da organização
    const { data: associacoes, error: associacoesError } = await supabase
      .from("associacoes")
      .select("*")
      .eq("organizacao_id", organizationId)
      .order("eh_proprietario", { ascending: false });

    if (associacoesError) {
      console.error("Erro ao buscar associações:", associacoesError);
    }

    if (associacoes && associacoes.length > 0) {
      // Obter o usuário autenticado atual
      const {
        data: { user: currentUser },
      } = await supabase.auth.getUser();

      // Buscar dados dos usuários da tabela de autenticação do Supabase
      // Nota: Esta é uma operação RPC personalizada que você deve criar no Supabase
      const { data: authUsers, error: authUsersError } = await supabase.rpc(
        "get_users_by_ids",
        { user_ids: associacoes.map((a) => a.usuario_id) }
      );

      // Se falhar a consulta RPC, registra o erro mas continua com o fallback
      if (authUsersError) {
        console.error("Erro ao buscar dados de autenticação:", authUsersError);
      }

      // Criar um mapa para lookup rápido
      const authUsersMap = new Map();
      if (authUsers && authUsers.length > 0) {
        authUsers.forEach((user: any) => {
          authUsersMap.set(user.id, user);
        });
      }

      // Mapear as associações para o formato Member
      for (const assoc of associacoes) {
        // Verificar se é o usuário atual
        const isCurrentUser = assoc.usuario_id === currentUser?.id;

        let userEmail = "";
        let userName = "";
        let userAvatar = null;

        // Tentar obter dados do usuário da tabela auth
        const authUser = authUsersMap.get(assoc.usuario_id);

        // 1. Se for o usuário atual, usar seus dados da sessão (mais confiável)
        if (isCurrentUser) {
          userEmail = currentUser?.email || "";

          // Verificar a existência do campo raw_user_meta_data antes de acessá-lo
          const metadata = currentUser?.user_metadata || {};
          userName = metadata.name || userEmail.split("@")[0] || "Usuário";
          userAvatar = metadata.avatar_url;

          // Log para debug - remover após resolução
          console.log("Current user metadata:", metadata);
        }
        // 2. Se encontrou dados de autenticação, use-os
        else if (authUser) {
          userEmail = authUser.email || "";

          // Verificar a existência do campo raw_user_meta_data antes de acessá-lo
          const metadata = authUser.raw_user_meta_data || {};
          userName = metadata.name || userEmail.split("@")[0] || "Usuário";
          userAvatar = metadata.avatar_url;

          // Log para debug - remover após resolução
          console.log("Auth user metadata:", metadata);
        }
        // 3. Último recurso: crie dados temporários baseados na associação
        else {
          // Verificar a função para usar no nome
          const roleName =
            assoc.funcao === "PROPRIETARIO"
              ? "Proprietário"
              : assoc.funcao === "ADMINISTRADOR"
              ? "Administrador"
              : "Membro";

          userEmail = `${roleName.toLowerCase()}-${assoc.id.substring(
            0,
            4
          )}@exemplo.com`;
          userName = `${roleName} ${assoc.id.substring(0, 4)}`;
        }

        // Adicionar o membro à lista
        members.push({
          id: assoc.id,
          usuario_id: assoc.usuario_id,
          organizacao_id: assoc.organizacao_id,
          funcao: assoc.funcao,
          eh_proprietario: assoc.eh_proprietario,
          ultimo_login: assoc.ultimo_login,
          data_adicao: assoc.data_adicao,
          created_at: assoc.created_at,
          updated_at: assoc.updated_at,
          user: {
            id: assoc.usuario_id,
            email: userEmail,
            nome: userName,
            avatar: userAvatar,
          },
        });
      }
    }
  } catch (error) {
    console.error("Erro ao obter membros da organização:", error);
    // Criar um array vazio em caso de erro para evitar falhas na renderização
    members = [];
  }

  // Busca convites pendentes
  const { data: invites } = await supabase
    .from("convites")
    .select("*")
    .eq("organizacao_id", organizationId)
    .eq("status", "PENDENTE");

  return (
    <div className="flex flex-col">
      <SiteHeader
        title={`Gerenciar ${organization.nome}`}
        showBackButton={true}
        backUrl="/dashboard/organization"
      />

      <div className="container mx-auto p-6">
        <h1 className="text-3xl font-semibold tracking-tight mb-6">
          {organization.nome}
        </h1>

        <Tabs defaultValue={activeTab} className="">
          <TabsList>
            <TabsTrigger value="info">Informações</TabsTrigger>
            <TabsTrigger value="members">
              Membros ({members?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="invites">
              Convites ({invites?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="edit">Editar Organização</TabsTrigger>
            <TabsTrigger value="settings">Configurações</TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="mt-0 pt-2">
            <OrganizationDetailInfo organization={organization} />
          </TabsContent>

          <TabsContent value="members" className="mt-0 pt-2">
            <OrganizationDetailMembers
              members={members}
              organizationId={organizationId}
              organizationName={organization.nome}
            />
          </TabsContent>

          <TabsContent value="invites" className="mt-0 pt-2">
            <OrganizationDetailInvites
              invites={invites || []}
              organizationId={organizationId}
              organizationName={organization.nome}
            />
          </TabsContent>

          <TabsContent value="edit" className="mt-0 pt-2">
            <OrganizationDetailEdit
              userId={user.id}
              organization={organization}
            />
          </TabsContent>

          <TabsContent value="settings" className="mt-0 pt-2">
            <OrganizationSettings organizationId={organizationId} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
