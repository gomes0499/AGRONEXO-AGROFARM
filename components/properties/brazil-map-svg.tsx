"use client";

import { StatePropertyData } from "@/lib/actions/property-geo-stats-actions";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import { useState } from "react";

interface BrazilMapSvgProps {
  estadosData: StatePropertyData[];
  className?: string;
}

// URL do TopoJSON específico dos estados do Brasil
const BRAZIL_TOPOJSON = "https://raw.githubusercontent.com/codeforamerica/click_that_hood/master/public/data/brazil-states.geojson";

// Mapeamento de nomes de estados em português para siglas
const STATE_NAME_TO_CODE: Record<string, string> = {
  'ACRE': 'AC',
  'ALAGOAS': 'AL',
  'AMAPÁ': 'AP',
  'AMAZONAS': 'AM',
  'BAHIA': 'BA',
  'CEARÁ': 'CE',
  'DISTRITO FEDERAL': 'DF',
  'ESPÍRITO SANTO': 'ES',
  'GOIÁS': 'GO',
  'MARANHÃO': 'MA',
  'MATO GROSSO': 'MT',
  'MATO GROSSO DO SUL': 'MS',
  'MINAS GERAIS': 'MG',
  'PARÁ': 'PA',
  'PARAÍBA': 'PB',
  'PARANÁ': 'PR',
  'PERNAMBUCO': 'PE',
  'PIAUÍ': 'PI',
  'RIO DE JANEIRO': 'RJ',
  'RIO GRANDE DO NORTE': 'RN',
  'RIO GRANDE DO SUL': 'RS',
  'RONDÔNIA': 'RO',
  'RORAIMA': 'RR',
  'SANTA CATARINA': 'SC',
  'SÃO PAULO': 'SP',
  'SERGIPE': 'SE',
  'TOCANTINS': 'TO'
};

export function BrazilMapSvg({ estadosData, className }: BrazilMapSvgProps) {
  const [hoveredState, setHoveredState] = useState<string | null>(null);
  
  // Criar um map para acesso rápido aos dados por estado
  const estadosMap = new Map(estadosData.map(estado => [estado.estado, estado]));

  const getStateData = (geoProperties: any) => {
    // Tentar diferentes campos comuns em GeoJSON do Brasil
    const stateName = geoProperties.name?.toUpperCase() ||
                     geoProperties.NAME?.toUpperCase() ||
                     geoProperties.Name?.toUpperCase() ||
                     geoProperties.estado?.toUpperCase() ||
                     geoProperties.ESTADO?.toUpperCase();
    
    // Procurar correspondência por nome
    if (stateName) {
      const foundCode = STATE_NAME_TO_CODE[stateName];
      if (foundCode && estadosMap.has(foundCode)) {
        return estadosMap.get(foundCode);
      }
      
      // Tentar busca parcial
      for (const [fullName, code] of Object.entries(STATE_NAME_TO_CODE)) {
        if (stateName.includes(fullName) || fullName.includes(stateName)) {
          if (estadosMap.has(code)) {
            return estadosMap.get(code);
          }
        }
      }
    }
    
    return null;
  };

  const getStateFillColor = (geoProperties: any) => {
    const stateData = getStateData(geoProperties);
    
    if (stateData && stateData.totalPropriedades > 0) {
      return stateData.color;
    }
    
    return '#E2E8F0'; // Cor mais clara para estados sem dados
  };

  const getStateOpacity = (geoProperties: any) => {
    const stateData = getStateData(geoProperties);
    
    if (stateData && stateData.totalPropriedades > 0) {
      return hoveredState === stateData.estado ? 1 : 0.8;
    }
    
    return 0.7;
  };

  return (
    <div className={`w-full h-full flex items-center justify-center ${className}`}>
      <div className="w-full h-full max-w-md max-h-80 relative">
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{
            scale: 700,
            center: [-55, -15], // Centro do Brasil
          }}
          style={{
            width: "100%",
            height: "100%",
          }}
        >
          <Geographies geography={BRAZIL_TOPOJSON}>
            {({ geographies }) => {
              return geographies.map((geo) => {
                const stateData = getStateData(geo.properties);
                
                return (
                  <Geography
                    key={geo.rsmKey}
                    geography={geo}
                    fill={getStateFillColor(geo.properties)}
                    stroke="#94A3B8"
                    strokeWidth={0.5}
                    style={{
                      default: {
                        opacity: getStateOpacity(geo.properties),
                        transition: "all 0.2s",
                        cursor: stateData ? "pointer" : "default",
                      },
                      hover: {
                        opacity: 1,
                        filter: "brightness(1.1)",
                      },
                      pressed: {
                        opacity: 0.9,
                      },
                    }}
                    onMouseEnter={() => {
                      if (stateData) {
                        setHoveredState(stateData.estado);
                      }
                    }}
                    onMouseLeave={() => {
                      setHoveredState(null);
                    }}
                  />
                );
              });
            }}
          </Geographies>
        </ComposableMap>
        
        {/* Tooltip */}
        {hoveredState && estadosMap.has(hoveredState) && (
          <div className="absolute top-2 left-2 bg-black/80 text-white px-2 py-1 rounded text-xs pointer-events-none">
            {estadosMap.get(hoveredState)?.nomeEstado}: {estadosMap.get(hoveredState)?.totalPropriedades} propriedades
          </div>
        )}
        
      </div>
    </div>
  );
}