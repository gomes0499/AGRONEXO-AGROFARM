import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  
  // Debug completo da URL
  console.log('=== CALLBACK HANDLER DEBUG ===');
  console.log('Full URL:', request.url);
  console.log('Search params:', requestUrl.searchParams.toString());
  
  // Pegar todos os parâmetros possíveis
  const code = requestUrl.searchParams.get('code');
  const token = requestUrl.searchParams.get('token');
  const token_hash = requestUrl.searchParams.get('token_hash');
  const type = requestUrl.searchParams.get('type');
  const error = requestUrl.searchParams.get('error');
  const error_description = requestUrl.searchParams.get('error_description');
  
  console.log('Parsed params:', { 
    code: code?.substring(0, 20) + '...', 
    token: token?.substring(0, 20) + '...', 
    token_hash: token_hash?.substring(0, 20) + '...', 
    type, 
    error 
  });
  
  // Se houver erro na URL, redireciona para página de erro
  if (error || error_description) {
    console.error('Callback error:', error, error_description);
    return NextResponse.redirect(new URL('/auth/error', requestUrl.origin));
  }
  
  const supabase = await createClient();
  
  // Tentar processar o token/code
  try {
    // Se temos um code (OAuth flow ou PKCE)
    if (code) {
      console.log('Processing code exchange for type:', type);
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (!error && data.session) {
        console.log('Code exchange successful, session created');
        // IMPORTANTE: Sempre verificar o tipo ANTES de redirecionar
        if (type === 'recovery') {
          console.log('>>> RECOVERY TYPE - Redirecting to /auth/reset-password');
          return NextResponse.redirect(new URL('/auth/reset-password', requestUrl.origin));
        }
        console.log('>>> Regular auth - Redirecting to /dashboard');
        return NextResponse.redirect(new URL('/dashboard', requestUrl.origin));
      } else {
        console.error('Code exchange error:', error);
        return NextResponse.redirect(new URL('/auth/error', requestUrl.origin));
      }
    }
    
    // Se temos um token (pode ser PKCE ou magic link)
    if (token || token_hash) {
      const tokenToUse = token || token_hash;
      
      // Se o token começa com 'pkce_', é um token PKCE
      if (tokenToUse?.startsWith('pkce_')) {
        // Para tokens PKCE, precisamos usar exchangeCodeForSession
        const { data, error } = await supabase.auth.exchangeCodeForSession(tokenToUse);
        
        if (!error && data.session) {
          if (type === 'recovery') {
            return NextResponse.redirect(new URL('/auth/reset-password', requestUrl.origin));
          }
          return NextResponse.redirect(new URL('/dashboard', requestUrl.origin));
        } else {
          console.error('PKCE token exchange error:', error);
          return NextResponse.redirect(new URL('/auth/error', requestUrl.origin));
        }
      } else {
        // Para outros tokens, usar verifyOtp
        const { data, error } = await supabase.auth.verifyOtp({
          token_hash: tokenToUse!,
          type: type as any,
        });
        
        if (!error) {
          if (type === 'recovery') {
            return NextResponse.redirect(new URL('/auth/reset-password', requestUrl.origin));
          }
          return NextResponse.redirect(new URL('/dashboard', requestUrl.origin));
        } else {
          console.error('OTP verification error:', error);
          return NextResponse.redirect(new URL('/auth/error', requestUrl.origin));
        }
      }
    }
    
    // Se não temos token nem code, verificar se há parâmetros na URL
    // IMPORTANTE: Sempre respeitar o parâmetro 'type' se ele existir
    if (type === 'recovery') {
      console.log('Recovery type detected without token/code, checking session...');
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session) {
        console.log('Session found during recovery, redirecting to reset-password');
        return NextResponse.redirect(new URL('/auth/reset-password', requestUrl.origin));
      } else {
        console.log('No session found during recovery, going to error page');
        return NextResponse.redirect(new URL('/auth/error', requestUrl.origin));
      }
    }
    
    // Para outros casos, verificar sessão normal
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      console.log('Regular session found, going to dashboard');
      return NextResponse.redirect(new URL('/dashboard', requestUrl.origin));
    }
    
  } catch (err) {
    console.error('Callback processing error:', err);
  }

  // Se chegamos aqui, algo deu errado
  console.error('No valid token or code found in callback');
  return NextResponse.redirect(new URL('/auth/error', requestUrl.origin));
}