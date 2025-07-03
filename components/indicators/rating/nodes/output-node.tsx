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
    <Card className="p-4 min-w-[160px] bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
      <div className="space-y-2 text-center">
        <div className="flex items-center justify-center gap-2">
          <Award className="h-5 w-5 text-primary" />
          <h3 className="font-semibold text-sm">{data.label}</h3>
        </div>
        
        <div className="flex items-center justify-center gap-3">
          <div className="text-2xl font-bold">
            {score.toFixed(1)}
          </div>
          
          <Badge className={`${rating.color} text-white px-2 py-0.5 text-sm`}>
            {rating.letra}
          </Badge>
        </div>
      </div>

      <Handle
        type="target"
        position={Position.Left}
        className="w-3 h-3 bg-primary border-2 border-white shadow-md hover:w-4 hover:h-4 transition-all"
        title="Conecte as métricas aqui"
      />
    </Card>
  );
}