"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTriggerPrimary,
} from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Building,
  MapPin,
  Ruler,
  Calendar,
  FileText,
  Shield,
  Home,
  Plus,
  Tractor,
  DollarSign,
  User,
  TreePine,
  RefreshCw,
  Warehouse,
} from "lucide-react";
import { Property } from "@/schemas/properties";
import { Improvement } from "@/schemas/properties";
import { Lease } from "@/schemas/properties";
import { formatCurrency, formatArea } from "@/lib/utils/formatters";
import {
  getPropertyById,
  getImprovements,
  getLeases,
  getSafras,
} from "@/lib/actions/property-actions";
import { ImprovementForm } from "./improvement-form";
import { LeaseCard } from "./lease-card";
import { EmptyState } from "@/components/ui/empty-state";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2 } from "lucide-react";

interface PropertyDetailsModalProps {
  propertyId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function PropertyDetailsModal({
  propertyId,
  open,
  onOpenChange,
}: PropertyDetailsModalProps) {
  const [property, setProperty] = useState<Property | null>(null);
  const [improvements, setImprovements] = useState<Improvement[]>([]);
  const [leases, setLeases] = useState<Lease[]>([]);
  const [safras, setSafras] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("info");
  const [showImprovementForm, setShowImprovementForm] = useState(false);
  const [loadingSicar, setLoadingSicar] = useState(false);
  const [sicarData, setSicarData] = useState<any>(null);
  const [showSicarInfo, setShowSicarInfo] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!open || !propertyId) return;

