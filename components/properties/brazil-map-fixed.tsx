"use client";

import { StatePropertyData } from "@/lib/actions/property-geo-stats-actions";
import { ComposableMap, Geographies, Geography } from "react-simple-maps";
import { useState } from "react";

interface BrazilMapFixedProps {
  estadosData: StatePropertyData[];
  className?: string;
}

// GeoJSON confiável dos estados do Brasil
const BRAZIL_GEOJSON = "https://raw.githubusercontent.com/tbrugz/geodata-br/master/geojson/geojs-states-br.json";

// Mapeamento robusto para identificar estados corretamente
const STATE_MAPPINGS: Record<string, string> = {
  // Por ID (quando disponível)
  '11': 'RO', '12': 'AC', '13': 'AM', '14': 'RR', '15': 'PA', '16': 'AP', '17': 'TO',
  '21': 'MA', '22': 'PI', '23': 'CE', '24': 'RN', '25': 'PB', '26': 'PE', '27': 'AL', '28': 'SE', '29': 'BA',
  '31': 'MG', '32': 'ES', '33': 'RJ', '35': 'SP',
  '41': 'PR', '42': 'SC', '43': 'RS',
  '50': 'MS', '51': 'MT', '52': 'GO', '53': 'DF',
  
  // Por nome completo
  'RONDÔNIA': 'RO', 'RONDONIA': 'RO',
  'ACRE': 'AC',
  'AMAZONAS': 'AM',
  'RORAIMA': 'RR',
  'PARÁ': 'PA', 'PARA': 'PA',
  'AMAPÁ': 'AP', 'AMAPA': 'AP',
  'TOCANTINS': 'TO',
  'MARANHÃO': 'MA', 'MARANHAO': 'MA',
  'PIAUÍ': 'PI', 'PIAUI': 'PI',
  'CEARÁ': 'CE', 'CEARA': 'CE',
  'RIO GRANDE DO NORTE': 'RN',
  'PARAÍBA': 'PB', 'PARAIBA': 'PB',
  'PERNAMBUCO': 'PE',
  'ALAGOAS': 'AL',
  'SERGIPE': 'SE',
  'BAHIA': 'BA',
  'MINAS GERAIS': 'MG',
  'ESPÍRITO SANTO': 'ES', 'ESPIRITO SANTO': 'ES',
  'RIO DE JANEIRO': 'RJ',
  'SÃO PAULO': 'SP', 'SAO PAULO': 'SP',
  'PARANÁ': 'PR', 'PARANA': 'PR',
  'SANTA CATARINA': 'SC',
  'RIO GRANDE DO SUL': 'RS',
  'MATO GROSSO DO SUL': 'MS',
  'MATO GROSSO': 'MT',
  'GOIÁS': 'GO', 'GOIAS': 'GO',
  'DISTRITO FEDERAL': 'DF',
  
  // Por sigla (caso venha como sigla)
  'RO': 'RO', 'AC': 'AC', 'AM': 'AM', 'RR': 'RR', 'PA': 'PA', 'AP': 'AP', 'TO': 'TO',
  'MA': 'MA', 'PI': 'PI', 'CE': 'CE', 'RN': 'RN', 'PB': 'PB', 'PE': 'PE', 'AL': 'AL', 'SE': 'SE', 'BA': 'BA',
  'MG': 'MG', 'ES': 'ES', 'RJ': 'RJ', 'SP': 'SP',
  'PR': 'PR', 'SC': 'SC', 'RS': 'RS',
  'MS': 'MS', 'MT': 'MT', 'GO': 'GO', 'DF': 'DF'
};

export function BrazilMapFixed({ estadosData, className }: BrazilMapFixedProps) {
  const [hoveredState, setHoveredState] = useState<string | null>(null);
  
  // Criar um map para acesso rápido aos dados por estado
  const estadosMap = new Map(estadosData.map(estado => [estado.estado, estado]));

  const getStateCode = (geoProperties: any): string | null => {
    // Listar todos os campos possíveis onde o estado pode estar
    const possibleFields = [
      'id', 'ID', 'cd_geocuf', 'CD_GEOCUF', 'codigo_ibge', 'CODIGO_IBGE',
      'name', 'NAME', 'nome', 'NOME', 'nm_estado', 'NM_ESTADO',
      'sigla', 'SIGLA', 'uf', 'UF', 'estado', 'ESTADO',
      'properties.name', 'properties.NAME'
    ];

    for (const field of possibleFields) {
      let value = geoProperties[field];
      
      // Se o campo tem um ponto, navegar no objeto
      if (field.includes('.')) {
        const parts = field.split('.');
        value = geoProperties;
        for (const part of parts) {
          value = value?.[part];
        }
      }
      
      if (value) {
        const valueStr = String(value).toUpperCase().trim();
        
        // Verificar mapeamento direto
        if (STATE_MAPPINGS[valueStr]) {
          return STATE_MAPPINGS[valueStr];
        }
        
        // Verificar se é uma sigla válida
        if (valueStr.length === 2 && estadosMap.has(valueStr)) {
          return valueStr;
        }
      }
    }
    
    // Log para debug (só em desenvolvimento)
    if (process.env.NODE_ENV === 'development') {
      console.log('Estado não mapeado:', geoProperties);
    }
    
    return null;
  };

  const getStateData = (geoProperties: any) => {
    const stateCode = getStateCode(geoProperties);
    return stateCode ? estadosMap.get(stateCode) : null;
  };

  const getStateFillColor = (geoProperties: any) => {
    const stateData = getStateData(geoProperties);
    
    if (stateData && stateData.totalPropriedades > 0) {
      return stateData.color;
    }
    
    return '#E2E8F0'; // Cor neutra para estados sem dados
  };

  const getStateOpacity = (geoProperties: any) => {
    const stateData = getStateData(geoProperties);
    
    if (stateData && stateData.totalPropriedades > 0) {
      return hoveredState === stateData.estado ? 1 : 0.8;
    }
    
    return 0.3;
  };

  return (
    <div className={`w-full h-full flex items-center justify-center ${className}`}>
      <div className="w-full h-full max-w-md max-h-80 relative">
        <ComposableMap
          projection="geoMercator"
          projectionConfig={{
            scale: 700,
            center: [-55, -15],
          }}
          style={{
            width: "100%",
            height: "100%",
          }}
        >
          <Geographies geography={BRAZIL_GEOJSON}>
            {({ geographies }) => {
              return geographies.map((geo) => {
                const stateData = getStateData(geo.properties);
                const stateCode = getStateCode(geo.properties);
                
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
        
        {/* Tooltip melhorado */}
        {hoveredState && estadosMap.has(hoveredState) && (
          <div className="absolute top-2 left-2 bg-black/90 text-white px-3 py-2 rounded-lg text-sm pointer-events-none shadow-lg">
            <div className="font-semibold">{hoveredState}</div>
            <div className="text-xs opacity-90">
              {estadosMap.get(hoveredState)?.totalPropriedades} {' '}
              {estadosMap.get(hoveredState)?.totalPropriedades === 1 ? 'propriedade' : 'propriedades'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}