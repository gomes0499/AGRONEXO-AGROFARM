'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { CheckCircle, AlertCircle, RefreshCw } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';

export function YahooConnectionStatus() {
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    checkConnection();
  }, []);
  
  async function checkConnection() {
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setIsConnected(false);
        setLoading(false);
        return;
      }
      
      // Verificar se existe token para o usuário
      const { data, error } = await supabase
        .from('yahoo_tokens')
        .select('expires_at')
        .eq('user_id', user.id)
        .single();
      
      if (data && !error) {
        // Verificar se ainda está válido
        const expiresAt = new Date(data.expires_at).getTime();
        setIsConnected(expiresAt > Date.now());
      } else {
        setIsConnected(false);
      }
    } catch (error) {
      console.error('Error checking Yahoo connection:', error);
      setIsConnected(false);
    } finally {
      setLoading(false);
    }
  }
  
  const handleConnect = () => {
    // Redirecionar para o endpoint de autorização
    window.location.href = '/api/yahoo-auth/authorize';
  };
  
  if (loading) {
    return (
      <Card className="p-4">
        <div className="flex items-center gap-2">
          <RefreshCw className="h-4 w-4 animate-spin" />
          <span className="text-sm text-muted-foreground">Verificando conexão...</span>
        </div>
      </Card>
    );
  }
  
  if (isConnected) {
    return (
      <Card className="p-4 border-green-500/20 bg-green-50/50 dark:bg-green-950/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium">Yahoo Finance conectado</span>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => checkConnection()}
          >
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </Card>
    );
  }
  
  return (
    <Card className="p-4 border-yellow-500/20 bg-yellow-50/50 dark:bg-yellow-950/20">
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-yellow-600" />
          <span className="text-sm font-medium">Yahoo Finance não conectado</span>
        </div>
        <p className="text-xs text-muted-foreground">
          Conecte sua conta Yahoo para obter cotações em tempo real
        </p>
        <Button
          onClick={handleConnect}
          size="sm"
          className="w-full"
        >
          Conectar Yahoo Finance
        </Button>
      </div>
    </Card>
  );
}