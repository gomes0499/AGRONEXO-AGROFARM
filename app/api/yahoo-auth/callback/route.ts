import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const state = searchParams.get('state');
    const error = searchParams.get('error');
    
    // Se o usuário negou acesso
    if (error === 'access_denied') {
      return NextResponse.redirect(new URL('/dashboard?error=yahoo_auth_denied', request.url));
    }
    
    if (!code) {
      return NextResponse.redirect(new URL('/dashboard?error=no_auth_code', request.url));
    }
    
    // Exchange authorization code for tokens
    const clientId = process.env.YAHOO_CLIENT_ID!;
    const clientSecret = process.env.YAHOO_CLIENT_SECRET!;
    const isProd = process.env.NODE_ENV === 'production';
    const baseUrl = isProd ? 'https://www.srcon.com.br' : 'http://localhost:3000';
    const redirectUri = `${baseUrl}/api/yahoo-auth/callback`;
    
    const tokenUrl = 'https://api.login.yahoo.com/oauth2/get_token';
    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    
    const response = await fetch(tokenUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        code: code,
        grant_type: 'authorization_code',
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Token exchange failed:', errorText);
      return NextResponse.redirect(new URL('/dashboard?error=token_exchange_failed', request.url));
    }
    
    const tokenData = await response.json();
    
    // Armazenar tokens no Supabase (mais seguro que cookies)
    const supabase = await createClient();
    
    // Obter o usuário atual
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.redirect(new URL('/dashboard?error=not_authenticated', request.url));
    }
    
    // Armazenar tokens na tabela de configurações (criar se não existir)
    const { error: upsertError } = await supabase
      .from('yahoo_tokens')
      .upsert({
        user_id: user.id,
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_at: new Date(Date.now() + (tokenData.expires_in * 1000)).toISOString(),
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'user_id'
      });
    
    if (upsertError) {
      console.error('Failed to store tokens:', upsertError);
      // Ainda funciona mas não persiste entre sessões
    }
    
    // Redirecionar de volta ao dashboard com sucesso
    return NextResponse.redirect(new URL('/dashboard?success=yahoo_connected', request.url));
    
  } catch (error) {
    console.error('OAuth callback error:', error);
    return NextResponse.redirect(new URL('/dashboard?error=oauth_error', request.url));
  }
}