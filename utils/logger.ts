/**
 * Sistema de logs para toda a aplicação
 * Suporta diferentes níveis de log e contextos adicionais
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
  [key: string]: any;
}

// Determina se estamos em produção ou não
const isProduction = process.env.NODE_ENV === 'production';

/**
 * Função central para logs, com suporte a contexto adicional
 * Em produção, formata os logs para serem compatíveis com serviços de logging
 */
function log(level: LogLevel, message: string, context?: LogContext) {
  const timestamp = new Date().toISOString();
  const logObject = {
    timestamp,
    level,
    message,
    ...context
  };

  // Em produção, usamos JSON para facilitar integração com serviços de log
  if (isProduction) {
    console[level](JSON.stringify(logObject));
    
    // Em produção, podemos enviar logs para um serviço externo
    // Como Sentry, LogRocket, etc.
    if (level === 'error' && process.env.NEXT_PUBLIC_SENTRY_DSN) {
      // Aqui iria a integração com Sentry ou outro serviço
      // Sentry.captureException(new Error(message), { extra: context });
    }
  } else {
    // Em desenvolvimento, formatamos os logs para facilitar leitura
    const contextString = context ? `\nContexto: ${JSON.stringify(context, null, 2)}` : '';
    console[level](`[${timestamp}] [${level.toUpperCase()}] ${message}${contextString}`);
  }
}

/**
 * Log de nível debug - apenas para desenvolvimento
 */
export function logDebug(message: string, context?: LogContext) {
  if (!isProduction) {
    log('debug', message, context);
  }
}

/**
 * Log de nível info - informações gerais do sistema
 */
export function logInfo(message: string, context?: LogContext) {
  log('info', message, context);
}

/**
 * Log de nível warn - avisos importantes mas não críticos
 */
export function logWarn(message: string, context?: LogContext) {
  log('warn', message, context);
}

/**
 * Log de nível error - erros que precisam de atenção
 */
export function logError(message: string, context?: LogContext) {
  log('error', message, context);
}

/**
 * Registra uma exceção com stack trace
 */
export function logException(error: Error, context?: LogContext) {
  logError(error.message, {
    stack: error.stack,
    ...context
  });
}