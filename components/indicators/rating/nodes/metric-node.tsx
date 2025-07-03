"use client";

import { Handle, Position, NodeProps, useReactFlow } from "reactflow";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { RatingMetric } from "@/schemas/rating";

export interface MetricNodeData {
  metric: RatingMetric;
  weight: number;
  value?: number;
  score?: number;
}

export function MetricNode({ data, id }: NodeProps<MetricNodeData>) {
  const { setNodes } = useReactFlow();
  
  const handleWeightChange = (value: string) => {
    const weight = Math.min(100, Math.max(0, parseInt(value) || 0));
    setNodes((nodes) =>
      nodes.map((node) => {
        if (node.id === id) {
          return {
            ...node,
            data: {
              ...node.data,
              weight,
            },
          };
        }
        return node;
      })
    );
  };

  const handleValueChange = (value: string) => {
    const numValue = parseFloat(value) || 0;
    setNodes((nodes) =>
      nodes.map((node) => {
        if (node.id === id) {
          return {
            ...node,
            data: {
              ...node.data,
              value: numValue,
            },
          };
        }
        return node;
      })
    );
  };

  const isQuantitative = data.metric.tipo === "QUANTITATIVE";

  return (
    <Card className="p-4 min-w-[250px] bg-white shadow-lg">
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold text-sm">{data.metric.nome}</h4>
          <Badge variant={isQuantitative ? "default" : "secondary"}>
            {isQuantitative ? "Quantitativa" : "Qualitativa"}
          </Badge>
        </div>

        <div className="text-xs text-muted-foreground">
          {data.metric.descricao}
        </div>

        {/* Weight control */}
        <div className="space-y-1">
          <Label className="text-xs">Peso (%)</Label>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min="0"
              max="100"
              step="5"
              value={data.weight}
              onChange={(e) => handleWeightChange(e.target.value)}
              className="h-8 text-sm"
            />
            <span className="text-xs text-muted-foreground">%</span>
          </div>
        </div>

        {/* Value input for qualitative metrics */}
        {!isQuantitative && (
          <div className="space-y-1">
            <Label className="text-xs">Valor (0-100)</Label>
            <Input
              type="number"
              min="0"
              max="100"
              value={data.value || 0}
              onChange={(e) => handleValueChange(e.target.value)}
              className="h-8 text-sm"
            />
          </div>
        )}

        {/* Current score display */}
        {data.score !== undefined && (
          <div className="pt-2 border-t">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Pontuação:</span>
              <span className="font-semibold">
                {typeof data.score === 'number' ? data.score.toFixed(1) : '0.0'}
              </span>
            </div>
          </div>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="w-3 h-3 bg-primary border-2 border-white shadow-md hover:w-4 hover:h-4 transition-all cursor-crosshair"
        title="Arraste para conectar ao Rating Final"
      />
    </Card>
  );
}