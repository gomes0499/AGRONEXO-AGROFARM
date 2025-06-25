"use client";

import { StatePropertyData } from "@/lib/actions/property-geo-stats-actions";
import { useState } from "react";
import { MapPin } from "lucide-react";

interface BrazilStaticMapProps {
  estadosData: StatePropertyData[];
  className?: string;
}

// SVG paths simplificados dos estados brasileiros
const STATE_PATHS = {
  'AC': 'M120,180 L160,180 L160,220 L120,220 Z',
  'AL': 'M320,160 L340,160 L340,180 L320,180 Z',
  'AP': 'M240,80 L260,80 L260,120 L240,120 Z',
  'AM': 'M80,120 L180,120 L180,180 L80,180 Z',
  'BA': 'M280,140 L340,140 L340,200 L280,200 Z',
  'CE': 'M300,120 L340,120 L340,140 L300,140 Z',
  'DF': 'M260,180 L280,180 L280,200 L260,200 Z',
  'ES': 'M320,200 L340,200 L340,220 L320,220 Z',
  'GO': 'M240,180 L280,180 L280,220 L240,220 Z',
  'MA': 'M260,120 L300,120 L300,160 L260,160 Z',
  'MT': 'M200,160 L240,160 L240,220 L200,220 Z',
  'MS': 'M200,220 L240,220 L240,280 L200,280 Z',
  'MG': 'M260,200 L320,200 L320,260 L260,260 Z',
  'PA': 'M200,80 L280,80 L280,160 L200,160 Z',
  'PB': 'M320,120 L340,120 L340,140 L320,140 Z',
  'PR': 'M240,260 L280,260 L280,300 L240,300 Z',
  'PE': 'M300,140 L340,140 L340,160 L300,160 Z',
  'PI': 'M240,120 L280,120 L280,180 L240,180 Z',
  'RJ': 'M300,220 L340,220 L340,240 L300,240 Z',
  'RN': 'M300,100 L340,100 L340,120 L300,120 Z',
  'RS': 'M220,300 L280,300 L280,340 L220,340 Z',
  'RO': 'M160,160 L200,160 L200,200 L160,200 Z',
  'RR': 'M180,40 L220,40 L220,80 L180,80 Z',
  'SC': 'M240,280 L280,280 L280,320 L240,320 Z',
  'SP': 'M280,240 L320,240 L320,280 L280,280 Z',
  'SE': 'M320,140 L340,140 L340,160 L320,160 Z',
  'TO': 'M220,120 L260,120 L260,180 L220,180 Z'
};

export function BrazilStaticMap({ estadosData, className }: BrazilStaticMapProps) {
  const [hoveredState, setHoveredState] = useState<string | null>(null);
  
  // Criar um map para acesso rápido aos dados por estado
  const estadosMap = new Map(estadosData.map(estado => [estado.estado, estado]));

  const getStateFillColor = (stateCode: string) => {
    const stateData = estadosMap.get(stateCode);
    if (stateData && stateData.totalPropriedades > 0) {
      return stateData.color;
    }
    return '#E2E8F0';
  };

  const getStateOpacity = (stateCode: string) => {
    const stateData = estadosMap.get(stateCode);
    if (stateData && stateData.totalPropriedades > 0) {
      return hoveredState === stateCode ? 1 : 0.8;
    }
    return 0.3;
  };

  return (
    <div className={`w-full h-full flex flex-col items-center justify-center ${className}`}>
      <div className="w-full max-w-sm">
        <svg
          viewBox="0 0 400 380"
          className="w-full h-auto"
          style={{ maxHeight: '300px' }}
        >
          {/* Estados com dados */}
          {Object.entries(STATE_PATHS).map(([stateCode, path]) => {
            const stateData = estadosMap.get(stateCode);
            const hasData = stateData && stateData.totalPropriedades > 0;
            
            return (
              <g key={stateCode}>
                <path
                  d={path}
                  fill={getStateFillColor(stateCode)}
                  stroke="#94A3B8"
                  strokeWidth="1"
                  opacity={getStateOpacity(stateCode)}
                  style={{
                    transition: "all 0.2s",
                    cursor: hasData ? "pointer" : "default",
                  }}
                  onMouseEnter={() => {
                    if (hasData) {
                      setHoveredState(stateCode);
                    }
                  }}
                  onMouseLeave={() => {
                    setHoveredState(null);
                  }}
                />
                
                {/* Label do estado */}
                {hasData && (
                  <text
                    x={getStateCenterX(path)}
                    y={getStateCenterY(path)}
                    textAnchor="middle"
                    alignmentBaseline="middle"
                    fill="#374151"
                    fontSize="10"
                    fontWeight="600"
                    style={{
                      pointerEvents: "none",
                      textShadow: "0 0 3px white",
                    }}
                  >
                    {stateCode}
                  </text>
                )}
              </g>
            );
          })}
        </svg>
        
        {/* Tooltip */}
        {hoveredState && estadosMap.has(hoveredState) && (
          <div className="mt-2 text-center">
            <div className="inline-block bg-black/90 text-white px-3 py-2 rounded-lg text-sm shadow-lg">
              <div className="font-semibold">{hoveredState}</div>
              <div className="text-xs opacity-90">
                {estadosMap.get(hoveredState)?.totalPropriedades} {' '}
                {estadosMap.get(hoveredState)?.totalPropriedades === 1 ? 'propriedade' : 'propriedades'}
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Lista de estados quando há muitos */}
      {estadosData.length > 0 && (
        <div className="mt-4 w-full max-w-sm">
          <div className="text-center text-sm text-muted-foreground mb-2">
            Estados com propriedades
          </div>
          <div className="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto">
            {estadosData.map((estado) => (
              <div key={estado.estado} className="flex items-center gap-2 text-xs">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: estado.color }}
                />
                <span className="font-medium">{estado.estado}</span>
                <span className="text-muted-foreground">({estado.totalPropriedades})</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// Funções auxiliares para calcular o centro dos estados
function getStateCenterX(path: string): number {
  // Extrair coordenadas básicas do path (simplificado)
  const match = path.match(/M(\d+),(\d+).*L(\d+),(\d+)/);
  if (match) {
    const x1 = parseInt(match[1]);
    const x2 = parseInt(match[3]);
    return (x1 + x2) / 2;
  }
  return 0;
}

function getStateCenterY(path: string): number {
  // Extrair coordenadas básicas do path (simplificado)
  const match = path.match(/M(\d+),(\d+).*L(\d+),(\d+)/);
  if (match) {
    const y1 = parseInt(match[2]);
    const y2 = parseInt(match[4]);
    return (y1 + y2) / 2;
  }
  return 0;
}