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
    return <CloudLightning className="text-yellow-400 dark:text-yellow-300" />;
  if (code >= 300 && code < 600) return <CloudRain className="text-blue-400 dark:text-blue-300" />;
  if (code >= 600 && code < 700) return <CloudSnow className="text-blue-200 dark:text-blue-100" />;
  if (code === 800) return <Sun className="text-yellow-500 dark:text-yellow-400" />;
  if (code > 800) return <Cloud className="text-gray-500 dark:text-gray-400" />;
  return <Cloud className="text-gray-500 dark:text-gray-400" />;
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
        .ticker-container {
          width: 100%;
          position: relative;
          overflow: hidden;
          height: 2.5rem;
          background-color: #f9fafb;
        }
        .dark .ticker-container {
          background-color: #0a0a0a;
        }
        .ticker-wrapper {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          white-space: nowrap;
          overflow: hidden;
        }
        .ticker-track {
          position: absolute;
          height: 100%;
          display: inline-flex;
          animation: tickerScroll 30s linear infinite;
          will-change: transform;
        }
        @keyframes tickerScroll {
          0% {
            transform: translateX(0%);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .ticker-item {
          display: flex;
          align-items: center;
          height: 100%;
          padding: 0 0.75rem;
          border-right: 1px solid #e5e7eb;
          white-space: nowrap;
          font-size: 0.875rem;
        }
        .dark .ticker-item {
          border-right: 1px solid #27272a;
        }
        .ticker-divider {
          position: absolute;
          right: 0;
          top: 0;
          bottom: 0;
          width: 1px;
          background-color: #e5e7eb;
          z-index: 10;
        }
        .dark .ticker-divider {
          background-color: #27272a;
        }
        .ticker-fade {
          position: absolute;
          right: 0;
          top: 0;
          bottom: 0;
          width: 50px;
          background: linear-gradient(to right, transparent, #f9fafb);
          z-index: 5;
        }
        .dark .ticker-fade {
          background: linear-gradient(to right, transparent, #0a0a0a);
        }
        .ticker-prefix {
          color: #6b7280;
          margin-right: 0.5rem;
        }
        .dark .ticker-prefix {
          color: #a1a1aa;
        }
        .ticker-value {
          font-weight: 600;
          margin-right: 0.25rem;
        }
        .ticker-minmax {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          margin-right: 0.5rem;
          font-size: 0.7rem;
          min-width: 3.5rem;
        }
        .ticker-minmax-item {
          display: flex;
          align-items: center;
        }
        .ticker-variation {
          font-size: 0.75rem;
          font-weight: 500;
          margin-left: 0.25rem;
        }
        .value-positive {
          color: #10b981;
        }
        .value-negative {
          color: #ef4444;
        }
      `}</style>
      <div className="ticker-container">
        {loading ? (
          <div className="h-full flex items-center px-4 text-muted-foreground dark:text-gray-400 animate-pulse">
            Carregando...
          </div>
        ) : error ? (
          <div className="h-full flex items-center px-4 text-red-500 dark:text-red-400">
            {error}
          </div>
        ) : (
          <div className="ticker-wrapper">
            <div className="ticker-track">
              {[...forecast, ...forecast].map((item, idx) => {
                const prev =
                  idx === 0 ? null : forecast[(idx - 1) % forecast.length];
                const variation = prev
                  ? calculateVariation(item.max, prev.max)
                  : 0;
                const isPositive = variation >= 0;
                return (
                  <div key={idx} className="ticker-item">
                    <span className="ticker-prefix">{item.weekday}</span>
                    {getWeatherIcon(item.icon)}

                    <div className="ticker-minmax">
                      <div className="ticker-minmax-item text-orange-500 dark:text-orange-400">
                        <ArrowUp className="h-3 w-3 mr-1" />
                        <span>{Math.round(item.max)}°</span>
                      </div>
                      <div className="ticker-minmax-item text-blue-500 dark:text-blue-400">
                        <ArrowDown className="h-3 w-3 mr-1" />
                        <span>{Math.round(item.min)}°</span>
                      </div>
                    </div>

                    {prev && (
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <span
                              className={`ticker-variation ${
                                isPositive ? "value-positive" : "value-negative"
                              }`}
                            >
                              {isPositive ? "+" : ""}
                              {variation.toFixed(1)}%
                            </span>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>
                              Variação da temperatura máxima em relação ao dia
                              anterior
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    )}
                    <span className="text-xs text-muted-foreground dark:text-gray-400 ml-2">
                      {item.desc}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        <div className="ticker-fade"></div>
        <div className="ticker-divider"></div>
      </div>
    </div>
  );
}
