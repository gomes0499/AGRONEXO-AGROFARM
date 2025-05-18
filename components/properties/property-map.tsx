"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  AlertCircle,
  AlertTriangle,
  Loader2,
  MapPin,
  Search,
  Info,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import type { Property } from "@/schemas/properties";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LeafletMap } from "@/components/properties/leaflet-map";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PropertyMapProps {
  property: Property;
}

// Interface para os dados do SICAR
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
  nome_imovel?: string;
  situacao_imovel?: string;
  classe_imovel?: string;

  // Áreas com geometria
  poligono_imovel: {
    type: string;
    geometry: {
      type: string;
      coordinates: any; // Pode ser Polygon ou MultiPolygon
    };
  };
  reserva_legal: {
    area: number;
    percentual: number;
    poligono: {
      type: string;
      geometry: {
        type: string;
        coordinates: any; // Pode ser Polygon ou MultiPolygon
      };
    };
  };
  app: {
    area: number;
    percentual: number;
    poligono: {
      type: string;
      geometry: {
        type: string;
        coordinates: any; // Pode ser Polygon ou MultiPolygon
      };
    };
  };

  // Áreas sem geometria
  area_cultivo?: {
    area: number;
    percentual: number;
    poligono: null;
  };
  area_protegida?: {
    area: number;
    percentual: number;
    poligono: null;
  };
  // Área cultivável calculada
  area_cultivavel?: {
    area: number;
    percentual: number;
    poligono: {
      type: string;
      properties: {
        tipo: string;
        area: number;
        percentual: string;
      };
      geometry: {
        type: string;
        coordinates: any;
      };
    } | null;
  };
  // Solo - dados do demonstrativo
  solo?: {
    area_nativa: number;
    area_uso: number;
    area_servidao_administrativa: number;
  };

  // Campos específicos da API InfoSimples
  area_preservacao_permanente?: number;
  area_preservacao_permanente_area_remanescente_vegetacao_nativa?: number;
  area_preservacao_permanente_area_rural_consolidada?: number;
  area_uso_restrito?: number;
  regularidade_ambiental?: {
    passivo_excedente_reserva_legal: number;
    area_reserva_legal_recompor: number;
    area_preservacao_permanente_recompor: number;
  };
  reserva_situacao?: string;
  reserva_justificativa?: string | null;
  reserva_area_averbada?: number;
  reserva_area_nao_averbada?: number;
  reserva_area_legal_proposta?: number;
  reserva_area_legal_declarada?: number;
  
  // Coordenadas
  coordenadas: {
    centro: [number, number];
  };

  // Estatísticas gerais
  estatisticas?: {
    percentual_ocupacao: number;
    area_cultivavel_teorica: number;
  };
}

