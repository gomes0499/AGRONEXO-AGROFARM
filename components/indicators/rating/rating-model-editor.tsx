"use client";

import { useCallback, useState, useEffect } from "react";
import ReactFlow, {
  Node,
  Edge,
  Connection,
  useNodesState,
  useEdgesState,
  addEdge,
  NodeTypes,
  Controls,
  Background,
  Panel,
} from "reactflow";
import "reactflow/dist/style.css";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Save, Calculator, Star, ChevronLeft, ChevronRight, Loader2, Trash2, AlertTriangle } from "lucide-react";
import { MetricNode } from "./nodes/metric-node";
import { OutputNode } from "./nodes/output-node";
import { CreateMetricDialog } from "./create-metric-dialog";
import { CalculateModelRatingModal } from "./calculate-model-rating-modal";
import { RatingResultModal } from "./rating-result-modal";
import type { RatingMetric, RatingModel } from "@/schemas/rating";
import { calculateQuantitativeMetrics } from "@/lib/actions/rating-metrics-calculations";
import { getRatingMetricThresholds } from "@/lib/actions/flexible-rating-actions";
import { getSafras } from "@/lib/actions/production-actions";
import { getProjections } from "@/lib/actions/projections-actions";

const nodeTypes: NodeTypes = {
  metric: MetricNode,
  output: OutputNode,
};

interface RatingModelEditorProps {
  organizationId: string;
  modelId?: string;
  onSave: (modelData: any) => void;
  onDelete?: (modelId: string) => void;
  availableMetrics: RatingMetric[];
  initialModel?: RatingModel | null;
  models?: RatingModel[];
  selectedModelId?: string;
  onModelChange?: (value: string) => void;
}

const initialNodes: Node[] = [
  {
    id: "output",
    type: "output",
    position: { x: 600, y: 300 },
    data: { label: "Rating Final", score: 0 },
  },
];

