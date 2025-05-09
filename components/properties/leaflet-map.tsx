"use client";

import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface LeafletMapProps {
  className?: string;
  center: [number, number];
  zoom?: number;
  geoJson?: any;
  mapType?: "satellite" | "map";
}

export function LeafletMap({ 
  className, 
  center, 
  zoom = 13, 
  geoJson,
  mapType = "map" 
}: LeafletMapProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const geoJsonLayerRef = useRef<any>(null);

  useEffect(() => {
    // Verificar se Leaflet está disponível
    if (!mapRef.current || typeof window === 'undefined' || !(window as any).L) {
      return;
    }

    const L = (window as any).L;
    
    // Limpar mapa anterior se existir
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    // Inicializar o mapa
    const map = L.map(mapRef.current).setView(center, zoom);
    mapInstanceRef.current = map;

    // Escolher tipo de mapa
    if (mapType === "satellite") {
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
      }).addTo(map);
    } else {
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(map);
    }

    // Adicionar GeoJSON se fornecido
    if (geoJson) {
      try {
        const geoJsonLayer = L.geoJSON(geoJson, {
          style: {
            color: "#4338ca",
            weight: 2,
            opacity: 0.8,
            fillColor: "#4338ca",
            fillOpacity: 0.2
          }
        }).addTo(map);
        
        geoJsonLayerRef.current = geoJsonLayer;
        
        // Zoom para os limites do GeoJSON
        map.fitBounds(geoJsonLayer.getBounds());
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
  }, [center, zoom, geoJson, mapType]);

  return (
    <div 
      ref={mapRef} 
      className={cn("w-full h-[400px] rounded-md overflow-hidden", className)}
    />
  );
}