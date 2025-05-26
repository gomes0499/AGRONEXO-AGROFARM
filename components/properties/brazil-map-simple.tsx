"use client";

import { StatePropertyData } from "@/lib/actions/property-geo-stats-actions";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import { useState } from "react";

interface BrazilMapSimpleProps {
  estadosData: StatePropertyData[];
  className?: string;
}

// URL do Natural Earth para dados do Brasil (mais confiável)
const BRAZIL_TOPO = "https://cdn.jsdelivr.net/npm/world-atlas@3/countries-50m.json";

// Mapeamento completo de códigos e nomes de estados
const STATE_MAPPINGS = {
  // Siglas para nomes completos
  'AC': 'ACRE',
  'AL': 'ALAGOAS', 
  'AP': 'AMAPÁ',
  'AM': 'AMAZONAS',
  'BA': 'BAHIA',
  'CE': 'CEARÁ',
  'DF': 'DISTRITO FEDERAL',
  'ES': 'ESPÍRITO SANTO',
  'GO': 'GOIÁS',
  'MA': 'MARANHÃO',
  'MT': 'MATO GROSSO',
  'MS': 'MATO GROSSO DO SUL',
  'MG': 'MINAS GERAIS',
  'PA': 'PARÁ',
  'PB': 'PARAÍBA',
  'PR': 'PARANÁ',
  'PE': 'PERNAMBUCO',
  'PI': 'PIAUÍ',
  'RJ': 'RIO DE JANEIRO',
  'RN': 'RIO GRANDE DO NORTE',
  'RS': 'RIO GRANDE DO SUL',
  'RO': 'RONDÔNIA',
  'RR': 'RORAIMA',
  'SC': 'SANTA CATARINA',
  'SP': 'SÃO PAULO',
  'SE': 'SERGIPE',
  'TO': 'TOCANTINS'
};

export function BrazilMapSimple({ estadosData, className }: BrazilMapSimpleProps) {
  const [hoveredState, setHoveredState] = useState<string | null>(null);
  
  // Criar um map para acesso rápido aos dados por estado
  const estadosMap = new Map(estadosData.map(estado => [estado.estado, estado]));

  const getStateData = (geoProperties: any) => {
    // Primeiro, vamos filtrar apenas o Brasil se estivermos usando dados mundiais
    const countryName = geoProperties.NAME || geoProperties.name || geoProperties.NAME_EN;
    if (countryName && !['Brazil', 'Brasil', 'BRAZIL', 'BRASIL'].includes(countryName)) {
      return null; // Não é o Brasil
    }

    // Para dados do Brasil, procurar por qualquer campo que possa conter estado
    const possibleFields = [
      'NAME', 'name', 'NAME_1', 'name_1', 'admin', 'ADMIN',
      'estado', 'ESTADO', 'uf', 'UF', 'sigla', 'SIGLA',
      'NM_ESTADO', 'nm_estado', 'NOME', 'nome'
    ];
    
    for (const field of possibleFields) {
      const value = geoProperties[field];
      if (!value) continue;
      
      const upperValue = String(value).toUpperCase();
      
      // Verificar se é uma sigla direta
      if (upperValue.length === 2 && estadosMap.has(upperValue)) {
        return estadosMap.get(upperValue);
      }
      
      // Verificar se é nome completo
      for (const [code, name] of Object.entries(STATE_MAPPINGS)) {
        if (upperValue === name || upperValue.includes(name) || name.includes(upperValue)) {
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
    
    return '#f1f5f9';
  };

  const getStateOpacity = (geoProperties: any) => {
    const stateData = getStateData(geoProperties);
    
    if (stateData && stateData.totalPropriedades > 0) {
      return hoveredState === stateData.estado ? 1 : 0.8;
    }
    
    return 0.3;
  };

  return (
    <div className={`w-full h-full ${className}`}>
      <ComposableMap
        projection="geoMercator"
        projectionConfig={{
          scale: 700,
          center: [-55, -15],
        }}
        style={{
          width: "100%",
          height: "320px",
        }}
      >
        <Geographies geography={BRAZIL_TOPO}>
          {({ geographies }) => {
            // Filtrar apenas o Brasil
            const brazilGeos = geographies.filter(geo => {
              const name = geo.properties.NAME || geo.properties.name;
              return name && ['Brazil', 'Brasil', 'BRAZIL', 'BRASIL'].includes(name);
            });
            
            console.log('Brasil encontrado:', brazilGeos.length > 0);
            
            if (brazilGeos.length === 0) {
              return (
                <text x="50%" y="50%" textAnchor="middle" fill="#666" fontSize="12">
                  Carregando mapa do Brasil...
                </text>
              );
            }
            
            return brazilGeos.map((geo) => {
              return (
                <Geography
                  key={geo.rsmKey}
                  geography={geo}
                  fill="#10b981"
                  stroke="#e2e8f0"
                  strokeWidth={0.5}
                  style={{
                    default: {
                      opacity: 0.8,
                      transition: "all 0.2s",
                    },
                    hover: {
                      opacity: 1,
                      filter: "brightness(1.1)",
                    },
                  }}
                />
              );
            });
          }}
        </Geographies>
      </ComposableMap>
      
      <div className="text-center mt-2">
        <p className="text-sm font-semibold text-muted-foreground">
          Distribuição de Propriedades
        </p>
      </div>
    </div>
  );
}