import fs from 'fs';

const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY || 'leticia-clinic-evolution-secret-key-2026';

const systemPrompt = `=Você é a Sofia, assistente virtual humanizada, empática e eficiente da Dra. Letícia Chaves (Médica · CRM-MG 114660).

CONTEXTO CRUCIAL DO NÚMERO (NÚMERO HÍBRIDO PESSOAL E PROFISSIONAL):
Este número de WhatsApp é tanto o canal profissional de teleconsultas da clínica quanto o número de uso pessoal da Letícia.
Por essa razão, em mensagens iniciais (como saudações "oi", "olá", "bom dia", "boa tarde") ou quando a intenção do contato ainda não estiver clara, você deve cumprimentar cordialmente e apresentar o menu de direcionamento:

"Olá! Tudo bem? 😊

Aqui é a Sofia, assistente virtual da Dra. Letícia Chaves (Médica · CRM-MG 114660).

Como este número também é utilizado para fins pessoais pela Letícia, para eu te direcionar da melhor forma, por favor escolha uma das opções abaixo:

1️⃣ Agendar Consulta Médica Online (Telemedicina)
2️⃣ Informações e Valores (R$ 80,00 · Pix ou Cartão)
3️⃣ Falar com a Letícia / Assunto Pessoal (amigos, família ou outros)

Como posso te ajudar hoje? (Você pode digitar apenas o número 1, 2 ou 3, ou me dizer o que precisa!)"

REGRAS DE CONDUTA POR OPÇÃO / INTENÇÃO:

- SE O CONTATO ESCOLHER A OPÇÃO 3 OU DISSER QUE É ASSUNTO PESSOAL / AMIGO / FAMÍLIA / SÓ CONVERSAR:
  Responda com carinho e gentileza imediata:
  "Perfeito! Já deixei avisado para a Letícia e ela te responderá diretamente por aqui assim que estiver disponível. Um abraço! 😊"
  ATENÇÃO: NUNCA tente agendar consulta, não pergunte sobre sintomas e encerre a sua intervenção por aí.

- SE O CONTATO ESCOLHER A OPÇÃO 2 OU PEDIR INFORMAÇÕES / VALORES:
  Apresente com total clareza, transparência e simpatia:
  • Atendimento 100% online por Telemedicina (chamada de vídeo individual e segura pelo WhatsApp ou Microsoft Teams). Não possuímos consultório físico.
  • Valor da consulta: R$ 80,00.
  • Formas de pagamento aceitas: Pix ou Cartão de crédito/débito.
  • Horários de atendimento disponíveis:
    - Segunda a Sexta-feira: das 18:00 às 22:00
    - Sábados: das 08:00 às 17:00
    - Domingos e feriados: Sem atendimento regular.
  • Duração média: cerca de 50 minutos a 1 hora.
  E pergunte gentilmente: "Gostaria de agendar o seu horário para algum dia e horário específico?"

- SE O PACIENTE ESCOLHER A OPÇÃO 1 OU QUISER AGENDAR CONSULTA:
  1. Pergunte o dia e horário de preferência dele (respeitando rigorosamente a grade de atendimento: Seg-Sex 18h às 22h, Sáb 08h às 17h). Se o paciente pedir um horário fora dessa grade, explique com carinho os horários permitidos e sugira as opções válidas mais próximas.
  2. Colete com o paciente de forma agradável e organizada:
     - Nome completo
     - E-mail (obrigatório para envio do link da teleconsulta e confirmação)
     - Dia e horário exatos
     - Breve motivo ou objetivo da consulta (ex: check-up de rotina, sintomas gerais, queixa específica, etc.)
     - Relembre que o valor é R$ 80,00 (Pix ou Cartão).
  3. Assim que você tiver esses 4 dados confirmados pelo paciente (nome, e-mail, data/hora e motivo), ACIONE OBRIGATORIAMENTE a ferramenta 'Ferramenta: Agendar Consulta'.
     Lembrete de data: O ano atual é 2026 (use formato ISO 8601 ex: '2026-10-20T19:00:00').
  4. Depois que a ferramenta responder com sucesso, informe com alegria que o agendamento foi realizado, confirme a data e hora marcadas e avise que todos os detalhes e o link da teleconsulta foram enviados para o e-mail dele.

REGRAS CRÍTICAS DE SEGURANÇA E ÉTICA MÉDICA (CFM / LGPD):
- NUNCA forneça diagnósticos, NÃO avalie nem interprete exames e NÃO prescreva medicamentos ou receitas pelo chat do WhatsApp.
- Em emergências graves (dor no peito intensa, falta de ar severa, convulsão, desmaio), oriente imediatamente a procurar um pronto-socorro ou acionar o SAMU 192.
- Mantenha mensagens concisas, elegantes e com boa formatação para o WhatsApp.`;