export function RatingModelEditor({
  organizationId,
  onSave,
  onDelete,
  availableMetrics,
  initialModel,
  models = [],
  selectedModelId = "new",
  onModelChange,
}: RatingModelEditorProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [modelName, setModelName] = useState(initialModel?.nome || "");
  const [modelDescription, setModelDescription] = useState(initialModel?.descricao || "");
  const [showMetricDialog, setShowMetricDialog] = useState(false);
  const [showCalculateModal, setShowCalculateModal] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [ratingResult, setRatingResult] = useState<any>(null);
  const [selectedMetricType, setSelectedMetricType] = useState<"quantitative" | "qualitative">("quantitative");
  const [isPanelCollapsed, setIsPanelCollapsed] = useState(false);
  const [isCalculatingRating, setIsCalculatingRating] = useState(false);
  const [organizationName, setOrganizationName] = useState<string>("");
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [totalWeight, setTotalWeight] = useState(0);


  // Fetch organization name
  useEffect(() => {
    const fetchOrganizationName = async () => {
      try {
        const { createClient } = await import("@/lib/supabase/client");
        const supabase = createClient();
        
        const { data, error } = await supabase
          .from("organizacoes")
          .select("nome")
          .eq("id", organizationId)
          .single();
          
        if (data && !error) {
          setOrganizationName(data.nome);
        }
      } catch (error) {
        console.error("Error fetching organization name:", error);
      }
    };
    
    if (organizationId) {
      fetchOrganizationName();
    }
  }, [organizationId]);

  // Calculate total weight whenever nodes or edges change
  useEffect(() => {
    const connectedNodes = nodes.filter((node) => 
      node.type === "metric" && 
      edges.some((edge) => edge.source === node.id && edge.target === "output")
    );
    
    const total = connectedNodes.reduce((sum, node) => sum + (node.data.weight || 0), 0);
    setTotalWeight(total);
  }, [nodes, edges]);

  useEffect(() => {
    if (initialModel) {
      setModelName(initialModel.nome);
      setModelDescription(initialModel.descricao || "");
      
      // Load saved flow data if available
      if (initialModel.flow_data) {
        try {
          const flowData = typeof initialModel.flow_data === 'string' 
            ? JSON.parse(initialModel.flow_data) 
            : initialModel.flow_data;
          
          if (flowData.nodes && flowData.edges) {
            setNodes(flowData.nodes);
            // Apply consistent style to loaded edges
            const styledEdges = flowData.edges.map((edge: Edge) => ({
              ...edge,
              type: 'smoothstep',
              animated: true,
              style: {
                strokeWidth: 3,
                stroke: '#6366f1',
              },
            }));
            setEdges(styledEdges);
          } else {
            setNodes(initialNodes);
            setEdges([]);
          }
        } catch (error) {
          console.error("Error loading flow data:", error);
          setNodes(initialNodes);
          setEdges([]);
        }
      } else {
        setNodes(initialNodes);
        setEdges([]);
      }
    } else {
      setModelName("");
      setModelDescription("");
      setNodes(initialNodes);
      setEdges([]);
    }
  }, [initialModel, setNodes, setEdges]);

  const onConnect = useCallback(
    (params: Edge | Connection) => {
      // Only allow connections from metric nodes to the output node
      const sourceNode = nodes.find(n => n.id === params.source);
      const targetNode = nodes.find(n => n.id === params.target);
      
      if (sourceNode?.type === "metric" && targetNode?.type === "output") {
        setEdges((eds) => addEdge({
          ...params,
          type: 'smoothstep',
          animated: true,
          style: {
            strokeWidth: 3,
            stroke: '#6366f1',
          },
        }, eds));
      }
    },
    [setEdges, nodes]
  );

  const addMetricNode = useCallback((metric: RatingMetric) => {
    // Verificar se a métrica já foi adicionada
    const metricAlreadyExists = nodes.some(
      (node) => node.type === "metric" && node.data?.metric?.id === metric.id
    );

    if (metricAlreadyExists) {
      toast.error(`A métrica "${metric.nome}" já foi adicionada ao modelo`);
      return;
    }

    const newNode: Node = {
      id: `metric-${Date.now()}`,
      type: "metric",
      position: { x: 450 + Math.random() * 100, y: 100 + Math.random() * 300 },
      data: {
        metric,
        weight: 20,
        value: 0,
        score: 0,
      },
    };
    setNodes((nds) => nds.concat(newNode));
  }, [setNodes, nodes]);


  const handleShowCalculateModal = () => {
    // Check if there are connected nodes
    const connectedNodes = nodes.filter((node) => 
      node.type === "metric" && 
      edges.some((edge) => edge.source === node.id && edge.target === "output")
    );

    if (connectedNodes.length === 0) {
      toast.error("Conecte pelo menos uma métrica ao nó de saída");
      return;
    }

    // Check if total weight is 100%
    if (totalWeight !== 100) {
      toast.warning(
        totalWeight > 100 
          ? `O peso total está em ${totalWeight}%. Ajuste para 100% antes de calcular.`
          : `O peso total está em ${totalWeight}%. Complete até 100% antes de calcular.`
      );
      return;
    }

    setShowCalculateModal(true);
  };

  const calculateFinalScore = async (safraId: string, scenarioId: string | null) => {
    try {
      setIsCalculatingRating(true);
      // Get all metric nodes connected to output
      const connectedNodes = nodes.filter((node) => 
        node.type === "metric" && 
        edges.some((edge) => edge.source === node.id && edge.target === "output")
      );

      // Get quantitative metrics values
      const quantitativeValues = await calculateQuantitativeMetrics(organizationId, safraId, scenarioId);
      
      console.log("Rating calculation - quantitativeValues:", quantitativeValues);
      console.log("Rating calculation - params:", { organizationId, safraId, scenarioId });

      // Get safra and projection names
      const safras = await getSafras(organizationId);
      const safra = safras.find(s => s.id === safraId);
      let scenarioName = "Dados Atuais";
      
      if (scenarioId) {
        const projectionsResult = await getProjections();
        if (!projectionsResult.error && projectionsResult.data) {
          const projection = projectionsResult.data.find(p => p.id === scenarioId);
          if (projection) {
            scenarioName = projection.nome;
          }
        }
      }

      // Calculate weighted average
      let totalWeight = 0;
      let weightedSum = 0;
      const metricResults = [];

      for (const node of connectedNodes) {
        const metric = node.data.metric;
        const weight = node.data.weight || 0;
        let score = 0;

        if (metric.tipo === "QUANTITATIVE") {
          // Get value from calculated metrics
          const value = quantitativeValues[metric.codigo] || 0;
          
          console.log(`Metric ${metric.codigo}: value=${value}`);
          
          // Get thresholds and calculate score
          if (metric.id) {
            const thresholds = await getRatingMetricThresholds(metric.id);
            console.log(`Thresholds for ${metric.codigo}:`, thresholds);
            score = calculateMetricScore(value, thresholds);
            console.log(`Score for ${metric.codigo}: ${score}`);
          } else {
            // Fallback if no thresholds
            score = Math.min(100, Math.max(0, value * 10));
          }
        } else {
          // Use manual value for qualitative metrics
          score = node.data.value || 0;
        }

        const contribution = (score * weight) / 100;
        totalWeight += weight;
        weightedSum += (score * weight);
        
        // Store metric result for detailed view
        metricResults.push({
          nome: metric.nome,
          codigo: metric.codigo,
          categoria: metric.categoria || "GERAL",
          valor: metric.tipo === "QUANTITATIVE" ? quantitativeValues[metric.codigo] || 0 : node.data.value || 0,
          peso: weight,
          pontuacao: score,
          contribuicao: contribution,
          unidade: metric.unidade,
        });
        
        // Update node with calculated score
        setNodes((nds) =>
          nds.map((n) => {
            if (n.id === node.id) {
              return {
                ...n,
                data: {
                  ...n.data,
                  score,
                },
              };
            }
            return n;
          })
        );
      }

      const finalScore = totalWeight > 0 ? weightedSum / totalWeight : 0;

      // Update output node
      setNodes((nds) =>
        nds.map((node) => {
          if (node.id === "output") {
            return {
              ...node,
              data: {
                ...node.data,
                score: finalScore,
              },
            };
          }
          return node;
        })
      );

      // Get rating letter and color
      const getRating = (score: number) => {
        if (score >= 90) return { letra: "AAA", color: "bg-green-500" };
        if (score >= 80) return { letra: "AA", color: "bg-green-400" };
        if (score >= 70) return { letra: "A", color: "bg-lime-500" };
        if (score >= 60) return { letra: "BBB", color: "bg-yellow-500" };
        if (score >= 50) return { letra: "BB", color: "bg-orange-500" };
        if (score >= 40) return { letra: "B", color: "bg-orange-600" };
        return { letra: "C", color: "bg-red-500" };
      };

      const rating = getRating(finalScore);

      // Set result and show modal
      setRatingResult({
        modelName: modelName || "Modelo sem nome",
        safraName: safra?.nome || "Safra não especificada",
        scenarioName,
        finalScore,
        rating: rating.letra,
        ratingColor: rating.color,
        metrics: metricResults,
        calculatedAt: new Date(),
        organizationName: organizationName,
      });
      
      setShowResultModal(true);
    } catch (error) {
      console.error("Error calculating score:", error);
      toast.error("Erro ao calcular pontuação");
    } finally {
      setIsCalculatingRating(false);
    }
  };

  // Helper function to calculate metric score based on thresholds
  const calculateMetricScore = (value: number, thresholds: any[]): number => {
    if (thresholds.length === 0) return 0;

    // Sort thresholds by score descending
    const sortedThresholds = [...thresholds].sort((a, b) => b.pontuacao - a.pontuacao);

    for (const threshold of sortedThresholds) {
      const meetsMin = threshold.valor_min === null || value >= (threshold.valor_min || 0);
      const meetsMax = threshold.valor_max === null || value <= (threshold.valor_max || 0);

      if (meetsMin && meetsMax) {
        return threshold.pontuacao;
      }
    }

    // If no threshold matches, return the lowest score
    return sortedThresholds[sortedThresholds.length - 1]?.pontuacao || 0;
  };

  const handleDelete = async () => {
    if (!initialModel?.id || !onDelete) return;
    
    if (initialModel.is_default) {
      toast.error("Não é possível excluir o modelo padrão");
      return;
    }
    
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!initialModel?.id || !onDelete) return;
    
    try {
      onDelete(initialModel.id);
      toast.success("Modelo excluído com sucesso");
      setShowDeleteDialog(false);
    } catch (error) {
      console.error("Error deleting model:", error);
      toast.error("Erro ao excluir modelo");
    }
  };

  const handleSave = async () => {
    if (!modelName) {
      toast.error("Informe o nome do modelo");
      return;
    }

    // Get connected metrics with weights
    const connectedMetrics = nodes
      .filter((node) => 
        node.type === "metric" && 
        edges.some((edge) => edge.source === node.id && edge.target === "output")
      )
      .map((node) => ({
        rating_metric_id: node.data.metric.id,
        peso: node.data.weight,
      }));

    if (connectedMetrics.length === 0) {
      toast.error("Adicione e conecte pelo menos uma métrica ao nó Rating Final");
      return;
    }

    // Check if total weight is 100%
    const totalWeight = connectedMetrics.reduce((sum, metric) => sum + metric.peso, 0);
    if (totalWeight !== 100) {
      toast.error(
        totalWeight > 100 
          ? `O peso total está em ${totalWeight}%. Ajuste para exatamente 100%.`
          : `O peso total está em ${totalWeight}%. Complete até 100% antes de salvar.`
      );
      return;
    }

    // Save flow data as JSON string for database storage
    const flowData = JSON.stringify({ nodes, edges });

    onSave({
      nome: modelName,
      descricao: modelDescription,
      metrics: connectedMetrics,
      flow_data: flowData,
    });
  };

  return (
    <div className="h-[800px] w-full">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        nodeTypes={nodeTypes}
        fitView
      >
        <Background />
        <Controls position="bottom-right" />
        
        {/* Loading overlay */}
        {isCalculatingRating && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-background rounded-lg p-6 shadow-xl flex flex-col items-center gap-4 dark:bg-gray-900 dark:border dark:border-gray-700">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-lg font-medium">Calculando Rating...</p>
              <p className="text-sm text-muted-foreground">Analisando métricas e indicadores</p>
            </div>
          </div>
        )}
        
        {/* Action buttons top-right */}
        <Panel position="top-right" className="mr-2">
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={handleShowCalculateModal}
              size="sm"
              className="bg-background shadow-sm dark:bg-gray-800 dark:hover:bg-gray-700"
            >
              <Calculator className="h-4 w-4 mr-2" />
              Calcular
            </Button>
            
            <Button 
              onClick={handleSave} 
              size="sm"
              className="shadow-sm"
            >
              <Save className="h-4 w-4 mr-2" />
              Salvar Modelo
            </Button>
            
            {initialModel && selectedModelId !== "new" && !initialModel.is_default && (
              <Button 
                onClick={handleDelete}
                variant="destructive"
                size="sm"
                className="shadow-sm"
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
              </Button>
            )}
          </div>
        </Panel>
        
        <Panel position="top-left" className={`bg-background/95 dark:bg-background/95 backdrop-blur-sm rounded-lg shadow-lg border dark:border-gray-700 h-[80vh] my-4 flex flex-col transition-all duration-300 ${isPanelCollapsed ? 'w-12' : 'w-96'}`}>
          {/* Collapse/Expand Button */}
          <div className={`flex justify-end p-2 border-b ${isPanelCollapsed ? 'border-transparent' : ''}`}>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsPanelCollapsed(!isPanelCollapsed)}
              className="h-8 w-8 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              {isPanelCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            </Button>
          </div>
          
          <div className={`p-4 flex-1 overflow-y-auto space-y-4 min-h-0 ${isPanelCollapsed ? 'hidden' : ''}`}>
            <div>
              <Label className="text-sm font-medium">Selecionar Modelo</Label>
              <Select value={selectedModelId} onValueChange={onModelChange}>
                <SelectTrigger className="w-full mt-1">
                  <SelectValue placeholder="Selecione um modelo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="new">
                    <div className="flex items-center gap-2">
                      <Plus className="h-4 w-4" />
                      <span>Criar Novo Modelo</span>
                    </div>
                  </SelectItem>
                  {models.length > 0 && (
                    <>
                      <div className="border-t my-1" />
                      {models.map((model) => (
                        <SelectItem key={model.id} value={model.id!}>
                          <div className="flex items-center gap-2">
                            {model.is_default && <Star className="h-4 w-4 text-yellow-500" />}
                            <span>{model.nome}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="model-name" className="text-sm font-medium">Nome do Modelo</Label>
              <Input
                id="model-name"
                value={modelName}
                onChange={(e) => setModelName(e.target.value)}
                placeholder="Ex: Modelo Conservador"
                className="mt-1"
              />
            </div>
            
            <div>
              <Label htmlFor="model-description" className="text-sm font-medium">Descrição</Label>
              <Input
                id="model-description"
                value={modelDescription}
                onChange={(e) => setModelDescription(e.target.value)}
                placeholder="Descrição do modelo"
                className="mt-1"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Adicionar Métrica</Label>
              <Select value={selectedMetricType} onValueChange={(v: any) => setSelectedMetricType(v)}>
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="quantitative">Quantitativa</SelectItem>
                  <SelectItem value="qualitative">Qualitativa</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex flex-col gap-2 max-h-[200px] overflow-y-auto border dark:border-gray-700 rounded-md p-2 dark:bg-gray-900/50">
                {availableMetrics
                  .filter((m) => m.tipo === selectedMetricType.toUpperCase())
                  .map((metric) => {
                    const isAlreadyAdded = nodes.some(
                      (node) => node.type === "metric" && node.data?.metric?.id === metric.id
                    );
                    
                    return (
                      <Button
                        key={metric.id}
                        variant={isAlreadyAdded ? "secondary" : "outline"}
                        size="sm"
                        onClick={() => addMetricNode(metric)}
                        className={`justify-start text-xs ${
                          isAlreadyAdded ? "opacity-50 cursor-not-allowed" : ""
                        }`}
                        disabled={isAlreadyAdded}
                      >
                        <Plus className="h-3 w-3 mr-1" />
                        {metric.nome}
                        {isAlreadyAdded && (
                          <span className="ml-auto text-xs text-muted-foreground">(Adicionada)</span>
                        )}
                      </Button>
                    );
                  })}
              </div>

              <Button
                variant="outline"
                onClick={() => setShowMetricDialog(true)}
                className="w-full mt-2"
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Criar Nova Métrica
              </Button>
            </div>

            {/* Weight validation warning */}
            {totalWeight > 0 && (
              <div className={`p-3 rounded-md border text-sm flex items-start gap-2 ${
                totalWeight > 100 
                  ? "bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800 text-red-700 dark:text-red-300"
                  : totalWeight === 100
                  ? "bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800 text-green-700 dark:text-green-300"
                  : "bg-yellow-50 dark:bg-yellow-950/30 border-yellow-200 dark:border-yellow-800 text-yellow-700 dark:text-yellow-300"
              }`}>
                <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-semibold">Peso total: {totalWeight}%</p>
                  <p className="text-xs mt-1">
                    {totalWeight > 100 
                      ? "O peso total excede 100%. Ajuste os pesos para que a soma seja exatamente 100%."
                      : totalWeight === 100
                      ? "Perfeito! O peso total está correto."
                      : `Faltam ${100 - totalWeight}% para completar 100%.`
                    }
                  </p>
                </div>
              </div>
            )}

            <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-md p-3 text-xs space-y-1">
              <p className="font-semibold text-blue-900 dark:text-blue-200 mb-1">Como usar:</p>
              <p className="text-blue-700 dark:text-blue-300">1. Clique em uma métrica acima para adicionar</p>
              <p className="text-blue-700 dark:text-blue-300">2. Arraste do ponto ● direito da métrica</p>
              <p className="text-blue-700 dark:text-blue-300">3. Solte no ponto ● esquerdo do "Rating Final"</p>
              <p className="text-blue-700 dark:text-blue-300">4. Ajuste o peso de cada métrica (0-100%)</p>
              <p className="text-blue-700 dark:text-blue-300">5. Clique em Calcular para ver o resultado</p>
            </div>
          </div>

        </Panel>
      </ReactFlow>

      <CreateMetricDialog
        organizationId={organizationId}
        isOpen={showMetricDialog}
        onClose={() => setShowMetricDialog(false)}
        onSuccess={(newMetric) => {
          addMetricNode(newMetric);
          setShowMetricDialog(false);
        }}
      />
      
      <CalculateModelRatingModal
        organizationId={organizationId}
        isOpen={showCalculateModal}
        onClose={() => setShowCalculateModal(false)}
        onCalculate={calculateFinalScore}
      />
      
      <RatingResultModal
        isOpen={showResultModal}
        onClose={() => setShowResultModal(false)}
        result={ratingResult}
      />
      
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmar exclusão</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o modelo "{initialModel?.nome}"? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}