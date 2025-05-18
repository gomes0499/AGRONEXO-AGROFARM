"use client";

import { useEffect, useRef, useId } from "react";
import { cn } from "@/lib/utils";

interface LeafletMapProps {
  className?: string;
  center: [number, number];
  zoom?: number;
  geoJson?: any;
  mapType?: "satellite" | "osm" | "topographic" | "terrain" | "hybrid";
  marker?: [number, number]; // Coordenadas para um marcador único
}

export function LeafletMap({
  className,
  center,
  zoom = 13,
  geoJson,
  mapType = "osm",
  marker,
}: LeafletMapProps) {
  // Gerar um ID único para cada instância do componente
  // Isso ajuda a garantir que cada mapa seja um elemento único
  const mapId = useId();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const geoJsonLayerRef = useRef<any>(null);

  // Recrie o mapa do zero sempre que qualquer props mudar
  useEffect(() => {
    // Verificar se Leaflet está disponível
    if (
      !mapRef.current ||
      typeof window === "undefined" ||
      !(window as any).L
    ) {
      return;
    }

    const L = (window as any).L;

    // Limpar mapa anterior e camadas
    if (mapInstanceRef.current) {
      // Limpar todas as camadas primeiro
      if (geoJsonLayerRef.current) {
        geoJsonLayerRef.current.clearLayers();
        geoJsonLayerRef.current.remove();
        geoJsonLayerRef.current = null;
      }

      // Remover todos os event listeners e destruir o mapa
      mapInstanceRef.current.off();
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    // Inicializar o mapa
    const map = L.map(mapRef.current).setView(center, zoom);
    mapInstanceRef.current = map;

    // Escolher tipo de mapa
    if (mapType === "satellite") {
      // Mapa de satélite de alta resolução ESRI
      L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        {
          attribution:
            "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community",
        }
      ).addTo(map);
    } else if (mapType === "hybrid") {
      // Mapa híbrido (satélite com informações de ruas)
      // Primeiro adiciona o satélite como camada base
      L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
        {
          attribution:
            "Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community",
        }
      ).addTo(map);

      // Adiciona camada de rótulos e estradas por cima
      L.tileLayer(
        "https://stamen-tiles-{s}.a.ssl.fastly.net/toner-hybrid/{z}/{x}/{y}{r}.png",
        {
          attribution:
            'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          subdomains: "abcd",
          minZoom: 0,
          maxZoom: 20,
          opacity: 0.7,
        }
      ).addTo(map);
    } else if (mapType === "topographic") {
      // Mapa topográfico - ideal para áreas rurais com informações de relevo
      L.tileLayer(
        "https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}",
        {
          attribution:
            "Tiles &copy; Esri &mdash; Esri, DeLorme, NAVTEQ, TomTom, Intermap, iPC, USGS, FAO, NPS, NRCAN, GeoBase, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), and the GIS User Community",
        }
      ).addTo(map);
    } else if (mapType === "terrain") {
      // Mapa de terreno com sombreamento - bom para visualização de relevos
      L.tileLayer(
        "https://stamen-tiles-{s}.a.ssl.fastly.net/terrain/{z}/{x}/{y}{r}.png",
        {
          attribution:
            'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          subdomains: "abcd",
          minZoom: 0,
          maxZoom: 18,
        }
      ).addTo(map);
    } else {
      // Mapa padrão OpenStreetMap
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(map);
    }

    // Adiciona escala ao mapa
    L.control
      .scale({
        imperial: false,
        metric: true,
        position: "bottomright",
      })
      .addTo(map);

    // Adiciona controles de zoom com posição personalizada
    L.control
      .zoom({
        position: "topright",
      })
      .addTo(map);

    // Adicionar marcador único se fornecido
    if (marker) {
      // Criar um ícone personalizado para o marcador
      const customIcon = L.icon({
        iconUrl: "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png",
        iconRetinaUrl:
          "https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon-2x.png",
        shadowUrl:
          "https://unpkg.com/leaflet@1.7.1/dist/images/marker-shadow.png",
        iconSize: [25, 41], // tamanho do ícone
        iconAnchor: [12, 41], // ponto do ícone que corresponderá à localização do marcador
        popupAnchor: [1, -34], // ponto a partir do qual o popup deve abrir em relação ao iconAnchor
        shadowSize: [41, 41], // tamanho da sombra
      });

      // Adicionar o marcador ao mapa
      const markerInstance = L.marker(marker, { icon: customIcon })
        .addTo(map)
        .bindPopup("Localização do Escritório")
        .openPopup();
    }

    // Adicionar GeoJSON se fornecido
    if (geoJson) {
      try {
        // Limpar qualquer camada GeoJSON existente
        if (geoJsonLayerRef.current) {
          geoJsonLayerRef.current.clearLayers();
          geoJsonLayerRef.current.remove();
          geoJsonLayerRef.current = null;
        }

        // Função para estilizar os polígonos baseado no tipo
        const styleFunction = (feature: any) => {
          // Para FeatureCollection que contém múltiplos polígonos
          if (feature.properties && feature.properties.tipo) {
            if (feature.properties.tipo === "reserva") {
              return {
                color: "#10b981", // verde para reserva legal
                weight: 2,
                opacity: 0.9,
                fillColor: "#10b981",
                fillOpacity: 0.3,
                dashArray: "5, 5", // linha tracejada para reserva legal
              };
            } else if (feature.properties.tipo === "app") {
              return {
                color: "#0ea5e9", // azul para APPs
                weight: 2,
                opacity: 0.9,
                fillColor: "#0ea5e9",
                fillOpacity: 0.3,
              };
            } else if (feature.properties.tipo === "vegetacao") {
              return {
                color: "#16a34a", // verde escuro para vegetação nativa
                weight: 2,
                opacity: 0.9,
                fillColor: "#16a34a",
                fillOpacity: 0.3,
                dashArray: "3, 3", // linha tracejada fina para vegetação
              };
            } else if (feature.properties.tipo === "consolidada") {
              return {
                color: "#f59e0b", // amarelo âmbar para área consolidada
                weight: 2,
                opacity: 0.9,
                fillColor: "#f59e0b",
                fillOpacity: 0.3,
              };
            } else if (feature.properties.tipo === "cultivavel") {
              return {
                color: "#eab308", // amarelo para área cultivável
                weight: 2,
                opacity: 0.9,
                fillColor: "#fde047", // amarelo mais claro para o preenchimento
                fillOpacity: 0.5,
                dashArray: "10, 5", // linha tracejada larga para destacar área cultivável
              };
            } else if (feature.properties.tipo === "imovel") {
              return {
                color: "#4338ca", // roxo para área do imóvel
                weight: 3,
                opacity: 0.9,
                fillColor: "#4338ca",
                fillOpacity: 0.1,
              };
            } else {
              return {
                color: "#4338ca", // roxo padrão
                weight: 3, 
                opacity: 0.9,
                fillColor: "#4338ca",
                fillOpacity: 0.1,
              };
            }
          } else {
            // Estilo padrão para GeoJSON simples
            return {
              color: "#4338ca",
              weight: 3,
              opacity: 0.9,
              fillColor: "#4338ca",
              fillOpacity: 0.1,
            };
          }
        };

        // Função para adicionar rótulos e pop-ups
        const onEachFeature = (feature: any, layer: any) => {
          if (feature.properties && feature.properties.tipo) {
            let popupContent = "";

            if (feature.properties.tipo === "reserva") {
              popupContent = "<strong>Reserva Legal</strong>";
              if (feature.properties.area) {
                popupContent += `<br>Área: ${Number(feature.properties.area).toFixed(2).replace(".", ",")} ha`;
              }
            } else if (feature.properties.tipo === "app") {
              popupContent = "<strong>Área de Preservação Permanente</strong>";
              if (feature.properties.area) {
                popupContent += `<br>Área: ${Number(feature.properties.area).toFixed(2).replace(".", ",")} ha`;
              }
            } else if (feature.properties.tipo === "vegetacao") {
              popupContent = "<strong>Vegetação Nativa</strong>";
              if (feature.properties.area) {
                popupContent += `<br>Área: ${Number(feature.properties.area).toFixed(2).replace(".", ",")} ha`;
              }
            } else if (feature.properties.tipo === "consolidada") {
              popupContent = "<strong>Área Consolidada</strong>";
              if (feature.properties.area) {
                popupContent += `<br>Área: ${Number(feature.properties.area).toFixed(2).replace(".", ",")} ha`;
              }
            } else if (feature.properties.tipo === "cultivavel") {
              // Se temos informações sobre a área no próprio Feature
              if (feature.properties.area && feature.properties.percentual) {
                popupContent = `<strong>Área Cultivável</strong><br>
                                Área: ${Number(feature.properties.area)
                                  .toFixed(4)
                                  .replace(".", ",")} ha<br>
                                Percentual: ${feature.properties.percentual}`;
              } else {
                popupContent = "<strong>Área Cultivável</strong>";
              }
            } else if (feature.properties.tipo === "imovel") {
              popupContent = "<strong>Área do Imóvel Rural</strong>";
              if (feature.properties.car) {
                popupContent += `<br>CAR: ${feature.properties.car}`;
              }
              if (feature.properties.area) {
                popupContent += `<br>Área: ${Number(feature.properties.area).toFixed(4).replace(".", ",")} ha`;
              }
              if (feature.properties.municipio) {
                popupContent += `<br>Município: ${feature.properties.municipio}`;
              }
            }

            if (popupContent) {
              layer.bindPopup(popupContent);
              layer.on("mouseover", function (this: any) {
                this.openPopup();
              });
              layer.on("mouseout", function (this: any) {
                this.closePopup();
              });
            }
          }
        };

        // Criar nova camada GeoJSON
        const geoJsonLayer = L.geoJSON(geoJson, {
          style: styleFunction,
          onEachFeature: onEachFeature,
        });

        // Adicionar ao mapa
        geoJsonLayer.addTo(map);

        // Salvar referência
        geoJsonLayerRef.current = geoJsonLayer;

        // Zoom para os limites do GeoJSON
        if (geoJsonLayer.getBounds && geoJsonLayer.getBounds().isValid()) {
          map.fitBounds(geoJsonLayer.getBounds());
        }
      } catch (error) {
        console.error("Erro ao processar GeoJSON:", error);
      }
    }

    // Limpar na desmontagem
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [center, zoom, geoJson, mapType, marker]);

  return (
    <div
      id={`map-${mapId}`}
      ref={mapRef}
      className={cn("w-full h-[600px] rounded-md overflow-hidden", className)}
    />
  );
}
