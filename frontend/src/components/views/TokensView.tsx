import React, { useMemo, useState } from 'react';
import {
  BookOpen,
  ChevronDown,
  ChevronRight,
  Code2,
  Copy,
  Folder,
  Globe,
  MessageSquare,
  Send,
  ShieldCheck,
  Smartphone,
  Terminal,
  Webhook
} from 'lucide-react';
import { AppState, ApiToken } from '../../types';

interface TokensViewProps {
  state: AppState;
  onSelectToken: (id: string | null) => void;
  onAddToken: (token: ApiToken) => void;
  onRevokeToken: (id: string) => void;
}

type HttpMethod = 'GET' | 'POST';
type DocTab = 'curl' | 'js' | 'php' | 'python';
type SectionGroupId = 'messages' | 'instance' | 'chats' | 'contacts' | 'groups' | 'media';

type DocField = {
  name: string;
  type: string;
  required?: boolean;
  description: string;
  example?: string;
};

type DocEndpoint = {
  id: string;
  groupId: SectionGroupId;
  method: HttpMethod;
  title: string;
  description: string;
  path: string;
  fields: DocField[];
  response: Record<string, unknown>;
};

type DocGroup = {
  id: SectionGroupId;
  title: string;
  icon: React.ReactNode;
  defaultOpen?: boolean;
};

const groups: DocGroup[] = [
  { id: 'messages', title: 'Messages', icon: <MessageSquare className="h-4 w-4" />, defaultOpen: true },
  { id: 'instance', title: 'Instance', icon: <Smartphone className="h-4 w-4" />, defaultOpen: true },
  { id: 'chats', title: 'Chats', icon: <MessageSquare className="h-4 w-4" /> },
  { id: 'contacts', title: 'Contacts', icon: <Folder className="h-4 w-4" /> },
  { id: 'groups', title: 'Groups', icon: <Folder className="h-4 w-4" /> },
  { id: 'media', title: 'Media', icon: <Globe className="h-4 w-4" /> }
];

