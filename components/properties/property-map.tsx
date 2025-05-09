"use client";

import { useState, useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Loader2, MapPin, Search } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Property } from "@/schemas/properties";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { LeafletMap } from "@/components/properties/leaflet-map";

interface PropertyMapProps {
  property: Property;
}

// Interface para os dados do SICAR
interface SicarData {
  status: string;
  tipo: string;
  area_imovel: number;
  modulos_fiscais: number;
  app: number;
  reserva_legal: number;
  vegetacao_nativa: number;
  uso_consolidado: number;
  poligono: any; // GeoJSON
}

export function PropertyMap({ property }: PropertyMapProps) {
  const [carNumber, setCarNumber] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sicarData, setSicarData] = useState<SicarData | null>(null);
  const [mapTab, setMapTab] = useState("satellite");
  const mapRef = useRef<HTMLDivElement>(null);
  const [mapInitialized, setMapInitialized] = useState(false);

  // Função para buscar dados do SICAR
  const fetchSicarData = async () => {
    if (!carNumber.trim()) {
      setError("Por favor, informe o número do CAR");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Chamar a API que criamos
      const response = await fetch(`/api/sicar?car=${encodeURIComponent(carNumber)}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Erro ao buscar dados do SICAR");
      }
      
      const data = await response.json();
      setSicarData(data);
      initializeMap();
    } catch (err) {
      console.error("Erro ao buscar dados do SICAR:", err);
      setError("Não foi possível obter os dados do SICAR. Verifique o número informado e tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  // Função para inicializar o mapa quando os dados do SICAR forem carregados
  const initializeMap = () => {
    if (!sicarData) return;
    setMapInitialized(true);
  };

  // Pré-preencher o número do CAR se a propriedade tiver o campo
  useEffect(() => {
    if (property.numeroMatricula) {
      setCarNumber(property.numeroMatricula);
    }
  }, [property]);

  // Recria o mapa quando a aba de mapa mudar
  useEffect(() => {
    if (sicarData) {
      setMapInitialized(false);
      setTimeout(() => {
        initializeMap();
      }, 100);
    }
  }, [mapTab]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-xl">Dados do CAR/SICAR</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="flex-1">
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
                <div className="flex justify-between items-center">
                  <div>
                    <Badge 
                      variant={sicarData.status === "ATIVO" ? "outline" : "destructive"}
                      className="mb-2"
                    >
                      Status: {sicarData.status}
                    </Badge>
                    <h3 className="text-lg font-medium">
                      {property.nome}
                    </h3>
                    <p className="text-muted-foreground flex items-center text-sm">
                      <MapPin className="h-3.5 w-3.5 mr-1" />
                      {property.cidade}, {property.estado}
                    </p>
                  </div>
                  
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Área Total</p>
                    <p className="text-lg font-medium">{sicarData.area_imovel.toLocaleString('pt-BR')} ha</p>
                    <p className="text-xs text-muted-foreground">{sicarData.modulos_fiscais.toLocaleString('pt-BR')} módulos fiscais</p>
                  </div>
                </div>

                <Tabs defaultValue={mapTab} onValueChange={setMapTab} className="w-full">
                  <div className="flex justify-between items-center mb-3">
                    <TabsList>
                      <TabsTrigger value="satellite">Satélite</TabsTrigger>
                      <TabsTrigger value="map">Mapa</TabsTrigger>
                    </TabsList>
                  </div>
                  
                  <TabsContent value="satellite" className="m-0">
                    {sicarData.coordenadas?.centro ? (
                      <LeafletMap
                        center={sicarData.coordenadas.centro}
                        zoom={14}
                        geoJson={sicarData.poligono}
                        mapType="satellite"
                      />
                    ) : (
                      <div className="w-full h-[400px] bg-gray-100 rounded-md flex items-center justify-center">
                        <p className="text-secondary-foreground">
                          Dados de coordenadas não disponíveis para esta propriedade.
                        </p>
                      </div>
                    )}
                  </TabsContent>
                  
                  <TabsContent value="map" className="m-0">
                    {sicarData.coordenadas?.centro ? (
                      <LeafletMap
                        center={sicarData.coordenadas.centro}
                        zoom={14}
                        geoJson={sicarData.poligono}
                        mapType="map"
                      />
                    ) : (
                      <div className="w-full h-[400px] bg-gray-100 rounded-md flex items-center justify-center">
                        <p className="text-secondary-foreground">
                          Dados de coordenadas não disponíveis para esta propriedade.
                        </p>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
                  <Card className="border-primary/20">
                    <CardHeader className="p-3 pb-0">
                      <CardTitle className="text-sm font-medium">Reserva Legal</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 pt-0">
                      <p className="text-lg font-semibold">{sicarData.reserva_legal.toLocaleString('pt-BR')} ha</p>
                      <p className="text-xs text-muted-foreground">
                        {((sicarData.reserva_legal / sicarData.area_imovel) * 100).toFixed(1)}% da área total
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-primary/20">
                    <CardHeader className="p-3 pb-0">
                      <CardTitle className="text-sm font-medium">APP</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 pt-0">
                      <p className="text-lg font-semibold">{sicarData.app.toLocaleString('pt-BR')} ha</p>
                      <p className="text-xs text-muted-foreground">
                        {((sicarData.app / sicarData.area_imovel) * 100).toFixed(1)}% da área total
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-primary/20">
                    <CardHeader className="p-3 pb-0">
                      <CardTitle className="text-sm font-medium">Vegetação Nativa</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 pt-0">
                      <p className="text-lg font-semibold">{sicarData.vegetacao_nativa.toLocaleString('pt-BR')} ha</p>
                      <p className="text-xs text-muted-foreground">
                        {((sicarData.vegetacao_nativa / sicarData.area_imovel) * 100).toFixed(1)}% da área total
                      </p>
                    </CardContent>
                  </Card>
                  
                  <Card className="border-primary/20">
                    <CardHeader className="p-3 pb-0">
                      <CardTitle className="text-sm font-medium">Uso Consolidado</CardTitle>
                    </CardHeader>
                    <CardContent className="p-3 pt-0">
                      <p className="text-lg font-semibold">{sicarData.uso_consolidado.toLocaleString('pt-BR')} ha</p>
                      <p className="text-xs text-muted-foreground">
                        {((sicarData.uso_consolidado / sicarData.area_imovel) * 100).toFixed(1)}% da área total
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}