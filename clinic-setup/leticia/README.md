# Setup do CRM: Dra. Letícia Chaves (CRM-MG 114660)

Este script cria no Twenty o modelo de dados da Fase 1 do plano de configuração.

## O que o `setup-data-model.mjs` cria
- **People** passa a se chamar **Pacientes** e ganha 28 campos: jornada, contato, financeiro, relacionamento, resumo clínico restrito e LGPD.
- 8 objetos novos: **Profissional**, **Campanha**, **Modelo de Mensagem**, **Consulta**, **Plano de Acompanhamento**, **Consentimento**, **Registro de Comunicação** e **Solicitação do Titular**, com as relações entre eles.
- 1 registro **Profissional** com as credenciais da Dra.
- 10 **Modelos de Mensagem** com os textos padrão.

O script é idempotente. O que já existe (mesmo nome de API) é pulado, então ele pode ser rodado de novo sem duplicar nada.

## Como rodar
1. Suba o Twenty e entre como administrador.
2. Em **Settings → APIs & Webhooks**, crie uma API key.
3. No PowerShell:
   ```powershell
   $env:TWENTY_API_URL = "http://localhost:3000"
   $env:TWENTY_API_KEY = "<cole a chave>"
   $env:DRY_RUN = "true"; node clinic-setup/leticia/setup-data-model.mjs   # simulação
   $env:DRY_RUN = "false"; node clinic-setup/leticia/setup-data-model.mjs  # aplica
   ```
4. Revogue a API key se ela não for mais usada.

## O que fazer na interface depois de rodar
- **Views**: Jornada do Paciente (kanban por Etapa), Agenda de Hoje, Retornos vencendo etc. (plano §2.5).
- **Roles**: papel *Secretária* sem acesso a `alergiasRelevantes`, `condicoesAcompanhamento`, `linkProntuario` e ao objeto Plano de Acompanhamento (plano §5.3).
- **Profissional**: preencher endereço, WhatsApp e link de agendamento, e confirmar a formação.
- **Workflows** e **Dashboards** (plano §3 e §6).

## Evolution API (WhatsApp)
A Evolution API está integrada no Docker Compose:
- **API URL**: `http://localhost:8080`
- **Painel de Gestão (Manager)**: `http://localhost:8080/manager`
- **Chave de API (`apikey`)**: Definida no seu arquivo `.env` (ex: `EVOLUTION_API_KEY`)
- **Criar/Conectar Instância**:
  1. Acesse `http://localhost:8080/manager`.
  2. Insira a URL da API (`http://localhost:8080`) e a chave acima.
  3. Crie uma nova instância (ex: `leticia-chaves`) e leia o QR Code com o WhatsApp da clínica.

## Webhook Bridge (WhatsApp ↔ Twenty)
O servidor de sincronização em tempo real está em `clinic-setup/leticia/whatsapp-webhook-server.mjs`:
- **Porta**: `3002`
- **Como funciona**:
  - Registra automaticamente o webhook na Evolution API.
  - Ao receber mensagens (`MESSAGES_UPSERT`), busca o paciente pelo número no Twenty.
  - Se não existir, cadastra automaticamente como novo paciente (`LEAD_NOVO`, `WHATSAPP_DIRETO`).
  - Registra a mensagem no histórico do paciente em `Registro de Comunicação`.
- **Como iniciar**:
  ```powershell
  node clinic-setup/leticia/whatsapp-webhook-server.mjs
  ```

## n8n (Motor de Automações Visuais)
O n8n está integrado no Docker Compose:
- **Painel Visual**: `http://localhost:5678`
- **Conexões internas no Docker**:
  - Twenty CRM: `http://server:3000`
  - Evolution API: `http://evolution-api:8080`
- **Casos de uso configuráveis**:
  - Respostas automáticas de WhatsApp e qualificação de leads.
  - Agendamento de consultas sincronizado com Google Calendar / Cal.com.
  - Disparo de e-mails de confirmação e recibos (SMTP / Resend / Gmail).
  - Lembretes automáticos (24h antes, pós-consulta, reativação, aniversário).
