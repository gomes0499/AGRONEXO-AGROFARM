"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  ArrowLeft,
  Save,
  FileText,
  Settings,
  BarChart3,
  DollarSign,
  TrendingUp,
  Calendar,
  AlertTriangle,
} from "lucide-react";
import Link from "next/link";

export default function ProjectionEditPage({ params }: any) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Mock data - replace with actual API call
  const [projection, setProjection] = useState({
    id: params.id,
    nome: "Projeção 2024-2026",
    descricao: "Projeção estratégica para crescimento sustentável",
    periodo_inicio: "2024-01-01",
    periodo_fim: "2026-12-31",
    tipo: "PADRAO",
    status: "ATIVO",
    eh_padrao: true,
    criado_em: "2024-01-15",
    atualizado_em: "2024-02-10",
  });

  const handleSave = async () => {
    setIsLoading(true);
    try {
      // TODO: Implement actual API call
      console.log("Saving projection:", projection);
      await new Promise((resolve) => setTimeout(resolve, 1000));
      setHasChanges(false);
      router.push(`/dashboard/projections/${params.id}`);
    } catch (error) {
      console.error("Error saving projection:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setProjection((prev) => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href={`/dashboard/projections/${params.id}`}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Voltar
            </Button>
          </Link>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold">Editar Projeção</h1>
              {hasChanges && (
                <Badge variant="outline" className="text-orange-600">
                  <AlertTriangle className="mr-1 h-3 w-3" />
                  Alterações não salvas
                </Badge>
              )}
            </div>
            <p className="text-muted-foreground">
              Configure os parâmetros e dados da projeção
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={() => router.back()}>
            Cancelar
          </Button>
          <Button onClick={handleSave} disabled={isLoading || !hasChanges}>
            <Save className="mr-2 h-4 w-4" />
            {isLoading ? "Salvando..." : "Salvar"}
          </Button>
        </div>
      </div>

      {/* Edit Tabs */}
      <Tabs defaultValue="basic" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="basic">Informações Básicas</TabsTrigger>
          <TabsTrigger value="settings">Configurações</TabsTrigger>
          <TabsTrigger value="data">Dados e Importação</TabsTrigger>
          <TabsTrigger value="advanced">Avançado</TabsTrigger>
        </TabsList>

        <TabsContent value="basic">
          <BasicInfoTab projection={projection} onChange={handleInputChange} />
        </TabsContent>

        <TabsContent value="settings">
          <SettingsTab projection={projection} onChange={handleInputChange} />
        </TabsContent>

        <TabsContent value="data">
          <DataImportTab projection={projection} onChange={handleInputChange} />
        </TabsContent>

        <TabsContent value="advanced">
          <AdvancedTab projection={projection} onChange={handleInputChange} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Tab Components
function BasicInfoTab({ projection, onChange }: any) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <FileText className="h-5 w-5" />
          <span>Informações Básicas</span>
        </CardTitle>
        <CardDescription>
          Configure as informações fundamentais da projeção
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-medium">Nome da Projeção</label>
            <input
              type="text"
              value={projection.nome}
              onChange={(e) => onChange("nome", e.target.value)}
              className="w-full px-3 py-2 border border-input bg-background rounded-md"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Tipo de Projeção</label>
            <select
              value={projection.tipo}
              onChange={(e) => onChange("tipo", e.target.value)}
              className="w-full px-3 py-2 border border-input bg-background rounded-md"
            >
              <option value="PADRAO">Padrão</option>
              <option value="CENARIO">Cenário Alternativo</option>
              <option value="STRESS_TEST">Teste de Stress</option>
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Data de Início</label>
            <input
              type="date"
              value={projection.periodo_inicio}
              onChange={(e) => onChange("periodo_inicio", e.target.value)}
              className="w-full px-3 py-2 border border-input bg-background rounded-md"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Data de Fim</label>
            <input
              type="date"
              value={projection.periodo_fim}
              onChange={(e) => onChange("periodo_fim", e.target.value)}
              className="w-full px-3 py-2 border border-input bg-background rounded-md"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Status</label>
            <select
              value={projection.status}
              onChange={(e) => onChange("status", e.target.value)}
              className="w-full px-3 py-2 border border-input bg-background rounded-md"
            >
              <option value="ATIVO">Ativo</option>
              <option value="INATIVO">Inativo</option>
              <option value="RASCUNHO">Rascunho</option>
            </select>
          </div>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="eh_padrao"
              checked={projection.eh_padrao}
              onChange={(e) => onChange("eh_padrao", e.target.checked)}
              className="w-4 h-4"
            />
            <label htmlFor="eh_padrao" className="text-sm font-medium">
              Definir como projeção padrão
            </label>
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Descrição</label>
          <textarea
            value={projection.descricao}
            onChange={(e) => onChange("descricao", e.target.value)}
            rows={4}
            className="w-full px-3 py-2 border border-input bg-background rounded-md"
          />
        </div>
      </CardContent>
    </Card>
  );
}

function SettingsTab({ projection, onChange }: any) {
  const [settings, setSettings] = useState({
    auto_update: true,
    notification_enabled: true,
    export_format: "EXCEL",
    currency: "BRL",
    precision: 2,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Settings className="h-5 w-5" />
          <span>Configurações</span>
        </CardTitle>
        <CardDescription>
          Configure parâmetros de funcionamento da projeção
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h4 className="font-medium">Configurações Gerais</h4>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">Atualização Automática</p>
                <p className="text-sm text-muted-foreground">
                  Atualizar projeções automaticamente quando dados base mudarem
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.auto_update}
                onChange={(e) =>
                  setSettings({ ...settings, auto_update: e.target.checked })
                }
                className="w-4 h-4"
              />
            </div>

            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="font-medium">Notificações</p>
                <p className="text-sm text-muted-foreground">
                  Receber notificações sobre alterações na projeção
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.notification_enabled}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    notification_enabled: e.target.checked,
                  })
                }
                className="w-4 h-4"
              />
            </div>
          </div>

          <div className="space-y-4">
            <h4 className="font-medium">Formatação</h4>

            <div className="space-y-2">
              <label className="text-sm font-medium">Moeda Padrão</label>
              <select
                value={settings.currency}
                onChange={(e) =>
                  setSettings({ ...settings, currency: e.target.value })
                }
                className="w-full px-3 py-2 border border-input bg-background rounded-md"
              >
                <option value="BRL">Real (BRL)</option>
                <option value="USD">Dólar (USD)</option>
                <option value="EUR">Euro (EUR)</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Formato de Exportação
              </label>
              <select
                value={settings.export_format}
                onChange={(e) =>
                  setSettings({ ...settings, export_format: e.target.value })
                }
                className="w-full px-3 py-2 border border-input bg-background rounded-md"
              >
                <option value="EXCEL">Excel (.xlsx)</option>
                <option value="PDF">PDF</option>
                <option value="CSV">CSV</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Precisão Decimal</label>
              <select
                value={settings.precision}
                onChange={(e) =>
                  setSettings({
                    ...settings,
                    precision: Number(e.target.value),
                  })
                }
                className="w-full px-3 py-2 border border-input bg-background rounded-md"
              >
                <option value={0}>0 casas decimais</option>
                <option value={2}>2 casas decimais</option>
                <option value={4}>4 casas decimais</option>
              </select>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function DataImportTab({ projection, onChange }: any) {
  const [importSettings, setImportSettings] = useState({
    auto_import: false,
    source_modules: ["PRODUCAO", "COMERCIAL"],
    last_import: "2024-02-01",
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <BarChart3 className="h-5 w-5" />
          <span>Dados e Importação</span>
        </CardTitle>
        <CardDescription>
          Configure a importação de dados de outros módulos
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-medium">Importação Automática</p>
              <p className="text-sm text-muted-foreground">
                Importar dados automaticamente dos módulos selecionados
              </p>
            </div>
            <input
              type="checkbox"
              checked={importSettings.auto_import}
              onChange={(e) =>
                setImportSettings({
                  ...importSettings,
                  auto_import: e.target.checked,
                })
              }
              className="w-4 h-4"
            />
          </div>

          <div className="space-y-3">
            <h4 className="font-medium">Módulos de Origem</h4>
            <p className="text-sm text-muted-foreground">
              Selecione quais módulos devem ter seus dados importados
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {[
                {
                  id: "PRODUCAO",
                  name: "Produção",
                  icon: TrendingUp,
                  color: "text-green-600",
                },
                {
                  id: "COMERCIAL",
                  name: "Comercial",
                  icon: DollarSign,
                  color: "text-blue-600",
                },
                {
                  id: "FINANCEIRO",
                  name: "Financeiro",
                  icon: BarChart3,
                  color: "text-purple-600",
                },
              ].map((module) => (
                <div
                  key={module.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    importSettings.source_modules.includes(module.id)
                      ? "border-primary bg-primary/5"
                      : "border-input hover:bg-muted/50"
                  }`}
                  onClick={() => {
                    const newModules = importSettings.source_modules.includes(
                      module.id
                    )
                      ? importSettings.source_modules.filter(
                          (m) => m !== module.id
                        )
                      : [...importSettings.source_modules, module.id];
                    setImportSettings({
                      ...importSettings,
                      source_modules: newModules,
                    });
                  }}
                >
                  <div className="flex items-center space-x-3">
                    <module.icon className={`h-6 w-6 ${module.color}`} />
                    <div>
                      <p className="font-medium">{module.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {module.id === "PRODUCAO" &&
                          "Culturas, custos, produtividade"}
                        {module.id === "COMERCIAL" &&
                          "Vendas, preços, contratos"}
                        {module.id === "FINANCEIRO" &&
                          "Dívidas, liquidez, fluxo"}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {importSettings.last_import && (
            <div className="p-4 bg-muted/30 rounded-lg">
              <div className="flex items-center space-x-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Última Importação:</span>
                <span className="text-sm">
                  {new Date(importSettings.last_import).toLocaleDateString()}
                </span>
              </div>
            </div>
          )}

          <div className="flex space-x-2">
            <Button variant="outline" size="sm">
              Importar Agora
            </Button>
            <Button variant="outline" size="sm">
              Histórico de Importações
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AdvancedTab({ projection, onChange }: any) {
  const [advanced, setAdvanced] = useState({
    backup_enabled: true,
    version_control: true,
    api_access: false,
    custom_calculations: false,
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Settings className="h-5 w-5" />
          <span>Configurações Avançadas</span>
        </CardTitle>
        <CardDescription>Configurações para usuários avançados</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-medium">Backup Automático</p>
              <p className="text-sm text-muted-foreground">
                Criar backups automáticos da projeção
              </p>
            </div>
            <input
              type="checkbox"
              checked={advanced.backup_enabled}
              onChange={(e) =>
                setAdvanced({ ...advanced, backup_enabled: e.target.checked })
              }
              className="w-4 h-4"
            />
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-medium">Controle de Versão</p>
              <p className="text-sm text-muted-foreground">
                Manter histórico de versões das alterações
              </p>
            </div>
            <input
              type="checkbox"
              checked={advanced.version_control}
              onChange={(e) =>
                setAdvanced({ ...advanced, version_control: e.target.checked })
              }
              className="w-4 h-4"
            />
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-medium">Acesso via API</p>
              <p className="text-sm text-muted-foreground">
                Permitir acesso aos dados via API externa
              </p>
            </div>
            <input
              type="checkbox"
              checked={advanced.api_access}
              onChange={(e) =>
                setAdvanced({ ...advanced, api_access: e.target.checked })
              }
              className="w-4 h-4"
            />
          </div>

          <div className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-medium">Cálculos Customizados</p>
              <p className="text-sm text-muted-foreground">
                Habilitar fórmulas e cálculos personalizados
              </p>
            </div>
            <input
              type="checkbox"
              checked={advanced.custom_calculations}
              onChange={(e) =>
                setAdvanced({
                  ...advanced,
                  custom_calculations: e.target.checked,
                })
              }
              className="w-4 h-4"
            />
          </div>
        </div>

        <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-start space-x-2">
            <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
            <div>
              <p className="font-medium text-yellow-800">Atenção</p>
              <p className="text-sm text-yellow-700">
                As configurações avançadas podem afetar o desempenho e a
                segurança. Altere apenas se souber o que está fazendo.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