const endpoints: DocEndpoint[] = [
  {
    id: 'messages-chat',
    groupId: 'messages',
    method: 'POST',
    title: 'CHAT',
    description: 'Отправить текстовое сообщение в WhatsApp чат.',
    path: '/api/messages/text',
    fields: [
      { name: 'instanceId', type: 'string', required: true, description: 'ID инстанса', example: 'cmr...' },
      { name: 'remoteJid', type: 'string', required: true, description: 'Номер получателя', example: '+992922772244' },
      { name: 'text', type: 'string', required: true, description: 'Текст сообщения', example: 'Salom test sms' }
    ],
    response: { success: true, data: { messageId: 'BAE5A1A1F...', status: 'sent' } }
  },
  {
    id: 'messages-image',
    groupId: 'messages',
    method: 'POST',
    title: 'IMAGE',
    description: 'Отправить изображение с подписью.',
    path: '/api/messages/image',
    fields: [
      { name: 'instanceId', type: 'string', required: true, description: 'ID инстанса' },
      { name: 'remoteJid', type: 'string', required: true, description: 'Номер получателя' },
      { name: 'caption', type: 'string', description: 'Подпись', example: 'Фото' }
    ],
    response: { success: true, data: { messageId: 'BAE5A1B2C...', status: 'sent' } }
  },
  {
    id: 'messages-sticker',
    groupId: 'messages',
    method: 'POST',
    title: 'STICKER',
    description: 'Отправить стикер.',
    path: '/api/messages/sticker',
    fields: [
      { name: 'instanceId', type: 'string', required: true, description: 'ID инстанса' },
      { name: 'remoteJid', type: 'string', required: true, description: 'Номер получателя' }
    ],
    response: { success: true, data: { messageId: 'BAE5A1S3D...', status: 'sent' } }
  },
  {
    id: 'messages-document',
    groupId: 'messages',
    method: 'POST',
    title: 'DOCUMENT',
    description: 'Отправить документ.',
    path: '/api/messages/document',
    fields: [
      { name: 'instanceId', type: 'string', required: true, description: 'ID инстанса' },
      { name: 'remoteJid', type: 'string', required: true, description: 'Номер получателя' },
      { name: 'fileName', type: 'string', required: true, description: 'Имя файла', example: 'contract.pdf' }
    ],
    response: { success: true, data: { messageId: 'BAE5A1D3E...', status: 'sent' } }
  },
  {
    id: 'messages-audio',
    groupId: 'messages',
    method: 'POST',
    title: 'AUDIO',
    description: 'Отправить аудиофайл.',
    path: '/api/messages/audio',
    fields: [
      { name: 'instanceId', type: 'string', required: true, description: 'ID инстанса' },
      { name: 'remoteJid', type: 'string', required: true, description: 'Номер получателя' }
    ],
    response: { success: true, data: { messageId: 'BAE5A1F4G...', status: 'sent' } }
  },
  {
    id: 'messages-voice',
    groupId: 'messages',
    method: 'POST',
    title: 'VOICE',
    description: 'Отправить voice note.',
    path: '/api/messages/voice',
    fields: [
      { name: 'instanceId', type: 'string', required: true, description: 'ID инстанса' },
      { name: 'remoteJid', type: 'string', required: true, description: 'Номер получателя' }
    ],
    response: { success: true, data: { messageId: 'BAE5A1V5H...', status: 'sent' } }
  },
  {
    id: 'messages-video',
    groupId: 'messages',
    method: 'POST',
    title: 'VIDEO',
    description: 'Отправить видео.',
    path: '/api/messages/video',
    fields: [
      { name: 'instanceId', type: 'string', required: true, description: 'ID инстанса' },
      { name: 'remoteJid', type: 'string', required: true, description: 'Номер получателя' }
    ],
    response: { success: true, data: { messageId: 'BAE5A1V6I...', status: 'sent' } }
  },
  {
    id: 'messages-contact',
    groupId: 'messages',
    method: 'POST',
    title: 'CONTACT',
    description: 'Отправить карточку контакта.',
    path: '/api/messages/contact',
    fields: [
      { name: 'instanceId', type: 'string', required: true, description: 'ID инстанса' },
      { name: 'remoteJid', type: 'string', required: true, description: 'Номер получателя' }
    ],
    response: { success: true, data: { messageId: 'BAE5A1C7J...', status: 'sent' } }
  },
  {
    id: 'messages-location',
    groupId: 'messages',
    method: 'POST',
    title: 'LOCATION',
    description: 'Отправить геолокацию.',
    path: '/api/messages/location',
    fields: [
      { name: 'latitude', type: 'number', required: true, description: 'Широта', example: '43.2' },
      { name: 'longitude', type: 'number', required: true, description: 'Долгота', example: '76.8' }
    ],
    response: { success: true, data: { messageId: 'BAE5A1L8K...', status: 'sent' } }
  },
  {
    id: 'messages-vcard',
    groupId: 'messages',
    method: 'POST',
    title: 'VCARD',
    description: 'Отправить vCard контакт.',
    path: '/api/messages/vcard',
    fields: [
      { name: 'fullName', type: 'string', required: true, description: 'Имя', example: 'John Doe' },
      { name: 'phone', type: 'string', required: true, description: 'Телефон', example: '+992...' }
    ],
    response: { success: true, data: { messageId: 'BAE5A1V9L...', status: 'sent' } }
  },
  {
    id: 'messages-reaction',
    groupId: 'messages',
    method: 'POST',
    title: 'REACTION',
    description: 'Отправить реакцию на сообщение.',
    path: '/api/messages/reaction',
    fields: [
      { name: 'messageId', type: 'string', required: true, description: 'ID сообщения', example: 'BAE5A1...' },
      { name: 'emoji', type: 'string', required: true, description: 'Эмодзи', example: '👍' }
    ],
    response: { success: true, data: { messageId: 'BAE5A1R1M...', status: 'sent' } }
  },
  {
    id: 'messages-delete',
    groupId: 'messages',
    method: 'POST',
    title: 'DELETE',
    description: 'Удалить сообщение.',
    path: '/api/messages/delete',
    fields: [{ name: 'messageId', type: 'string', required: true, description: 'ID сообщения' }],
    response: { success: true, data: { deleted: true } }
  },
  {
    id: 'messages-resendbystatus',
    groupId: 'messages',
    method: 'POST',
    title: 'RESENDBYSTATUS',
    description: 'Повторно отправить сообщения по статусу.',
    path: '/api/messages/resend-by-status',
    fields: [{ name: 'status', type: 'string', required: true, description: 'Статус', example: 'failed' }],
    response: { success: true, data: { queued: 3 } }
  },
  {
    id: 'messages-resendbyid',
    groupId: 'messages',
    method: 'POST',
    title: 'RESENDBYID',
    description: 'Повторно отправить сообщение по ID.',
    path: '/api/messages/resend-by-id',
    fields: [{ name: 'messageId', type: 'string', required: true, description: 'ID сообщения' }],
    response: { success: true, data: { resent: true } }
  },
  {
    id: 'messages-clear',
    groupId: 'messages',
    method: 'POST',
    title: 'CLEAR',
    description: 'Очистить историю сообщений.',
    path: '/api/messages/clear',
    fields: [],
    response: { success: true, data: { cleared: true } }
  },
  {
    id: 'messages-list',
    groupId: 'messages',
    method: 'GET',
    title: 'MESSAGES',
    description: 'Получить список сообщений.',
    path: '/api/messages',
    fields: [
      { name: 'page', type: 'number', description: 'Номер страницы', example: '1' },
      { name: 'limit', type: 'number', description: 'Размер страницы', example: '20' }
    ],
    response: { success: true, data: [{ id: 'msg_01', status: 'sent' }] }
  },
  {
    id: 'messages-statistics',
    groupId: 'messages',
    method: 'GET',
    title: 'STATISTICS',
    description: 'Статистика сообщений.',
    path: '/api/messages/statistics',
    fields: [],
    response: { success: true, data: { total: 24812, sentToday: 1248 } }
  },
  {
    id: 'instance-status',
    groupId: 'instance',
    method: 'GET',
    title: 'STATUS',
    description: 'Статус инстанса.',
    path: '/api/instance/status',
    fields: [{ name: 'instanceId', type: 'string', required: true, description: 'ID инстанса' }],
    response: { success: true, data: { status: 'CONNECTED' } }
  },
  {
    id: 'instance-qr',
    groupId: 'instance',
    method: 'GET',
    title: 'QR',
    description: 'Получить QR для подключения.',
    path: '/api/instance/qr',
    fields: [{ name: 'instanceId', type: 'string', required: true, description: 'ID инстанса' }],
    response: { success: true, data: { qrCode: 'data:image/png;base64,...' } }
  },
  {
    id: 'instance-qrcode',
    groupId: 'instance',
    method: 'GET',
    title: 'QRCODE',
    description: 'Получить текущий QR код.',
    path: '/api/instance/qrcode',
    fields: [{ name: 'instanceId', type: 'string', required: true, description: 'ID инстанса' }],
    response: { success: true, data: { qrCode: 'data:image/png;base64,...' } }
  },
  {
    id: 'instance-me',
    groupId: 'instance',
    method: 'GET',
    title: 'ME',
    description: 'Информация о текущем WhatsApp аккаунте.',
    path: '/api/instance/me',
    fields: [],
    response: { success: true, data: { jid: '992922772244@s.whatsapp.net' } }
  },
  {
    id: 'instance-settings',
    groupId: 'instance',
    method: 'GET',
    title: 'SETTINGS',
    description: 'Настройки инстанса.',
    path: '/api/instance/settings',
    fields: [{ name: 'instanceId', type: 'string', required: true, description: 'ID инстанса' }],
    response: { success: true, data: { autoReconnect: true } }
  },
  {
    id: 'instance-logout',
    groupId: 'instance',
    method: 'POST',
    title: 'LOGOUT',
    description: 'Выйти из WhatsApp сессии.',
    path: '/api/instance/logout',
    fields: [{ name: 'instanceId', type: 'string', required: true, description: 'ID инстанса' }],
    response: { success: true, data: { loggedOut: true } }
  },
  {
    id: 'instance-restart',
    groupId: 'instance',
    method: 'POST',
    title: 'RESTART',
    description: 'Перезапуск инстанса.',
    path: '/api/instance/restart',
    fields: [{ name: 'instanceId', type: 'string', required: true, description: 'ID инстанса' }],
    response: { success: true, data: { restarted: true } }
  },
  {
    id: 'instance-setsettings',
    groupId: 'instance',
    method: 'POST',
    title: 'SETTINGS',
    description: 'Изменить настройки инстанса.',
    path: '/api/instance/settings',
    fields: [
      { name: 'instanceId', type: 'string', required: true, description: 'ID инстанса' },
      { name: 'webhookUrl', type: 'string', description: 'Webhook URL' }
    ],
    response: { success: true, data: { updated: true } }
  },
  {
    id: 'instance-clear',
    groupId: 'instance',
    method: 'POST',
    title: 'CLEAR',
    description: 'Очистить данные инстанса.',
    path: '/api/instance/clear',
    fields: [{ name: 'instanceId', type: 'string', required: true, description: 'ID инстанса' }],
    response: { success: true, data: { cleared: true } }
  },
  {
    id: 'chats-chats',
    groupId: 'chats',
    method: 'GET',
    title: 'CHATS',
    description: 'Список чатов.',
    path: '/api/chats',
    fields: [],
    response: { success: true, data: [{ id: 'chat_01' }] }
  },
  {
    id: 'chats-ids',
    groupId: 'chats',
    method: 'GET',
    title: 'IDS',
    description: 'ID чатов.',
    path: '/api/chats/ids',
    fields: [],
    response: { success: true, data: ['chat_01', 'chat_02'] }
  },
  {
    id: 'chats-messages',
    groupId: 'chats',
    method: 'GET',
    title: 'MESSAGES',
    description: 'Сообщения конкретного чата.',
    path: '/api/chats/{id}/messages',
    fields: [{ name: 'id', type: 'string', required: true, description: 'ID чата' }],
    response: { success: true, data: [{ id: 'msg_01', text: 'Hello' }] }
  },
  {
    id: 'chats-archive',
    groupId: 'chats',
    method: 'POST',
    title: 'ARCHIVE',
    description: 'Архивировать чат.',
    path: '/api/chats/archive',
    fields: [{ name: 'chatId', type: 'string', required: true, description: 'ID чата' }],
    response: { success: true, archived: true }
  },
  {
    id: 'chats-unarchive',
    groupId: 'chats',
    method: 'POST',
    title: 'UNARCHIVE',
    description: 'Разархивировать чат.',
    path: '/api/chats/unarchive',
    fields: [{ name: 'chatId', type: 'string', required: true, description: 'ID чата' }],
    response: { success: true, unarchived: true }
  },
  {
    id: 'chats-clearmessages',
    groupId: 'chats',
    method: 'POST',
    title: 'CLEARMESSAGES',
    description: 'Очистить сообщения чата.',
    path: '/api/chats/clear-messages',
    fields: [{ name: 'chatId', type: 'string', required: true, description: 'ID чата' }],
    response: { success: true, cleared: true }
  },
  {
    id: 'chats-delete',
    groupId: 'chats',
    method: 'POST',
    title: 'DELETE',
    description: 'Удалить чат.',
    path: '/api/chats/delete',
    fields: [{ name: 'chatId', type: 'string', required: true, description: 'ID чата' }],
    response: { success: true, deleted: true }
  },
  {
    id: 'chats-read',
    groupId: 'chats',
    method: 'POST',
    title: 'READ',
    description: 'Пометить чат прочитанным.',
    path: '/api/chats/read',
    fields: [{ name: 'chatId', type: 'string', required: true, description: 'ID чата' }],
    response: { success: true, read: true }
  },
  {
    id: 'contacts-block',
    groupId: 'contacts',
    method: 'POST',
    title: 'BLOCK',
    description: 'Заблокировать контакт.',
    path: '/api/contacts/block',
    fields: [{ name: 'id', type: 'string', required: true, description: 'ID контакта' }],
    response: { success: true, blocked: true }
  },
  {
    id: 'contacts-unblock',
    groupId: 'contacts',
    method: 'POST',
    title: 'UNBLOCK',
    description: 'Разблокировать контакт.',
    path: '/api/contacts/unblock',
    fields: [{ name: 'id', type: 'string', required: true, description: 'ID контакта' }],
    response: { success: true, unblocked: true }
  },
  {
    id: 'contacts-contacts',
    groupId: 'contacts',
    method: 'GET',
    title: 'CONTACTS',
    description: 'Список контактов.',
    path: '/api/contacts',
    fields: [],
    response: { success: true, data: [{ id: 'contact_01' }] }
  },
  {
    id: 'contacts-ids',
    groupId: 'contacts',
    method: 'GET',
    title: 'IDS',
    description: 'ID контактов.',
    path: '/api/contacts/ids',
    fields: [],
    response: { success: true, data: ['contact_01', 'contact_02'] }
  },
  {
    id: 'contacts-contact',
    groupId: 'contacts',
    method: 'GET',
    title: 'CONTACT',
    description: 'Получить контакт.',
    path: '/api/contacts/{id}',
    fields: [{ name: 'id', type: 'string', required: true, description: 'ID контакта' }],
    response: { success: true, data: { id: 'contact_01' } }
  },
  {
    id: 'contacts-blocked',
    groupId: 'contacts',
    method: 'GET',
    title: 'BLOCKED',
    description: 'Список заблокированных.',
    path: '/api/contacts/blocked',
    fields: [],
    response: { success: true, data: [] }
  },
  {
    id: 'contacts-invalid',
    groupId: 'contacts',
    method: 'GET',
    title: 'INVALID',
    description: 'Список неверных контактов.',
    path: '/api/contacts/invalid',
    fields: [],
    response: { success: true, data: [] }
  },
  {
    id: 'contacts-check',
    groupId: 'contacts',
    method: 'GET',
    title: 'CHECK',
    description: 'Проверить контакт.',
    path: '/api/contacts/check',
    fields: [{ name: 'phone', type: 'string', required: true, description: 'Телефон' }],
    response: { success: true, data: { exists: true } }
  },
  {
    id: 'contacts-image',
    groupId: 'contacts',
    method: 'GET',
    title: 'IMAGE',
    description: 'Получить аватар контакта.',
    path: '/api/contacts/image',
    fields: [{ name: 'id', type: 'string', required: true, description: 'ID контакта' }],
    response: { success: true, data: { image: 'data:image/png;base64,...' } }
  },
  {
    id: 'groups-groups',
    groupId: 'groups',
    method: 'GET',
    title: 'GROUPS',
    description: 'Список групп.',
    path: '/api/groups',
    fields: [],
    response: { success: true, data: [{ id: 'group_01' }] }
  },
  {
    id: 'groups-ids',
    groupId: 'groups',
    method: 'GET',
    title: 'IDS',
    description: 'ID групп.',
    path: '/api/groups/ids',
    fields: [],
    response: { success: true, data: ['group_01', 'group_02'] }
  },
  {
    id: 'groups-group',
    groupId: 'groups',
    method: 'GET',
    title: 'GROUP',
    description: 'Получить группу.',
    path: '/api/groups/{id}',
    fields: [{ name: 'id', type: 'string', required: true, description: 'ID группы' }],
    response: { success: true, data: { id: 'group_01' } }
  },
  {
    id: 'media-upload',
    groupId: 'media',
    method: 'POST',
    title: 'UPLOAD',
    description: 'Загрузить медиа файл.',
    path: '/api/media/upload',
    fields: [{ name: 'file', type: 'file', required: true, description: 'Файл' }],
    response: { success: true, data: { mediaId: 'media_01' } }
  },
  {
    id: 'media-delete',
    groupId: 'media',
    method: 'POST',
    title: 'DELETE',
    description: 'Удалить медиа файл.',
    path: '/api/media/delete',
    fields: [{ name: 'mediaId', type: 'string', required: true, description: 'ID медиа' }],
    response: { success: true, deleted: true }
  },
  {
    id: 'media-deletebydate',
    groupId: 'media',
    method: 'POST',
    title: 'DELETEBYDATE',
    description: 'Удалить медиа по дате.',
    path: '/api/media/delete-by-date',
    fields: [{ name: 'date', type: 'string', required: true, description: 'Дата' }],
    response: { success: true, deleted: 12 }
  }
];

