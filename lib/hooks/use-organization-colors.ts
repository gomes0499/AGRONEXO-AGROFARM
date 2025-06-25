"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface OrganizationColors {
  primary: string;
  secondary: string;
  background: string;
  text: string;
}

const DEFAULT_COLORS: OrganizationColors = {
  primary: "#0066FF",
  secondary: "#FF6B00", 
  background: "#FFFFFF",
  text: "#000000",
};

// Função para gerar uma paleta de cores baseada nas cores primária e secundária
export function generateColorPalette(primary: string, secondary: string): string[] {
  // Função auxiliar para ajustar brilho de uma cor
  const adjustBrightness = (color: string, factor: number): string => {
    const hex = color.replace("#", "");
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    
    const newR = Math.min(255, Math.max(0, Math.round(r * factor)));
    const newG = Math.min(255, Math.max(0, Math.round(g * factor)));
    const newB = Math.min(255, Math.max(0, Math.round(b * factor)));
    
    return `#${newR.toString(16).padStart(2, "0")}${newG.toString(16).padStart(2, "0")}${newB.toString(16).padStart(2, "0")}`;
  };
  
  // Função para misturar duas cores
  const mixColors = (color1: string, color2: string, ratio: number = 0.5): string => {
    const hex1 = color1.replace("#", "");
    const hex2 = color2.replace("#", "");
    
    const r1 = parseInt(hex1.substring(0, 2), 16);
    const g1 = parseInt(hex1.substring(2, 4), 16);
    const b1 = parseInt(hex1.substring(4, 6), 16);
    
    const r2 = parseInt(hex2.substring(0, 2), 16);
    const g2 = parseInt(hex2.substring(2, 4), 16);
    const b2 = parseInt(hex2.substring(4, 6), 16);
    
    const r = Math.round(r1 * (1 - ratio) + r2 * ratio);
    const g = Math.round(g1 * (1 - ratio) + g2 * ratio);
    const b = Math.round(b1 * (1 - ratio) + b2 * ratio);
    
    return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
  };
  
  return [
    primary,                           // Cor 1: Primária
    secondary,                         // Cor 2: Secundária
    adjustBrightness(primary, 0.8),    // Cor 3: Primária escurecida
    adjustBrightness(secondary, 0.8),  // Cor 4: Secundária escurecida
    adjustBrightness(primary, 1.2),    // Cor 5: Primária clareada
    adjustBrightness(secondary, 1.2),  // Cor 6: Secundária clareada
    mixColors(primary, secondary, 0.5), // Cor 7: Mix 50/50
    mixColors(primary, secondary, 0.3), // Cor 8: Mix 70/30
    mixColors(primary, secondary, 0.7), // Cor 9: Mix 30/70
    adjustBrightness(primary, 0.6),    // Cor 10: Primária muito escura
  ];
}

export function useOrganizationColors(organizationId?: string) {
  const [colors, setColors] = useState<OrganizationColors>(DEFAULT_COLORS);
  const [palette, setPalette] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchColors() {
      if (!organizationId) {
        setIsLoading(false);
        setPalette(generateColorPalette(DEFAULT_COLORS.primary, DEFAULT_COLORS.secondary));
        return;
      }

      try {
        const supabase = createClient();
        const { data: organization } = await supabase
          .from("organizacoes")
          .select("*")
          .eq("id", organizationId)
          .single();
          
        if (organization) {
          const orgColors = {
            primary: organization.cor_primaria || DEFAULT_COLORS.primary,
            secondary: organization.cor_secundaria || DEFAULT_COLORS.secondary,
            background: organization.cor_fundo || DEFAULT_COLORS.background,
            text: organization.cor_texto || DEFAULT_COLORS.text,
          };
          setColors(orgColors);
          setPalette(generateColorPalette(orgColors.primary, orgColors.secondary));
        } else {
          setPalette(generateColorPalette(DEFAULT_COLORS.primary, DEFAULT_COLORS.secondary));
        }
      } catch (error) {
        console.error("Erro ao buscar cores da organização:", error);
        setPalette(generateColorPalette(DEFAULT_COLORS.primary, DEFAULT_COLORS.secondary));
      } finally {
        setIsLoading(false);
      }
    }

    fetchColors();
  }, [organizationId]);

  return { colors, palette, isLoading };
}

// Hook para usar em componentes server-side
export function getOrganizationColorsSync(organization: any): { colors: OrganizationColors; palette: string[] } {
  const colors = {
    primary: organization?.cor_primaria || DEFAULT_COLORS.primary,
    secondary: organization?.cor_secundaria || DEFAULT_COLORS.secondary,
    background: organization?.cor_fundo || DEFAULT_COLORS.background,
    text: organization?.cor_texto || DEFAULT_COLORS.text,
  };
  
  const palette = generateColorPalette(colors.primary, colors.secondary);
  
  return { colors, palette };
}