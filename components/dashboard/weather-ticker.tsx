// components/dashboard/weather-ticker.tsx

"use client";

import { useEffect, useState } from "react";
import { Sun, Cloud, CloudRain, CloudSnow, CloudLightning } from "lucide-react";
import { cn } from "@/lib/utils";

// Função para remover acentos
function removeAccents(str: string) {
  return str.normalize("NFD").replace(/\p{Diacritic}/gu, "");
}

export const CITIES = [
  { name: "Sorriso", value: "Sorriso" },
  { name: "Ribeirao Preto", value: "Ribeirao Preto" },
  { name: "Londrina", value: "Londrina" },
  { name: "Uberaba", value: "Uberaba" },
  { name: "Luis Eduardo Magalhaes", value: "Luis Eduardo Magalhaes" },
  { name: "Campo Grande", value: "Campo Grande" },
  { name: "Chapeco", value: "Chapeco" },
  { name: "Barreiras", value: "Barreiras" },
  { name: "Cascavel", value: "Cascavel" },
  { name: "Sinop", value: "Sinop" },
];

const API_KEY = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;

function getWeatherIcon(code: number) {
  if (code >= 200 && code < 300)
    return <CloudLightning className="text-yellow-400" />;
  if (code >= 300 && code < 600) return <CloudRain className="text-blue-400" />;
  if (code >= 600 && code < 700) return <CloudSnow className="text-blue-200" />;
  if (code === 800) return <Sun className="text-yellow-500" />;
  if (code > 800) return <Cloud className="text-gray-500" />;
  return <Cloud className="text-gray-500" />;
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
          border-left: 1px solid #e5e7eb;
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
        .ticker-divider {
          position: absolute;
          right: 0;
          top: 0;
          bottom: 0;
          width: 1px;
          background-color: #e5e7eb;
          z-index: 10;
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
        .ticker-prefix {
          color: #6b7280;
          margin-right: 0.5rem;
        }
        .ticker-value {
          font-weight: 600;
          margin-right: 0.25rem;
        }
        .ticker-variation {
          font-size: 0.75rem;
          font-weight: 500;
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
          <div className="h-full flex items-center px-4 text-muted-foreground animate-pulse">
            Carregando previsão...
          </div>
        ) : error ? (
          <div className="h-full flex items-center px-4 text-red-500">
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
                    <span className="ticker-value">
                      {Math.round(item.max)}°C
                    </span>
                    {prev && (
                      <span
                        className={`ticker-variation ${
                          isPositive ? "value-positive" : "value-negative"
                        }`}
                      >
                        {isPositive ? "+" : ""}
                        {variation.toFixed(1)}%
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground ml-2">
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