const codeSamples: Record<DocTab, { get: string; post: string }> = {
  curl: {
    get: `curl --location --request GET 'https://api.asiamsg.com/...' \\
--header 'Authorization: Bearer YOUR_TOKEN'`,
    post: `curl --location --request POST 'https://api.asiamsg.com/...' \\
--header 'Authorization: Bearer YOUR_TOKEN' \\
--header 'Content-Type: application/json' \\
--data-raw '{ }'`
  },
  js: {
    get: `const response = await fetch('https://api.asiamsg.com/...', {
  headers: { Authorization: 'Bearer YOUR_TOKEN' }
});
const data = await response.json();`,
    post: `const response = await fetch('https://api.asiamsg.com/...', {
  method: 'POST',
  headers: {
    Authorization: 'Bearer YOUR_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({})
});
const data = await response.json();`
  },
  php: {
    get: `<?php
$ch = curl_init('https://api.asiamsg.com/...');
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Authorization: Bearer YOUR_TOKEN']);`,
    post: `<?php
$ch = curl_init('https://api.asiamsg.com/...');
curl_setopt_array($ch, [
  CURLOPT_POST => true,
  CURLOPT_HTTPHEADER => [
    'Authorization: Bearer YOUR_TOKEN',
    'Content-Type: application/json'
  ]
]);`
  },
  python: {
    get: `import requests

response = requests.get(
    'https://api.asiamsg.com/...',
    headers={'Authorization': 'Bearer YOUR_TOKEN'}
)`,
    post: `import requests

response = requests.post(
    'https://api.asiamsg.com/...',
    headers={'Authorization': 'Bearer YOUR_TOKEN'},
    json={}
)`
  }
};

