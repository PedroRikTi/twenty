// Provisions the clinic data model for Dra. Letícia Chaves (CRM-MG 114660) on a Twenty workspace.
// Idempotent: existing objects/fields (matched by API name) are skipped, so it is safe to re-run.
//
// Usage (PowerShell):
//   $env:TWENTY_API_URL="http://localhost:3000"; $env:TWENTY_API_KEY="<api key>"; node setup-data-model.mjs
//   $env:DRY_RUN="true" to only print what would be created.

const API_URL = (process.env.TWENTY_API_URL ?? 'http://localhost:3000').replace(/\/$/, '');
const API_KEY = process.env.TWENTY_API_KEY;
const DRY_RUN = process.env.DRY_RUN === 'true';

if (!API_KEY) {
  console.error('Defina TWENTY_API_KEY (Settings → APIs & Webhooks → Create API key).');
  process.exit(1);
}

const option = (label, value, color, position) => ({ label, value, color, position });

const toOptions = (entries) =>
  entries.map(([label, value, color], position) => option(label, value, color, position));

const RELATION_TO_PERSON = (targetFieldLabel, targetFieldIcon) => ({
  type: 'RELATION',
  relationTarget: 'person',
  targetFieldLabel,
  targetFieldIcon,
});

const PERSON_FIELDS = [
  { name: 'etapa', label: 'Etapa', type: 'SELECT', icon: 'IconProgress', options: toOptions([
    ['Lead novo', 'LEAD_NOVO', 'sky'],
    ['Lead em contato', 'LEAD_EM_CONTATO', 'blue'],
    ['Agendado', 'AGENDADO', 'purple'],
    ['Paciente ativo', 'PACIENTE_ATIVO', 'green'],
    ['Paciente inativo', 'PACIENTE_INATIVO', 'orange'],
    ['Não convertido', 'NAO_CONVERTIDO', 'gray'],
  ]), defaultValue: "'LEAD_NOVO'" },
  { name: 'origem', label: 'Origem', type: 'SELECT', icon: 'IconRoute', options: toOptions([
    ['Instagram', 'INSTAGRAM', 'pink'],
    ['Indicação de paciente', 'INDICACAO_PACIENTE', 'green'],
    ['Indicação médica', 'INDICACAO_MEDICA', 'turquoise'],
    ['Google', 'GOOGLE', 'blue'],
    ['Site', 'SITE', 'sky'],
    ['Página de agendamento', 'PAGINA_AGENDAMENTO', 'purple'],
    ['WhatsApp direto', 'WHATSAPP_DIRETO', 'green'],
    ['Outro', 'OUTRO', 'gray'],
  ]) },
  { name: 'tagsPaciente', label: 'Tags', type: 'MULTI_SELECT', icon: 'IconTags', options: toOptions([
    ['Check-up', 'CHECK_UP', 'blue'],
    ['Crônico', 'CRONICO', 'orange'],
    ['Gestante', 'GESTANTE', 'pink'],
    ['Idoso', 'IDOSO', 'purple'],
    ['Telemedicina', 'TELEMEDICINA', 'sky'],
    ['VIP', 'VIP', 'yellow'],
  ]) },
  { name: 'dataNascimento', label: 'Data de nascimento', type: 'DATE', icon: 'IconCake' },
  { name: 'cpf', label: 'CPF', type: 'TEXT', icon: 'IconId' },
  { name: 'sexoGenero', label: 'Sexo / Gênero', type: 'SELECT', icon: 'IconGenderBigender', options: toOptions([
    ['Feminino', 'FEMININO', 'pink'],
    ['Masculino', 'MASCULINO', 'blue'],
    ['Não binário', 'NAO_BINARIO', 'purple'],
    ['Prefere não informar', 'NAO_INFORMADO', 'gray'],
  ]) },
  { name: 'nomeSocial', label: 'Nome social', type: 'TEXT', icon: 'IconUserHeart' },
  { name: 'whatsapp', label: 'WhatsApp', type: 'PHONES', icon: 'IconBrandWhatsapp' },
  { name: 'canalPreferido', label: 'Canal preferido', type: 'SELECT', icon: 'IconMessageCircle', options: toOptions([
    ['WhatsApp', 'WHATSAPP', 'green'],
    ['E-mail', 'EMAIL', 'blue'],
    ['Ligação', 'LIGACAO', 'orange'],
  ]) },
  { name: 'melhorHorario', label: 'Melhor horário', type: 'SELECT', icon: 'IconClock', options: toOptions([
    ['Manhã', 'MANHA', 'yellow'],
    ['Tarde', 'TARDE', 'orange'],
    ['Noite', 'NOITE', 'purple'],
  ]) },
  { name: 'endereco', label: 'Endereço', type: 'ADDRESS', icon: 'IconMapPin' },
  { name: 'modalidade', label: 'Modalidade', type: 'SELECT', icon: 'IconCash', options: toOptions([
    ['Particular', 'PARTICULAR', 'green'],
    ['Convênio', 'CONVENIO', 'blue'],
    ['Cortesia', 'CORTESIA', 'gray'],
  ]) },
  { name: 'convenio', label: 'Convênio', type: 'TEXT', icon: 'IconShieldCheck' },
  { name: 'primeiraConsulta', label: 'Primeira consulta', type: 'DATE', icon: 'IconCalendarPlus' },
  { name: 'ultimaConsulta', label: 'Última consulta', type: 'DATE', icon: 'IconCalendarCheck' },
  { name: 'proximoRetorno', label: 'Próximo retorno previsto', type: 'DATE', icon: 'IconCalendarRepeat' },
  { name: 'totalConsultas', label: 'Total de consultas', type: 'NUMBER', icon: 'IconHash' },
  { name: 'npsUltimaNota', label: 'NPS (última nota)', type: 'NUMBER', icon: 'IconMoodSmile' },
  { name: 'preferencias', label: 'Preferências', type: 'TEXT', icon: 'IconHeart' },
  // Clinical summary fields: restrict via role field permissions (Secretária must not read them).
  { name: 'alergiasRelevantes', label: 'Alergias relevantes', type: 'TEXT', icon: 'IconAlertTriangle' },
  { name: 'condicoesAcompanhamento', label: 'Condições em acompanhamento', type: 'MULTI_SELECT', icon: 'IconStethoscope', options: toOptions([
    ['Hipertensão', 'HIPERTENSAO', 'red'],
    ['Diabetes', 'DIABETES', 'orange'],
    ['Saúde mental', 'SAUDE_MENTAL', 'purple'],
    ['Respiratória', 'RESPIRATORIA', 'sky'],
    ['Outra', 'OUTRA', 'gray'],
  ]) },
  { name: 'linkProntuario', label: 'Link do prontuário (PEP)', type: 'LINKS', icon: 'IconFileText' },
  { name: 'consentimentoDados', label: 'Consentimento tratamento de dados', type: 'BOOLEAN', icon: 'IconShieldLock', defaultValue: false },
  { name: 'optInWhatsapp', label: 'Opt-in WhatsApp', type: 'BOOLEAN', icon: 'IconBrandWhatsapp', defaultValue: false },
  { name: 'optInMarketing', label: 'Opt-in e-mail/WhatsApp marketing', type: 'BOOLEAN', icon: 'IconSpeakerphone', defaultValue: false },
  { name: 'dataUltimoConsentimento', label: 'Data do último consentimento', type: 'DATE_TIME', icon: 'IconCalendarTime' },
  { name: 'optOutGeral', label: 'Opt-out geral', type: 'BOOLEAN', icon: 'IconBan', defaultValue: false },
];

