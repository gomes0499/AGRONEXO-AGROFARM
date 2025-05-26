"use client";

import { StatePropertyData } from "@/lib/actions/property-geo-stats-actions";

interface BrazilFallbackProps {
  estadosData: StatePropertyData[];
  className?: string;
}

export function BrazilFallback({
  estadosData,
  className,
}: BrazilFallbackProps) {
  const totalPropriedades = estadosData.reduce(
    (acc, estado) => acc + estado.totalPropriedades,
    0
  );
  const totalArea = estadosData.reduce(
    (acc, estado) => acc + estado.areaTotal,
    0
  );

  return (
    <div
      className={`w-full h-full flex flex-col items-center justify-center p-4 ${className}`}
    >
      {/* SVG simples do Brasil */}
      <div className="w-full max-w-md h-64 bg-gradient-to-br from-green-50 to-blue-50 rounded-lg border border-border flex items-center justify-center relative overflow-hidden">
        {/* Representação visual simplificada */}
        <div className="absolute inset-0 opacity-10">
          <svg viewBox="0 0 400 300" className="w-full h-full">
            {/* Contorno básico do Brasil */}
            <path
              d="M 120 80 L 180 70 L 240 75 L 280 85 L 320 110 L 340 140 L 350 180 L 340 220 L 320 250 L 280 260 L 240 255 L 200 250 L 160 240 L 130 220 L 110 190 L 105 150 L 110 120 Z"
              fill="currentColor"
              className="text-green-600"
            />
          </svg>
        </div>

        {/* Informações centralizadas */}
        <div className="text-center space-y-2 z-10">
          <div className="text-2xl font-bold text-green-700">🇧🇷</div>
          <div className="text-lg font-semibold">
            {totalPropriedades}{" "}
            {totalPropriedades === 1 ? "Propriedade" : "Propriedades"}
          </div>
          <div className="text-sm text-muted-foreground">
            {totalArea.toLocaleString("pt-BR", { maximumFractionDigits: 1 })}{" "}
            hectares
          </div>
          <div className="text-xs text-muted-foreground">
            em {estadosData.length}{" "}
            {estadosData.length === 1 ? "estado" : "estados"}
          </div>
        </div>
      </div>

      {/* Lista simplificada de estados */}
      <div className="w-full mt-4 space-y-2">
        {estadosData.slice(0, 3).map((estado) => (
          <div
            key={estado.estado}
            className="flex items-center justify-between p-2 bg-muted/50 rounded"
          >
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: estado.color }}
              />
              <span className="text-sm font-medium">{estado.estado}</span>
            </div>
            <div className="text-xs text-muted-foreground">
              {estado.totalPropriedades} prop.
            </div>
          </div>
        ))}

        {estadosData.length > 3 && (
          <div className="text-center text-xs text-muted-foreground">
            +{estadosData.length - 3} outros estados
          </div>
        )}
      </div>

      <div className="text-center mt-4">
        <p className="text-sm font-semibold text-muted-foreground">
          Distribuição de Propriedades
        </p>
      </div>
    </div>
  );
}
