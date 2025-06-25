"use client";

import React from "react";
import { Palette, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useState } from "react";

interface BrandingColorsDisplayProps {
  corPrimaria?: string;
  corSecundaria?: string;
  corFundo?: string;
  corTexto?: string;
}

interface ColorCardProps {
  label: string;
  color?: string;
  description?: string;
}

function ColorCard({ label, color, description }: ColorCardProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!color) return;
    
    try {
      await navigator.clipboard.writeText(color);
      setCopied(true);
      toast.success(`Cor ${label.toLowerCase()} copiada!`);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error("Erro ao copiar cor");
    }
  };

  if (!color) return null;

  return (
    <div className="space-y-3">
      <div>
        <p className="text-sm font-medium mb-1">{label}</p>
        {description && (
          <p className="text-xs text-muted-foreground">{description}</p>
        )}
      </div>
      
      <div className="relative group">
        <div 
          className="w-full h-24 rounded-lg border-2 border-border shadow-sm transition-all duration-200 group-hover:shadow-md"
          style={{ backgroundColor: color }}
        />
        
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            size="sm"
            variant="secondary"
            onClick={handleCopy}
            className="shadow-lg"
          >
            {copied ? (
              <Check className="h-3 w-3" />
            ) : (
              <Copy className="h-3 w-3" />
            )}
          </Button>
        </div>
      </div>
      
      <div className="flex items-center justify-between">
        <code className="text-xs font-mono bg-muted px-2 py-1 rounded">
          {color}
        </code>
      </div>
    </div>
  );
}

export function BrandingColorsDisplay({
  corPrimaria,
  corSecundaria,
  corFundo,
  corTexto,
}: BrandingColorsDisplayProps) {
  const hasColors = corPrimaria || corSecundaria || corFundo || corTexto;

  if (!hasColors) {
    return (
      <div className="text-center py-8">
        <Palette className="h-12 w-12 text-muted-foreground/50 mx-auto mb-4" />
        <p className="text-muted-foreground">
          Nenhuma cor de branding configurada
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <ColorCard 
          label="Cor Primária" 
          color={corPrimaria}
          description="Cor principal da marca"
        />
        <ColorCard 
          label="Cor Secundária" 
          color={corSecundaria}
          description="Cor de apoio e destaques"
        />
        <ColorCard 
          label="Cor de Fundo" 
          color={corFundo}
          description="Cor para backgrounds"
        />
        <ColorCard 
          label="Cor de Texto" 
          color={corTexto}
          description="Cor padrão para textos"
        />
      </div>

      {/* Preview de aplicação */}
      <div className="mt-8 p-6 rounded-lg border-2 border-dashed" 
           style={{ backgroundColor: corFundo || '#ffffff' }}>
        <h3 className="text-lg font-semibold mb-2" 
            style={{ color: corTexto || '#000000' }}>
          Preview de Aplicação
        </h3>
        <p className="mb-4" style={{ color: corTexto || '#000000' }}>
          Este é um exemplo de como as cores serão aplicadas em relatórios e documentos.
        </p>
        <div className="flex gap-3">
          <Button 
            style={{ 
              backgroundColor: corPrimaria || '#000000',
              color: '#ffffff',
              borderColor: corPrimaria || '#000000'
            }}
            className="hover:opacity-90"
          >
            Botão Primário
          </Button>
          <Button 
            variant="outline"
            style={{ 
              borderColor: corSecundaria || '#666666',
              color: corSecundaria || '#666666',
            }}
            className="hover:opacity-90"
          >
            Botão Secundário
          </Button>
        </div>
      </div>

      {/* Paleta de cores complementares sugeridas */}
      {corPrimaria && (
        <div className="mt-6">
          <h4 className="text-sm font-medium mb-3">Variações da Cor Primária</h4>
          <div className="flex gap-2">
            {[90, 70, 50, 30, 10].map((lightness) => (
              <div
                key={lightness}
                className="flex-1 h-12 rounded border"
                style={{
                  backgroundColor: corPrimaria,
                  filter: `brightness(${lightness}%)`,
                }}
                title={`${lightness}% de luminosidade`}
              />
            ))}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Sugestões de variações para criar hierarquia visual
          </p>
        </div>
      )}
    </div>
  );
}