// Order matters: relation targets must exist before the relation fields that point to them.
const CUSTOM_OBJECTS = [
  {
    nameSingular: 'profissional', namePlural: 'profissionais',
    labelSingular: 'Profissional', labelPlural: 'Profissionais', icon: 'IconStethoscope',
    description: 'Credenciais da médica responsável, usadas nos templates e assinaturas.',
    fields: [
      { name: 'nomeCompleto', label: 'Nome completo', type: 'TEXT', icon: 'IconUser' },
      { name: 'numeroCrm', label: 'Número CRM', type: 'TEXT', icon: 'IconId' },
      { name: 'ufCrm', label: 'UF CRM', type: 'SELECT', icon: 'IconMap', options: toOptions([
        ['MG', 'MG', 'blue'], ['SP', 'SP', 'gray'], ['RJ', 'RJ', 'gray'], ['ES', 'ES', 'gray'],
      ]) },
      { name: 'dataInscricao', label: 'Data de inscrição', type: 'DATE', icon: 'IconCalendar' },
      { name: 'situacaoRegistro', label: 'Situação do registro', type: 'SELECT', icon: 'IconCircleCheck', options: toOptions([
        ['Ativa – Regular', 'ATIVA_REGULAR', 'green'],
        ['Suspensa', 'SUSPENSA', 'orange'],
        ['Cancelada', 'CANCELADA', 'red'],
      ]) },
      { name: 'especialidadeRqe', label: 'Especialidade (RQE)', type: 'TEXT', icon: 'IconCertificate' },
      { name: 'formacao', label: 'Formação', type: 'TEXT', icon: 'IconSchool' },
      { name: 'assinaturaEmail', label: 'Assinatura de e-mail', type: 'TEXT', icon: 'IconSignature' },
      { name: 'linkVerificacao', label: 'Link de verificação', type: 'LINKS', icon: 'IconExternalLink' },
      { name: 'enderecoConsultorio', label: 'Endereço do consultório', type: 'ADDRESS', icon: 'IconMapPin' },
      { name: 'whatsappConsultorio', label: 'WhatsApp do consultório', type: 'PHONES', icon: 'IconBrandWhatsapp' },
      { name: 'linkAgendamento', label: 'Link de agendamento', type: 'LINKS', icon: 'IconCalendarPlus' },
    ],
  },
  {
    nameSingular: 'campanha', namePlural: 'campanhas',
    labelSingular: 'Campanha', labelPlural: 'Campanhas', icon: 'IconSpeakerphone',
    fields: [
      { name: 'tipoCampanha', label: 'Tipo', type: 'SELECT', icon: 'IconCategory', options: toOptions([
        ['Reativação', 'REATIVACAO', 'orange'],
        ['Aniversário', 'ANIVERSARIO', 'pink'],
        ['Check-up sazonal', 'CHECK_UP_SAZONAL', 'blue'],
        ['Educativa', 'EDUCATIVA', 'green'],
      ]) },
      { name: 'publico', label: 'Público (filtro)', type: 'TEXT', icon: 'IconUsers' },
      { name: 'inicio', label: 'Início', type: 'DATE', icon: 'IconCalendar' },
      { name: 'fim', label: 'Fim', type: 'DATE', icon: 'IconCalendarOff' },
      { name: 'enviados', label: 'Enviados', type: 'NUMBER', icon: 'IconSend' },
      { name: 'respostas', label: 'Respostas', type: 'NUMBER', icon: 'IconMessageReply' },
      { name: 'agendamentosGerados', label: 'Agendamentos gerados', type: 'NUMBER', icon: 'IconCalendarCheck' },
      { name: 'statusCampanha', label: 'Status', type: 'SELECT', icon: 'IconProgress', options: toOptions([
        ['Planejada', 'PLANEJADA', 'gray'],
        ['Em andamento', 'EM_ANDAMENTO', 'blue'],
        ['Concluída', 'CONCLUIDA', 'green'],
      ]) },
    ],
  },
  {
    nameSingular: 'modeloMensagem', namePlural: 'modelosMensagem',
    labelSingular: 'Modelo de Mensagem', labelPlural: 'Modelos de Mensagem', icon: 'IconTemplate',
    description: 'Textos editáveis pela Dra. Para WhatsApp, o texto precisa estar aprovado na Meta.',
    fields: [
      { name: 'chave', label: 'Chave', type: 'TEXT', icon: 'IconKey' },
      { name: 'canal', label: 'Canal', type: 'SELECT', icon: 'IconMessageCircle', options: toOptions([
        ['WhatsApp', 'WHATSAPP', 'green'], ['E-mail', 'EMAIL', 'blue'],
      ]) },
      { name: 'assunto', label: 'Assunto', type: 'TEXT', icon: 'IconMail' },
      { name: 'corpo', label: 'Corpo', type: 'TEXT', icon: 'IconAlignLeft' },
      { name: 'templateMeta', label: 'Nome do template na Meta', type: 'TEXT', icon: 'IconBrandMeta' },
      { name: 'ativo', label: 'Ativo', type: 'BOOLEAN', icon: 'IconToggleRight', defaultValue: true },
    ],
  },
  {
    nameSingular: 'consulta', namePlural: 'consultas',
    labelSingular: 'Consulta', labelPlural: 'Consultas', icon: 'IconCalendarEvent',
    fields: [
      { name: 'paciente', label: 'Paciente', icon: 'IconUser', ...RELATION_TO_PERSON('Consultas', 'IconCalendarEvent') },
      { name: 'inicio', label: 'Início', type: 'DATE_TIME', icon: 'IconClockPlay' },
      { name: 'fim', label: 'Fim', type: 'DATE_TIME', icon: 'IconClockStop' },
      { name: 'tipoConsulta', label: 'Tipo', type: 'SELECT', icon: 'IconCategory', options: toOptions([
        ['Primeira consulta', 'PRIMEIRA_CONSULTA', 'purple'],
        ['Retorno', 'RETORNO', 'blue'],
        ['Check-up', 'CHECK_UP', 'turquoise'],
        ['Teleconsulta', 'TELECONSULTA', 'sky'],
      ]) },
      { name: 'modalidadeAtendimento', label: 'Modalidade', type: 'SELECT', icon: 'IconBuildingHospital', options: toOptions([
        ['Presencial', 'PRESENCIAL', 'green'], ['Telemedicina', 'TELEMEDICINA', 'sky'],
      ]) },
      { name: 'statusConsulta', label: 'Status', type: 'SELECT', icon: 'IconProgressCheck', options: toOptions([
        ['Agendada', 'AGENDADA', 'blue'],
        ['Confirmada', 'CONFIRMADA', 'turquoise'],
        ['Realizada', 'REALIZADA', 'green'],
        ['Faltou', 'FALTOU', 'red'],
        ['Cancelada pelo paciente', 'CANCELADA_PACIENTE', 'orange'],
        ['Cancelada pela médica', 'CANCELADA_MEDICA', 'gray'],
        ['Remarcada', 'REMARCADA', 'yellow'],
      ]), defaultValue: "'AGENDADA'" },
      { name: 'motivoResumo', label: 'Motivo (resumo)', type: 'TEXT', icon: 'IconNotes' },
      { name: 'linkTeleconsulta', label: 'Link da teleconsulta', type: 'LINKS', icon: 'IconVideo' },
      { name: 'valor', label: 'Valor', type: 'CURRENCY', icon: 'IconCurrencyReal' },
      { name: 'pagamento', label: 'Pagamento', type: 'SELECT', icon: 'IconCreditCard', options: toOptions([
        ['Pix', 'PIX', 'turquoise'],
        ['Cartão', 'CARTAO', 'blue'],
        ['Dinheiro', 'DINHEIRO', 'green'],
        ['Convênio', 'CONVENIO', 'purple'],
        ['Pendente', 'PENDENTE', 'orange'],
      ]) },
      { name: 'retornoNecessario', label: 'Retorno necessário', type: 'BOOLEAN', icon: 'IconRepeat', defaultValue: false },
      { name: 'prazoRetornoDias', label: 'Prazo de retorno (dias)', type: 'NUMBER', icon: 'IconCalendarRepeat' },
      { name: 'lembrete48hEnviado', label: 'Lembrete 48h enviado', type: 'BOOLEAN', icon: 'IconBell', defaultValue: false },
      { name: 'lembrete24hEnviado', label: 'Lembrete 24h enviado', type: 'BOOLEAN', icon: 'IconBellRinging', defaultValue: false },
      { name: 'confirmacaoRecebida', label: 'Confirmação recebida', type: 'DATE_TIME', icon: 'IconChecks' },
      { name: 'origemAgendamento', label: 'Origem do agendamento', type: 'SELECT', icon: 'IconRoute', options: toOptions([
        ['Página online', 'PAGINA_ONLINE', 'purple'],
        ['WhatsApp', 'WHATSAPP', 'green'],
        ['Telefone', 'TELEFONE', 'orange'],
        ['Presencial', 'PRESENCIAL', 'blue'],
      ]) },
      { name: 'idEventoExterno', label: 'ID evento externo', type: 'TEXT', icon: 'IconLink' },
      { name: 'utmCampanha', label: 'Campanha de origem (utm)', type: 'TEXT', icon: 'IconSpeakerphone' },
    ],
  },
  {
    nameSingular: 'planoAcompanhamento', namePlural: 'planosAcompanhamento',
    labelSingular: 'Plano de Acompanhamento', labelPlural: 'Planos de Acompanhamento', icon: 'IconClipboardHeart',
    description: 'Resumo do plano (sem conteúdo clínico, que fica no PEP).',
    fields: [
      { name: 'paciente', label: 'Paciente', icon: 'IconUser', ...RELATION_TO_PERSON('Planos de acompanhamento', 'IconClipboardHeart') },
      { name: 'consultaOrigem', label: 'Consulta de origem', type: 'RELATION', icon: 'IconCalendarEvent',
        relationTarget: 'consulta', targetFieldLabel: 'Planos de acompanhamento', targetFieldIcon: 'IconClipboardHeart' },
      { name: 'objetivo', label: 'Objetivo', type: 'TEXT', icon: 'IconTarget' },
      { name: 'statusPlano', label: 'Status', type: 'SELECT', icon: 'IconProgress', options: toOptions([
        ['Em andamento', 'EM_ANDAMENTO', 'blue'],
        ['Concluído', 'CONCLUIDO', 'green'],
        ['Interrompido', 'INTERROMPIDO', 'red'],
        ['Encaminhado', 'ENCAMINHADO', 'purple'],
      ]) },
      { name: 'inicio', label: 'Início', type: 'DATE', icon: 'IconCalendar' },
      { name: 'proximaRevisao', label: 'Próxima revisão', type: 'DATE', icon: 'IconCalendarRepeat' },
      { name: 'desfecho', label: 'Desfecho', type: 'SELECT', icon: 'IconChartLine', options: toOptions([
        ['Melhora', 'MELHORA', 'green'],
        ['Estável', 'ESTAVEL', 'blue'],
        ['Piora', 'PIORA', 'red'],
        ['Encaminhado a especialista', 'ENCAMINHADO_ESPECIALISTA', 'purple'],
        ['Sem informação', 'SEM_INFORMACAO', 'gray'],
      ]) },
      { name: 'adesao', label: 'Adesão (1–5)', type: 'NUMBER', icon: 'IconStar' },
      { name: 'examesPendentes', label: 'Exames pendentes', type: 'BOOLEAN', icon: 'IconTestPipe', defaultValue: false },
    ],
  },
  {
    nameSingular: 'consentimento', namePlural: 'consentimentos',
    labelSingular: 'Consentimento', labelPlural: 'Consentimentos', icon: 'IconShieldLock',
    description: 'Trilha de evidência LGPD (art. 8º e 11). Anexar o termo assinado na aba Arquivos.',
    fields: [
      { name: 'paciente', label: 'Paciente', icon: 'IconUser', ...RELATION_TO_PERSON('Consentimentos', 'IconShieldLock') },
      { name: 'finalidade', label: 'Finalidade', type: 'SELECT', icon: 'IconTarget', options: toOptions([
        ['Tratamento de dados de saúde', 'DADOS_SAUDE', 'blue'],
        ['Lembretes por WhatsApp', 'LEMBRETES_WHATSAPP', 'green'],
        ['E-mail/WhatsApp marketing', 'MARKETING', 'orange'],
        ['Telemedicina (TCLE)', 'TELEMEDICINA_TCLE', 'sky'],
        ['Uso de imagem', 'USO_IMAGEM', 'pink'],
      ]) },
      { name: 'situacao', label: 'Situação', type: 'SELECT', icon: 'IconCircleCheck', options: toOptions([
        ['Concedido', 'CONCEDIDO', 'green'], ['Revogado', 'REVOGADO', 'red'],
      ]) },
      { name: 'dataHora', label: 'Data/hora', type: 'DATE_TIME', icon: 'IconCalendarTime' },
      { name: 'versaoTermo', label: 'Versão do termo', type: 'TEXT', icon: 'IconVersions' },
      { name: 'canalColeta', label: 'Canal de coleta', type: 'SELECT', icon: 'IconInbox', options: toOptions([
        ['Formulário online', 'FORMULARIO_ONLINE', 'purple'],
        ['Assinado presencial', 'PRESENCIAL', 'blue'],
        ['WhatsApp', 'WHATSAPP', 'green'],
        ['E-mail', 'EMAIL', 'sky'],
      ]) },
    ],
  },
  {
    nameSingular: 'registroComunicacao', namePlural: 'registrosComunicacao',
    labelSingular: 'Registro de Comunicação', labelPlural: 'Registros de Comunicação', icon: 'IconMessages',
    fields: [
      { name: 'paciente', label: 'Paciente', icon: 'IconUser', ...RELATION_TO_PERSON('Comunicações', 'IconMessages') },
      { name: 'campanha', label: 'Campanha', type: 'RELATION', icon: 'IconSpeakerphone',
        relationTarget: 'campanha', targetFieldLabel: 'Comunicações', targetFieldIcon: 'IconMessages' },
      { name: 'modelo', label: 'Modelo usado', type: 'RELATION', icon: 'IconTemplate',
        relationTarget: 'modeloMensagem', targetFieldLabel: 'Comunicações', targetFieldIcon: 'IconMessages' },
      { name: 'canal', label: 'Canal', type: 'SELECT', icon: 'IconMessageCircle', options: toOptions([
        ['WhatsApp', 'WHATSAPP', 'green'], ['E-mail', 'EMAIL', 'blue'],
      ]) },
      { name: 'direcao', label: 'Direção', type: 'SELECT', icon: 'IconArrowsExchange', options: toOptions([
        ['Enviada', 'ENVIADA', 'blue'], ['Recebida', 'RECEBIDA', 'purple'],
      ]) },
      { name: 'statusEnvio', label: 'Status', type: 'SELECT', icon: 'IconChecks', options: toOptions([
        ['Enviada', 'ENVIADA', 'gray'],
        ['Entregue', 'ENTREGUE', 'blue'],
        ['Lida', 'LIDA', 'turquoise'],
        ['Respondida', 'RESPONDIDA', 'green'],
        ['Falhou', 'FALHOU', 'red'],
      ]) },
      { name: 'dataHora', label: 'Data/hora', type: 'DATE_TIME', icon: 'IconCalendarTime' },
      { name: 'idExterno', label: 'ID externo', type: 'TEXT', icon: 'IconLink' },
    ],
  },
  {
    nameSingular: 'solicitacaoTitular', namePlural: 'solicitacoesTitular',
    labelSingular: 'Solicitação do Titular', labelPlural: 'Solicitações do Titular', icon: 'IconGavel',
    description: 'Pedidos LGPD (art. 18). Responder em até 15 dias.',
    fields: [
      { name: 'paciente', label: 'Paciente', icon: 'IconUser', ...RELATION_TO_PERSON('Solicitações LGPD', 'IconGavel') },
      { name: 'tipoSolicitacao', label: 'Tipo', type: 'SELECT', icon: 'IconCategory', options: toOptions([
        ['Acesso', 'ACESSO', 'blue'],
        ['Correção', 'CORRECAO', 'yellow'],
        ['Eliminação', 'ELIMINACAO', 'red'],
        ['Portabilidade', 'PORTABILIDADE', 'purple'],
        ['Revogação de consentimento', 'REVOGACAO', 'orange'],
        ['Informação sobre compartilhamento', 'COMPARTILHAMENTO', 'sky'],
      ]) },
      { name: 'dataRecebimento', label: 'Data de recebimento', type: 'DATE', icon: 'IconCalendar' },
      { name: 'prazo', label: 'Prazo', type: 'DATE', icon: 'IconAlarm' },
      { name: 'statusSolicitacao', label: 'Status', type: 'SELECT', icon: 'IconProgress', options: toOptions([
        ['Recebida', 'RECEBIDA', 'blue'],
        ['Em análise', 'EM_ANALISE', 'yellow'],
        ['Concluída', 'CONCLUIDA', 'green'],
        ['Negada (fundamentada)', 'NEGADA', 'gray'],
      ]) },
      { name: 'resposta', label: 'Resposta', type: 'TEXT', icon: 'IconMessageReply' },
    ],
  },
];

