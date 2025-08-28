import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  const token_hash = requestUrl.searchParams.get('token_hash');
  const type = requestUrl.searchParams.get('type');
  const next = requestUrl.searchParams.get('next') ?? '/';
  
  // Também verificar por 'token' além de 'token_hash' (Supabase às vezes usa token)
  const token = requestUrl.searchParams.get('token');
  const error_description = requestUrl.searchParams.get('error_description');
  
  // Se houver erro na URL, redireciona para página de erro
  if (error_description) {
    console.error('Callback error:', error_description);
    return NextResponse.redirect(new URL('/auth/error', requestUrl.origin));
  }
  
  // Verifica tanto token_hash quanto token
  const tokenToVerify = token_hash || token;
  
  if (tokenToVerify && type) {
    const supabase = await createClient();
    
    try {
      if (type === 'recovery') {
        // Para recovery, usar exchangeCodeForSession ao invés de verifyOtp
        const { data, error } = await supabase.auth.exchangeCodeForSession(tokenToVerify);
        
        if (!error && data.session) {
          // Sessão criada com sucesso, redirecionar para reset de senha
          return NextResponse.redirect(new URL('/auth/reset-password', requestUrl.origin));
        } else {
          console.error('Recovery token error:', error);
        }
      } else {
        // Para outros tipos, usar verifyOtp
        const { error } = await supabase.auth.verifyOtp({
          token_hash: tokenToVerify,
          type: type as any,
        });
        
        if (!error) {
          return NextResponse.redirect(new URL(next, requestUrl.origin));
        } else {
          console.error('OTP verification error:', error);
        }
      }
    } catch (err) {
      console.error('Callback processing error:', err);
    }
  }

  // Redireciona para página de erro se houver problema
  return NextResponse.redirect(new URL('/auth/error', requestUrl.origin));
}