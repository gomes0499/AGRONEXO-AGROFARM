import { Metadata } from "next";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Settings, Download, Share2 } from "lucide-react";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Detalhes da Projeção | SR-Consultoria",
  description: "Visualize e gerencie os detalhes de uma projeção específica",
};

export default function ProjectionDetailsLayout({ children, params }: any) {
  const projection = {
    id: params.id,
    nome: "Projeção 2024-2026",
    descricao: "Projeção estratégica para crescimento sustentável",
    status: "ATIVO",
    periodo_inicio: "2024-01-01",
    periodo_fim: "2026-12-31",
    eh_padrao: true,
    criado_em: "2024-01-15",
    atualizado_em: "2024-02-10",
  };

  return (
    <div className="space-y-6">
      {/* Header com navegação e ações */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/dashboard/projections">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
          </Link>

          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold">{projection.nome}</h1>
              <Badge variant={projection.eh_padrao ? "default" : "secondary"}>
                {projection.eh_padrao ? "Padrão" : "Alternativa"}
              </Badge>
              <Badge
                variant={
                  projection.status === "ATIVO" ? "default" : "secondary"
                }
              >
                {projection.status}
              </Badge>
            </div>
            <p className="text-muted-foreground mt-1">{projection.descricao}</p>
            <p className="text-sm text-muted-foreground">
              Período:{" "}
              {new Date(projection.periodo_inicio).toLocaleDateString()} -{" "}
              {new Date(projection.periodo_fim).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Download className="mr-2 h-4 w-4" />
            Exportar
          </Button>
          <Button variant="outline" size="sm">
            <Share2 className="mr-2 h-4 w-4" />
            Compartilhar
          </Button>
          <Link href={`/dashboard/projections/${params.id}/edit`}>
            <Button size="sm">
              <Settings className="mr-2 h-4 w-4" />
              Editar
            </Button>
          </Link>
        </div>
      </div>

      {/* Navegação por Tabs */}
      <Tabs defaultValue="cultures" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="cultures">Culturas</TabsTrigger>
          <TabsTrigger value="debts">Dívidas</TabsTrigger>
          <TabsTrigger value="cashflow">Fluxo de Caixa</TabsTrigger>
        </TabsList>

        <TabsContent value="cultures">{children}</TabsContent>

        <TabsContent value="debts">{children}</TabsContent>

        <TabsContent value="cashflow">{children}</TabsContent>
      </Tabs>
    </div>
  );
}