const PROFISSIONAL_RECORD = {
  name: 'Dra. Letícia Chaves',
  nomeCompleto: 'Letícia Chaves Rodrigues da Silva',
  numeroCrm: '114660',
  ufCrm: 'MG',
  dataInscricao: '2026-01-15',
  situacaoRegistro: 'ATIVA_REGULAR',
  especialidadeRqe: 'Sem especialidade registrada (médica generalista)',
  formacao: 'A confirmar: Medicina – UFMG',
  assinaturaEmail:
    'Dra. Letícia Chaves\nMédica · CRM-MG 114660\n[Endereço do consultório] · [Telefone/WhatsApp]\nVerifique meu registro em: portal.cfm.org.br (Busca por médicos)',
  linkVerificacao: {
    primaryLinkUrl: 'https://portal.cfm.org.br/busca-medicos/',
    primaryLinkLabel: 'Busca por médicos – CFM',
  },
};

const MESSAGE_TEMPLATES = [
  ['boas_vindas', 'WHATSAPP', null, 'Olá, {{nome}}! 😊 Aqui é da equipe da Dra. Letícia Chaves (Médica · CRM-MG 114660). Obrigada pelo seu contato! Em breve vamos te responder para encontrar o melhor horário para você. Se preferir, já pode escolher seu horário por aqui: {{link_agenda}}'],
  ['agendamento_confirmado', 'EMAIL', 'Sua consulta com a Dra. Letícia Chaves está agendada', 'Olá, {{nome}}! Sua consulta com a Dra. Letícia Chaves está agendada:\n📅 {{data}} às {{hora}}\n📍 {{local_ou_link}}\nSe precisar remarcar, é só responder esta mensagem. Até breve!'],
  ['preparo_consulta', 'EMAIL', 'Preparação para sua consulta', 'Olá, {{nome}}! Sua consulta é em 2 dias ({{data}}, {{hora}}). Para aproveitarmos bem o nosso tempo, separe:\n• Documento com foto e carteirinha do convênio (se houver)\n• Exames recentes (últimos 12 meses)\n• Lista dos medicamentos e suplementos que usa, com as doses\n• Suas dúvidas anotadas, elas são muito bem-vindas!\n{{instrucao_especifica}}\nChegue com 10 minutos de antecedência. 💙'],
  ['lembrete_24h', 'WHATSAPP', null, 'Olá, {{nome}}! Passando para lembrar da sua consulta amanhã, {{data}}, às {{hora}} com a Dra. Letícia Chaves. Podemos confirmar sua presença?'],
  ['pos_consulta', 'WHATSAPP', null, '{{nome}}, obrigada pela confiança hoje! 💙 Foi um prazer cuidar de você. Se surgir qualquer dúvida sobre as orientações, é só chamar por aqui. Em uma escala de 0 a 10, quanto você recomendaria a Dra. Letícia a um amigo ou familiar?'],
  ['lembrete_retorno', 'WHATSAPP', null, 'Olá, {{nome}}! Está chegando a hora do seu retorno com a Dra. Letícia Chaves, previsto para por volta de {{data_retorno}}. Escolha o melhor horário aqui: {{link_agenda}} ou responda esta mensagem. 🌿'],
  ['falta_reagendar', 'WHATSAPP', null, 'Olá, {{nome}}! Sentimos sua falta na consulta de hoje. Imprevistos acontecem! Quando quiser, vamos encontrar um novo horário: {{link_agenda}}. Estamos à disposição. 💙'],
  ['reativacao', 'WHATSAPP', null, 'Olá, {{nome}}! Aqui é da equipe da Dra. Letícia Chaves. Faz um tempo desde a sua última consulta e queremos saber como você está. 😊 Se quiser agendar: {{link_agenda}}. Para não receber mais mensagens como esta, responda SAIR.'],
  ['aniversario', 'WHATSAPP', null, 'Feliz aniversário, {{nome}}! 🎉 A Dra. Letícia Chaves e equipe desejam um novo ano cheio de saúde, alegria e cuidado. Um abraço!'],
  ['lead_followup', 'WHATSAPP', null, 'Olá, {{nome}}! Vimos que você entrou em contato com a Dra. Letícia Chaves. Ainda podemos te ajudar a agendar sua consulta? Estamos à disposição. 😊'],
];

