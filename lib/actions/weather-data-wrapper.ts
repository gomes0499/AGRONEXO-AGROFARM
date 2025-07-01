import { cache } from "react";
import { createClient } from "@/lib/supabase/server";
import { getWeatherForecast, groupForecastByDay } from "./weather-data-actions";

export interface WeatherDataFormatted {
  location: string;
  current: {
    temp: number;
    condition: string;
    humidity: number;
    windSpeed: number;
  };
  forecast: Array<{
    date: string;
    condition: string;
    tempMax: number;
    tempMin: number;
    rainChance: number;
  }>;
}

/**
 * Get weather data for organization location
 */
export const getWeatherData = cache(async (organizationId: string): Promise<WeatherDataFormatted | null> => {
  try {
    const supabase = await createClient();
    
    // Get organization location
    const { data: org } = await supabase
      .from("organizacoes")
      .select("cidade, estado")
      .eq("id", organizationId)
      .single();

    if (!org?.cidade) {
      return null;
    }

    // Get weather data
    const { currentWeather, error } = await getWeatherForecast(org.cidade);
    
    if (error || !currentWeather) {
      return null;
    }

    // Group by day
    const dailyForecast = await groupForecastByDay(currentWeather.list);
    const forecastDays = Object.keys(dailyForecast).slice(0, 3);

    // Format data
    return {
      location: `${currentWeather.city.name}, ${org.estado}`,
      current: {
        temp: Math.round(currentWeather.list[0].main.temp),
        condition: currentWeather.list[0].weather[0].description,
        humidity: currentWeather.list[0].main.humidity,
        windSpeed: currentWeather.list[0].wind.speed,
      },
      forecast: forecastDays.map(day => {
        const dayData = dailyForecast[day];
        const temps = dayData.map(d => d.main.temp);
        const hasRain = dayData.some(d => d.weather[0].id >= 500 && d.weather[0].id < 600);
        
        return {
          date: day,
          condition: dayData[0].weather[0].description,
          tempMax: Math.round(Math.max(...temps)),
          tempMin: Math.round(Math.min(...temps)),
          rainChance: hasRain ? 80 : 20,
        };
      }),
    };
  } catch (error) {
    console.error("Error formatting weather data:", error);
    return null;
  }
});