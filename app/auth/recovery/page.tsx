'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Loader2 } from 'lucide-react';

export default function RecoveryPage() {
  const router = useRouter();

  useEffect(() => {
    const checkRecoverySession = async () => {
      const supabase = createClient();
      
      // Verificar se há uma sessão de recovery ativa
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        console.log('Recovery session found, redirecting to reset-password');
        router.push('/auth/reset-password');
      } else {
        console.log('No recovery session, redirecting to error');
        router.push('/auth/error');
      }
    };

    checkRecoverySession();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground">Processando recuperação de senha...</p>
      </div>
    </div>
  );
}