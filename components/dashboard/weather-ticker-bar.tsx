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
    <div className="w-full" style={{ backgroundColor: "#000000" }}>
      <div className="w-full flex items-center h-10">
        <div
          className="flex items-center space-x-2 text-sm font-medium pr-4"
          style={{ borderRight: "1px solid #1a1a1a" }}
        >
          <Cloud className="h-4 w-4 ml-4" style={{ color: "#6b7280" }} />
          <Select value={selectedCity} onValueChange={setSelectedCity} >
            <SelectTrigger
              className="w-[180px] h-8 border-0 bg-gray-800 text-white"
              style={{
                backgroundColor: "primary",
              }}
            >
              {CITIES.find((city) => city.value === selectedCity)?.name ||
                selectedCity}
            </SelectTrigger>
            <SelectContent
              style={{
                backgroundColor: "#0a0a0a",
                border: "1px solid #1a1a1a",
              }}
            >
              {CITIES.map((city) => (
                <SelectItem
                  key={city.value}
                  value={city.value}
                  className="text-white"
                >
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
