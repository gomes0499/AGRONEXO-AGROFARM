"use client";

import { useState } from "react";
import { WeatherTicker, CITIES } from "@/components/dashboard/weather-ticker";
import { Cloud } from "lucide-react";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

export function WeatherTickerBar() {
  const [selectedCity, setSelectedCity] = useState(CITIES[0].value);

  return (
    <div className="w-full border-b bg-background">
      <div className="container flex items-center h-10">
        <div className="flex items-center space-x-2 text-sm text-muted-foreground font-medium pr-4 border-r">
          <Cloud className="h-4 w-4 ml-4 text-primary" />
          <Select value={selectedCity} onValueChange={setSelectedCity}>
            <SelectTrigger className="w-[180px] h-8 bg-muted/40">
              {CITIES.find((city) => city.value === selectedCity)?.name ||
                selectedCity}
            </SelectTrigger>
            <SelectContent>
              {CITIES.map((city) => (
                <SelectItem key={city.value} value={city.value}>
                  {city.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex-1">
          <WeatherTicker selectedCity={selectedCity} />
        </div>
      </div>
    </div>
  );
}
