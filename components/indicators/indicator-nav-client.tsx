"use client";

export interface IndicatorNavClientProps {
  indicatorsComponent: React.ReactNode;
}

export function IndicatorNavClient({
  indicatorsComponent,
}: IndicatorNavClientProps) {
  return (
    <div>
      {/* Conteúdo direto do componente de indicadores */}
      {indicatorsComponent}
    </div>
  );
}