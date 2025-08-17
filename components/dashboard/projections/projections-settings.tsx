"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

interface ProjectionsSettingsProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedSafras: string[];
  selectedCultures: string[];
  onSafrasChange: (safras: string[]) => void;
  onCulturesChange: (cultures: string[]) => void;
  safras: any[];
  cultures: any[];
}

export function ProjectionsSettings({
  open,
  onOpenChange,
  selectedSafras,
  selectedCultures,
  onSafrasChange,
  onCulturesChange,
  safras,
  cultures,
}: ProjectionsSettingsProps) {
  const handleSafraToggle = (safraId: string) => {
    if (selectedSafras.includes(safraId)) {
      onSafrasChange(selectedSafras.filter(id => id !== safraId));
    } else {
      onSafrasChange([...selectedSafras, safraId]);
    }
  };

  const handleCultureToggle = (cultureId: string) => {
    if (selectedCultures.includes(cultureId)) {
      onCulturesChange(selectedCultures.filter(id => id !== cultureId));
    } else {
      onCulturesChange([...selectedCultures, cultureId]);
    }
  };

  const selectAllSafras = () => {
    onSafrasChange(safras.map(s => s.id));
  };

  const selectAllCultures = () => {
    onCulturesChange(cultures.map(c => c.id));
  };

  const clearAllSafras = () => {
    onSafrasChange([]);
  };

  const clearAllCultures = () => {
    onCulturesChange([]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Configurações de Projeção</DialogTitle>
          <DialogDescription>
            Selecione as safras e culturas para incluir nas projeções
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-6">
          {/* Safras */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label className="text-base font-semibold">Safras</Label>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={selectAllSafras}
                >
                  Selecionar todas
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllSafras}
                >
                  Limpar
                </Button>
              </div>
            </div>
            <Separator />
            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-3">
                {safras.map(safra => (
                  <div key={safra.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`safra-${safra.id}`}
                      checked={selectedSafras.includes(safra.id)}
                      onCheckedChange={() => handleSafraToggle(safra.id)}
                    />
                    <Label
                      htmlFor={`safra-${safra.id}`}
                      className="text-sm font-normal cursor-pointer flex-1"
                    >
                      {safra.nome}
                    </Label>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>

          {/* Culturas */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Label className="text-base font-semibold">Culturas</Label>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={selectAllCultures}
                >
                  Selecionar todas
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearAllCultures}
                >
                  Limpar
                </Button>
              </div>
            </div>
            <Separator />
            <ScrollArea className="h-[300px] pr-4">
              <div className="space-y-3">
                {cultures.map(cultura => (
                  <div key={cultura.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={`cultura-${cultura.id}`}
                      checked={selectedCultures.includes(cultura.id)}
                      onCheckedChange={() => handleCultureToggle(cultura.id)}
                    />
                    <Label
                      htmlFor={`cultura-${cultura.id}`}
                      className="text-sm font-normal cursor-pointer flex-1"
                    >
                      {cultura.nome}
                    </Label>
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={() => onOpenChange(false)}>
            Aplicar Filtros
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}