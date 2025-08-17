"use client";

import { useState, useEffect } from "react";
import { Eye, EyeOff, ChevronDown, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

interface TickerVisibility {
  market: boolean;
  weather: boolean;
  news: boolean;
}

interface TickerVisibilityToggleProps {
  onVisibilityChange?: (visibility: TickerVisibility) => void;
}

export function TickerVisibilityToggle({ onVisibilityChange }: TickerVisibilityToggleProps) {
  const [visibility, setVisibility] = useState<TickerVisibility>({
    market: true,
    weather: true,
    news: true,
  });

  // Carregar preferências do localStorage
  useEffect(() => {
    const saved = localStorage.getItem("ticker-visibility");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setVisibility(parsed);
        onVisibilityChange?.(parsed);
      } catch (e) {
        console.error("Erro ao carregar preferências de visibilidade:", e);
      }
    }
  }, []);

  // Salvar preferências no localStorage
  const updateVisibility = (key: keyof TickerVisibility, value: boolean) => {
    const newVisibility = { ...visibility, [key]: value };
    setVisibility(newVisibility);
    localStorage.setItem("ticker-visibility", JSON.stringify(newVisibility));
    onVisibilityChange?.(newVisibility);
    
    // Emit custom event for same-window updates
    window.dispatchEvent(new CustomEvent("ticker-visibility-changed", { detail: newVisibility }));
  };

  const toggleAll = () => {
    const allHidden = !visibility.market && !visibility.weather && !visibility.news;
    const newState = {
      market: allHidden,
      weather: allHidden,
      news: allHidden,
    };
    setVisibility(newState);
    localStorage.setItem("ticker-visibility", JSON.stringify(newState));
    onVisibilityChange?.(newState);
    
    // Emit custom event for same-window updates
    window.dispatchEvent(new CustomEvent("ticker-visibility-changed", { detail: newState }));
  };

  const visibleCount = Object.values(visibility).filter(v => v).length;
  const allVisible = visibleCount === 3;
  const allHidden = visibleCount === 0;
  const someHidden = visibleCount > 0 && visibleCount < 3;

  return (
    <>
      <style jsx>{`
        @keyframes pulse-border {
          0%, 100% {
            border-color: rgba(239, 68, 68, 0.5);
            box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.4);
          }
          50% {
            border-color: rgba(239, 68, 68, 0.8);
            box-shadow: 0 0 0 4px rgba(239, 68, 68, 0);
          }
        }
        
        .ticker-toggle-pulse {
          animation: pulse-border 2s infinite;
        }
      `}</style>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className={`h-8 gap-1.5 transition-all duration-200 ${
              someHidden || allHidden ? 'ticker-toggle-pulse' : ''
            }`}
            style={{ 
              color: allHidden ? '#ffffff' : someHidden ? '#fbbf24' : '#10b981',
              backgroundColor: allHidden ? '#ef4444' : someHidden ? 'rgba(251, 191, 36, 0.15)' : 'rgba(16, 185, 129, 0.1)',
              borderColor: allHidden ? '#ef4444' : someHidden ? 'rgba(251, 191, 36, 0.5)' : 'rgba(16, 185, 129, 0.3)',
              fontWeight: allHidden || someHidden ? '600' : '500'
            }}
          >
            {allHidden ? (
              <EyeOff className="h-4 w-4" />
            ) : someHidden ? (
              <AlertCircle className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
            <span className="text-xs">
              Tickers {allHidden ? 'Ocultos' : `(${visibleCount}/3)`}
            </span>
            <ChevronDown className="h-3 w-3" />
          </Button>
        </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="end" 
        className="w-56"
        style={{
          backgroundColor: '#0a0a0a',
          border: '1px solid #1a1a1a',
        }}
      >
        <div className="p-2">
          <div className="flex items-center justify-between mb-2">
            <Label 
              htmlFor="ticker-all" 
              className="text-sm font-medium"
              style={{ color: '#e5e7eb' }}
            >
              Mostrar/Ocultar Todos
            </Label>
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleAll}
              className="h-6 px-2 text-xs"
              style={{ color: '#9ca3af' }}
            >
              {allVisible ? 'Ocultar' : 'Mostrar'}
            </Button>
          </div>
        </div>
        
        <DropdownMenuSeparator style={{ backgroundColor: '#1a1a1a' }} />
        
        <div className="p-2 space-y-2">
          {/* Market Ticker */}
          <div className="flex items-center justify-between">
            <Label 
              htmlFor="ticker-market" 
              className="text-sm cursor-pointer flex items-center gap-2"
              style={{ color: '#e5e7eb' }}
            >
              <span className="text-lg">$</span>
              Mercado
            </Label>
            <Switch
              id="ticker-market"
              checked={visibility.market}
              onCheckedChange={(checked) => updateVisibility('market', checked)}
              className="data-[state=checked]:bg-green-500"
            />
          </div>

          {/* Weather Ticker */}
          <div className="flex items-center justify-between">
            <Label 
              htmlFor="ticker-weather" 
              className="text-sm cursor-pointer flex items-center gap-2"
              style={{ color: '#e5e7eb' }}
            >
              <span className="text-lg">☁</span>
              Clima
            </Label>
            <Switch
              id="ticker-weather"
              checked={visibility.weather}
              onCheckedChange={(checked) => updateVisibility('weather', checked)}
              className="data-[state=checked]:bg-green-500"
            />
          </div>

          {/* News Ticker */}
          <div className="flex items-center justify-between">
            <Label 
              htmlFor="ticker-news" 
              className="text-sm cursor-pointer flex items-center gap-2"
              style={{ color: '#e5e7eb' }}
            >
              <span className="text-lg">📰</span>
              Notícias
            </Label>
            <Switch
              id="ticker-news"
              checked={visibility.news}
              onCheckedChange={(checked) => updateVisibility('news', checked)}
              className="data-[state=checked]:bg-green-500"
            />
          </div>
        </div>

        <DropdownMenuSeparator style={{ backgroundColor: '#1a1a1a' }} />
        
        <div className="p-2">
          <p className="text-xs" style={{ color: '#6b7280' }}>
            As preferências são salvas automaticamente
          </p>
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
    </>
  );
}