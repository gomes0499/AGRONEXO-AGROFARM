import { redirect } from "next/navigation";
import { getOrganizationId } from "@/lib/auth";
import { getLivestockSales } from "@/lib/actions/commercial-actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { NewLivestockSaleButton } from "@/components/commercial/livestock-sales/new-livestock-sale-button";
import { LivestockSaleList } from "@/components/commercial/livestock-sales/livestock-sale-list";

export default async function LivestockSalesPage() {
  try {
    // Obter ID da organização (já verifica autenticação)
    const organizationId = await getOrganizationId();
    
    // Busca as vendas pecuárias da organização
    const response = await getLivestockSales(organizationId);
    const livestockSales = Array.isArray(response) ? response : [];
    
    return (
      <div className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold">Vendas Pecuárias</h1>
            <p className="text-muted-foreground">
              Gerenciamento de operações comerciais de animais
            </p>
          </div>
          
          <NewLivestockSaleButton
            organizationId={organizationId}
          />
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Registros de Vendas</CardTitle>
            <CardDescription>
              Histórico de operações comerciais pecuárias
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LivestockSaleList
              initialLivestockSales={livestockSales}
              organizationId={organizationId}
            />
          </CardContent>
        </Card>
      </div>
    );
  } catch (error) {
    // Se não conseguir obter a organização, redireciona para login
    redirect("/auth/login");
  }
}