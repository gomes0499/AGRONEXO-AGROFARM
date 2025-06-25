"use client";

import { StatePropertyData } from "@/lib/actions/property-geo-stats-actions";
import { ComposableMap, Geographies, Geography, Annotation } from "react-simple-maps";
import { useState } from "react";
import { formatNumber } from "@/lib/utils/formatters";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface BrazilStatesMapProps {
  estadosData: StatePropertyData[];
  className?: string;
}

// URL para o TopoJSON dos estados brasileiros
const BRAZIL_STATES_TOPO = "https://raw.githubusercontent.com/codeforamerica/click_that_hood/master/public/data/brazil-states.geojson";

// Coordenadas centrais dos estados para labels
const STATE_CENTERS: Record<string, [number, number]> = {
  AC: [-70.55, -9.02],
  AL: [-36.62, -9.57],
  AP: [-51.77, 1.41],
  AM: [-64.70, -4.03],
  BA: [-41.70, -12.54],
  CE: [-39.32, -5.20],
  DF: [-47.86, -15.78],
  ES: [-40.34, -19.71],
  GO: [-49.31, -15.98],
  MA: [-44.30, -5.42],
  MT: [-55.42, -12.64],
  MS: [-54.54, -20.51],
  MG: [-44.38, -18.10],
  PA: [-52.29, -5.53],
  PB: [-36.82, -7.06],
  PR: [-51.55, -24.89],
  PE: [-37.86, -8.38],
  PI: [-42.72, -6.60],
  RJ: [-42.80, -22.25],
  RN: [-36.52, -5.40],
  RS: [-53.20, -29.68],
  RO: [-63.90, -10.83],
  RR: [-60.67, 2.82],
  SC: [-50.16, -27.33],
  SP: [-48.55, -22.32],
  SE: [-37.27, -10.57],
  TO: [-48.12, -10.25],
};

