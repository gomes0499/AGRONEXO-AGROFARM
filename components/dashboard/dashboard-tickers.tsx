"use client";

import { MarketTicker } from "@/components/dashboard/market-ticker";
import { WeatherTickerBar } from "@/components/dashboard/weather-ticker-bar";
import { NewsTicker } from "@/components/dashboard/news-ticker";
import { DollarSign } from "lucide-react";

interface DashboardTickersProps {
  commercialPrices?: any;
  rightContent?: React.ReactNode;
  visibility?: {
    market: boolean;
    weather: boolean;
    news: boolean;
  };
}

export function DashboardTickers({ commercialPrices, rightContent, visibility }: DashboardTickersProps) {
  // Default all to true if visibility prop is not provided
  const tickerVisibility = visibility || {
    market: true,
    weather: true,
    news: true,
  };

  return (
    <>
      {/* Market Ticker - full width */}
      {tickerVisibility.market && (
        <div className="w-full" style={{ borderBottom: '1px solid #1a1a1a' }}>
          <div className="w-full flex items-center justify-between h-10" style={{ backgroundColor: '#000000' }}>
            <div className="flex items-center flex-1 min-w-0">
              <div className="flex items-center space-x-2 text-sm font-medium pr-4 flex-shrink-0" style={{ borderRight: '1px solid #1a1a1a' }}>
                <DollarSign className="h-4 w-4 ml-4" style={{ color: '#6b7280' }} />
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
      )}

      {/* Weather Ticker */}
      {tickerVisibility.weather && <WeatherTickerBar />}
      
      {/* News Ticker */}
      {tickerVisibility.news && <NewsTicker />}
    </>
  );
}
