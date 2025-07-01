"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PlusIcon } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ProjectionConfigForm } from "./projection-config-form";
import { ProjectionConfigRowActions } from "./projection-config-row-actions";
import { EmptyState } from "@/components/shared/empty-state";
import { toast } from "sonner";
import { deleteProjecaoConfig } from "@/lib/actions/projections-actions/index";
import { formatDate } from "@/lib/utils/formatters";

interface ProjecaoConfig {
  id: string;
  nome: string;
  descricao?: string;
  periodo_inicio: number;
  periodo_fim: number;
  formato_safra: "SAFRA_COMPLETA" | "ANO_CIVIL";
  status: "ATIVA" | "INATIVA" | "ARQUIVADA";
  eh_padrao: boolean;
  created_at?: string;
  updated_at?: string;
}

interface ProjectionConfigListingProps {
  organization: { id: string; nome: string };
  initialConfigs: ProjecaoConfig[];
}

export function ProjectionConfigListing({
  organization,
  initialConfigs,
}: ProjectionConfigListingProps) {
  const [configs, setConfigs] = useState<ProjecaoConfig[]>(initialConfigs);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<ProjecaoConfig | null>(null);

  const handleEdit = (config: ProjecaoConfig) => {
    setEditingConfig(config);
    setIsFormOpen(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const result = await deleteProjecaoConfig(id);
      if ('error' in result) {
        toast.error(result.error);
      } else {
        setConfigs(configs.filter(config => config.id !== id));
        toast.success("Configuração removida com sucesso");
      }
    } catch (error) {
      toast.error("Erro ao remover configuração");
    }
  };

  const handleFormClose = () => {
    setIsFormOpen(false);
    setEditingConfig(null);
  };

  const handleFormSuccess = (config: ProjecaoConfig) => {
    if (editingConfig) {
      setConfigs(configs.map(c => c.id === config.id ? config : c));
    } else {
      setConfigs([...configs, config]);
    }
    handleFormClose();
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Configurações de Projeção</h2>
            <p className="text-muted-foreground">
              Gerencie as configurações base para suas projeções financeiras
            </p>
          </div>
          <Button onClick={() => setIsFormOpen(true)}>
            <PlusIcon className="mr-2 h-4 w-4" />
            Nova Configuração
          </Button>
        </div>

        {/* Content */}
        {configs.length === 0 ? (
          <EmptyState
            icon="chart"
            title="Nenhuma configuração encontrada"
            description="Crie sua primeira configuração de projeção para começar"
            action={
              <Button onClick={() => setIsFormOpen(true)}>
                <PlusIcon className="mr-2 h-4 w-4" />
                Nova Configuração
              </Button>
            }
          />
        ) : (
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Período</TableHead>
                    <TableHead>Formato</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Padrão</TableHead>
                    <TableHead>Criado em</TableHead>
                    <TableHead className="w-[100px]">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {configs.map((config) => (
                    <TableRow key={config.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{config.nome}</div>
                          {config.descricao && (
                            <div className="text-sm text-muted-foreground">
                              {config.descricao}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        {config.periodo_inicio} - {config.periodo_fim}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {config.formato_safra === "SAFRA_COMPLETA" ? "Safra Completa" : "Ano Civil"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={
                            config.status === "ATIVA" ? "default" : 
                            config.status === "INATIVA" ? "secondary" : "destructive"
                          }
                        >
                          {config.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {config.eh_padrao && (
                          <Badge variant="outline">Padrão</Badge>
                        )}
                      </TableCell>
                      <TableCell>
                        {config.created_at ? formatDate(config.created_at) : "-"}
                      </TableCell>
                      <TableCell>
                        <ProjectionConfigRowActions
                          config={config}
                          onEdit={handleEdit}
                          onDelete={handleDelete}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Form Modal */}
      <ProjectionConfigForm
        isOpen={isFormOpen}
        onClose={handleFormClose}
        onSuccess={handleFormSuccess}
        organizationId={organization.id}
        initialData={editingConfig}
      />
    </>
  );
}