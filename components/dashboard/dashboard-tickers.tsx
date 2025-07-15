"use client";

import { MarketTicker } from "@/components/dashboard/market-ticker";
import { WeatherTickerBar } from "@/components/dashboard/weather-ticker-bar";
import { NewsTicker } from "@/components/dashboard/news-ticker";
import { DollarSign } from "lucide-react";

interface DashboardTickersProps {
  commercialPrices?: any;
  rightContent?: React.ReactNode;
}

export function DashboardTickers({ commercialPrices, rightContent }: DashboardTickersProps) {
  return (
    <>
      {/* Market Ticker - full width */}
      <div className="w-full border-b bg-muted/30">
        <div className="w-full flex items-center justify-between h-10 bg-primary">
          <div className="flex items-center flex-1 min-w-0">
            <div className="flex items-center space-x-2 text-sm text-muted-foreground font-medium pr-4 flex-shrink-0">
              <DollarSign className="h-4 w-4 ml-4 text-white" />
            </div>
            <div className="flex-1 min-w-0 overflow-hidden">
              <MarketTicker commercialPrices={commercialPrices} />
            </div>
          </div>
          
          {/* Right content - like projection selector */}
          {rightContent && (
            <div className="ml-4 mr-4 flex-shrink-0">
              {rightContent}
            </div>
          )}
        </div>
      </div>

      {/* Weather Ticker */}
      <WeatherTickerBar />
      
      {/* News Ticker */}
      <NewsTicker />
    </>
  );
}
