"use client";

import { useState } from "react";
import { Search, Loader2, CheckCircle, AlertCircle, TreePine } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatArea } from "@/lib/utils/formatters";

interface SicarData {
  car: string;
  status: string;
  tipo: string;
  area_imovel: number;
  modulos_fiscais: number;
  municipio: string;
  estado: string;
  condicao: string;
  criacao: string;
  atualizacao: string;
  nome_imovel: string;
  situacao_imovel: string;
  classe_imovel: string;
  
  reserva_legal: {
    area: number;
    percentual: number;
  };
  
  app: {
    area: number;
    percentual: number;
  };
  
  area_cultivo: {
    area: number;
    percentual: number;
  };
  
  area_cultivavel: {
    area: number;
    percentual: number;
  };
  
  area_protegida: {
    area: number;
    percentual: number;
  };
  
  // Dados adicionais da API InfoSimples
  area_preservacao_permanente: number;
  area_preservacao_permanente_area_remanescente_vegetacao_nativa: number;
  area_preservacao_permanente_area_rural_consolidada: number;
  area_uso_restrito: number;
  regularidade_ambiental: {
    passivo_excedente_reserva_legal: number;
    area_reserva_legal_recompor: number;
    area_preservacao_permanente_recompor: number;
  };
  reserva_situacao: string;
  reserva_justificativa: string | null;
  reserva_area_averbada: number;
  reserva_area_nao_averbada: number;
  reserva_area_legal_proposta: number;
  reserva_area_legal_declarada: number;
  solo: {
    area_nativa: number;
    area_uso: number;
    area_servidao_administrativa: number;
  };
}

interface SicarLookupProps {
  onDataReceived?: (data: SicarData) => void;
  defaultCar?: string;
  estado?: string;
}