const metadataRequest = async (query, variables = {}) => {
  const response = await fetch(`${API_URL}/metadata`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${API_KEY}` },
    body: JSON.stringify({ query, variables }),
  });
  const body = await response.json();

  if (body.errors?.length) {
    throw new Error(body.errors.map((error) => error.message).join(' | '));
  }

  return body.data;
};

const restRequest = async (method, path, payload) => {
  const options = {
    method,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${API_KEY}` },
  };

  if (payload !== undefined) {
    options.body = JSON.stringify(payload);
  }

  const response = await fetch(`${API_URL}/rest/${path}`, options);
  const body = await response.json();

  if (!response.ok) {
    throw new Error(`${response.status} ${JSON.stringify(body)}`);
  }

  return body;
};

const loadObjects = async () => {
  const data = await metadataRequest(`
    query {
      objects(paging: { first: 1000 }) {
        edges { node { id nameSingular namePlural labelSingular fieldsList { id name } } }
      }
    }`);

  return new Map(data.objects.edges.map(({ node }) => [node.nameSingular, node]));
};

const createObject = async (definition) => {
  const { fields: _fields, ...object } = definition;
  const data = await metadataRequest(
    `mutation CreateOneObject($input: CreateOneObjectInput!) {
      createOneObject(input: $input) { id nameSingular }
    }`,
    { input: { object: { ...object, isLabelSyncedWithName: false } } },
  );

  return data.createOneObject;
};

