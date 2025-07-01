"use server";

const API_KEY = process.env.OPENWEATHER_API_KEY || process.env.NEXT_PUBLIC_OPENWEATHER_API_KEY;

export interface WeatherData {
  city: {
    name: string;
    country: string;
  };
  list: Array<{
    dt: number;
    dt_txt: string;
    main: {
      temp: number;
      feels_like: number;
      humidity: number;
      pressure: number;
    };
    weather: Array<{
      id: number;
      description: string;
    }>;
    wind: {
      speed: number;
    };
  }>;
}

export interface WeatherForecast {
  currentWeather: WeatherData | null;
  error?: string;
}

export async function getWeatherForecast(city: string = "São Paulo"): Promise<WeatherForecast> {
  if (!API_KEY) {
    console.error("OpenWeather API key not configured");
    return { 
      currentWeather: null, 
      error: "API key não configurada" 
    };
  }

  try {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/forecast?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric&lang=pt_br`,
      {
        next: { revalidate: 3600 } // Cache for 1 hour
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        return { 
          currentWeather: null, 
          error: "Cidade não encontrada" 
        };
      }
      throw new Error(`Weather API error: ${response.status}`);
    }

    const data = await response.json();
    
    return {
      currentWeather: data
    };
  } catch (error) {
    console.error("Erro ao buscar dados do clima:", error);
    return {
      currentWeather: null,
      error: "Erro ao buscar dados do clima"
    };
  }
}

// Helper function to group forecast by day
export async function groupForecastByDay(list: WeatherData['list']) {
  const days: Record<string, typeof list> = {};
  
  list.forEach((item) => {
    const day = item.dt_txt.split(" ")[0];
    if (!days[day]) days[day] = [];
    days[day].push(item);
  });
  
  return days;
}

// Helper function to get weather icon type
export async function getWeatherIconType(code: number): Promise<'lightning' | 'rain' | 'snow' | 'sun' | 'cloud'> {
  if (code >= 200 && code < 300) return 'lightning';
  if (code >= 300 && code < 600) return 'rain';
  if (code >= 600 && code < 700) return 'snow';
  if (code === 800) return 'sun';
  return 'cloud';
}