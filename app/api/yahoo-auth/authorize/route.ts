import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const clientId = process.env.YAHOO_CLIENT_ID;
    const isProd = process.env.NODE_ENV === 'production';
    const baseUrl = isProd ? 'https://www.srcon.com.br' : 'http://localhost:3000';
    const redirectUri = `${baseUrl}/api/yahoo-auth/callback`;
    
    if (!clientId) {
      return NextResponse.json({ error: 'Yahoo client ID not configured' }, { status: 500 });
    }
    
    // Generate state parameter for security
    const state = Math.random().toString(36).substring(7);
    const nonce = Math.random().toString(36).substring(7);
    
    // Build authorization URL
    const authUrl = new URL('https://api.login.yahoo.com/oauth2/request_auth');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('state', state);
    authUrl.searchParams.set('nonce', nonce);
    authUrl.searchParams.set('scope', 'openid'); // Add more scopes if needed for Finance API
    
    // Redirect to Yahoo for authorization
    return NextResponse.redirect(authUrl.toString());
    
  } catch (error) {
    console.error('Error generating auth URL:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}