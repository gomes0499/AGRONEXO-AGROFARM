"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Calculator, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { getSafras, type Safra } from "@/lib/actions/production-actions";
import { getProjections, type Projection } from "@/lib/actions/projections-actions";

interface CalculateModelRatingModalProps {
  organizationId: string;
  isOpen: boolean;
  onClose: () => void;
  onCalculate: (safraId: string, scenarioId: string | null) => void;
}

export function CalculateModelRatingModal({
  organizationId,
  isOpen,
  onClose,
  onCalculate,
}: CalculateModelRatingModalProps) {
  const [safras, setSafras] = useState<Safra[]>([]);
  const [projections, setProjections] = useState<Projection[]>([]);
  const [selectedSafra, setSelectedSafra] = useState<string>("");
  const [selectedProjection, setSelectedProjection] = useState<string>("current");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen, organizationId]);

  const loadData = async () => {
    try {
      setIsLoading(true);
      
      // Load safras
      const safrasData = await getSafras(organizationId);
      
      // Load projections
      const projectionsResult = await getProjections();
      
      // Filter active safras
      const activeSafras = safrasData.filter(s => s.ativa !== false);
      setSafras(activeSafras);
      
      // Set projections
      if (!projectionsResult.error && projectionsResult.data) {
        setProjections(projectionsResult.data);
      }
      
      // Select most recent safra
      if (activeSafras.length > 0) {
        setSelectedSafra(activeSafras[0].id);
      }
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Erro ao carregar dados");
    } finally {
      setIsLoading(false);
    }
  };

  const handleCalculate = () => {
    if (!selectedSafra) {
      toast.error("Selecione uma safra");
      return;
    }

    // Pass null for "current" (base scenario), or the projection ID
    const projectionId = selectedProjection === "current" ? null : selectedProjection;
    onCalculate(selectedSafra, projectionId);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Calculator className="h-5 w-5 text-primary" />
            Calcular Rating do Modelo
          </DialogTitle>
          <DialogDescription>
            Selecione a safra e o cenário para calcular o rating
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="safra">Safra</Label>
              <Select value={selectedSafra} onValueChange={setSelectedSafra}>
                <SelectTrigger id="safra">
                  <SelectValue placeholder="Selecione uma safra" />
                </SelectTrigger>
                <SelectContent>
                  {safras.map((safra) => (
                    <SelectItem key={safra.id} value={safra.id}>
                      {safra.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="scenario">Cenário</Label>
              <Select value={selectedProjection} onValueChange={setSelectedProjection}>
                <SelectTrigger id="scenario">
                  <SelectValue placeholder="Selecione um cenário" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="current">
                    <div className="flex items-center gap-2">
                      <span>📊</span>
                      <span>Dados Atuais</span>
                    </div>
                  </SelectItem>
                  
                  {projections.length > 0 && (
                    <>
                      <div className="border-t my-1" />
                      {projections.map((projection) => (
                        <SelectItem key={projection.id} value={projection.id}>
                          <div className="flex items-center gap-2">
                            <span>📈</span>
                            <span>{projection.nome}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </>
                  )}
                </SelectContent>
              </Select>
            </div>

            {selectedSafra && (
              <div className="rounded-lg bg-muted p-3 text-sm">
                <p className="text-muted-foreground">
                  O rating será calculado usando os dados financeiros da safra e cenário selecionados.
                </p>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose} disabled={isLoading}>
            Cancelar
          </Button>
          <Button 
            onClick={handleCalculate} 
            disabled={isLoading || !selectedSafra}
          >
            <Calculator className="mr-2 h-4 w-4" />
            Calcular Rating
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}