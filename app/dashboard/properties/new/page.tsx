import { Metadata } from "next";
import { PropertyForm } from "@/components/properties/property-form";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export const metadata: Metadata = {
  title: "Nova Propriedade | SR Consultoria",
  description: "Cadastre uma nova propriedade rural no sistema.",
};

export default async function NewPropertyPage() {
  const session = await getSession();
  
  if (!session?.organizationId) {
    redirect("/dashboard");
  }
  
  return (
    <div className="flex flex-col gap-6 p-6">
      <PropertyForm organizationId={session.organizationId} />
    </div>
  );
}