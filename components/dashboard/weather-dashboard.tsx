"use client";

import { useState, useEffect } from "react";
import {
  Sun, Cloud, CloudRain, CloudSnow, CloudLightning, Wind, Droplets, Thermometer
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const API_KEY = process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;

function getWeatherIcon(code: number) {
  if (code >= 200 && code < 300) return <CloudLightning className="text-yellow-400" />;
  if (code >= 300 && code < 600) return <CloudRain className="text-blue-400" />;
  if (code >= 600 && code < 700) return <CloudSnow className="text-blue-200" />;
  if (code === 800) return <Sun className="text-yellow-500" />;
  if (code > 800) return <Cloud className="text-gray-500" />;
  return <Cloud className="text-gray-500" />;
}

export function WeatherDashboard() {
  const [city, setCity] = useState("São Paulo");
  const [query, setQuery] = useState("São Paulo");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query) return;
    setLoading(true);
    fetch(
      `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(query)}&appid=${API_KEY}&units=metric&lang=pt_br`
    )
      .then((res) => res.json())
      .then((res) => {
        setData(res);
        setLoading(false);
      });
  }, [query]);

  // Helper: Agrupa por dia
  const groupByDay = (list: any[]) => {
    const days: Record<string, any[]> = {};
    list.forEach((item) => {
      const day = item.dt_txt.split(" ")[0];
      if (!days[day]) days[day] = [];
      days[day].push(item);
    });
    return days;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Clima</CardTitle>
      </CardHeader>
      <CardContent>
        <form
          className="flex gap-2 mb-4"
          onSubmit={e => {
            e.preventDefault();
            setQuery(city);
          }}
        >
          <Input
            value={city}
            onChange={e => setCity(e.target.value)}
            placeholder="Buscar cidade"
          />
          <Button type="submit">Buscar</Button>
        </form>

        {loading && <div>Carregando...</div>}

        {data && data.city && (
          <div>
            {/* Resumo atual */}
            <div className="flex items-center gap-4 mb-2">
              <div>
                <div className="text-lg font-bold">{data.city.name}, {data.city.country}</div>
                <div className="flex items-center gap-2">
                  {getWeatherIcon(data.list[0].weather[0].id)}
                  <span className="text-3xl font-bold">{Math.round(data.list[0].main.temp)}°C</span>
                  <span className="capitalize text-muted-foreground">{data.list[0].weather[0].description}</span>
                </div>
                <div className="text-xs text-muted-foreground">
                  Sensação: {Math.round(data.list[0].main.feels_like)}°C &nbsp;|&nbsp;
                  Umidade: {data.list[0].main.humidity}% &nbsp;|&nbsp;
                  Vento: {Math.round(data.list[0].wind.speed * 3.6)} km/h &nbsp;|&nbsp;
                  Pressão: {data.list[0].main.pressure} hPa
                </div>
              </div>
            </div>

            {/* Gráfico de previsão horária (simplificado) */}
            <div className="my-4">
              <div className="font-semibold mb-1">Próximas horas</div>
              <div className="flex gap-4 overflow-x-auto">
                {data.list.slice(0, 8).map((item: any, idx: number) => (
                  <div key={idx} className="flex flex-col items-center min-w-[60px]">
                    <span className="text-xs">{item.dt_txt.split(' ')[1].slice(0, 5)}</span>
                    {getWeatherIcon(item.weather[0].id)}
                    <span className="font-bold">{Math.round(item.main.temp)}°</span>
                    <span className="text-xs">{Math.round(item.wind.speed * 3.6)}km/h</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Previsão de 5 dias (resumida) */}
            <div className="my-4">
              <div className="font-semibold mb-1">Próximos dias</div>
              <div className="flex gap-4 overflow-x-auto">
                {Object.entries(groupByDay(data.list)).slice(0, 5).map(([day, items]: any, idx) => {
                  const temps = items.map((i: any) => i.main.temp);
                  const min = Math.min(...temps);
                  const max = Math.max(...temps);
                  const icon = items[0].weather[0].id;
                  return (
                    <div key={day} className="flex flex-col items-center min-w-[80px]">
                      <span className="text-xs">{new Date(day).toLocaleDateString('pt-BR', { weekday: 'short', day: '2-digit', month: '2-digit' })}</span>
                      {getWeatherIcon(icon)}
                      <span className="font-bold">{Math.round(max)}° / {Math.round(min)}°</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {!loading && (!data || !data.city) && (
          <div className="text-muted-foreground text-center py-8">
            Nenhum dado encontrado para a cidade.
          </div>
        )}
      </CardContent>
    </Card>
  );
}