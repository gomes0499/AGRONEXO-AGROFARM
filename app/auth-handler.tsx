'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export function AuthHandler() {
  const router = useRouter();

  useEffect(() => {
    // Verificar se há hash parameters de autenticação
    const hash = window.location.hash;
    
    if (hash && hash.includes('type=recovery')) {
      // Se for um token de recovery, redirecionar para reset-password
      router.push('/auth/reset-password');
    } else if (hash && hash.includes('error=')) {
      // Se houver erro, redirecionar para página de erro
      const params = new URLSearchParams(hash.substring(1));
      const errorDescription = params.get('error_description');
      console.error('Auth error:', errorDescription);
      router.push('/auth/error');
    }
  }, [router]);

  return null;
}