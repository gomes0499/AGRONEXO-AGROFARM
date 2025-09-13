import type { Metadata } from "next";
import { ProfileBasicTab } from "@/components/auth/profile-basic-tab";
import { ProfileDetailsTab } from "@/components/auth/profile-details-tab";
import { ProfileAccountTab } from "@/components/auth/profile-account-tab";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { SiteHeader } from "@/components/dashboard/site-header";
import { verifyUserPermission } from "@/lib/auth/verify-permissions";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Perfil do Usuário | AGROFARM",
  description: "Gerencie suas informações de perfil e conta na AGROFARM",
};

export default async function ProfilePage() {
  // Verifica autenticação e obtém dados do usuário
  const user = await verifyUserPermission();

  // Obtém dados completos do usuário
  const supabase = await createClient();
  const { data: userData } = await supabase
    .from("users")
    .select("*")
    .eq("id", user.id)
    .single();

  return (
    <div className="flex flex-col">
      <SiteHeader title="Perfil do Usuário" />

      {/* Tabs Navigation - logo abaixo do site header */}
      <Tabs defaultValue="basic">
        <div className="border-b">
          <div className="container mx-auto px-6 py-3">
            <TabsList>
              <TabsTrigger
                value="basic"
                className="rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-3 h-7 py-1.5 text-xs md:text-sm whitespace-nowrap"
              >
                Informações Básicas
              </TabsTrigger>
              <TabsTrigger
                value="details"
                className="rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-3 h-7 py-1.5 text-xs md:text-sm whitespace-nowrap"
              >
                Dados Completos
              </TabsTrigger>
              <TabsTrigger
                value="account"
                className="rounded-md data-[state=active]:bg-primary data-[state=active]:text-primary-foreground px-3 h-7 py-1.5 text-xs md:text-sm whitespace-nowrap"
              >
                Configurações da Conta
              </TabsTrigger>
            </TabsList>
          </div>
        </div>

        <main className="flex-1 p-4">
          <TabsContent value="basic" className="space-y-4">
            <ProfileBasicTab user={user} userData={userData} />
          </TabsContent>

          <TabsContent value="details" className="space-y-4">
            <ProfileDetailsTab user={user} userData={userData} />
          </TabsContent>

          <TabsContent value="account" className="space-y-4">
            <ProfileAccountTab user={user} userData={userData} />
          </TabsContent>
        </main>
      </Tabs>
    </div>
  );
}
