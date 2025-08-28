import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createServerClient } from '@supabase/ssr';

// Define as rotas que exigem autenticação
const protectedRoutes = [
  '/dashboard',
];

// Define as rotas que estão disponíveis apenas para visitantes (não logados)
const publicAuthRoutes = [
  '/auth/login',
  '/auth/register',
  '/auth/forgot-password',
  '/auth/reset-password',
  '/auth/verify-email',
];

// Middleware para validação de autenticação e rotas
export async function middleware(request: NextRequest) {
  // Create an unmodified response
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  // Add additional security headers
  response.headers.set('X-DNS-Prefetch-Control', 'on');
  response.headers.set('X-Permitted-Cross-Domain-Policies', 'none');
  response.headers.set('X-Download-Options', 'noopen');

  // Cria o cliente do Supabase com os cookies da requisição
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set({
              name,
              value,
              ...options,
            });
          });
        },
      },
    }
  );

  // Obtém a sessão atual
  const {
    data: { session },
  } = await supabase.auth.getSession();

  // URL da solicitação atual
  const url = request.nextUrl.clone();
  const { pathname } = url;

  // Padrão para redirecionar URLs das páginas de benfeitoria removidas (new e edit)
  const oldNewImprovementPattern = /^\/dashboard\/properties\/([^\/]+)\/improvements\/new/;
  const isOldNewImprovementPage = oldNewImprovementPattern.test(pathname);
  
  const oldEditImprovementPattern = /^\/dashboard\/properties\/([^\/]+)\/improvements\/([^\/]+)\/edit/;
  const isOldEditImprovementPage = oldEditImprovementPattern.test(pathname);
  
  // Redirecionar tanto a página de criar quanto a de editar
  if (isOldNewImprovementPage) {
    // Extrair o ID da propriedade da URL
    const propertyId = pathname.match(oldNewImprovementPattern)?.[1];
    if (propertyId) {
      // Redirecionar para a página de lista de benfeitorias
      url.pathname = `/dashboard/properties/${propertyId}/improvements`;
      return NextResponse.redirect(url);
    }
  }
  
  if (isOldEditImprovementPage) {
    // Extrair o ID da propriedade da URL
    const propertyId = pathname.match(oldEditImprovementPattern)?.[1];
    if (propertyId) {
      // Redirecionar para a página de lista de benfeitorias
      url.pathname = `/dashboard/properties/${propertyId}/improvements`;
      return NextResponse.redirect(url);
    }
  }

  // Verificar se o usuário está tentando acessar uma rota protegida sem estar autenticado
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname === route || pathname.startsWith(`${route}/`)
  );

  // Verificar se o usuário está autenticado e tentando acessar páginas de autenticação
  const isAuthRoute = publicAuthRoutes.some(route => 
    pathname === route || pathname.startsWith(`${route}/`)
  );

  // Redireciona para login se tentar acessar rota protegida sem autenticação
  if (isProtectedRoute && !session) {
    url.pathname = '/auth/login';
    // Armazena a URL original para redirecionar após o login
    url.searchParams.set('callbackUrl', request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  // Redireciona para dashboard se tentar acessar rota de auth estando autenticado
  if (isAuthRoute && session) {
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  // Prossegue normalmente
  return response;
}

// Configura o matcher para aplicar o middleware apenas nas rotas especificadas
export const config = {
  matcher: [
    // Rotas protegidas
    '/dashboard/:path*',
    
    // Rotas de autenticação
    '/auth/:path*'
  ],
};