'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export function AuthHandler() {
  const router = useRouter();

  useEffect(() => {
    const handleAuthCallback = async () => {
      // Verificar se há hash parameters de autenticação
      const hash = window.location.hash;
      
      if (!hash) return;
      
      // Parse hash parameters
      const params = new URLSearchParams(hash.substring(1));
      const access_token = params.get('access_token');
      const refresh_token = params.get('refresh_token');
      const type = params.get('type');
      const error = params.get('error');
      
      console.log('AuthHandler detected hash:', { type, hasAccessToken: !!access_token, error });
      
      if (error) {
        console.error('Auth error:', params.get('error_description'));
        router.push('/auth/error');
        return;
      }
      
      if (access_token && refresh_token) {
        const supabase = createClient();
        
        try {
          // Definir a sessão com os tokens
          const { error: sessionError } = await supabase.auth.setSession({
            access_token,
            refresh_token
          });
          
          if (!sessionError) {
            // Se for recovery, ir para reset-password
            if (type === 'recovery') {
              console.log('Recovery token detected, redirecting to reset-password');
              // Limpar o hash da URL
              window.history.replaceState(null, '', window.location.pathname);
              router.push('/auth/reset-password');
            } else {
              // Caso contrário, ir para dashboard
              window.history.replaceState(null, '', window.location.pathname);
              router.push('/dashboard');
            }
          } else {
            console.error('Session error:', sessionError);
            router.push('/auth/error');
          }
        } catch (err) {
          console.error('Auth handler error:', err);
          router.push('/auth/error');
        }
      }
    };
    
    handleAuthCallback();
  }, [router]);

  return null;
}