export function PropertyMap({ property }: PropertyMapProps) {
  const [carNumber, setCarNumber] = useState("");
  const [estadoSelecionado, setEstadoSelecionado] = useState(
    property.estado || ""
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sicarData, setSicarData] = useState<SicarData | null>(null);
  const [mapTab, setMapTab] = useState("satellite");
  const [mapLayer, setMapLayer] = useState<
    "imovel" | "reserva" | "app" | "hidrica" | "cultivavel" | "completo"
  >("completo");
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapInitialized, setMapInitialized] = useState(false);
  const [autoCarregado, setAutoCarregado] = useState(false);

  // Função para buscar dados do SICAR
  const fetchSicarData = async () => {
    if (!carNumber.trim()) {
      setError("Por favor, informe o número do CAR");
      return;
    }

    if (!estadoSelecionado) {
      setError("Por favor, selecione o estado da propriedade");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Chamar a API que atualizamos para buscar os dados do CAR
      const response = await fetch(
        `/api/sicar?car=${encodeURIComponent(
          carNumber
        )}&estado=${estadoSelecionado}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao buscar dados do SICAR");
      }

      const data = await response.json();
      setSicarData(data);
      initializeMap();
    } catch (err: any) {
      console.error("Erro ao buscar dados do SICAR:", err);
      setError(
        err.message ||
          "Não foi possível obter os dados do SICAR. Verifique o número e estado informados e tente novamente."
      );
    } finally {
      setLoading(false);
    }
  };

  // Função para inicializar o mapa quando os dados do SICAR forem carregados
  const initializeMap = () => {
    if (!sicarData) return;
    setMapInitialized(true);
  };

  // Função para buscar dados do SICAR sem depender do estado interno
  const fetchSicarDataWithParams = async (car: string, estado: string) => {
    if (!car || !estado) return;

    setLoading(true);
    setError(null);

    try {
      // Chamar a API que atualizamos para buscar os dados do CAR
      const response = await fetch(
        `/api/sicar?car=${encodeURIComponent(car)}&estado=${estado}`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao buscar dados do SICAR");
      }

      const data = await response.json();
      setSicarData(data);
      initializeMap();
    } catch (err: any) {
      console.error("Erro ao buscar dados do SICAR:", err);
      setError(
        err.message ||
          "Não foi possível obter os dados do SICAR. Verifique o número e estado informados e tente novamente."
      );
    } finally {
      setLoading(false);
    }
  };

  // Pré-preencher o número do CAR e carregar automaticamente quando a página carrega
  useEffect(() => {
    if (!autoCarregado && property.numero_car && property.estado) {
      setCarNumber(property.numero_car);
      setEstadoSelecionado(property.estado);
      setAutoCarregado(true);

      // Carregar automaticamente os dados do CAR
      fetchSicarDataWithParams(property.numero_car, property.estado);
    } else if (property.numero_car) {
      // Se só tivermos o CAR, pelo menos preencher o campo
      setCarNumber(property.numero_car);
    }
  }, [property, autoCarregado]);

  // Recria o mapa quando a aba de mapa ou camada mudar
  useEffect(() => {
    if (sicarData) {
      // Forçar a recriação do mapa ao mudar a camada ou o tipo de mapa
      setMapInitialized(false);

      // Pequeno timeout para garantir que a UI esteja pronta para reconstruir o mapa
      const timer = setTimeout(() => {
        initializeMap();
      }, 100);

      // Limpar o timer se o componente for desmontado
      return () => clearTimeout(timer);
    }
  }, [mapTab, mapLayer]);

  // Função para obter o GeoJSON apropriado com base na camada selecionada
  const getGeoJsonForLayer = () => {
    if (!sicarData) return null;

    // Camada apenas do imóvel
    if (mapLayer === "imovel") {
      return {
        type: "FeatureCollection",
        features: [
          {
            ...sicarData.poligono_imovel,
            properties: { 
              tipo: "imovel",
              car: sicarData.car,
              area: sicarData.area_imovel,
              municipio: sicarData.municipio,
              estado: sicarData.estado
            },
          },
        ],
      };
    }
    // Camada apenas da reserva legal
    else if (mapLayer === "reserva") {
      return {
        type: "FeatureCollection",
        features: [
          {
            ...sicarData.reserva_legal.poligono,
            properties: { 
              tipo: "reserva",
              area: sicarData.reserva_legal.area,
              percentual: sicarData.reserva_legal.percentual
            },
          },
        ],
      };
    }
    // Camada apenas da APP/Hidrografia
    else if (mapLayer === "app" || mapLayer === "hidrica") {
      return {
        type: "FeatureCollection",
        features: [
          {
            ...sicarData.app.poligono,
            properties: { 
              tipo: "app",
              area: sicarData.app.area,
              percentual: sicarData.app.percentual
            },
          },
        ],
      };
    }
    // Camada apenas da área cultivável
    else if (mapLayer === "cultivavel" && sicarData.area_cultivavel?.poligono) {
      return {
        type: "FeatureCollection",
        features: [sicarData.area_cultivavel.poligono],
      };
    }
    // Para 'completo', retornamos um FeatureCollection com todos os polígonos disponíveis
    else {
      // Incluímos todos os polígonos que temos geometrias
      const features = [
        {
          ...sicarData.poligono_imovel,
          properties: { 
            tipo: "imovel",
            car: sicarData.car,
            area: sicarData.area_imovel,
            municipio: sicarData.municipio,
            estado: sicarData.estado
          },
        },
        {
          ...sicarData.reserva_legal.poligono,
          properties: { 
            tipo: "reserva",
            area: sicarData.reserva_legal.area,
            percentual: sicarData.reserva_legal.percentual
          },
        },
        {
          ...sicarData.app.poligono,
          properties: { 
            tipo: "app",
            area: sicarData.app.area,
            percentual: sicarData.app.percentual
          },
        },
      ];

      // Adicionar área cultivável se disponível
      if (sicarData.area_cultivavel?.poligono) {
        features.push(sicarData.area_cultivavel.poligono);
      }

      return {
        type: "FeatureCollection",
        features,
      };
    }
  };

  // Lista de estados brasileiros
  const ESTADOS = [
    "AC",
    "AL",
    "AP",
    "AM",
    "BA",
    "CE",
    "DF",
    "ES",
    "GO",
    "MA",
    "MT",
    "MS",
    "MG",
    "PA",
    "PB",
    "PR",
    "PE",
    "PI",
    "RJ",
    "RN",
    "RS",
    "RO",
    "RR",
    "SC",
    "SP",
    "SE",
    "TO",
  ];

  // Renderiza os cards de resumo com os dados do SICAR
  const renderPropertyCards = () => {
    if (!sicarData) return null;

    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-6">
            <h3 className="text-sm font-medium text-gray-500">Área Total</h3>
            <p className="text-2xl font-bold mt-1">
              {Number(sicarData.area_imovel || 0)
                .toFixed(2)
                .replace(".", ",")}{" "}
              ha
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h3 className="text-sm font-medium text-gray-500">
              Área Cultivável
            </h3>
            <p className="text-2xl font-bold mt-1 ">
              {Number(String(sicarData.area_cultivavel?.area || 0))
                .toFixed(2)
                .replace(".", ",")}{" "}
              ha
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h3 className="text-sm font-medium text-gray-500">Reserva Legal</h3>
            <p className="text-2xl font-bold mt-1 ">
              {Number(String(sicarData.reserva_legal?.area || 0))
                .toFixed(2)
                .replace(".", ",")}{" "}
              ha
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <h3 className="text-sm font-medium text-gray-500">Cultivo Ativo</h3>
            <p className="text-2xl font-bold mt-1 ">
              {Number(String(sicarData.area_cultivo?.area || 0))
                .toFixed(2)
                .replace(".", ",")}{" "}
              ha
            </p>
          </CardContent>
        </Card>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Cards de resumo no topo quando os dados estiverem disponíveis */}
      {sicarData && renderPropertyCards()}

      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Dados do CAR/SICAR</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {property.numero_car ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <Info size={16} />
                <p>
                  Esta propriedade possui o número CAR:{" "}
                  <span className="font-medium">{property.numero_car}</span>
                </p>
                {loading && <Loader2 className="h-4 w-4 animate-spin ml-2" />}
              </div>
            ) : (
              <Alert variant="default" className="mb-2">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Informação</AlertTitle>
                <AlertDescription>
                  Esta propriedade não possui um número CAR registrado. Adicione
                  o número CAR nas informações da propriedade para facilitar a
                  consulta automática.
                </AlertDescription>
              </Alert>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="flex-1">
                <Label htmlFor="estado-select">Estado</Label>
                <Select
                  value={estadoSelecionado}
                  onValueChange={setEstadoSelecionado}
                >
                  <SelectTrigger id="estado-select" className="mt-1.5">
                    <SelectValue placeholder="Selecione o estado" />
                  </SelectTrigger>
                  <SelectContent>
                    {ESTADOS.map((estado) => (
                      <SelectItem key={estado} value={estado}>
                        {estado}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="sm:col-span-2">
                <Label htmlFor="car-number">Número do CAR</Label>
                <div className="flex mt-1.5">
                  <Input
                    id="car-number"
                    placeholder="Digite o número do CAR"
                    value={carNumber}
                    onChange={(e) => setCarNumber(e.target.value)}
                    className="rounded-r-none"
                  />
                  <Button
                    onClick={fetchSicarData}
                    disabled={loading}
                    className="rounded-l-none"
                  >
                    {loading ? (
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    ) : (
                      <Search className="h-4 w-4 mr-2" />
                    )}
                    Buscar
                  </Button>
                </div>
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Erro</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {loading && (
              <div className="space-y-2">
                <Skeleton className="h-[300px] w-full rounded-md" />
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <Skeleton className="h-[60px] rounded-md" />
                  <Skeleton className="h-[60px] rounded-md" />
                  <Skeleton className="h-[60px] rounded-md" />
                  <Skeleton className="h-[60px] rounded-md" />
                </div>
              </div>
            )}

            {sicarData && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-6">
                  <div>
                    <Badge
                      variant={
                        sicarData.status === "AT" ? "outline" : "secondary"
                      }
                      className="mb-2"
                    >
                      Status:{" "}
                      {sicarData.status === "AT" ? "ATIVO" : sicarData.status}
                    </Badge>
                    <h3 className="text-lg font-medium">
                      {sicarData.nome_imovel || property.nome}
                    </h3>
                    <p className="text-muted-foreground flex items-center text-sm">
                      <MapPin className="h-3.5 w-3.5 mr-1" />
                      {sicarData.municipio || property.cidade},{" "}
                      {sicarData.estado || property.estado}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Condição: {sicarData.condicao || "-"}
                    </p>
                    {sicarData.situacao_imovel && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Situação: {sicarData.situacao_imovel}
                      </p>
                    )}
                    {sicarData.classe_imovel && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Classe: {sicarData.classe_imovel}
                      </p>
                    )}
                    {property.cartorio_registro && (
                      <p className="text-xs text-muted-foreground mt-1">
                        CRI: {property.cartorio_registro}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      Matrícula: {property.numero_matricula || "Não informado"}
                    </p>
                  </div>

                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium">Área Total</p>
                    <p className="text-2xl font-semibold">
                      {Number(sicarData.area_imovel || 0)
                        .toFixed(2)
                        .replace(".", ",")}{" "}
                      ha
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {Number(String(sicarData.modulos_fiscais || 0))
                        .toFixed(2)
                        .replace(".", ",")}{" "}
                      módulos fiscais
                    </p>

                    <div className="mt-2">
                      <p className="text-sm font-medium">Reserva Legal</p>
                      <p className="text-base">
                        {Number(String(sicarData.reserva_legal?.area || 0))
                          .toFixed(2)
                          .replace(".", ",")}{" "}
                        ha
                      </p>
                      {/* Mostrar o percentual exato da Reserva Legal que vem da API */}
                      <div className="flex items-center gap-1">
                        <p className="text-xs text-muted-foreground">
                          {(() => {
                            // Usamos parseFloat para garantir que estamos trabalhando com um número
                            const percentual =
                              sicarData.reserva_legal?.percentual;
                            const percentualDecimal =
                              percentual !== undefined
                                ? Number.parseFloat(String(percentual))
                                : 0;
                            // Não multiplicar por 100, pois o valor já está em porcentagem
                            return percentualDecimal
                              .toFixed(2)
                              .replace(".", ",");
                          })()}
                          % da área total
                        </p>
                      </div>
                    </div>

                    {/* Recursos Hídricos (APP) */}
                    <div className="mt-2">
                      <p className="text-sm font-medium">Recursos Hídricos</p>
                      <p className="text-base">
                        {Number(String(sicarData.app.area || 0))
                          .toFixed(2)
                          .replace(".", ",")}{" "}
                        ha
                      </p>
                      <div className="flex items-center gap-1">
                        <p className="text-xs text-muted-foreground">
                          {Number(String(sicarData.app.percentual || 0))
                            .toFixed(2)
                            .replace(".", ",")}
                          % da área total
                        </p>
                      </div>
                    </div>

                    {/* Área Protegida Total */}
                    {sicarData.area_protegida && (
                      <div className="mt-2">
                        <p className="text-sm font-medium">
                          Área Protegida Total
                        </p>
                        <p className="text-base">
                          {Number(String(sicarData.area_protegida.area || 0))
                            .toFixed(2)
                            .replace(".", ",")}{" "}
                          ha
                        </p>
                        <div className="flex items-center gap-1">
                          <p className="text-xs text-muted-foreground">
                            {Number(
                              String(sicarData.area_protegida.percentual || 0)
                            )
                              .toFixed(2)
                              .replace(".", ",")}
                            % da área total
                          </p>
                        </div>
                      </div>
                    )}
                    
                    {/* Vegetação Nativa (se disponível do InfoSimples) */}
                    {sicarData.area_preservacao_permanente_area_remanescente_vegetacao_nativa && (
                      <div className="mt-2">
                        <p className="text-sm font-medium">
                          Vegetação Nativa Remanescente
                        </p>
                        <p className="text-base">
                          {Number(String(sicarData.area_preservacao_permanente_area_remanescente_vegetacao_nativa || 0))
                            .toFixed(2)
                            .replace(".", ",")}{" "}
                          ha
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="sm:text-right">
                    <p className="text-sm font-medium">Informações do CAR</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Código CAR:{" "}
                      <span className="font-medium">{sicarData.car}</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Criado em: {sicarData.criacao || "-"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Atualizado em: {sicarData.atualizacao || "-"}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Tipo: {sicarData.tipo || "-"}
                    </p>

                    {/* Informações de regularidade ambiental */}
                    {sicarData.regularidade_ambiental && (
                      <div className="mt-4 text-left sm:text-right">
                        <p className="text-sm font-medium">Regularidade Ambiental</p>
                        {sicarData.reserva_situacao && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Situação da Reserva: <span className="font-medium">{sicarData.reserva_situacao}</span>
                          </p>
                        )}
                        {sicarData.regularidade_ambiental.area_reserva_legal_recompor > 0 && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Reserva a Recompor: {sicarData.regularidade_ambiental.area_reserva_legal_recompor.toFixed(2).replace('.', ',')} ha
                          </p>
                        )}
                        {sicarData.regularidade_ambiental.area_preservacao_permanente_recompor > 0 && (
                          <p className="text-xs text-muted-foreground mt-1">
                            APP a Recompor: {sicarData.regularidade_ambiental.area_preservacao_permanente_recompor.toFixed(2).replace('.', ',')} ha
                          </p>
                        )}
                        {sicarData.reserva_area_averbada > 0 && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Reserva Averbada: {sicarData.reserva_area_averbada.toFixed(2).replace('.', ',')} ha
                          </p>
                        )}
                      </div>
                    )}

                    {/* Informações de cultivo */}
                    <div className="mt-4 text-left sm:text-right">
                      <p className="text-sm font-medium">Áreas Agricultáveis</p>

                      {/* Área Cultivável Calculada */}
                      {sicarData.area_cultivavel && (
                        <div className="mt-1">
                          <p className="text-base font-semibold text-emerald-600">
                            Área Cultivável:{" "}
                            {Number(String(sicarData.area_cultivavel.area || 0))
                              .toFixed(2)
                              .replace(".", ",")}{" "}
                            ha
                          </p>
                          <div className="flex items-center gap-1 justify-end">
                            <p className="text-xs text-muted-foreground">
                              {Number(
                                String(
                                  sicarData.area_cultivavel.percentual || 0
                                )
                              )
                                .toFixed(2)
                                .replace(".", ",")}
                              % da área total
                            </p>
                          </div>
                          <p className="text-xs text-muted-foreground mt-1 italic">
                            (Cálculo: Área total - (RL + APP + Uso Restrito +
                            Vegetação Nativa))
                          </p>
                        </div>
                      )}

                      {/* Área de Cultivo Ativa */}
                      {sicarData.area_cultivo && (
                        <div className="mt-2">
                          <p className="text-base">
                            <span className="font-medium">Cultivo Ativo:</span>{" "}
                            {Number(String(sicarData.area_cultivo.area || 0))
                              .toFixed(2)
                              .replace(".", ",")}{" "}
                            ha
                          </p>
                          <div className="flex items-center gap-1 justify-end">
                            <p className="text-xs text-muted-foreground">
                              {Number(
                                String(sicarData.area_cultivo.percentual || 0)
                              )
                                .toFixed(2)
                                .replace(".", ",")}
                              % da área total
                            </p>
                          </div>
                        </div>
                      )}


                      {/* Ocupação e Área Cultivável */}
                      {sicarData.estatisticas && (
                        <div className="mt-2 text-xs text-muted-foreground">
                          <p>
                            Percentual de ocupação:{" "}
                            {Number(sicarData.estatisticas.percentual_ocupacao)
                              .toFixed(2)
                              .replace(".", ",")}
                            %
                          </p>
                          <p>
                            Área cultivável:{" "}
                            {Number(
                              sicarData.estatisticas.area_cultivavel_teorica
                            )
                              .toFixed(2)
                              .replace(".", ",")}
                            ha
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <Tabs
                  defaultValue={mapTab}
                  onValueChange={setMapTab}
                  className="w-full"
                >
                  <div className="flex justify-between items-center mb-3">
                    <TabsList className="grid grid-cols-2 w-[220px]">
                      <TabsTrigger value="satellite">Satélite</TabsTrigger>
                      <TabsTrigger value="osm">Mapa</TabsTrigger>
                    </TabsList>
                    <div className="flex">
                      <Select
                        value={mapLayer}
                        onValueChange={(v) => setMapLayer(v as any)}
                      >
                        <SelectTrigger className="h-9 w-auto">
                          <SelectValue placeholder="Camadas" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="completo">
                            Todas as camadas
                          </SelectItem>
                          <SelectItem value="imovel">Área do imóvel</SelectItem>
                          <SelectItem value="reserva">Reserva legal</SelectItem>
                          <SelectItem value="app">Recursos hídricos</SelectItem>
                          {sicarData?.area_cultivavel && (
                            <SelectItem value="cultivavel">
                              Área cultivável
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Mapa do tipo satélite */}
                  <TabsContent value="satellite" className="m-0">
                    {sicarData.coordenadas?.centro ? (
                      <LeafletMap
                        center={sicarData.coordenadas.centro}
                        zoom={14}
                        geoJson={getGeoJsonForLayer()}
                        mapType="satellite"
                      />
                    ) : (
                      <div className="w-full h-[600px] bg-gray-100 rounded-md flex items-center justify-center">
                        <p className="text-secondary-foreground">
                          Dados de coordenadas não disponíveis para esta
                          propriedade.
                        </p>
                      </div>
                    )}
                  </TabsContent>

                  {/* Mapa padrão OpenStreetMap */}
                  <TabsContent value="osm" className="m-0">
                    {sicarData.coordenadas?.centro ? (
                      <LeafletMap
                        center={sicarData.coordenadas.centro}
                        zoom={14}
                        geoJson={getGeoJsonForLayer()}
                        mapType="osm"
                      />
                    ) : (
                      <div className="w-full h-[600px] bg-gray-100 rounded-md flex items-center justify-center">
                        <p className="text-secondary-foreground">
                          Dados de coordenadas não disponíveis para esta
                          propriedade.
                        </p>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
