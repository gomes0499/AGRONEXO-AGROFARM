import { logError, logException } from './logger';

/**
 * Interface para erros customizados da aplicação
 */
export interface AppError extends Error {
  code?: ErrorCode;
  statusCode?: number;
  details?: any;
}

/**
 * Cria um erro customizado da aplicação
 */
export function createAppError(
  message: string,
  code: ErrorCode = 'INTERNAL_ERROR',
  statusCode: number = 500,
  details?: any
): AppError {
  const error = new Error(message) as AppError;
  error.code = code;
  error.statusCode = statusCode;
  error.details = details;
  return error;
}

/**
 * Códigos de erro padrão da aplicação
 */
export const ErrorCodes = {
  // Erros de autenticação e autorização
  UNAUTHORIZED: 'UNAUTHORIZED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  FORBIDDEN: 'FORBIDDEN',
  
  // Erros de validação
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  
  // Erros de dados
  NOT_FOUND: 'NOT_FOUND',
  DUPLICATE_ENTRY: 'DUPLICATE_ENTRY',
  
  // Erros de sistema
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  DATABASE_ERROR: 'DATABASE_ERROR',
  
  // Erros de serviços externos
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  
  // Erros multitenant
  TENANT_NOT_FOUND: 'TENANT_NOT_FOUND',
  TENANT_INACTIVE: 'TENANT_INACTIVE'
} as const;

// Tipo para códigos de erro
export type ErrorCode = keyof typeof ErrorCodes;

/**
 * Função para lidar com erros no servidor, retornando resposta formatada
 */
export function handleApiError(error: any) {
  if (error instanceof Error) {
    logException(error);
    
    // Se for um AppError, usamos suas propriedades
    const appError = error as AppError;
    const statusCode = appError.statusCode || 500;
    const code = appError.code || 'INTERNAL_ERROR';
    
    return Response.json({
      error: {
        message: appError.message,
        code,
        ...(appError.details ? { details: appError.details } : {})
      }
    }, { status: statusCode });
  }
  
  // Para erros genéricos não instâncias de Error
  logError('Erro desconhecido capturado', { error });
  return Response.json({
    error: {
      message: 'Ocorreu um erro interno no servidor',
      code: 'INTERNAL_ERROR'
    }
  }, { status: 500 });
}

/**
 * Wrapper para capturar erros em server actions
 */
export function withErrorHandling<T extends (...args: any[]) => Promise<any>>(fn: T): T {
  return (async (...args: Parameters<T>) => {
    try {
      return await fn(...args);
    } catch (error) {
      if (error instanceof Error) {
        logException(error);
        // Repassamos o erro para que o cliente possa tratá-lo
        throw error;
      } else {
        const genericError = createAppError(
          'Ocorreu um erro interno no servidor',
          ErrorCodes.INTERNAL_ERROR
        );
        logError('Erro desconhecido capturado em server action', { error });
        throw genericError;
      }
    }
  }) as T;
}

/**
 * Tratador de erros específico para métodos das actions
 * Registra o erro e retorna um objeto de erro padronizado
 */
// Interface para respostas de erro padronizadas
export interface ErrorResponse {
  error: boolean;
  message: string;
  code: ErrorCode;
}

export function errorHandler(error: any, defaultMessage: string): ErrorResponse {
  if (error instanceof Error) {
    logException(error);
    
    // Se for um erro da Supabase ou outro error conhecido
    const errorMessage = error.message || defaultMessage;
    
    // Determina o código com base no tipo de erro
    let errorCode: ErrorCode = 'INTERNAL_ERROR';
    
    if (errorMessage.includes('not found') || errorMessage.includes('não encontrado')) {
      errorCode = 'NOT_FOUND';
    } else if (errorMessage.includes('duplicate') || errorMessage.includes('already exists') || 
               errorMessage.includes('duplicado') || errorMessage.includes('já existe')) {
      errorCode = 'DUPLICATE_ENTRY';
    } else if (errorMessage.includes('permission') || errorMessage.includes('permissão') || 
               errorMessage.includes('unauthorized') || errorMessage.includes('não autorizado')) {
      errorCode = 'UNAUTHORIZED';
    } else if (errorMessage.includes('validation') || errorMessage.includes('validação') ||
               errorMessage.includes('invalid') || errorMessage.includes('inválido')) {
      errorCode = 'VALIDATION_ERROR';
    }
    
    return {
      error: true,
      message: errorMessage,
      code: errorCode,
    };
  }
  
  // Para erros genéricos não instâncias de Error
  logError('Erro desconhecido capturado', { error });
  
  return {
    error: true,
    message: defaultMessage,
    code: 'INTERNAL_ERROR',
  };
}