const createField = async (objectMetadataId, definition, objectsByName) => {
  const { relationTarget, targetFieldLabel, targetFieldIcon, ...field } = definition;
  const input = { ...field, objectMetadataId, isLabelSyncedWithName: false };

  if (field.type === 'RELATION') {
    const target = objectsByName.get(relationTarget);

    if (!target) {
      throw new Error(`Objeto alvo "${relationTarget}" não encontrado`);
    }

    input.relationCreationPayload = {
      type: 'MANY_TO_ONE',
      targetObjectMetadataId: target.id,
      targetFieldLabel,
      targetFieldIcon,
    };
  }

  await metadataRequest(
    `mutation CreateOneField($input: CreateOneFieldMetadataInput!) {
      createOneField(input: $input) { id name }
    }`,
    { input: { field: input } },
  );
};

const summary = { created: [], skipped: [], failed: [] };

const ensureFields = async (objectName, fields) => {
  let objectsByName = await loadObjects();
  const object = objectsByName.get(objectName);

  if (!object) {
    summary.failed.push(`${objectName} (objeto inexistente)`);
    return;
  }

  const existingFieldNames = new Set(object.fieldsList.map((field) => field.name));

  for (const field of fields) {
    const label = `${objectName}.${field.name}`;

    if (existingFieldNames.has(field.name)) {
      summary.skipped.push(label);
      continue;
    }

    if (DRY_RUN) {
      summary.created.push(`${label} (dry-run)`);
      continue;
    }

    try {
      await createField(object.id, field, objectsByName);
      summary.created.push(label);

      if (field.type === 'RELATION') {
        objectsByName = await loadObjects();
      }
    } catch (error) {
      summary.failed.push(`${label}: ${error.message}`);
    }
  }
};

