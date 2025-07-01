import { Resend } from 'resend';
import { logError } from '@/utils/logger';

// Cria uma instância do cliente Resend com a API key
const resendClient = new Resend(process.env.RESEND_API_KEY);

// Nome da empresa para exibição nos emails
const COMPANY_NAME = 'SR-Consultoria';
const DEFAULT_FROM_EMAIL = `${COMPANY_NAME} <noreply@byteconta.com.br>`;

/**
 * Interface para envio de email genérico
 */
interface SendEmailParams {
  to: string | string[];
  subject: string;
  react?: React.ReactNode;
  from?: string;
  text?: any;
  cc?: string | string[];
  bcc?: string | string[];
  replyTo?: string;
}

/**
 * Função para enviar email usando o Resend
 */
export async function sendEmail({
  to,
  subject,
  react,
  from = DEFAULT_FROM_EMAIL,
  cc,
  bcc,
  replyTo,
}: SendEmailParams) {
  if (!process.env.RESEND_API_KEY) {
    logError('RESEND_API_KEY não configurada. Email não enviado.', {
      to,
      subject,
    });
    throw new Error('Resend API key não configurada');
  }

  try {
    
    if (process.env.NODE_ENV === 'development' && !process.env.ENABLE_EMAILS_IN_DEV) {
      console.log('📧 Email em modo desenvolvimento (não enviado):', {
        to,
        subject,
        from
      });
      return { success: true, data: { id: 'dev-mode-email-id' } };
    }
    
    const { data, error } = await resendClient.emails.send({
      from,
      to,
      subject,
      react,
      cc,
      bcc,
    });

    if (error) {
      console.error('Erro ao enviar email via Resend:', error);
      logError('Erro ao enviar email via Resend', { error, to, subject });
      throw error;
    }

    return { success: true, data };
  } catch (error) {
    console.error('Exceção ao enviar email via Resend:', error);
    logError('Erro ao enviar email via Resend', { error, to, subject });
    throw error;
  }
}

export { resendClient };