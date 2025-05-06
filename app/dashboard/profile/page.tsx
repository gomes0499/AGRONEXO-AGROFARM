import type { Metadata } from "next";
import { ProfileForm } from "@/components/auth/profile-form";
import { FullProfileForm } from "@/components/auth/full-profile-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card } from "@/components/ui/card";
import { verifyUserPermission } from "@/lib/auth/verify-permissions";
import { createClient } from "@/lib/supabase/server";
import { SiteHeader } from "@/components/dashboard/site-header";

export const metadata: Metadata = {
  title: "Perfil do Usuário | SR-Consultoria",
  description: "Gerencie suas informações de perfil e conta na SR-Consultoria",
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
      <SiteHeader title="Perfil" />
      <main className="flex-1 p-6">
        <p className="text-muted-foreground mb-6">
          Gerencie suas informações pessoais e preferências de conta
        </p>

        <Tabs defaultValue="basic" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="basic">Informações Básicas</TabsTrigger>
            <TabsTrigger value="details">Dados Completos</TabsTrigger>
          </TabsList>

          <TabsContent value="basic">
            <Card className="p-6">
              <ProfileForm />
            </Card>
          </TabsContent>

          <TabsContent value="details">
            <Card className="p-6">
              <FullProfileForm />
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
