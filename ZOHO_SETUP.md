# Configuração do Zoho Desk

## Problema: Token OAuth Inválido

O erro `INVALID_OAUTH` ocorre porque o access token do Zoho expira após **1 hora**.

## Solução Implementada

O código agora suporta **renovação automática** do token usando um **Refresh Token**.

## Variáveis de Ambiente Necessárias

### Opção 1: Com Refresh Token (Recomendado) ✅

Adicione as seguintes variáveis no seu arquivo `.env.local`:

```env
# Zoho Desk API
ZOHO_API_URL=https://desk.zoho.com/api/v1/tickets
ZOHO_ORG_ID=seu_org_id_aqui
ZOHO_DEPARTMENT_ID=seu_department_id_aqui

# Credenciais OAuth (para renovação automática)
ZOHO_CLIENT_ID=seu_client_id_aqui
ZOHO_CLIENT_SECRET=seu_client_secret_aqui
ZOHO_REFRESH_TOKEN=seu_refresh_token_aqui

# Access Token (opcional, usado como fallback)
ZOHO_ACCESS_TOKEN=seu_access_token_aqui
```

### Opção 2: Apenas com Access Token (Temporário) ⚠️

Se você não configurar o Refresh Token, o sistema usará apenas o Access Token, mas **você precisará atualizá-lo manualmente a cada hora**.

```env
ZOHO_API_URL=https://desk.zoho.com/api/v1/tickets
ZOHO_ORG_ID=seu_org_id_aqui
ZOHO_DEPARTMENT_ID=seu_department_id_aqui
ZOHO_ACCESS_TOKEN=seu_access_token_aqui
```

## Como Obter as Credenciais

### 1. Criar uma Aplicação OAuth no Zoho

1. Acesse: https://api-console.zoho.com/
2. Clique em "Add Client"
3. Escolha "Server-based Applications"
4. Preencha:
   - **Client Name**: Nome da sua aplicação
   - **Homepage URL**: URL do seu site
   - **Authorized Redirect URIs**: `https://seudominio.com/callback` (ou `http://localhost:3000/callback` para dev)

5. Clique em "Create"
6. Copie o **Client ID** e **Client Secret**

### 2. Gerar o Refresh Token

1. Acesse esta URL no navegador (substitua os valores):

```
https://accounts.zoho.com/oauth/v2/auth?scope=Desk.tickets.ALL&client_id=1000.1283ffc38f7f1ebce7eb347ae404f1a8.c436b59fe314dd40f54abe23d985953b&response_type=code&access_type=offline&redirect_uri=https://pathoftrade.net/callback
```

2. Autorize a aplicação
3. Você será redirecionado para: `SEU_REDIRECT_URI?code=AUTHORIZATION_CODE`
4. Copie o `AUTHORIZATION_CODE` da URL

5. Use este código para obter o Refresh Token (via terminal ou Postman):

```bash
curl -X POST https://accounts.zoho.com/oauth/v2/token \
  -d "code=AUTHORIZATION_CODE" \
  -d "client_id=SEU_CLIENT_ID" \
  -d "client_secret=SEU_CLIENT_SECRET" \
  -d "redirect_uri=SEU_REDIRECT_URI" \
  -d "grant_type=authorization_code"
```

6. Na resposta, copie o `refresh_token` - **GUARDE-O COM SEGURANÇA**

### 3. Obter ORG_ID e DEPARTMENT_ID

- **ORG_ID**: No painel do Zoho Desk, vá em Setup → Channels → API → copie o Organization ID
- **DEPARTMENT_ID**: No painel do Zoho Desk, vá em Setup → Channels → Departments → copie o ID do departamento desejado

## Como o Sistema Funciona Agora

1. ✅ **Renovação Automática**: Se você configurar o Refresh Token, o sistema renovará automaticamente o Access Token a cada 55 minutos
2. ✅ **Cache em Memória**: O Access Token é armazenado em cache para evitar chamadas desnecessárias
3. ✅ **Fallback**: Se houver erro na renovação, o sistema usa o Access Token das variáveis de ambiente
4. ✅ **Detecção de Expiração**: Se receber erro `INVALID_OAUTH`, o cache é limpo automaticamente

## Testando

Depois de configurar as variáveis:

1. Reinicie o servidor Next.js
2. Acesse `/support/tickets`
3. Preencha e envie um ticket
4. Verifique os logs para confirmar que não há erros de OAuth

## Troubleshooting

### "ZOHO_REFRESH_TOKEN não configurado"
- Isso é apenas um aviso. O sistema continuará funcionando com o Access Token direto, mas você precisará renová-lo manualmente.

### "Failed to refresh Zoho token"
- Verifique se o Client ID, Client Secret e Refresh Token estão corretos
- Certifique-se de que o Refresh Token não expirou (eles geralmente não expiram, a menos que revogados)

### "Failed to create the ticket"
- Verifique se o ORG_ID e DEPARTMENT_ID estão corretos
- Confirme que o escopo OAuth inclui `Desk.tickets.ALL`

## Recursos Úteis

- [Zoho OAuth Documentation](https://www.zoho.com/accounts/protocol/oauth.html)
- [Zoho Desk API Documentation](https://desk.zoho.com/support/APIDocument.do)
- [Zoho API Console](https://api-console.zoho.com/)