export function BrazilStatesMap({
  estadosData,
  className,
}: BrazilStatesMapProps) {
  const [hoveredState, setHoveredState] = useState<string | null>(null);

  // Criar um map para acesso rápido aos dados por estado
  const estadosMap = new Map(
    estadosData.map((estado) => [estado.estado, estado])
  );

  const getStateData = (geo: any) => {
    // Diferentes propriedades que podem conter a sigla do estado
    const possibleFields = [
      "sigla",
      "SIGLA", 
      "uf",
      "UF",
      "abbrev",
      "ABBREV",
      "code",
      "CODE",
      "estado",
      "ESTADO"
    ];

    for (const field of possibleFields) {
      const value = geo.properties[field];
      if (value && typeof value === 'string') {
        const sigla = value.toUpperCase();
        if (sigla.length === 2 && estadosMap.has(sigla)) {
          return estadosMap.get(sigla);
        }
      }
    }

    // Tentar pelo nome do estado
    const nomeFields = ["name", "NAME", "nome", "NOME", "name_1", "NAME_1"];
    
    for (const field of nomeFields) {
      const nome = geo.properties[field];
      if (nome) {
        const nomeUpper = nome.toUpperCase();
        
        // Procurar correspondência com os estados
        for (const [sigla, data] of estadosMap.entries()) {
          if (nomeUpper.includes(sigla) || 
              nomeUpper === getStateFullName(sigla) ||
              nomeUpper.includes(getStateFullName(sigla))) {
            return data;
          }
        }
      }
    }

    return null;
  };

  const getStateFullName = (sigla: string): string => {
    const nomes: Record<string, string> = {
      AC: "ACRE",
      AL: "ALAGOAS",
      AP: "AMAPÁ",
      AM: "AMAZONAS",
      BA: "BAHIA",
      CE: "CEARÁ",
      DF: "DISTRITO FEDERAL",
      ES: "ESPÍRITO SANTO",
      GO: "GOIÁS",
      MA: "MARANHÃO",
      MT: "MATO GROSSO",
      MS: "MATO GROSSO DO SUL",
      MG: "MINAS GERAIS",
      PA: "PARÁ",
      PB: "PARAÍBA",
      PR: "PARANÁ",
      PE: "PERNAMBUCO",
      PI: "PIAUÍ",
      RJ: "RIO DE JANEIRO",
      RN: "RIO GRANDE DO NORTE",
      RS: "RIO GRANDE DO SUL",
      RO: "RONDÔNIA",
      RR: "RORAIMA",
      SC: "SANTA CATARINA",
      SP: "SÃO PAULO",
      SE: "SERGIPE",
      TO: "TOCANTINS",
    };
    return nomes[sigla] || sigla;
  };

  const getStateFillColor = (geo: any) => {
    const stateData = getStateData(geo);
    
    if (stateData && stateData.totalPropriedades > 0) {
      return stateData.color;
    }
    
    return "#f1f5f9";
  };

  const getStateOpacity = (geo: any) => {
    const stateData = getStateData(geo);
    
    if (stateData && stateData.totalPropriedades > 0) {
      return hoveredState === stateData.estado ? 1 : 0.8;
    }
    
    return 0.3;
  };

  return (
    <TooltipProvider>
      <div className={`w-full h-full ${className}`}>
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{
            scale: 600,
            center: [-55, -15],
          }}
          style={{
            width: "100%",
            height: "320px",
          }}
        >
          <Geographies geography={BRAZIL_STATES_TOPO}>
            {({ geographies }) => 
              geographies.map((geo) => {
                const stateData = getStateData(geo);
                const fillColor = getStateFillColor(geo);
                const opacity = getStateOpacity(geo);
                
                return (
                  <Tooltip key={geo.rsmKey}>
                    <TooltipTrigger asChild>
                      <Geography
                        geography={geo}
                        fill={fillColor}
                        stroke="#e2e8f0"
                        strokeWidth={0.5}
                        style={{
                          default: {
                            opacity: opacity,
                            transition: "all 0.2s",
                            outline: "none",
                          },
                          hover: {
                            opacity: 1,
                            filter: "brightness(1.1)",
                            outline: "none",
                          },
                          pressed: {
                            opacity: 1,
                            filter: "brightness(0.9)",
                            outline: "none",
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
                    </TooltipTrigger>
                    {stateData && (
                      <TooltipContent>
                        <div className="space-y-1">
                          <p className="font-semibold">{stateData.estado} - {getStateFullName(stateData.estado)}</p>
                          <p className="text-sm">Propriedades: {formatNumber(stateData.totalPropriedades)}</p>
                          <p className="text-sm">Área Total: {formatNumber(stateData.areaTotal)} ha</p>
                        </div>
                      </TooltipContent>
                    )}
                  </Tooltip>
                );
              })
            }
          </Geographies>
          
          {/* Adicionar labels dos estados com dados */}
          {estadosData
            .filter(estado => estado.totalPropriedades > 0)
            .map((estado) => {
              const center = STATE_CENTERS[estado.estado];
              if (!center) return null;
              
              return (
                <Annotation
                  key={estado.estado}
                  subject={center}
                  dx={0}
                  dy={0}
                  connectorProps={{
                    stroke: "none",
                  }}
                >
                  <text
                    textAnchor="middle"
                    alignmentBaseline="middle"
                    fill="#374151"
                    fontSize="10"
                    fontWeight="600"
                    style={{
                      pointerEvents: "none",
                      textShadow: "0 0 3px white, 0 0 3px white, 0 0 3px white",
                    }}
                  >
                    {estado.estado}
                  </text>
                </Annotation>
              );
            })}
        </ComposableMap>

        <div className="text-center mt-2">
          <p className="text-sm font-semibold text-muted-foreground">
            Distribuição de Propriedades por Estado
          </p>
        </div>
      </div>
    </TooltipProvider>
  );
}