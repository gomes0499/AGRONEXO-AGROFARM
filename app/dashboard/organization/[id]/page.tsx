import { SiteHeader } from "@/components/dashboard/site-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { verifyUserPermission } from "@/lib/auth/verify-permissions";
import { UserRole } from "@/lib/auth/roles";
import { notFound, redirect } from "next/navigation";

// Componentes da organização
import { OrganizationDetailInfo } from "@/components/organization/organization-detail-info";
import { OrganizationDetailMembers } from "@/components/organization/organization-detail-members";
import { OrganizationDetailInvites } from "@/components/organization/organization-detail-invites";
import { OrganizationDetailEdit } from "@/components/organization/organization-detail-edit";

interface PageProps {
  params: {
    id: string;
  };
}

interface SearchParams {
  tab?: string;
}

// Define a member type to fix the implicit any type error
interface Member {
  id: string;
  usuario_id: string;
  organizacao_id: string;
  funcao: string;
  eh_proprietario: boolean;
  ultimo_login?: string;
  created_at: string;
  updated_at: string;
  user: {
    id: string;
    email: string;
    nome: string;
  };
}

export default async function ManageOrganizationPage({
  params,
  searchParams,
}: PageProps & { searchParams: SearchParams }) {
  // Verifica autenticação e obtém dados do usuário
  const user = await verifyUserPermission();

  // Verifica se o usuário é super admin
  const isSuperAdmin = user.app_metadata?.is_super_admin === true;

  // Obtém dados da organização específica
  const supabase = await createClient();
  const { data: organization, error } = await supabase
    .from("organizacoes")
    .select("*")
    .eq("id", params.id)
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
      .eq("organizacao_id", params.id)
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

  // Buscar membros da organização usando a função RPC que junta associações com dados dos usuários
  let members: Member[] = [];

  // Tentar usar a função RPC para obter os membros com dados completos
  const { data: membersData, error: rpcError } = await supabase.rpc(
    "get_organization_members",
    { org_id: params.id }
  );

  if (membersData && membersData.length > 0) {
    // Converter os dados da RPC para o formato Member
    members = membersData.map((member: any) => ({
      id: member.associacao_id,
      usuario_id: member.usuario_id,
      organizacao_id: member.organizacao_id,
      funcao: member.funcao as UserRole,
      eh_proprietario: member.eh_proprietario,
      ultimo_login: member.ultimo_login,
      created_at: member.created_at,
      updated_at: member.updated_at,
      user: {
        id: member.usuario_id,
        email: member.usuario_email || `usuario@exemplo.com`,
        nome:
          member.usuario_nome ||
          `Usuário ${member.associacao_id.substring(0, 4)}`,
      },
    }));
  } else {
    // Fallback: buscar apenas as associações e criar dados de usuário parciais
    const { data: associacoes } = await supabase
      .from("associacoes")
      .select("*")
      .eq("organizacao_id", params.id)
      .order("eh_proprietario", { ascending: false });

    // Obter o usuário atual para mostrar dados reais
    const {
      data: { user: currentUser },
    } = await supabase.auth.getUser();

    // Criar lista de membros
    members = (associacoes || []).map((assoc) => {
      // Para o usuário atual, usar informações reais
      if (assoc.usuario_id === currentUser?.id) {
        return {
          id: assoc.id,
          usuario_id: assoc.usuario_id,
          organizacao_id: assoc.organizacao_id,
          funcao: assoc.funcao,
          eh_proprietario: assoc.eh_proprietario,
          ultimo_login: assoc.ultimo_login,
          created_at: assoc.created_at,
          updated_at: assoc.updated_at,
          user: {
            id: currentUser?.id || "Seu ID",
            email: currentUser?.email || "Seu email",
            nome:
              currentUser?.user_metadata?.name ||
              currentUser?.email?.split("@")[0] ||
              "Você",
          },
        };
      }

      // Para outros usuários, mostrar função e identificador único
      const roleName =
        assoc.funcao === UserRole.PROPRIETARIO
          ? "Proprietário"
          : assoc.funcao === UserRole.ADMINISTRADOR
          ? "Administrador"
          : "Membro";

      return {
        id: assoc.id,
        usuario_id: assoc.usuario_id,
        organizacao_id: assoc.organizacao_id,
        funcao: assoc.funcao,
        eh_proprietario: assoc.eh_proprietario,
        ultimo_login: assoc.ultimo_login,
        created_at: assoc.created_at,
        updated_at: assoc.updated_at,
        user: {
          id: assoc.usuario_id,
          email: `${roleName.toLowerCase()}@exemplo.com`,
          nome: `${roleName} ${assoc.id.substring(0, 4)}`,
        },
      };
    });
  }

  // Busca convites pendentes
  const { data: invites } = await supabase
    .from("convites")
    .select("*")
    .eq("organizacao_id", params.id)
    .eq("status", "PENDENTE");

  return (
    <div className="flex flex-col">
      <SiteHeader title={`Gerenciar ${organization.nome}`} />
      <div className="flex justify-between items-center p-6 pb-0">
        <h1 className="text-3xl font-bold tracking-tight">
          {organization.nome}
        </h1>
        <div className="flex space-x-2">
          <Link
            href="/dashboard/organization"
            className="inline-flex h-9 items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
          >
            Voltar
          </Link>
        </div>
      </div>
      <main className="flex-1 p-6 pt-4">
        <Tabs defaultValue={searchParams.tab || "info"}>
          <TabsList className="mb-6">
            <TabsTrigger value="info">Informações</TabsTrigger>
            <TabsTrigger value="members">
              Membros ({members?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="invites">
              Convites ({invites?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="edit">Editar Organização</TabsTrigger>
          </TabsList>

          <TabsContent value="info" className="space-y-6">
            <OrganizationDetailInfo organization={organization} />
          </TabsContent>

          <TabsContent value="members" className="space-y-6">
            <OrganizationDetailMembers
              members={members}
              organizationId={params.id}
            />
          </TabsContent>

          <TabsContent value="invites" className="space-y-6">
            <OrganizationDetailInvites invites={invites || []} />
          </TabsContent>

          <TabsContent value="edit" className="space-y-6">
            <OrganizationDetailEdit
              userId={user.id}
              organization={organization}
            />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