export function SicarLookup({ onDataReceived, defaultCar = "", estado }: SicarLookupProps) {
  const [carNumber, setCarNumber] = useState(defaultCar);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sicarData, setSicarData] = useState<SicarData | null>(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  const handleSearch = async () => {
    if (!carNumber.trim()) {
      setError("Por favor, informe o número do CAR");
      return;
    }

    if (!estado) {
      setError("Por favor, selecione o estado da propriedade primeiro");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/sicar?car=${encodeURIComponent(carNumber)}&estado=${encodeURIComponent(estado)}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao buscar dados do SICAR");
      }

      const data = await response.json();
      setSicarData(data);
      setShowConfirmDialog(true);
    } catch (err) {
      console.error("Erro ao buscar dados do SICAR:", err);
      setError(err instanceof Error ? err.message : "Erro ao buscar dados do SICAR");
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirm = () => {
    if (sicarData && onDataReceived) {
      onDataReceived(sicarData);
    }
    setShowConfirmDialog(false);
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "N/A";
    try {
      const [day, month, year] = dateStr.split("/");
      return `${day}/${month}/${year}`;
    } catch {
      return dateStr;
    }
  };

  const getStatusBadge = (status: string) => {
    const statusMap: { [key: string]: { label: string; variant: "default" | "secondary" | "destructive" | "outline" } } = {
      "Ativo": { label: "Ativo", variant: "default" },
      "Pendente": { label: "Pendente", variant: "secondary" },
      "Suspenso": { label: "Suspenso", variant: "destructive" },
      "Cancelado": { label: "Cancelado", variant: "destructive" },
    };

    const statusInfo = statusMap[status] || { label: status, variant: "outline" };
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <TreePine className="h-4 w-4" />
            Consulta SICAR
          </CardTitle>
          <CardDescription>
            Busque dados do Cadastro Ambiental Rural (CAR) para preencher automaticamente as informações da propriedade
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="Digite o número do CAR"
              value={carNumber}
              onChange={(e) => setCarNumber(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              disabled={isLoading}
              className="flex-1"
            />
            <Button
              onClick={handleSearch}
              disabled={isLoading || !carNumber.trim() || !estado}
              size="sm"
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Buscando...
                </>
              ) : (
                <>
                  <Search className="mr-2 h-4 w-4" />
                  Buscar
                </>
              )}
            </Button>
          </div>

          {!estado && (
            <p className="text-sm text-muted-foreground mt-2">
              Selecione o estado da propriedade antes de buscar o CAR
            </p>
          )}

          {error && (
            <Alert variant="destructive" className="mt-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Dados do SICAR Encontrados</DialogTitle>
            <DialogDescription>
              Revise os dados encontrados e confirme para preencher automaticamente o formulário
            </DialogDescription>
          </DialogHeader>

          {sicarData && (
            <div className="space-y-4">
              {/* Informações Básicas */}
              <div>
                <h3 className="font-semibold mb-2">Informações do Imóvel</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">CAR:</span>
                    <p className="font-medium">{sicarData.car}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Status:</span>
                    <p>{getStatusBadge(sicarData.situacao_imovel)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Município:</span>
                    <p className="font-medium">{sicarData.municipio}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Estado:</span>
                    <p className="font-medium">{sicarData.estado}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Área Total:</span>
                    <p className="font-medium">{formatArea(sicarData.area_imovel)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Módulos Fiscais:</span>
                    <p className="font-medium">{sicarData.modulos_fiscais.toFixed(2)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Data Registro:</span>
                    <p className="font-medium">{formatDate(sicarData.criacao)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Última Atualização:</span>
                    <p className="font-medium">{formatDate(sicarData.atualizacao)}</p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Áreas Ambientais */}
              <div>
                <h3 className="font-semibold mb-2">Áreas Ambientais</h3>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Reserva Legal</span>
                    <div className="text-right">
                      <p className="font-medium">{formatArea(sicarData.reserva_legal.area)}</p>
                      <p className="text-xs text-muted-foreground">{sicarData.reserva_legal.percentual.toFixed(2)}%</p>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">APP (Área de Preservação Permanente)</span>
                    <div className="text-right">
                      <p className="font-medium">{formatArea(sicarData.app.area)}</p>
                      <p className="text-xs text-muted-foreground">{sicarData.app.percentual.toFixed(2)}%</p>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Área de Uso</span>
                    <div className="text-right">
                      <p className="font-medium">{formatArea(sicarData.area_cultivo.area)}</p>
                      <p className="text-xs text-muted-foreground">{sicarData.area_cultivo.percentual.toFixed(2)}%</p>
                    </div>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Área Cultivável</span>
                    <div className="text-right">
                      <p className="font-medium">{formatArea(sicarData.area_cultivavel.area)}</p>
                      <p className="text-xs text-muted-foreground">{sicarData.area_cultivavel.percentual.toFixed(2)}%</p>
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Regularidade Ambiental */}
              <div>
                <h3 className="font-semibold mb-2">Regularidade Ambiental</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Situação Reserva Legal:</span>
                    <p className="font-medium">{sicarData.reserva_situacao}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Área RL a Recompor:</span>
                    <p className="font-medium">
                      {sicarData.regularidade_ambiental.area_reserva_legal_recompor > 0 
                        ? formatArea(sicarData.regularidade_ambiental.area_reserva_legal_recompor)
                        : "Não há"
                      }
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Área APP a Recompor:</span>
                    <p className="font-medium">
                      {sicarData.regularidade_ambiental.area_preservacao_permanente_recompor > 0 
                        ? formatArea(sicarData.regularidade_ambiental.area_preservacao_permanente_recompor)
                        : "Não há"
                      }
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Passivo/Excedente RL:</span>
                    <p className="font-medium">
                      {sicarData.regularidade_ambiental.passivo_excedente_reserva_legal !== 0
                        ? formatArea(Math.abs(sicarData.regularidade_ambiental.passivo_excedente_reserva_legal))
                        : "Não há"
                      }
                      {sicarData.regularidade_ambiental.passivo_excedente_reserva_legal > 0 && 
                        <span className="text-green-600 text-xs"> (Excedente)</span>
                      }
                      {sicarData.regularidade_ambiental.passivo_excedente_reserva_legal < 0 && 
                        <span className="text-red-600 text-xs"> (Passivo)</span>
                      }
                    </p>
                  </div>
                </div>
              </div>

              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  Os seguintes campos serão preenchidos automaticamente:
                  <ul className="list-disc list-inside mt-2 space-y-1">
                    <li>Número do CAR</li>
                    <li>Área total da propriedade</li>
                    <li>Área de Reserva Legal</li>
                    <li>Área de APP</li>
                    <li>Área cultivável (estimada)</li>
                  </ul>
                </AlertDescription>
              </Alert>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirmDialog(false)}>
              Cancelar
            </Button>
            <Button onClick={handleConfirm}>
              Usar estes dados
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}