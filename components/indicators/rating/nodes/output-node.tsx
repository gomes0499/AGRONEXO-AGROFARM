"use client";

import { Handle, Position, NodeProps } from "reactflow";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Award } from "lucide-react";

export interface OutputNodeData {
  label: string;
  score: number;
}

export function OutputNode({ data }: NodeProps<OutputNodeData>) {
  const getRatingFromScore = (score: number) => {
    if (score >= 90) return { letra: "AAA", color: "bg-green-500" };
    if (score >= 80) return { letra: "AA", color: "bg-green-400" };
    if (score >= 70) return { letra: "A", color: "bg-lime-500" };
    if (score >= 60) return { letra: "BBB", color: "bg-yellow-500" };
    if (score >= 50) return { letra: "BB", color: "bg-orange-500" };
    if (score >= 40) return { letra: "B", color: "bg-orange-600" };
    return { letra: "C", color: "bg-red-500" };
  };

  const score = typeof data.score === 'number' ? data.score : parseFloat(data.score) || 0;
  const rating = getRatingFromScore(score);

  return (
    <div className="relative">
      <Card className="p-4 min-w-[160px] bg-gradient-to-br from-primary/10 to-primary/5 dark:from-primary/20 dark:to-primary/10 border-2 border-primary/30 dark:border-primary/40 shadow-xl">
        <div className="space-y-2 text-center">
          <div className="flex items-center justify-center gap-2">
            <Award className="h-4 w-4 text-primary dark:text-primary" />
            <h3 className="font-semibold text-sm text-foreground">{data.label}</h3>
          </div>
          
          <div className="flex flex-col items-center gap-1">
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {score.toFixed(1)}
            </div>
            
            <Badge className={`${rating.color} text-white px-2 py-0.5 text-xs font-semibold`}>
              {rating.letra}
            </Badge>
          </div>
        </div>
      </Card>

      <Handle
        type="target"
        position={Position.Left}
        className="absolute top-1/2 -translate-y-1/2 -left-2 w-4 h-4 bg-primary border-2 border-background dark:border-gray-900 shadow-lg hover:scale-125 transition-transform cursor-pointer"
        title="Conecte as métricas aqui"
      />
    </div>
  );
}