const methodStyles: Record<HttpMethod, string> = {
  GET: 'bg-sky-500 text-white',
  POST: 'bg-emerald-500 text-white'
};

export const apiDocsGroups = groups;
export const apiDocsEndpoints = endpoints;
export const apiDocsCodeSamples = codeSamples;

const navStyles = {
  shell: 'rounded-[24px] border border-slate-200/80 bg-white shadow-[0_18px_60px_rgba(15,23,42,0.06)]',
  sectionButton: 'flex w-full items-center justify-between rounded-2xl px-3 py-2.5 text-left text-sm font-semibold transition hover:bg-slate-50',
  endpointButton: 'flex w-full items-center gap-2 rounded-2xl px-3 py-2 text-left text-sm transition'
};

export const TokensView: React.FC<TokensViewProps> = () => {
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState(endpoints[0]?.id ?? '');
  const [openGroups, setOpenGroups] = useState<Record<SectionGroupId, boolean>>({
    messages: true,
    instance: true,
    chats: false,
    contacts: false,
    groups: false,
    media: false
  });
  const [activeTab, setActiveTab] = useState<DocTab>('curl');
  const [copied, setCopied] = useState<string | null>(null);
  const [instanceId, setInstanceId] = useState('instance123456');
  const [token, setToken] = useState('c0m8x4ul5puxmh3q');

  const filteredEndpoints = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return endpoints;
    return endpoints.filter(endpoint =>
      endpoint.title.toLowerCase().includes(q) ||
      endpoint.path.toLowerCase().includes(q) ||
      endpoint.description.toLowerCase().includes(q)
    );
  }, [query]);

  const selectedEndpoint = useMemo(
    () => filteredEndpoints.find(endpoint => endpoint.id === selectedId) ?? filteredEndpoints[0] ?? endpoints[0],
    [filteredEndpoints, selectedId]
  );

  const groupedEndpoints = useMemo(() => {
    const map = new Map<SectionGroupId, DocEndpoint[]>();
    for (const endpoint of filteredEndpoints) {
      const list = map.get(endpoint.groupId) ?? [];
      list.push(endpoint);
      map.set(endpoint.groupId, list);
    }
    return map;
  }, [filteredEndpoints]);

  const toggleGroup = (groupId: SectionGroupId) => {
    setOpenGroups(prev => ({ ...prev, [groupId]: !prev[groupId] }));
  };

  const copyText = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(key);
    window.setTimeout(() => setCopied(null), 1200);
  };

  const requestBody = useMemo(() => {
    return selectedEndpoint.fields.reduce<Record<string, string>>((acc, field) => {
      acc[field.name] = field.example ?? '';
      return acc;
    }, {});
  }, [selectedEndpoint]);

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">API документация</h1>
          <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">
            Интерактивная справка по API AsiaMsg и примерам запросов.
          </p>
        </div>

        <div className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 shadow-sm dark:border-slate-800 dark:bg-slate-900 dark:text-slate-200">
          <BookOpen className="h-4 w-4 text-blue-600" />
          Документы API
        </div>
      </div>

      <div className="grid gap-6 grid-cols-[300px_minmax(0,1fr)] items-start">
        <aside className={`${navStyles.shell} min-w-0 p-4`}>
          <div className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2.5 dark:border-slate-800 dark:bg-slate-950">
            <span className="text-slate-400">⌕</span>
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Поиск endpoint..."
              className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
            />
          </div>

          <div className="mt-5 space-y-4">
            {groups.map(group => {
              const items = groupedEndpoints.get(group.id) ?? [];
              const isOpen = openGroups[group.id];

              return (
                <div key={group.id}>
                  <button
                    type="button"
                    onClick={() => toggleGroup(group.id)}
                    className={navStyles.sectionButton}
                  >
                    <span className="flex items-center gap-2 text-slate-700 dark:text-slate-200">
                      <span className="text-slate-500">{group.icon}</span>
                      {group.title}
                    </span>
                    {isOpen ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
                  </button>

                  {isOpen && (
                    <div className="mt-2 space-y-2 pl-2">
                      {items.map(endpoint => (
                        <button
                          key={endpoint.id}
                          type="button"
                          onClick={() => setSelectedId(endpoint.id)}
                          className={`${navStyles.endpointButton} ${
                            selectedEndpoint.id === endpoint.id
                              ? 'bg-blue-50 font-semibold text-blue-700 dark:bg-blue-500/15 dark:text-blue-300'
                              : 'text-slate-600 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-slate-800'
                          }`}
                        >
                          <span className={`inline-flex rounded-md px-1.5 py-0.5 text-[10px] font-bold ${methodStyles[endpoint.method]}`}>
                            {endpoint.method}
                          </span>
                          <span className="truncate">{endpoint.title}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </aside>

        <main className="min-w-0 rounded-[24px] border border-slate-200/80 bg-white p-5 shadow-[0_18px_60px_rgba(15,23,42,0.06)] dark:border-slate-800 dark:bg-slate-900 space-y-6">
          <section className="space-y-4">
            <div className={`${navStyles.shell} p-5`}>
              <div className="flex flex-wrap items-center gap-3">
                <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-bold ${methodStyles[selectedEndpoint.method]}`}>
                  {selectedEndpoint.method}
                </span>
                <span className="text-sm font-semibold text-slate-500">{selectedEndpoint.path}</span>
              </div>

              <h2 className="mt-4 text-xl font-bold text-slate-900 dark:text-white">{selectedEndpoint.title}</h2>
              <p className="mt-2 text-sm leading-6 text-slate-500 dark:text-slate-400">{selectedEndpoint.description}</p>
            </div>

            <div className={`${navStyles.shell} p-5`}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">Попробовать запрос</h3>
                  <p className="mt-1 text-xs text-slate-400">Заполни поля и используй шаблон запроса как основу.</p>
                </div>

                <button className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-blue-700">
                  <Send className="h-3.5 w-3.5" />
                  Отправить запрос
                </button>
              </div>

              <div className="mt-4 grid gap-3 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-xs font-semibold text-slate-500">Instance ID</span>
                  <input
                    value={instanceId}
                    onChange={e => setInstanceId(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500 dark:border-slate-800 dark:bg-slate-950"
                  />
                </label>

                <label className="space-y-2">
                  <span className="text-xs font-semibold text-slate-500">Token</span>
                  <input
                    value={token}
                    onChange={e => setToken(e.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-blue-500 dark:border-slate-800 dark:bg-slate-950"
                  />
                </label>
              </div>

              <div className="mt-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div className="border-b border-slate-200 px-4 py-3 text-sm font-semibold dark:border-slate-800">Параметры</div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {selectedEndpoint.fields.length > 0 ? (
                    selectedEndpoint.fields.map(field => (
                      <div key={field.name} className="grid grid-cols-[1.1fr_0.7fr_1.5fr] gap-4 px-4 py-3 text-sm">
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {field.name} {field.required ? <span className="text-rose-500">*</span> : null}
                        </div>
                        <div>
                          <span className="inline-flex rounded-md bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300">
                            {field.type}
                          </span>
                        </div>
                        <div className="text-slate-500">
                          {field.description}
                          {field.example ? <div className="mt-1 text-[11px] text-slate-400">Пример: {field.example}</div> : null}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="px-4 py-6 text-sm text-slate-400">Для этого endpoint пока нет параметров.</div>
                  )}
                </div>
              </div>

              <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-950 p-4 text-slate-100 dark:border-slate-800">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-semibold">Ответ</div>
                  <button
                    type="button"
                    onClick={() => copyText(JSON.stringify(selectedEndpoint.response, null, 2), `response-${selectedEndpoint.id}`)}
                    className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:bg-white/5"
                  >
                    <Copy className="h-3.5 w-3.5" />
                    {copied === `response-${selectedEndpoint.id}` ? 'Скопировано' : 'Copy'}
                  </button>
                </div>
                <pre className="mt-3 overflow-x-auto text-xs leading-6 text-cyan-200">{JSON.stringify(selectedEndpoint.response, null, 2)}</pre>
              </div>
            </div>
          </section>

          <div className="space-y-4">
            <div className={`${navStyles.shell} p-4`}>
              <div className="mb-4 flex items-center justify-between">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Примеры кода</h3>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <Code2 className="h-4 w-4" />
                  Готовые сниппеты
                </div>
              </div>

              <div className="flex gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
                {([
                  { id: 'curl', label: 'cURL' },
                  { id: 'js', label: 'JavaScript' },
                  { id: 'php', label: 'PHP' },
                  { id: 'python', label: 'Python' }
                ] as const).map(tab => (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => setActiveTab(tab.id)}
                    className={`rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                      activeTab === tab.id
                        ? 'bg-blue-600 text-white'
                        : 'bg-slate-50 text-slate-600 hover:bg-slate-100 dark:bg-slate-950 dark:text-slate-300 dark:hover:bg-slate-800'
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="mt-4 space-y-4">
                <div className="rounded-2xl bg-slate-950 p-4 text-slate-100 shadow-inner">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400">
                      <Terminal className="h-4 w-4" />
                      GET
                    </div>
                    <button
                      type="button"
                      onClick={() => copyText(codeSamples[activeTab].get, `get-${activeTab}`)}
                      className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:bg-white/5"
                    >
                      <Copy className="h-3.5 w-3.5" />
                      {copied === `get-${activeTab}` ? 'Скопировано' : 'Copy'}
                    </button>
                  </div>
                  <pre className="overflow-x-auto text-xs leading-6 text-amber-300">{codeSamples[activeTab].get}</pre>
                </div>

                <div className="rounded-2xl bg-slate-950 p-4 text-slate-100 shadow-inner">
                  <div className="mb-3 flex items-center justify-between">
                    <div className="inline-flex items-center gap-2 text-xs font-semibold text-slate-400">
                      <span className="text-base">↪</span>
                      POST
                    </div>
                    <button
                      type="button"
                      onClick={() => copyText(codeSamples[activeTab].post, `post-${activeTab}`)}
                      className="inline-flex items-center gap-2 rounded-xl border border-white/10 px-3 py-2 text-xs font-semibold text-slate-200 transition hover:bg-white/5"
                    >
                      <Copy className="h-3.5 w-3.5" />
                      {copied === `post-${activeTab}` ? 'Скопировано' : 'Copy'}
                    </button>
                  </div>
                  <pre className="overflow-x-auto text-xs leading-6 text-cyan-200">{codeSamples[activeTab].post}</pre>
                </div>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className={`${navStyles.shell} p-4`}>
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                  <ShieldCheck className="h-4 w-4 text-emerald-600" />
                  Авторизация
                </div>
                <p className="mt-2 text-xs text-slate-400">Bearer token передается в заголовке Authorization.</p>
              </div>

              <div className={`${navStyles.shell} p-4`}>
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
                  <Webhook className="h-4 w-4 text-blue-600" />
                  Webhooks
                </div>
                <p className="mt-2 text-xs text-slate-400">Следующий этап добавим отдельные разделы для webhook и событий.</p>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};
