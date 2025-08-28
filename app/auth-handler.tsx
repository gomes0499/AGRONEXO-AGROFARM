'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export function AuthHandler() {
  const router = useRouter();
  const pathname = usePathname();
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const handleAuthCallback = async () => {
      // Não processar se já estamos processando ou se estamos em páginas de auth específicas
      if (isProcessing || pathname === '/auth/reset-password') return;
      
      // Verificar se há hash parameters de autenticação
      const hash = window.location.hash;
      
      if (!hash) return;
      
      console.log('=== AUTH HANDLER DEBUG ===');
      console.log('Current path:', pathname);
      console.log('Hash found:', hash);
      
      setIsProcessing(true);
      
      // Parse hash parameters
      const params = new URLSearchParams(hash.substring(1));
      const access_token = params.get('access_token');
      const refresh_token = params.get('refresh_token');
      const type = params.get('type');
      const error = params.get('error');
      
      console.log('Parsed hash params:', { 
        type, 
        hasAccessToken: !!access_token, 
        hasRefreshToken: !!refresh_token,
        error 
      });
      
      if (error) {
        console.error('Auth error:', params.get('error_description'));
        window.history.replaceState(null, '', window.location.pathname);
        router.push('/auth/error');
        return;
      }
      
      if (access_token && refresh_token) {
        const supabase = createClient();
        
        try {
          console.log('Setting session with tokens...');
          // Definir a sessão com os tokens
          const { error: sessionError } = await supabase.auth.setSession({
            access_token,
            refresh_token
          });
          
          if (!sessionError) {
            console.log('Session set successfully');
            // Limpar o hash da URL ANTES de redirecionar
            window.history.replaceState(null, '', window.location.pathname);
            
            // IMPORTANTE: Sempre verificar o tipo
            if (type === 'recovery') {
              console.log('>>> RECOVERY TYPE DETECTED - Going to reset-password');
              router.push('/auth/reset-password');
            } else {
              console.log('>>> Regular auth - Going to dashboard');
              router.push('/dashboard');
            }
          } else {
            console.error('Session error:', sessionError);
            window.history.replaceState(null, '', window.location.pathname);
            router.push('/auth/error');
          }
        } catch (err) {
          console.error('Auth handler error:', err);
          window.history.replaceState(null, '', window.location.pathname);
          router.push('/auth/error');
        }
      }
      
      setIsProcessing(false);
    };
    
    handleAuthCallback();
  }, [router, pathname, isProcessing]);

  return null;
}