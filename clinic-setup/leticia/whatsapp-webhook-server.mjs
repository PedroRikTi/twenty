import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const [key, ...rest] = trimmed.split('=');
      const val = rest.join('=').trim().replace(/^['"]|['"]$/g, '');
      if (!process.env[key.trim()]) {
        process.env[key.trim()] = val;
      }
    }
  }
}

const PORT = parseInt(process.env.PORT ?? '3002', 10);
const TWENTY_API_URL = (process.env.TWENTY_API_URL ?? 'http://localhost:3000').replace(/\/$/, '');
const TWENTY_API_KEY = process.env.TWENTY_API_KEY ?? '';
const EVOLUTION_API_URL = (process.env.EVOLUTION_API_URL ?? 'http://localhost:8080').replace(/\/$/, '');
const EVOLUTION_API_KEY = process.env.EVOLUTION_API_KEY ?? '';
const EVOLUTION_INSTANCE = process.env.EVOLUTION_INSTANCE ?? 'leticia-chaves';
const WEBHOOK_URL = process.env.WEBHOOK_URL ?? 'http://host.docker.internal:3002/webhook';

if (!TWENTY_API_KEY) {
  console.warn('⚠ AVISO: TWENTY_API_KEY não configurada. Defina no arquivo .env ou variável de ambiente.');
}


const twentyRequest = async (method, path, payload) => {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${TWENTY_API_KEY}`,
    },
  };

  if (payload !== undefined) {
    options.body = JSON.stringify(payload);
  }

  const response = await fetch(`${TWENTY_API_URL}/rest/${path}`, options);
  const data = await response.json();

  if (!response.ok) {
    throw new Error(`Twenty API error (${response.status}): ${JSON.stringify(data)}`);
  }

  return data;
};

const registerEvolutionWebhook = async () => {
  try {
    console.log(`🔗 Registrando Webhook na Evolution API (${EVOLUTION_INSTANCE})...`);
    const response = await fetch(`${EVOLUTION_API_URL}/webhook/set/${EVOLUTION_INSTANCE}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: EVOLUTION_API_KEY,
      },
      body: JSON.stringify({
        webhook: {
          enabled: true,
          url: WEBHOOK_URL,
          byEvents: false,
          base64: false,
          events: ['MESSAGES_UPSERT'],
        },
      }),
    });

    const result = await response.json();

    if (response.ok) {
      console.log(`✔ Webhook registrado com sucesso na Evolution API! Alvo: ${WEBHOOK_URL}`);
    } else {
      console.warn(`⚠ Aviso ao registrar webhook:`, result);
    }
  } catch (error) {
    console.error(`✖ Erro ao registrar webhook na Evolution API:`, error.message);
  }
};

const parseName = (pushName, fallbackNumber) => {
  if (!pushName || typeof pushName !== 'string' || pushName.trim().length === 0) {
    return { firstName: 'Paciente', lastName: fallbackNumber };
  }

  const parts = pushName.trim().split(/\s+/);
  if (parts.length === 1) {
    return { firstName: parts[0], lastName: '' };
  }

  return {
    firstName: parts[0],
    lastName: parts.slice(1).join(' '),
  };
};

const findPatientByPhone = async (phoneDigits) => {
  try {
    const data = await twentyRequest('GET', 'people?limit=100');
    const patients = data?.data?.people ?? [];

    const normalizedTarget = phoneDigits.replace(/\D/g, '');
    const targetWithoutDdi = normalizedTarget.startsWith('55')
      ? normalizedTarget.slice(2)
      : normalizedTarget;

    for (const patient of patients) {
      const whatsappNumber = (patient.whatsapp?.primaryPhoneNumber ?? '').replace(/\D/g, '');
      const phoneNumber = (patient.phones?.primaryPhoneNumber ?? '').replace(/\D/g, '');

      if (
        (whatsappNumber && (whatsappNumber === normalizedTarget || whatsappNumber === targetWithoutDdi)) ||
        (phoneNumber && (phoneNumber === normalizedTarget || phoneNumber === targetWithoutDdi))
      ) {
        return patient;
      }
    }

    return null;
  } catch (error) {
    console.error(`Erro ao consultar pacientes no Twenty:`, error.message);
    return null;
  }
};

