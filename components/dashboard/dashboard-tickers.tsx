"use client";

import { MarketTicker } from "@/components/dashboard/market-ticker";
import { WeatherTickerBar } from "@/components/dashboard/weather-ticker-bar";
import { DollarSign } from "lucide-react";

interface DashboardTickersProps {
  commercialPrices?: any;
}

export function DashboardTickers({ commercialPrices }: DashboardTickersProps) {
  return (
    <>
      {/* Market Ticker - full width */}
      <div className="w-full border-b bg-muted/30">
        <div className="container flex items-center h-10">
          <div className="flex items-center space-x-2 text-sm text-muted-foreground font-medium pr-4 border-r">
            <DollarSign className="h-4 w-4 ml-4 text-primary" />
          </div>
          <div className="flex-1">
            <MarketTicker commercialPrices={commercialPrices} />
          </div>
        </div>
      </div>

      {/* Weather Ticker */}
      <WeatherTickerBar />
    </>
  );
}