const liveWorkflow = [
  {
    "id": "vZVt7zcgMWzJCidw",
    "name": "Robô de Atendimento e Agendamento IA - Dra. Letícia Chaves",
    "active": true,
    "nodes": [
      {
        "parameters": {
          "httpMethod": "POST",
          "path": "whatsapp-ia",
          "responseMode": "onReceived",
          "responseData": "allEntries",
          "options": {}
        },
        "type": "n8n-nodes-base.webhook",
        "typeVersion": 2,
        "position": [0, 0],
        "id": "3bd7103c-80f7-41b7-9e48-428e25cf4535",
        "name": "1. Webhook Evolution WhatsApp",
        "webhookId": "e5468553-fcba-41f6-80c2-47d594c80649"
      },
      {
        "parameters": {
          "jsCode": "const body = $input.first().json.body || $input.first().json;\n\n// Suporte tanto para eventos da Evolution API quanto para mensagens diretas\nconst event = body.event || body.type;\nconst data = body.data || body;\n\nif (!data || !data.key) {\n  return [];\n}\n\n// Ignora mensagens enviadas pelo próprio robô/médica\nif (data.key.fromMe) {\n  return [];\n}\n\n// Ignora grupos e status do WhatsApp\nconst remoteJid = data.key.remoteJid || '';\nif (remoteJid.includes('@g.us') || remoteJid.includes('status@broadcast')) {\n  return [];\n}\n\n// Extrai o conteúdo da mensagem\nconst msg = data.message || {};\nconst userText = msg.conversation ||\n                 msg.extendedTextMessage?.text ||\n                 msg.imageMessage?.caption ||\n                 '';\n\nif (!userText || typeof userText !== 'string' || !userText.trim()) {\n  return [];\n}\n\nconst pushName = data.pushName || 'Paciente';\nconst rawPhone = remoteJid.replace(/@.*$/, '').replace(/\\D/g, '');\n\nreturn [{\n  json: {\n    remoteJid,\n    pushName,\n    rawPhone,\n    userText: userText.trim(),\n    sessionId: rawPhone\n  }\n}];"
        },
        "type": "n8n-nodes-base.code",
        "typeVersion": 2,
        "position": [240, 0],
        "id": "4d8f94f9-1695-4873-8b5b-f21562621d8c",
        "name": "2. Filtrar Mensagens do Paciente"
      },
      {
        "parameters": {
          "promptType": "define",
          "text": "={{ $json.userText }}",
          "options": {
            "systemMessage": systemPrompt
          }
        },
        "type": "@n8n/n8n-nodes-langchain.agent",
        "typeVersion": 1.7,
        "position": [512, 0],
        "id": "54f0d454-13e9-486a-b8fd-06169c0cdd8f",
        "name": "3. Agente IA da Dra. Letícia"
      },
      {
        "parameters": {
          "modelName": "models/gemini-3.8-flash",
          "options": {
            "temperature": 0.4
          }
        },
        "type": "@n8n/n8n-nodes-langchain.lmChatGoogleGemini",
        "typeVersion": 1,
        "position": [432, 224],
        "id": "fd96cb7a-56cf-4c33-a7f0-511cf8712534",
        "name": "Google Gemini Chat Model",
        "credentials": {
          "googlePalmApi": {
            "id": "1pfQ9RmT7OtKn4SX",
            "name": "Google Gemini(PaLM) Api account"
          }
        }
      },
      {
        "parameters": {
          "sessionIdType": "customKey",
          "sessionKey": "={{ $('2. Filtrar Mensagens do Paciente').item.json.sessionId }}",
          "contextWindowLength": 15
        },
        "type": "@n8n/n8n-nodes-langchain.memoryBufferWindow",
        "typeVersion": 1.3,
        "position": [544, 224],
        "id": "64940310-a400-41f9-92cc-ee6582b9ab4e",
        "name": "Memória da Conversa do Paciente"
      },
      {
        "parameters": {
          "toolDescription": "Utilize esta ferramenta OBRIGATORIAMENTE para registrar o agendamento no CRM assim que o paciente fornecer nome, e-mail, data/hora e motivo. O ano atual é 2026.",
          "method": "POST",
          "url": "http://localhost:5678/webhook/agendamento-consulta",
          "sendBody": true,
          "specifyBody": "keypair",
          "parametersBody": {
            "values": [
              {
                "name": "nome",
                "valueProvider": "modelRequired"
              },
              {
                "name": "whatsapp",
                "valueProvider": "fieldValue",
                "value": "={{ $('2. Filtrar Mensagens do Paciente').item.json.rawPhone }}"
              },
              {
                "name": "email",
                "valueProvider": "modelRequired"
              },
              {
                "name": "dataHora",
                "valueProvider": "modelRequired"
              },
              {
                "name": "modalidade",
                "valueProvider": "fieldValue",
                "value": "TELEMEDICINA"
              },
              {
                "name": "motivo",
                "valueProvider": "modelRequired"
              }
            ]
          },
          "placeholderDefinitions": {
            "values": [
              {
                "name": "nome",
                "description": "Nome completo do paciente",
                "type": "string"
              },
              {
                "name": "email",
                "description": "E-mail do paciente",
                "type": "string"
              },
              {
                "name": "dataHora",
                "description": "Data e hora no formato ISO 8601 ex: 2026-10-20T19:00:00",
                "type": "string"
              },
              {
                "name": "motivo",
                "description": "Breve motivo da consulta",
                "type": "string"
              }
            ]
          }
        },
        "type": "@n8n/n8n-nodes-langchain.toolHttpRequest",
        "typeVersion": 1.1,
        "position": [672, 224],
        "id": "6dd06b1d-5553-4213-8a54-c059090adb25",
        "name": "Ferramenta: Agendar Consulta"
      },
      {
        "parameters": {
          "method": "POST",
          "url": "http://evolution-api:8080/message/sendText/leticia-chaves",
          "sendHeaders": true,
          "headerParameters": {
            "parameters": [
              {
                "name": "apikey",
                "value": EVOLUTION_API_KEY
              },
              {
                "name": "Content-Type",
                "value": "application/json"
              }
            ]
          },
          "sendBody": true,
          "specifyBody": "keypair",
          "bodyParameters": {
            "parameters": [
              {
                "name": "number",
                "value": "={{ $('2. Filtrar Mensagens do Paciente').item.json.rawPhone }}"
              },
              {
                "name": "text",
                "value": "={{ $json.output }}"
              }
            ]
          },
          "options": {}
        },
        "type": "n8n-nodes-base.httpRequest",
        "typeVersion": 4.2,
        "position": [864, 0],
        "id": "325de386-e66b-40c3-827c-81bea7749f08",
        "name": "4. Enviar Resposta no WhatsApp"
      }
    ],
    "connections": {
      "1. Webhook Evolution WhatsApp": {
        "main": [
          [
            {
              "node": "2. Filtrar Mensagens do Paciente",
              "type": "main",
              "index": 0
            }
          ]
        ]
      },
      "2. Filtrar Mensagens do Paciente": {
        "main": [
          [
            {
              "node": "3. Agente IA da Dra. Letícia",
              "type": "main",
              "index": 0
            }
          ]
        ]
      },
      "Google Gemini Chat Model": {
        "ai_languageModel": [
          [
            {
              "node": "3. Agente IA da Dra. Letícia",
              "type": "ai_languageModel",
              "index": 0
            }
          ]
        ]
      },
      "Memória da Conversa do Paciente": {
        "ai_memory": [
          [
            {
              "node": "3. Agente IA da Dra. Letícia",
              "type": "ai_memory",
              "index": 0
            }
          ]
        ]
      },
      "Ferramenta: Agendar Consulta": {
        "ai_tool": [
          [
            {
              "node": "3. Agente IA da Dra. Letícia",
              "type": "ai_tool",
              "index": 0
            }
          ]
        ]
      },
      "3. Agente IA da Dra. Letícia": {
        "main": [
          [
            {
              "node": "4. Enviar Resposta no WhatsApp",
              "type": "main",
              "index": 0
            }
          ]
        ]
      }
    },
    "settings": {
      "executionOrder": "v1"
    }
  }
];

// Salva o JSON para o container
fs.writeFileSync('clinic-setup/leticia/workflow-n8n-live.json', JSON.stringify(liveWorkflow, null, 2), 'utf8');

// Cria versão sanitizada para o git
const sanitizedWorkflow = JSON.parse(JSON.stringify(liveWorkflow[0]));
delete sanitizedWorkflow.id;
delete sanitizedWorkflow.nodes.find(n => n.name === 'Google Gemini Chat Model').credentials;
sanitizedWorkflow.nodes.find(n => n.name === '4. Enviar Resposta no WhatsApp').parameters.headerParameters.parameters.find(p => p.name === 'apikey').value = 'SUA_CHAVE_API_EVOLUTION';
fs.writeFileSync('clinic-setup/leticia/fluxo-robo-ia-whatsapp.json', JSON.stringify(sanitizedWorkflow, null, 2), 'utf8');

console.log('JSON files successfully written!');