const relabelPersonAsPaciente = async (objectsByName) => {
  const person = objectsByName.get('person');

  if (!person || person.labelSingular === 'Paciente' || DRY_RUN) {
    return;
  }

  try {
    await metadataRequest(
      `mutation UpdateOneObject($input: UpdateOneObjectInput!) {
        updateOneObject(input: $input) { id labelSingular }
      }`,
      {
        input: {
          id: person.id,
          update: { labelSingular: 'Paciente', labelPlural: 'Pacientes', isLabelSyncedWithName: false },
        },
      },
    );
    summary.created.push('person → rótulo "Pacientes"');
  } catch (error) {
    summary.failed.push(`Renomear People: ${error.message} (faça manualmente em Settings → Data model)`);
  }
};

const seedRecords = async () => {
  if (DRY_RUN) {
    return;
  }

  try {
    const existing = await restRequest('GET', 'profissionais?limit=1');

    if ((existing.data?.profissionais ?? []).length === 0) {
      await restRequest('POST', 'profissionais', PROFISSIONAL_RECORD);
      summary.created.push('registro Profissional (Dra. Letícia)');
    } else {
      summary.skipped.push('registro Profissional');
    }
  } catch (error) {
    summary.failed.push(`registro Profissional: ${error.message}`);
  }

  try {
    const existing = await restRequest('GET', 'modelosMensagem?limit=100');
    const existingKeys = new Set((existing.data?.modelosMensagem ?? []).map((record) => record.chave));

    for (const [chave, canal, assunto, corpo] of MESSAGE_TEMPLATES) {
      if (existingKeys.has(chave)) {
        summary.skipped.push(`modelo ${chave}`);
        continue;
      }

      await restRequest('POST', 'modelosMensagem', {
        name: chave,
        chave,
        canal,
        assunto,
        corpo,
        templateMeta: canal === 'WHATSAPP' ? chave : null,
        ativo: true,
      });
      summary.created.push(`modelo ${chave}`);
    }
  } catch (error) {
    summary.failed.push(`modelos de mensagem: ${error.message}`);
  }
};

