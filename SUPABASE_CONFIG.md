# Configuração do Supabase para srcon.com.br

## 1. Configurar URLs do Site

1. Acesse o Supabase Dashboard: https://supabase.com/dashboard
2. Vá para o seu projeto
3. Clique em **Authentication** no menu lateral
4. Clique em **URL Configuration**
5. Configure os seguintes campos:

### Site URL
```
https://www.srcon.com.br
```

### Redirect URLs (adicione TODAS estas URLs)
```
https://www.srcon.com.br/**
https://www.srcon.com.br/auth/callback
https://srcon.com.br/**
https://srcon.com.br/auth/callback
```

### Email Templates (Importante!)
6. Ainda em Authentication, vá para **Email Templates**
7. Clique em **Reset Password**
8. Certifique-se que o template tenha esta linha:
```html
<a href="{{ .ConfirmationURL }}">Redefinir Senha</a>
```

9. Se você quiser personalizar o redirect, você pode modificar o template para:
```html
<a href="{{ .SiteURL }}/auth/callback?token={{ .Token }}&type=recovery">Redefinir Senha</a>
```

## 2. Verificar Configurações de Email

1. Em **Authentication** > **Providers**
2. Certifique-se que **Email** está habilitado
3. Configure os campos:
   - **Enable Email Confirmations**: Pode deixar habilitado ou desabilitado conforme sua preferência
   - **Enable Email Change Confirmations**: Recomendo deixar habilitado
   - **Secure Email Change**: Recomendo deixar habilitado

## 3. Configurar SMTP (Opcional mas Recomendado)

1. Em **Project Settings** > **Auth**
2. Role até **SMTP Settings**
3. Habilite **Enable Custom SMTP**
4. Configure com os dados do Resend:
   - **Host**: smtp.resend.com
   - **Port**: 587
   - **Username**: resend
   - **Password**: re_UKpUoLPr_CugqPmnoFFLYnBuoJwp9YXTq (sua API key do Resend)
   - **Sender email**: noreply@srcon.com.br
   - **Sender name**: SR Consultoria

## 4. Testar

Após fazer essas configurações:
1. Tente solicitar uma redefinição de senha novamente
2. O link no email deve ser algo como:
   - `https://vnqovsdcychjczfjamdc.supabase.co/auth/v1/verify?token=XXX&type=recovery&redirect_to=https://www.srcon.com.br/auth/callback`
3. Ao clicar, deve redirecionar para a página de redefinição de senha

## Solução Alternativa (Se o problema persistir)

Se ainda não funcionar, podemos usar uma abordagem diferente com magic links. 
No arquivo `/lib/auth/actions/auth-actions.ts`, podemos modificar a função forgotPassword para usar um método diferente.

## Debug

Para debugar, você pode:
1. Verificar os logs do servidor (npm run dev ou vercel logs se estiver em produção)
2. Verificar o Network tab no navegador ao clicar no link
3. Verificar os Auth Logs no Supabase Dashboard (Authentication > Logs)