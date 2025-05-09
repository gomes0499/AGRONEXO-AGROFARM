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
import { getProperties } from "@/lib/actions/property-actions";

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
  categorias?: Record<string, { quantidade: number; valor: number }>;
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
  const properties: Property[] = propertiesData.map((p) => ({
    id: p.id || "", // Garantir que id nunca será undefined
    nome: p.nome,
    cidade: p.cidade,
    estado: p.estado,
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

  // Agrupar por tipo de animal, incluindo categorias
  const animalsByType = livestock.reduce<Record<string, LivestockGroupData>>(
    (acc, item) => {
      if (!acc[item.tipo_animal]) {
        acc[item.tipo_animal] = {
          quantidade: 0,
          valor: 0,
          categorias: {},
        };
      }

      // Incrementar totais para o tipo de animal
      acc[item.tipo_animal].quantidade += item.quantidade;
      acc[item.tipo_animal].valor += item.quantidade * item.preco_unitario;

      // Adicionar ou atualizar categoria para este tipo de animal
      const categorias = acc[item.tipo_animal].categorias || {};
      if (!categorias[item.categoria]) {
        categorias[item.categoria] = {
          quantidade: 0,
          valor: 0,
        };
      }

      // Incrementar totais para a categoria
      categorias[item.categoria].quantidade += item.quantidade;
      categorias[item.categoria].valor += item.quantidade * item.preco_unitario;

      // Garantir que categorias está atualizado no objeto
      acc[item.tipo_animal].categorias = categorias;

      return acc;
    },
    {}
  );

  // Agrupar por propriedade
  const animalsByProperty = livestock.reduce<
    Record<string, LivestockGroupData>
  >((acc, item) => {
    const propertyName =
      properties.find((p) => p.id === item.propriedade_id)?.nome ||
      "Desconhecida";
    if (!acc[propertyName]) {
      acc[propertyName] = {
        quantidade: 0,
        valor: 0,
        categorias: {},
      };
    }

    // Incrementar totais para a propriedade
    acc[propertyName].quantidade += item.quantidade;
    acc[propertyName].valor += item.quantidade * item.preco_unitario;

    // Adicionar ou atualizar categoria para esta propriedade
    const categorias = acc[propertyName].categorias || {};
    if (!categorias[item.categoria]) {
      categorias[item.categoria] = {
        quantidade: 0,
        valor: 0,
      };
    }

    // Incrementar totais para a categoria
    categorias[item.categoria].quantidade += item.quantidade;
    categorias[item.categoria].valor += item.quantidade * item.preco_unitario;

    // Garantir que categorias está atualizado no objeto
    acc[propertyName].categorias = categorias;

    return acc;
  }, {});

  return (
    <div className="space-y-6">
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

      <LivestockList
        key="livestock-list"
        initialLivestock={livestock}
        properties={properties}
        organizationId={organizationId}
      />
    </div>
  );
}