const main = async () => {
  console.log(`→ ${API_URL}${DRY_RUN ? ' (DRY RUN)' : ''}`);

  const objectsByName = await loadObjects();

  await relabelPersonAsPaciente(objectsByName);
  await ensureFields('person', PERSON_FIELDS);

  for (const definition of CUSTOM_OBJECTS) {
    const current = await loadObjects();

    if (current.has(definition.nameSingular)) {
      summary.skipped.push(`objeto ${definition.nameSingular}`);
    } else if (DRY_RUN) {
      summary.created.push(`objeto ${definition.nameSingular} (dry-run)`);
      continue;
    } else {
      try {
        await createObject(definition);
        summary.created.push(`objeto ${definition.nameSingular}`);
      } catch (error) {
        summary.failed.push(`objeto ${definition.nameSingular}: ${error.message}`);
        continue;
      }
    }

    await ensureFields(definition.nameSingular, definition.fields);
  }

  await seedRecords();

  console.log(`\n✔ Criados (${summary.created.length}):\n  ${summary.created.join('\n  ')}`);
  console.log(`\n• Já existiam (${summary.skipped.length}):\n  ${summary.skipped.join('\n  ')}`);

  if (summary.failed.length > 0) {
    console.log(`\n✖ Falhas (${summary.failed.length}):\n  ${summary.failed.join('\n  ')}`);
    process.exitCode = 1;
  }
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
