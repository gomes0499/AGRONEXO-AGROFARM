"use client";

import type React from "react";

import {
  ArrowUpIcon,
  ArrowDownIcon,
  BanknoteIcon,
  BarChart3Icon,
  CoinsIcon,
  DollarSignIcon,
  GaugeIcon,
  PercentIcon,
  TrendingDownIcon,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

interface KpiItemProps {
  title: string;
  value: string;
  change: string;
  isPositive: boolean;
  icon: React.ReactNode;
}

function KpiItem({ title, value, change, isPositive, icon }: KpiItemProps) {
  return (
    <div className="flex items-start p-5">
      <div className={`rounded-full p-2 mr-3 bg-primary`}>{icon}</div>
      <div>
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
          {title}
        </p>
        <h3 className="text-2xl font-bold mt-1">{value}</h3>
        <p
          className={`flex items-center text-xs font-medium mt-1 ${
            isPositive ? "text-emerald-600" : "text-rose-600"
          }`}
        >
          {isPositive ? (
            <ArrowUpIcon className="h-3 w-3 mr-1" />
          ) : (
            <ArrowDownIcon className="h-3 w-3 mr-1" />
          )}
          {change}
        </p>
      </div>
    </div>
  );
}

export default function AgroKpiCards() {
  return (
    <Card className="w-full bg-white shadow-sm border border-gray-100 rounded-lg overflow-hidden">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        {/* Faturamento Total */}
        <div className="relative">
          <KpiItem
            title="Faturamento Total"
            value="R$ 2.45M"
            change="+12% vs último ano"
            isPositive={true}
            icon={<BanknoteIcon className="h-5 w-5 text-white" />}
          />
          <div className="absolute top-5 bottom-5 right-0 w-px bg-gray-200 hidden lg:block"></div>
        </div>

        {/* EBITDA */}
        <div className="relative">
          <KpiItem
            title="EBITDA"
            value="R$ 875K"
            change="+8.3% vs último ano"
            isPositive={true}
            icon={<BarChart3Icon className="h-5 w-5 text-white" />}
          />
          <div className="absolute top-5 bottom-5 right-0 w-px bg-gray-200 hidden lg:block"></div>
        </div>

        {/* Margem EBITDA */}
        <div className="relative">
          <KpiItem
            title="Margem EBITDA"
            value="35.7%"
            change="-2.1% vs último ano"
            isPositive={false}
            icon={<PercentIcon className="h-5 w-5 text-white" />}
          />
          <div className="absolute top-5 bottom-5 right-0 w-px bg-gray-200 hidden lg:block"></div>
        </div>

        {/* Lucro Líquido */}
        <div>
          <KpiItem
            title="Lucro Líquido"
            value="R$ 620K"
            change="+5.2% vs último ano"
            isPositive={true}
            icon={<CoinsIcon className="h-5 w-5 text-white" />}
          />
        </div>
      </div>

      <Separator className="bg-gray-200" />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
        {/* Margem Líquida */}
        <div className="relative">
          <KpiItem
            title="Margem Líquida"
            value="25.3%"
            change="+0.5% vs último ano"
            isPositive={true}
            icon={<PercentIcon className="h-5 w-5 text-white" />}
          />
          <div className="absolute top-5 bottom-5 right-0 w-px bg-gray-200 hidden lg:block"></div>
        </div>

        {/* Dívida Total */}
        <div className="relative">
          <KpiItem
            title="Dívida Total"
            value="R$ 1.2M"
            change="-7.8% vs último ano"
            isPositive={true}
            icon={<DollarSignIcon className="h-5 w-5 text-white" />}
          />
          <div className="absolute top-5 bottom-5 right-0 w-px bg-gray-200 hidden lg:block"></div>
        </div>

        {/* Dívida Líquida */}
        <div className="relative">
          <KpiItem
            title="Dívida Líquida"
            value="R$ 950K"
            change="-10.2% vs último ano"
            isPositive={true}
            icon={<TrendingDownIcon className="h-5 w-5 text-white" />}
          />
          <div className="absolute top-5 bottom-5 right-0 w-px bg-gray-200 hidden lg:block"></div>
        </div>

        {/* Dívida/EBITDA */}
        <div>
          <KpiItem
            title="Dívida/EBITDA"
            value="1.09x"
            change="-0.15x vs último ano"
            isPositive={true}
            icon={<GaugeIcon className="h-5 w-5 text-white" />}
          />
        </div>
      </div>
    </Card>
  );
}
