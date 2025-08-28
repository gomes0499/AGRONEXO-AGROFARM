import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  const requestUrl = new URL(request.url);
  
  // O Supabase está enviando o link no formato PKCE
  // https://vnqovsdcychjczfjamdc.supabase.co/auth/v1/verify?token=pkce_XXX&type=recovery&redirect_to=...
  // Precisamos processar isso corretamente
  
  // Pegar todos os parâmetros possíveis
  const code = requestUrl.searchParams.get('code');
  const token = requestUrl.searchParams.get('token');
  const token_hash = requestUrl.searchParams.get('token_hash');
  const type = requestUrl.searchParams.get('type');
  const error = requestUrl.searchParams.get('error');
  const error_description = requestUrl.searchParams.get('error_description');
  
  console.log('Callback received:', { code, token, token_hash, type, error });
  
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
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (!error && data.session) {
        // Verificar o tipo para decidir o redirecionamento
        if (type === 'recovery') {
          return NextResponse.redirect(new URL('/auth/reset-password', requestUrl.origin));
        }
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
    
    // Se não temos token nem code, tentar verificar a sessão
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      if (type === 'recovery') {
        return NextResponse.redirect(new URL('/auth/reset-password', requestUrl.origin));
      }
      return NextResponse.redirect(new URL('/dashboard', requestUrl.origin));
    }
    
  } catch (err) {
    console.error('Callback processing error:', err);
  }

  // Se chegamos aqui, algo deu errado
  console.error('No valid token or code found in callback');
  return NextResponse.redirect(new URL('/auth/error', requestUrl.origin));
}