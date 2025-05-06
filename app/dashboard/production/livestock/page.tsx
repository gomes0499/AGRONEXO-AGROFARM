import { Metadata } from "next";
import { getOrganizationId } from "@/lib/auth";
import { getLivestock } from "@/lib/actions/production-actions";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LivestockList } from "@/components/production/livestock/livestock-list";
import { NewLivestockButton } from "@/components/production/livestock/new-livestock-button";
import { formatCurrency } from "@/lib/utils/formatters";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Link from "next/link";
import { getProperties } from "@/lib/actions/property-actions";
import { Button } from "@/components/ui/button";
import { Livestock } from "@/schemas/production";

// Define the Property interface that matches what the components expect
interface Property {
  id: string;
  nome: string;
  [key: string]: any;
}

// Interface para dados agrupados de rebanho
interface LivestockGroupData {
  quantidade: number;
  valor: number;
}

export const metadata: Metadata = {
  title: "Rebanho | SR Consultoria",
  description: "Gerenciamento de rebanho e operações pecuárias",
};

export default async function LivestockPage() {
  const organizationId = await getOrganizationId();

  // Buscar dados necessários
  const livestock = await getLivestock(organizationId);
  const propertiesData = await getProperties(organizationId);
  
  // Converter propriedades para o formato esperado pelos componentes
  const properties: Property[] = propertiesData.map(p => ({
    id: p.id || "",  // Garantir que id nunca será undefined
    nome: p.nome,
    cidade: p.cidade,
    estado: p.estado
  }));

  // Calcular estatísticas
  const totalAnimals = livestock.reduce(
    (sum, item) => sum + item.quantidade,
    0
  );
  const totalValue = livestock.reduce(
    (sum, item) => sum + item.quantidade * item.preco_unitario,
    0
  );

  // Agrupar por tipo de animal
  const animalsByType = livestock.reduce<Record<string, LivestockGroupData>>((acc, item) => {
    if (!acc[item.tipo_animal]) {
      acc[item.tipo_animal] = {
        quantidade: 0,
        valor: 0,
      };
    }
    acc[item.tipo_animal].quantidade += item.quantidade;
    acc[item.tipo_animal].valor += item.quantidade * item.preco_unitario;
    return acc;
  }, {});

  // Agrupar por propriedade
  const animalsByProperty = livestock.reduce<Record<string, LivestockGroupData>>((acc, item) => {
    const propertyName =
      properties.find((p) => p.id === item.propriedade_id)?.nome ||
      "Desconhecida";
    if (!acc[propertyName]) {
      acc[propertyName] = {
        quantidade: 0,
        valor: 0,
      };
    }
    acc[propertyName].quantidade += item.quantidade;
    acc[propertyName].valor += item.quantidade * item.preco_unitario;
    return acc;
  }, {});

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Rebanho</h1>
          <p className="text-muted-foreground">
            Gerenciamento de rebanho e controle de animais.
          </p>
        </div>
        <div className="flex gap-2">
          <NewLivestockButton
            properties={properties}
            organizationId={organizationId}
          />
          <Button asChild variant="outline">
            <Link href="/dashboard/production/livestock-operations">
              Operações Pecuárias
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Total de Animais</CardTitle>
            <CardDescription>Quantidade total de animais</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalAnimals} cabeças</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Tipos de Animais</CardTitle>
            <CardDescription>Categorias de animais</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Object.keys(animalsByType).length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle>Valor do Rebanho</CardTitle>
            <CardDescription>Valor total do rebanho</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(totalValue)}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Resumo do Rebanho</CardTitle>
          <CardDescription>
            Resumo da distribuição de animais por tipo e propriedade
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="by-type">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="by-type">Por Tipo de Animal</TabsTrigger>
              <TabsTrigger value="by-property">Por Propriedade</TabsTrigger>
            </TabsList>
            <TabsContent value="by-type" className="mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(animalsByType).map(([tipo, dados]) => (
                  <Card key={tipo}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">{tipo}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-between text-sm">
                        <span>Quantidade:</span>
                        <span className="font-medium">
                          {dados?.quantidade || 0} cabeças
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Valor:</span>
                        <span className="font-medium">
                          {formatCurrency(dados?.valor || 0)}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
            <TabsContent value="by-property" className="mt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {Object.entries(animalsByProperty).map(
                  ([propriedade, dados]) => (
                    <Card key={propriedade}>
                      <CardHeader className="pb-2">
                        <CardTitle className="text-base">
                          {propriedade}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex justify-between text-sm">
                          <span>Quantidade:</span>
                          <span className="font-medium">
                            {dados?.quantidade || 0} cabeças
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Valor:</span>
                          <span className="font-medium">
                            {formatCurrency(dados?.valor || 0)}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  )
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <LivestockList
        initialLivestock={livestock}
        properties={properties}
        organizationId={organizationId}
      />
    </div>
  );
}