const handleIncomingMessage = async (body) => {
  const event = body.event || body.type;

  if (event !== 'messages.upsert' && event !== 'MESSAGES_UPSERT') {
    return;
  }

  const messageData = body.data;
  if (!messageData || !messageData.key) {
    return;
  }

  const { remoteJid, fromMe, id: messageId } = messageData.key;

  // Ignorar mensagens enviadas pela própria clínica ou grupos
  if (fromMe || !remoteJid || remoteJid.includes('@g.us') || remoteJid.includes('broadcast')) {
    return;
  }

  const rawPhone = remoteJid.replace('@s.whatsapp.net', '').replace(/\D/g, '');
  const localNumber = rawPhone.startsWith('55') ? rawPhone.slice(2) : rawPhone;
  const pushName = messageData.pushName || '';

  const messageText =
    messageData.message?.conversation ||
    messageData.message?.extendedTextMessage?.text ||
    messageData.message?.imageMessage?.caption ||
    '[Mídia/Áudio]';

  console.log(`\n📩 Nova mensagem recebida de ${pushName || rawPhone} (${rawPhone}):`);
  console.log(`   "${messageText}"`);

  let patient = await findPatientByPhone(rawPhone);

  if (!patient) {
    const { firstName, lastName } = parseName(pushName, rawPhone);
    console.log(`✨ Paciente não encontrado. Cadastrando novo lead: ${firstName} ${lastName}...`);

    try {
      const created = await twentyRequest('POST', 'people', {
        name: { firstName, lastName },
        whatsapp: {
          primaryPhoneNumber: localNumber,
          primaryPhoneCountryCode: 'BR',
          primaryPhoneCallingCode: '+55',
        },
        phones: {
          primaryPhoneNumber: localNumber,
          primaryPhoneCountryCode: 'BR',
          primaryPhoneCallingCode: '+55',
        },
        etapa: 'LEAD_NOVO',
        origem: 'WHATSAPP_DIRETO',
        canalPreferido: 'WHATSAPP',
        optInWhatsapp: true,
      });

      patient = created.data?.createPerson || created.data;
      console.log(`✔ Novo paciente criado com sucesso no Twenty! ID: ${patient.id}`);
    } catch (err) {
      console.error(`✖ Erro ao criar paciente no Twenty:`, err.message);
      return;
    }
  } else {
    console.log(`👤 Paciente já existente no Twenty: ${patient.name?.firstName} ${patient.name?.lastName || ''} (ID: ${patient.id})`);
  }

  // Registrar a mensagem no objeto Registro de Comunicação
  if (patient?.id) {
    try {
      await twentyRequest('POST', 'registrosComunicacao', {
        pacienteId: patient.id,
        canal: 'WHATSAPP',
        direcao: 'RECEBIDA',
        statusEnvio: 'RESPONDIDA',
        dataHora: new Date().toISOString(),
        idExterno: messageId,
      });
      console.log(`✔ Registro de Comunicação gravado no Twenty.`);
    } catch (commError) {
      console.warn(`⚠ Registro de Comunicação não gravado:`, commError.message);
    }
  }
};

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === 'GET' && (url.pathname === '/' || url.pathname === '/health')) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'online', service: 'WhatsApp Twenty Webhook Bridge' }));
    return;
  }

  if (req.method === 'POST' && url.pathname === '/webhook') {
    let bodyData = '';

    req.on('data', (chunk) => {
      bodyData += chunk;
    });

    req.on('end', async () => {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ received: true }));

      try {
        if (bodyData.trim()) {
          const parsed = JSON.parse(bodyData);
          await handleIncomingMessage(parsed);
        }
      } catch (err) {
        console.error('Erro ao processar payload do webhook:', err.message);
      }
    });

    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'Not Found' }));
});

server.listen(PORT, '0.0.0.0', async () => {
  console.log(`=======================================================`);
  console.log(`🚀 WhatsApp ↔ Twenty Webhook Bridge ativo na porta ${PORT}`);
  console.log(`👉 Webhook URL configurada: ${WEBHOOK_URL}`);
  console.log(`👉 Twenty CRM URL: ${TWENTY_API_URL}`);
  console.log(`👉 Evolution API: ${EVOLUTION_API_URL}`);
  console.log(`=======================================================`);

  await registerEvolutionWebhook();
});
