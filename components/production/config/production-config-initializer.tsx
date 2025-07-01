"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle2, 
  XCircle, 
  Loader2, 
  Settings, 
  Plus,
  AlertTriangle 
} from "lucide-react";
import { 
  initializeProductionConfig, 
  forceInitializeProductionConfig,
  checkProductionConfigExists 
} from "@/lib/actions/production-config-initialization";
import { toast } from "sonner";

interface ProductionConfigInitializerProps {
  organizationId: string;
  hasCultures: boolean;
  hasSystems: boolean;
  hasCycles: boolean;
  hasHarvests: boolean;
  onConfigChanged?: () => void;
}

export function ProductionConfigInitializer({
  organizationId,
  hasCultures,
  hasSystems,
  hasCycles,
  hasHarvests,
  onConfigChanged
}: ProductionConfigInitializerProps) {
  const [loading, setLoading] = useState(false);
  const [configStatus, setConfigStatus] = useState({
    hasCultures,
    hasSystems,
    hasCycles,
    hasHarvests
  });

  const isComplete = configStatus.hasCultures && configStatus.hasSystems && 
                     configStatus.hasCycles && configStatus.hasHarvests;

  const handleInitialize = async () => {
    try {
      setLoading(true);
      
      const result = await initializeProductionConfig(organizationId);
      
      if (result.success) {
        if (result.created) {
          toast.success(result.message);
          
          // Atualizar status das configurações
          const newStatus = await checkProductionConfigExists(organizationId);
          setConfigStatus(newStatus);
          
          // Notificar componente pai sobre mudanças
          onConfigChanged?.();
        } else {
          toast.info(result.message);
        }
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("Erro ao inicializar configurações");
    } finally {
      setLoading(false);
    }
  };

  const handleForceInitialize = async () => {
    try {
      setLoading(true);
      
      const result = await forceInitializeProductionConfig(organizationId);
      
      if (result.success) {
        toast.success(result.message);
        
        // Atualizar status das configurações
        const newStatus = await checkProductionConfigExists(organizationId);
        setConfigStatus(newStatus);
        
        // Notificar componente pai sobre mudanças
        onConfigChanged?.();
      } else {
        toast.error(result.message);
      }
    } catch (error) {
      toast.error("Erro ao criar configurações");
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (hasConfig: boolean) => {
    return hasConfig ? (
      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
    ) : (
      <XCircle className="h-4 w-4 text-rose-600" />
    );
  };

  const getStatusBadge = (hasConfig: boolean) => {
    return hasConfig ? (
      <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-50">
        Configurado
      </Badge>
    ) : (
      <Badge variant="outline" className="text-rose-600 border-rose-200 bg-rose-50">
        Não configurado
      </Badge>
    );
  };

  if (isComplete) {
    return (
      <Card className="border-emerald-200 bg-emerald-50/50">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            <CardTitle className="text-emerald-900">Configurações Completas</CardTitle>
          </div>
          <CardDescription className="text-emerald-700">
            Todas as configurações básicas de produção estão disponíveis.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-100">
              ✓ Culturas
            </Badge>
            <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-100">
              ✓ Sistemas
            </Badge>
            <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-100">
              ✓ Ciclos
            </Badge>
            <Badge variant="outline" className="text-emerald-600 border-emerald-200 bg-emerald-100">
              ✓ Safras
            </Badge>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-amber-200 bg-amber-50/50">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-amber-600" />
          <CardTitle className="text-amber-900">Configurações de Produção</CardTitle>
        </div>
        <CardDescription className="text-amber-700">
          Algumas configurações básicas ainda não foram criadas. Inicialize as configurações padrão para começar.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status das configurações */}
        <div className="grid grid-cols-2 gap-3">
          <div className="flex items-center justify-between p-2 rounded-lg bg-white/60">
            <div className="flex items-center gap-2">
              {getStatusIcon(configStatus.hasCultures)}
              <span className="text-sm font-medium">Culturas</span>
            </div>
            {getStatusBadge(configStatus.hasCultures)}
          </div>
          
          <div className="flex items-center justify-between p-2 rounded-lg bg-white/60">
            <div className="flex items-center gap-2">
              {getStatusIcon(configStatus.hasSystems)}
              <span className="text-sm font-medium">Sistemas</span>
            </div>
            {getStatusBadge(configStatus.hasSystems)}
          </div>
          
          <div className="flex items-center justify-between p-2 rounded-lg bg-white/60">
            <div className="flex items-center gap-2">
              {getStatusIcon(configStatus.hasCycles)}
              <span className="text-sm font-medium">Ciclos</span>
            </div>
            {getStatusBadge(configStatus.hasCycles)}
          </div>
          
          <div className="flex items-center justify-between p-2 rounded-lg bg-white/60">
            <div className="flex items-center gap-2">
              {getStatusIcon(configStatus.hasHarvests)}
              <span className="text-sm font-medium">Safras</span>
            </div>
            {getStatusBadge(configStatus.hasHarvests)}
          </div>
        </div>

        {/* Botões de ação */}
        <div className="flex gap-2 pt-2">
          <Button 
            onClick={handleInitialize}
            disabled={loading}
            className="flex-1"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Settings className="h-4 w-4 mr-2" />
            )}
            Inicializar Configurações
          </Button>
          
          <Button 
            variant="outline"
            onClick={handleForceInitialize}
            disabled={loading}
            className="flex-shrink-0"
          >
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
          </Button>
        </div>
        
        <p className="text-xs text-amber-600 mt-2">
          O botão "Inicializar Configurações" cria apenas as configurações ausentes. 
          O botão "+" força a criação de todas as configurações padrão.
        </p>
      </CardContent>
    </Card>
  );
}