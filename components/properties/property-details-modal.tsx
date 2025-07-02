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

  if (!open) return null;

  const InfoField = ({ icon: Icon, label, value, className = "" }: any) => {
    if (!value && value !== 0) return null;

    return (
      <div className={`space-y-1 ${className}`}>
        <div className="flex items-center gap-2">
          <Icon className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">{label}</span>
        </div>
        <p className="font-medium pl-5">{value}</p>
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
                      label="Proprietário"
                      value={property.proprietario || "A informar"}
                    />
                    <InfoField
                      icon={FileText}
                      label="CAR"
                      value={property.numero_car}
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
