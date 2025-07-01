import { NextRequest } from "next/server";

// Função para remover acentos
function removeAccents(str: string) {
  return str.normalize("NFD").replace(/\p{Diacritic}/gu, "");
}

interface ForecastDay {
  date: string;
  weekday: string;
  icon: number;
  max: number;
  min: number;
  desc: string;
}

const API_KEY = process.env.OPENWEATHER_API_KEY || process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;

async function fetchWeatherData(city: string): Promise<ForecastDay[]> {
  try {
    // Normaliza o nome da cidade para a API
    let cityQuery = removeAccents(city);
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
      throw new Error(data.message || "Cidade não encontrada ou erro na API.");
    }

    // Agrupa por dia
    interface WeatherItem {
      dt_txt: string;
      main: {
        temp: number;
      };
      weather: Array<{
        id: number;
        description: string;
      }>;
    }
    
    const days: Record<string, WeatherItem[]> = {};
    data.list.forEach((item: WeatherItem) => {
      const day = item.dt_txt.split(" ")[0];
      if (!days[day]) days[day] = [];
      days[day].push(item);
    });
    
    // Pega os próximos 5 dias
    const forecastArr: ForecastDay[] = Object.entries(days)
      .slice(0, 5)
      .map(([date, items]) => {
        const temps = items.map((i) => i.main.temp);
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
      
    return forecastArr;
  } catch (error) {
    console.error("Erro ao buscar dados do tempo:", error);
    throw error;
  }
}

export async function GET(request: NextRequest) {
  const city = request.nextUrl.searchParams.get("city") || "Sorriso";

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      // Enviar dados iniciais
      try {
        const initialData = await fetchWeatherData(city);
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ forecast: initialData })}\n\n`)
        );
      } catch {
        controller.enqueue(
          encoder.encode(`data: ${JSON.stringify({ error: "Erro ao buscar dados iniciais" })}\n\n`)
        );
      }

      // Atualizar a cada 30 minutos (1800000 ms)
      const interval = setInterval(async () => {
        try {
          const updatedData = await fetchWeatherData(city);
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ forecast: updatedData })}\n\n`)
          );
        } catch {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify({ error: "Erro ao atualizar dados" })}\n\n`)
          );
        }
      }, 1800000); // 30 minutos

      // Limpar intervalo quando a conexão for fechada
      request.signal.addEventListener("abort", () => {
        clearInterval(interval);
        controller.close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}