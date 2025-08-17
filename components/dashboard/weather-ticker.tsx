// components/dashboard/weather-ticker.tsx

"use client";

import { useEffect, useState } from "react";
import {
  Sun,
  Cloud,
  CloudRain,
  CloudSnow,
  CloudLightning,
  ArrowDown,
  ArrowUp,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import Loading from "@/app/dashboard/production/loading";

// Função para remover acentos
function removeAccents(str: string) {
  return str.normalize("NFD").replace(/\p{Diacritic}/gu, "");
}

export const CITIES = [
  // Principais regiões produtoras de soja
  { name: "Sorriso", value: "Sorriso" },
  { name: "Rio Verde", value: "Rio Verde" },
  { name: "Sinop", value: "Sinop" },
  { name: "Nova Mutum", value: "Nova Mutum" },
  { name: "Primavera do Leste", value: "Primavera do Leste" },
  { name: "Lucas do Rio Verde", value: "Lucas do Rio Verde" },

  // Principais regiões produtoras de milho
  { name: "Jataí", value: "Jatai" },
  { name: "Cristalina", value: "Cristalina" },
  { name: "Unaí", value: "Unai" },
  { name: "Maracaju", value: "Maracaju" },

  // Principais regiões produtoras de algodão
  { name: "Sapezal", value: "Sapezal" },
  { name: "São Desidério", value: "Sao Desiderio" },
  { name: "Campo Verde", value: "Campo Verde" },
  { name: "Barreiras", value: "Barreiras" },

  // Principais regiões produtoras de café
  { name: "Patrocínio", value: "Patrocinio" },
  { name: "Monte Carmelo", value: "Monte Carmelo" },
  { name: "Guaxupé", value: "Guaxupe" },
  { name: "Franca", value: "Franca" },

  // Principais regiões produtoras de cana-de-açúcar
  { name: "Ribeirão Preto", value: "Ribeirao Preto" },
  { name: "Piracicaba", value: "Piracicaba" },
  { name: "Jaú", value: "Jau" },
  { name: "Sertãozinho", value: "Sertaozinho" },

  // Principais regiões produtoras de laranja
  { name: "Bebedouro", value: "Bebedouro" },
  { name: "Matão", value: "Matao" },
  { name: "Limeira", value: "Limeira" },

  // Regiões importantes para pecuária
  { name: "Uberaba", value: "Uberaba" },
  { name: "Araguaína", value: "Araguaina" },
  { name: "Paragominas", value: "Paragominas" },
  { name: "Redenção", value: "Redencao" },

  // Outras regiões agrícolas importantes
  { name: "Londrina", value: "Londrina" },
  { name: "Cascavel", value: "Cascavel" },
  { name: "Campo Grande", value: "Campo Grande" },
  { name: "Chapecó", value: "Chapeco" },
  { name: "Dourados", value: "Dourados" },
  { name: "Passo Fundo", value: "Passo Fundo" },
  { name: "Rondonópolis", value: "Rondonopolis" },
];

const API_KEY = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;

function getWeatherIcon(code: number) {
  if (code >= 200 && code < 300)
    return <CloudLightning className="text-yellow-500" style={{ width: '1rem', height: '1rem' }} />;
  if (code >= 300 && code < 600) 
    return <CloudRain className="text-blue-400" style={{ width: '1rem', height: '1rem' }} />;
  if (code >= 600 && code < 700) 
    return <CloudSnow className="text-gray-300" style={{ width: '1rem', height: '1rem' }} />;
  if (code === 800) 
    return <Sun className="text-yellow-400" style={{ width: '1rem', height: '1rem' }} />;
  if (code > 800) 
    return <Cloud className="text-gray-400" style={{ width: '1rem', height: '1rem' }} />;
  return <Cloud className="text-gray-400" style={{ width: '1rem', height: '1rem' }} />;
}

interface ForecastDay {
  date: string;
  weekday: string;
  icon: number;
  max: number;
  min: number;
  desc: string;
}

export function WeatherTicker({ selectedCity }: { selectedCity: string }) {
  const [forecast, setForecast] = useState<ForecastDay[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchForecast() {
      setLoading(true);
      setError(null);
      try {
        // Normaliza o nome da cidade para a API
        let cityQuery = removeAccents(selectedCity);
        // Adiciona ",BR" se não houver país
        if (!cityQuery.match(/,[A-Z]{2,}/i)) {
          cityQuery = `${cityQuery},BR`;
        }
        const res = await fetch(
          `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(
            cityQuery
          )}&appid=${API_KEY}&units=metric&lang=pt_br`
        );
        const data = await res.json();

        if (!data.list) {
          setForecast([]);
          setError(data.message || "Cidade não encontrada ou erro na API.");
          setLoading(false);
          return;
        }

        // Agrupa por dia
        const days: Record<string, any[]> = {};
        data.list.forEach((item: any) => {
          const day = item.dt_txt.split(" ")[0];
          if (!days[day]) days[day] = [];
          days[day].push(item);
        });
        // Pega os próximos 5 dias
        const forecastArr: ForecastDay[] = Object.entries(days)
          .slice(0, 5)
          .map(([date, items]: any) => {
            const temps = items.map((i: any) => i.main.temp);
            const min = Math.min(...temps);
            const max = Math.max(...temps);
            // Pega o ícone e descrição do primeiro horário do dia
            const icon = items[0].weather[0].id;
            const desc = items[0].weather[0].description;
            const weekday = new Date(date).toLocaleDateString("pt-BR", {
              weekday: "short",
            });
            return { date, weekday, icon, max, min, desc };
          });
        setForecast(forecastArr);
        setLoading(false);
      } catch (err) {
        setForecast([]);
        setError("Erro ao buscar previsão do tempo.");
        setLoading(false);
      }
    }
    fetchForecast();
  }, [selectedCity]);

  // Variação percentual baseada na máxima do dia anterior
  const calculateVariation = (current: number, previous: number) => {
    if (!previous) return 0;
    return ((current - previous) / previous) * 100;
  };

  return (
    <div className="w-full relative">
      <style jsx global>{`
        .weather-ticker-container {
          width: 100%;
          position: relative;
          overflow: hidden;
          height: 2.5rem;
          background-color: #000000;
          border-bottom: 1px solid #1a1a1a;
        }
        
        .weather-ticker-wrapper {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          white-space: nowrap;
          overflow: hidden;
        }
        
        .weather-ticker-track {
          position: absolute;
          height: 100%;
          display: inline-flex;
          animation: weatherTickerScroll 40s linear infinite;
          will-change: transform;
        }
        
        @keyframes weatherTickerScroll {
          0% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        
        .weather-ticker-item {
          display: flex;
          align-items: center;
          height: 100%;
          padding: 0 1.5rem;
          white-space: nowrap;
          font-size: 0.8125rem;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
        }
        
        .weather-ticker-divider {
          position: absolute;
          right: 0;
          top: 0;
          bottom: 0;
          width: 1px;
          background-color: #1a1a1a;
          z-index: 10;
        }
        
        .weather-ticker-fade {
          position: absolute;
          right: 0;
          top: 0;
          bottom: 0;
          width: 60px;
          background: linear-gradient(to right, transparent, #000000);
          z-index: 5;
          pointer-events: none;
        }
        
        .weather-ticker-city {
          color: #9ca3af;
          margin-right: 0.75rem;
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.025em;
          font-weight: 500;
        }
        
        .weather-ticker-temp {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          color: #ffffff;
          font-weight: 600;
          font-size: 0.8125rem;
        }
        
        .weather-ticker-icon {
          width: 1rem;
          height: 1rem;
        }
        
        .weather-ticker-minmax {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin-left: 0.5rem;
        }
        
        .weather-temp-high {
          color: #ef4444;
          font-size: 0.75rem;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 0.125rem;
        }
        
        .weather-temp-low {
          color: #3b82f6;
          font-size: 0.75rem;
          font-weight: 500;
          display: flex;
          align-items: center;
          gap: 0.125rem;
        }
        
        .weather-ticker-desc {
          color: #6b7280;
          font-size: 0.75rem;
          margin-left: 0.75rem;
        }
        
        .weather-ticker-variation {
          font-size: 0.75rem;
          font-weight: 600;
          padding: 0.125rem 0.375rem;
          border-radius: 0.25rem;
          margin-left: 0.5rem;
        }
        
        .weather-value-positive {
          color: #10b981;
          background-color: rgba(16, 185, 129, 0.1);
        }
        
        .weather-value-negative {
          color: #3b82f6;
          background-color: rgba(59, 130, 246, 0.1);
        }
        
        .weather-value-neutral {
          color: #6b7280;
          background-color: rgba(107, 114, 128, 0.1);
        }
      `}</style>
      <div className="weather-ticker-container">
        {loading ? (
          <div className="h-full flex items-center px-4 text-gray-500 animate-pulse">
            Carregando...
          </div>
        ) : error ? (
          <div className="h-full flex items-center px-4 text-red-400">
            {error}
          </div>
        ) : (
          <div className="weather-ticker-wrapper">
            <div className="weather-ticker-track">
              {[...forecast, ...forecast].map((item, idx) => {
                const prev =
                  idx === 0 ? null : forecast[(idx - 1) % forecast.length];
                const variation = prev
                  ? calculateVariation(item.max, prev.max)
                  : 0;
                const isPositive = variation > 0;
                const isNeutral = variation === 0;
                const variationClass = isNeutral 
                  ? "weather-value-neutral"
                  : isPositive 
                  ? "weather-value-positive" 
                  : "weather-value-negative";
                
                return (
                  <div key={idx} className="weather-ticker-item">
                    <span className="weather-ticker-city">{item.weekday.toUpperCase()}</span>
                    
                    <div className="weather-ticker-temp">
                      <span className="weather-ticker-icon">
                        {getWeatherIcon(item.icon)}
                      </span>
                      <span>{Math.round(item.max)}°</span>
                    </div>

                    <div className="weather-ticker-minmax">
                      <span className="weather-temp-high">
                        ↑ {Math.round(item.max)}°
                      </span>
                      <span className="weather-temp-low">
                        ↓ {Math.round(item.min)}°
                      </span>
                    </div>

                    {prev && (
                      <span className={`weather-ticker-variation ${variationClass}`}>
                        {isPositive ? "↑" : isNeutral ? "→" : "↓"} {Math.abs(variation).toFixed(1)}%
                      </span>
                    )}
                    
                    <span className="weather-ticker-desc">
                      {item.desc}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        <div className="weather-ticker-fade"></div>
        <div className="weather-ticker-divider"></div>
      </div>
    </div>
  );
}