      setLoading(true);
      try {
        // Buscar dados da propriedade
        const propertyData = await getPropertyById(propertyId);
        setProperty(propertyData);

        // Buscar benfeitorias
        const improvementsData = await getImprovements(
          propertyData.organizacao_id,
          propertyId
        );
        setImprovements(improvementsData);

        // Buscar arrendamentos
        const leasesData = await getLeases(
          propertyData.organizacao_id,
          propertyId
        );
        setLeases(leasesData);

        // Buscar safras para mostrar os nomes nos arrendamentos
        const safrasData = await getSafras(propertyData.organizacao_id);
        setSafras(safrasData);
      } catch (error) {
        console.error("Erro ao carregar dados:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [propertyId, open]);

  const handleSicarSearch = async () => {
    if (!property?.numero_car || !property?.estado) {
      toast.error("CAR ou estado não informado");
      return;
    }

    setLoadingSicar(true);
    try {
      const response = await fetch(
        `/api/sicar?car=${encodeURIComponent(property.numero_car)}&estado=${encodeURIComponent(property.estado)}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao buscar dados do SICAR");
      }

      const data = await response.json();
      setSicarData(data);
      setShowSicarInfo(true);
      toast.success("Dados do SICAR carregados com sucesso!");
    } catch (err) {
      console.error("Erro ao buscar dados do SICAR:", err);
      toast.error(err instanceof Error ? err.message : "Erro ao buscar dados do SICAR");
    } finally {
      setLoadingSicar(false);
    }
  };

  if (!open) return null;

  const InfoField = ({ icon: Icon, label, value, className = "" }: any) => {
    if (!value && value !== 0) return null;

    return (
      <div className={`space-y-1 ${className}`}>
        <div className="flex items-center gap-2">
          <Icon className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">{label}</span>
        </div>
        <div className="font-medium pl-5">{value}</div>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-h-[95vh] overflow-hidden p-0"
        style={{ width: "60vw", maxWidth: "1400px", minHeight: "80vh" }}
      >
        <DialogHeader className="px-6 py-4 border-b bg-muted/20">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-semibold">
                {loading
                  ? "Carregando..."
                  : property?.nome || "Detalhes da Propriedade"}
              </DialogTitle>
              {!loading && property && (
                <p className="text-sm text-muted-foreground mt-1">
                  {property.cidade}, {property.estado} •{" "}
                  {formatArea(property.area_total)}
                </p>
              )}
            </div>
            {!loading && property && (
              <Badge
                variant={property.tipo === "PROPRIO" ? "default" : "secondary"}
                className={
                  property.tipo === "ARRENDADO"
                    ? "bg-blue-100 text-blue-800 border-blue-200"
                    : property.tipo === "PARCERIA_AGRICOLA"
                      ? "bg-purple-100 text-purple-800 border-purple-200"
                      : ""
                }
              >
                {property.tipo === "PROPRIO"
                  ? "Própria"
                  : property.tipo === "ARRENDADO"
                    ? "Arrendada"
                    : "Parceria Agrícola"}
              </Badge>
            )}
          </div>
        </DialogHeader>

        {loading ? (
          <div className="p-6 space-y-6">
            <div className="space-y-4">
              <Skeleton className="h-8 w-48" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-6 w-32" />
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <Skeleton className="h-8 w-48" />
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-6 w-32" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : property ? (
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="flex-1 overflow-hidden"
          >
            <TabsList className="w-full justify-start rounded-none border-b px-6 bg-background">
              <TabsTriggerPrimary value="info">Informações</TabsTriggerPrimary>
              <TabsTriggerPrimary value="sicar">
                SICAR/CAR
                {property.numero_car && (
                  <TreePine className="h-3.5 w-3.5 ml-2" />
                )}
              </TabsTriggerPrimary>
              <TabsTriggerPrimary value="improvements">
                Benfeitorias
                {improvements.length > 0 && (
                  <Badge variant="secondary" className="ml-2">
                    {improvements.length}
                  </Badge>
                )}
              </TabsTriggerPrimary>
              {property.tipo !== "PROPRIO" && (
                <TabsTriggerPrimary value="leases">
                  Arrendamentos
                  {leases.length > 0 && (
                    <Badge variant="secondary" className="ml-2">
                      {leases.length}
                    </Badge>
                  )}
                </TabsTriggerPrimary>
              )}
            </TabsList>

            <div className="overflow-y-auto min-h-[calc(80vh-120px)] max-h-[calc(95vh-120px)]">
              <TabsContent value="info" className="p-6 space-y-6 m-0">
                {/* Informações Básicas */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-semibold">
                      Informações Básicas
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <InfoField
                      icon={Building}
                      label="Nome da Propriedade"
                      value={property.nome}
                    />
                    <InfoField
                      icon={FileText}
                      label="Tipo"
                      value={
                        <Badge
                          variant={
                            property.tipo === "PROPRIO"
                              ? "default"
                              : "secondary"
                          }
                          className={
                            property.tipo === "ARRENDADO"
                              ? "bg-blue-100 text-blue-800 border-blue-200"
                              : property.tipo === "PARCERIA_AGRICOLA"
                                ? "bg-purple-100 text-purple-800 border-purple-200"
                                : ""
                          }
                        >
                          {property.tipo === "PROPRIO"
                            ? "Própria"
                            : property.tipo === "ARRENDADO"
                              ? "Arrendada"
                              : "Parceria Agrícola"}
                        </Badge>
                      }
                    />
                    <InfoField
                      icon={FileText}
                      label="Matrícula"
                      value={property.numero_matricula}
                    />
                    <InfoField
                      icon={Calendar}
                      label="Ano de Aquisição"
                      value={property.ano_aquisicao}
                    />
                    <InfoField
                      icon={User}
                      label="Proprietário(s)"
                      value={
                        property.proprietarios && property.proprietarios.length > 0
                          ? property.proprietarios.map((p: any) => p.nome).join(", ")
                          : property.proprietario || "A informar"
                      }
                    />
                    <InfoField
                      icon={FileText}
                      label="CAR"
                      value={property.numero_car}
                    />
                    <InfoField
                      icon={Warehouse}
                      label="Possui Armazém"
                      value={
                        <Badge variant={property.possui_armazem ? "success" : "outline"}>
                          {property.possui_armazem ? "Sim" : "Não"}
                        </Badge>
                      }
                    />
                  </CardContent>
                </Card>

                {/* Localização */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-semibold">
                      Localização
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <InfoField
                      icon={MapPin}
                      label="Cidade"
                      value={property.cidade}
                    />
                    <InfoField
                      icon={MapPin}
                      label="Estado"
                      value={property.estado}
                    />
                    <InfoField
                      icon={FileText}
                      label="Cartório de Registro"
                      value={property.cartorio_registro}
                    />
                  </CardContent>
                </Card>

                {/* Áreas */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-semibold">
                      Áreas
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <InfoField
                      icon={Ruler}
                      label="Área Total"
                      value={formatArea(property.area_total)}
                    />
                    <InfoField
                      icon={Ruler}
                      label="Área Cultivada"
                      value={formatArea(property.area_cultivada)}
                    />
                    <InfoField
                      icon={Tractor}
                      label="Área de Pecuária"
                      value={formatArea(property.area_pecuaria)}
                    />
                  </CardContent>
                </Card>

                {/* Valores */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-semibold">
                      Valores
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <InfoField
                      icon={DollarSign}
                      label="Valor Total"
                      value={formatCurrency(property.valor_atual)}
                    />
                    <InfoField
                      icon={DollarSign}
                      label="Valor Terra Nua"
                      value={formatCurrency(property.valor_terra_nua)}
                    />
                    <InfoField
                      icon={DollarSign}
                      label="Valor Benfeitorias"
                      value={formatCurrency(property.valor_benfeitoria)}
                    />
                    <InfoField
                      icon={DollarSign}
                      label="Avaliação de Terceiro"
                      value={formatCurrency(property.avaliacao_terceiro)}
                    />
                  </CardContent>
                </Card>

                {/* Ônus */}
                {property.onus && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base font-semibold">
                        Informações de Ônus
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <InfoField
                        icon={Shield}
                        label="Descrição do Ônus"
                        value={property.onus}
                      />
                      <InfoField
                        icon={FileText}
                        label="Tipo de Ônus"
                        value={property.tipo_onus?.replace(/_/g, " ")}
                      />
                      <InfoField
                        icon={Building}
                        label="Banco/Instituição"
                        value={property.banco_onus}
                      />
                      <InfoField
                        icon={DollarSign}
                        label="Valor do Ônus"
                        value={formatCurrency(property.valor_onus)}
                      />
                    </CardContent>
                  </Card>
                )}

                {/* Dados de Arrendamento */}
                {(property.tipo === "ARRENDADO" ||
                  property.tipo === "PARCERIA_AGRICOLA") && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base font-semibold">
                        Dados do Arrendamento
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <InfoField
                        icon={User}
                        label="Arrendantes"
                        value={property.arrendantes}
                      />
                      <InfoField
                        icon={DollarSign}
                        label="Custo por Hectare"
                        value={
                          property.custo_hectare
                            ? `${property.custo_hectare} sacas/ha`
                            : null
                        }
                      />
                      <InfoField
                        icon={DollarSign}
                        label="Tipo de Pagamento"
                        value={property.tipo_pagamento}
                      />
                      <InfoField
                        icon={Calendar}
                        label="Período"
                        value={
                          property.data_inicio && property.data_termino
                            ? `${new Date(property.data_inicio).toLocaleDateString("pt-BR")} - ${new Date(property.data_termino).toLocaleDateString("pt-BR")}`
                            : null
                        }
                      />
                    </CardContent>
                  </Card>
                )}
              </TabsContent>

              <TabsContent value="improvements" className="p-6 m-0">
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">Benfeitorias</h3>
                    <Button
                      onClick={() => setShowImprovementForm(true)}
                      size="sm"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Adicionar Benfeitoria
                    </Button>
                  </div>

                  {improvements.length === 0 ? (
                    <EmptyState
                      icon={<Home className="h-8 w-8" />}
                      title="Nenhuma benfeitoria cadastrada"
                      description="Adicione as benfeitorias desta propriedade"
                      action={
                        <Button onClick={() => setShowImprovementForm(true)}>
                          <Plus className="h-4 w-4 mr-2" />
                          Adicionar Benfeitoria
                        </Button>
                      }
                    />
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {improvements.map((improvement) => (
                        <Card key={improvement.id}>
                          <CardContent className="pt-6">
                            <div className="space-y-2">
                              <h4 className="font-semibold">
                                {improvement.descricao}
                              </h4>
                              {improvement.dimensoes && (
                                <p className="text-sm text-muted-foreground">
                                  Dimensões: {improvement.dimensoes}
                                </p>
                              )}
                              <p className="text-lg font-semibold">
                                {formatCurrency(improvement.valor)}
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>

                {showImprovementForm && property && (
                  <ImprovementForm
                    open={showImprovementForm}
                    onOpenChange={setShowImprovementForm}
                    propertyId={property.id!}
                    organizationId={property.organizacao_id}
                    onSuccess={() => {
                      setShowImprovementForm(false);
                      // Recarregar benfeitorias
                    }}
                  />
                )}
              </TabsContent>

              <TabsContent value="leases" className="p-6 m-0">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">
                    Histórico de Arrendamentos
                  </h3>

                  {leases.length === 0 ? (
                    <EmptyState
                      icon={<FileText className="h-8 w-8" />}
                      title="Nenhum arrendamento cadastrado"
                      description="Esta propriedade não possui histórico de arrendamentos"
                    />
                  ) : (
                    <div className="space-y-4">
                      {leases.map((lease) => (
                        <LeaseCard
                          key={lease.id}
                          lease={lease}
                          propertyName={property.nome}
                          safras={safras}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </TabsContent>

              <TabsContent value="sicar" className="p-6 m-0">
                <div className="space-y-6">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        <TreePine className="h-4 w-4" />
                        Consulta SICAR - Cadastro Ambiental Rural
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {!property.numero_car ? (
                        <Alert>
                          <TreePine className="h-4 w-4" />
                          <AlertDescription>
                            Esta propriedade não possui número do CAR cadastrado. 
                            Você pode inserir o número abaixo e buscar os dados do SICAR.
                          </AlertDescription>
                        </Alert>
                      ) : (
                        <div className="flex items-center justify-between p-4 bg-muted/50 rounded-lg">
                          <div>
                            <p className="text-sm text-muted-foreground">Número do CAR</p>
                            <p className="font-medium">{property.numero_car}</p>
                          </div>
                          <Button
                            onClick={handleSicarSearch}
                            disabled={loadingSicar}
                            variant="outline"
                            size="sm"
                          >
                            {loadingSicar ? (
                              <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Buscando...
                              </>
                            ) : (
                              <>
                                <RefreshCw className="mr-2 h-4 w-4" />
                                Buscar Dados
                              </>
                            )}
                          </Button>
                        </div>
                      )}

                      {/* Formulário para inserir CAR se não houver */}
                      {!property.numero_car && (
                        <div className="space-y-4 pt-4">
                          <div className="flex gap-2">
                            <input
                              type="text"
                              placeholder="Digite o número do CAR"
                              className="flex-1 px-3 py-2 text-sm border rounded-md"
                              id="sicar-input"
                            />
                            <Button
                              onClick={() => {
                                const input = document.getElementById('sicar-input') as HTMLInputElement;
                                if (input?.value) {
                                  property.numero_car = input.value;
                                  handleSicarSearch();
                                }
                              }}
                              disabled={loadingSicar}
                              size="sm"
                            >
                              {loadingSicar ? (
                                <>
                                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                  Buscando...
                                </>
                              ) : (
                                <>
                                  <RefreshCw className="mr-2 h-4 w-4" />
                                  Buscar
                                </>
                              )}
                            </Button>
                          </div>
                        </div>
                      )}

                      {/* Exibir dados do SICAR */}
                      {sicarData && showSicarInfo && (
                        <div className="space-y-4 mt-6">
                          <div className="border-t pt-4">
                            <h4 className="font-semibold mb-4">Dados do SICAR</h4>
                            
                            {/* Resumo Visual de Áreas */}
                            <div className="mb-6 p-4 bg-muted/20 rounded-lg">
                              <div className="flex items-center justify-between mb-3">
                                <span className="text-sm font-medium">Distribuição da Propriedade</span>
                                <span className="text-xs text-muted-foreground">{formatArea(sicarData.area_imovel)}</span>
                              </div>
                              <div className="space-y-2">
                                <div className="relative h-8 bg-gray-200 rounded-full overflow-hidden">
                                  <div 
                                    className="absolute h-full bg-green-500" 
                                    style={{ width: `${sicarData.reserva_legal?.percentual || 0}%` }}
                                    title={`Reserva Legal: ${sicarData.reserva_legal?.percentual?.toFixed(2)}%`}
                                  />
                                  <div 
                                    className="absolute h-full bg-blue-500" 
                                    style={{ 
                                      left: `${sicarData.reserva_legal?.percentual || 0}%`,
                                      width: `${sicarData.app?.percentual || 0}%` 
                                    }}
                                    title={`APP: ${sicarData.app?.percentual?.toFixed(2)}%`}
                                  />
                                  <div 
                                    className="absolute h-full bg-orange-400" 
                                    style={{ 
                                      left: `${(sicarData.reserva_legal?.percentual || 0) + (sicarData.app?.percentual || 0)}%`,
                                      width: `${sicarData.area_cultivo?.percentual || 0}%` 
                                    }}
                                    title={`Área de Uso: ${sicarData.area_cultivo?.percentual?.toFixed(2)}%`}
                                  />
                                </div>
                                <div className="flex gap-4 text-xs">
                                  <div className="flex items-center gap-1">
                                    <div className="w-3 h-3 bg-green-500 rounded"></div>
                                    <span>RL {sicarData.reserva_legal?.percentual?.toFixed(1)}%</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <div className="w-3 h-3 bg-blue-500 rounded"></div>
                                    <span>APP {sicarData.app?.percentual?.toFixed(1)}%</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <div className="w-3 h-3 bg-orange-400 rounded"></div>
                                    <span>Uso {sicarData.area_cultivo?.percentual?.toFixed(1)}%</span>
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <div className="w-3 h-3 bg-gray-300 rounded"></div>
                                    <span>Outras</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            {/* Status e Informações Básicas */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                              <div>
                                <p className="text-sm text-muted-foreground">Status</p>
                                <Badge 
                                  variant={sicarData.situacao_imovel === "Ativo" ? "default" : "secondary"}
                                >
                                  {sicarData.situacao_imovel}
                                </Badge>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">Condição</p>
                                <p className="font-medium">{sicarData.condicao || "N/A"}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">Módulos Fiscais</p>
                                <p className="font-medium">{sicarData.modulos_fiscais?.toFixed(2) || "N/A"}</p>
                              </div>
                              <div>
                                <p className="text-sm text-muted-foreground">Data Registro</p>
                                <p className="font-medium">{sicarData.criacao || "N/A"}</p>
                              </div>
                            </div>

                            {/* Áreas */}
                            <div className="space-y-3">
                              <h5 className="font-medium text-sm">Distribuição de Áreas</h5>
                              <div className="space-y-2">
                                <div className="flex justify-between items-center p-3 bg-muted/30 rounded">
                                  <span className="text-sm">Área Total</span>
                                  <span className="font-medium">{formatArea(sicarData.area_imovel)}</span>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-green-50 rounded">
                                  <span className="text-sm">Reserva Legal</span>
                                  <div className="text-right">
                                    <p className="font-medium">{formatArea(sicarData.reserva_legal?.area || 0)}</p>
                                    <p className="text-xs text-muted-foreground">{sicarData.reserva_legal?.percentual?.toFixed(2)}%</p>
                                  </div>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-blue-50 rounded">
                                  <span className="text-sm">APP</span>
                                  <div className="text-right">
                                    <p className="font-medium">{formatArea(sicarData.app?.area || 0)}</p>
                                    <p className="text-xs text-muted-foreground">{sicarData.app?.percentual?.toFixed(2)}%</p>
                                  </div>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-orange-50 rounded">
                                  <span className="text-sm">Área de Uso</span>
                                  <div className="text-right">
                                    <p className="font-medium">{formatArea(sicarData.area_cultivo?.area || 0)}</p>
                                    <p className="text-xs text-muted-foreground">{sicarData.area_cultivo?.percentual?.toFixed(2)}%</p>
                                  </div>
                                </div>
                                <div className="flex justify-between items-center p-3 bg-purple-50 rounded">
                                  <span className="text-sm">Área Cultivável</span>
                                  <div className="text-right">
                                    <p className="font-medium">{formatArea(sicarData.area_cultivavel?.area || 0)}</p>
                                    <p className="text-xs text-muted-foreground">{sicarData.area_cultivavel?.percentual?.toFixed(2)}%</p>
                                  </div>
                                </div>
                              </div>
                            </div>

                            {/* Áreas Detalhadas APP */}
                            {(sicarData.area_preservacao_permanente_area_remanescente_vegetacao_nativa > 0 || 
                              sicarData.area_preservacao_permanente_area_rural_consolidada > 0) && (
                              <div className="mt-6 space-y-3">
                                <h5 className="font-medium text-sm">Detalhamento APP</h5>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {sicarData.area_preservacao_permanente_area_remanescente_vegetacao_nativa > 0 && (
                                    <div className="p-3 bg-green-50 rounded">
                                      <p className="text-sm text-muted-foreground">APP com Vegetação Nativa</p>
                                      <p className="font-medium text-green-700">
                                        {formatArea(sicarData.area_preservacao_permanente_area_remanescente_vegetacao_nativa)}
                                      </p>
                                    </div>
                                  )}
                                  {sicarData.area_preservacao_permanente_area_rural_consolidada > 0 && (
                                    <div className="p-3 bg-orange-50 rounded">
                                      <p className="text-sm text-muted-foreground">APP Área Rural Consolidada</p>
                                      <p className="font-medium text-orange-700">
                                        {formatArea(sicarData.area_preservacao_permanente_area_rural_consolidada)}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Detalhamento da Reserva Legal */}
                            {(sicarData.reserva_area_averbada > 0 || sicarData.reserva_area_nao_averbada > 0 || 
                              sicarData.reserva_area_legal_proposta > 0) && (
                              <div className="mt-6 space-y-3">
                                <h5 className="font-medium text-sm">Detalhamento Reserva Legal</h5>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  {sicarData.reserva_area_averbada > 0 && (
                                    <div className="p-3 bg-green-50 rounded">
                                      <p className="text-sm text-muted-foreground">Área Averbada</p>
                                      <p className="font-medium text-green-700">
                                        {formatArea(sicarData.reserva_area_averbada)}
                                      </p>
                                    </div>
                                  )}
                                  {sicarData.reserva_area_nao_averbada > 0 && (
                                    <div className="p-3 bg-yellow-50 rounded">
                                      <p className="text-sm text-muted-foreground">Área Não Averbada</p>
                                      <p className="font-medium text-yellow-700">
                                        {formatArea(sicarData.reserva_area_nao_averbada)}
                                      </p>
                                    </div>
                                  )}
                                  {sicarData.reserva_area_legal_proposta > 0 && (
                                    <div className="p-3 bg-blue-50 rounded">
                                      <p className="text-sm text-muted-foreground">Área Legal Proposta</p>
                                      <p className="font-medium text-blue-700">
                                        {formatArea(sicarData.reserva_area_legal_proposta)}
                                      </p>
                                    </div>
                                  )}
                                  {sicarData.reserva_justificativa && (
                                    <div className="p-3 bg-muted/30 rounded col-span-2">
                                      <p className="text-sm text-muted-foreground">Justificativa</p>
                                      <p className="font-medium">{sicarData.reserva_justificativa}</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Dados do Solo */}
                            {sicarData.solo && (
                              <div className="mt-6 space-y-3">
                                <h5 className="font-medium text-sm">Uso do Solo</h5>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                  <div className="p-3 bg-green-50 rounded">
                                    <p className="text-sm text-muted-foreground">Área Nativa</p>
                                    <p className="font-medium text-green-700">
                                      {formatArea(sicarData.solo.area_nativa || 0)}
                                    </p>
                                  </div>
                                  <div className="p-3 bg-orange-50 rounded">
                                    <p className="text-sm text-muted-foreground">Área de Uso</p>
                                    <p className="font-medium text-orange-700">
                                      {formatArea(sicarData.solo.area_uso || 0)}
                                    </p>
                                  </div>
                                  {sicarData.solo.area_servidao_administrativa > 0 && (
                                    <div className="p-3 bg-gray-50 rounded">
                                      <p className="text-sm text-muted-foreground">Servidão Administrativa</p>
                                      <p className="font-medium text-gray-700">
                                        {formatArea(sicarData.solo.area_servidao_administrativa)}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Regularidade Ambiental */}
                            {sicarData.regularidade_ambiental && (
                              <div className="mt-6 space-y-3">
                                <h5 className="font-medium text-sm">Regularidade Ambiental</h5>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="p-3 bg-muted/30 rounded">
                                    <p className="text-sm text-muted-foreground">Situação Reserva Legal</p>
                                    <p className="font-medium">{sicarData.reserva_situacao || "N/A"}</p>
                                  </div>
                                  {sicarData.regularidade_ambiental.area_reserva_legal_recompor > 0 && (
                                    <div className="p-3 bg-red-50 rounded">
                                      <p className="text-sm text-muted-foreground">RL a Recompor</p>
                                      <p className="font-medium text-red-700">
                                        {formatArea(sicarData.regularidade_ambiental.area_reserva_legal_recompor)}
                                      </p>
                                    </div>
                                  )}
                                  {sicarData.regularidade_ambiental.area_preservacao_permanente_recompor > 0 && (
                                    <div className="p-3 bg-red-50 rounded">
                                      <p className="text-sm text-muted-foreground">APP a Recompor</p>
                                      <p className="font-medium text-red-700">
                                        {formatArea(sicarData.regularidade_ambiental.area_preservacao_permanente_recompor)}
                                      </p>
                                    </div>
                                  )}
                                  {sicarData.regularidade_ambiental.passivo_excedente_reserva_legal !== 0 && (
                                    <div className={`p-3 rounded ${sicarData.regularidade_ambiental.passivo_excedente_reserva_legal > 0 ? 'bg-green-50' : 'bg-red-50'}`}>
                                      <p className="text-sm text-muted-foreground">
                                        {sicarData.regularidade_ambiental.passivo_excedente_reserva_legal > 0 ? 'Excedente RL' : 'Passivo RL'}
                                      </p>
                                      <p className={`font-medium ${sicarData.regularidade_ambiental.passivo_excedente_reserva_legal > 0 ? 'text-green-700' : 'text-red-700'}`}>
                                        {formatArea(Math.abs(sicarData.regularidade_ambiental.passivo_excedente_reserva_legal))}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Área de Uso Restrito */}
                            {sicarData.area_uso_restrito > 0 && (
                              <div className="mt-6 space-y-3">
                                <h5 className="font-medium text-sm">Outras Áreas</h5>
                                <div className="p-3 bg-yellow-50 rounded">
                                  <p className="text-sm text-muted-foreground">Área de Uso Restrito</p>
                                  <p className="font-medium text-yellow-700">
                                    {formatArea(sicarData.area_uso_restrito)}
                                  </p>
                                </div>
                              </div>
                            )}

                            {/* Coordenadas do Imóvel */}
                            {sicarData.coordenadas?.centro && (
                              <div className="mt-6 space-y-3">
                                <h5 className="font-medium text-sm">Localização</h5>
                                <div className="p-3 bg-muted/30 rounded">
                                  <p className="text-sm text-muted-foreground">Coordenadas Centrais</p>
                                  <p className="font-medium">
                                    Lat: {sicarData.coordenadas.centro[0]?.toFixed(6) || "N/A"}, 
                                    Lng: {sicarData.coordenadas.centro[1]?.toFixed(6) || "N/A"}
                                  </p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        ) : (
          <div className="p-6">
            <p className="text-center text-muted-foreground">
              Erro ao carregar dados da propriedade
            </p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
