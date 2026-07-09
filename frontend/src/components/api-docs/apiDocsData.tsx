import React from 'react';
import {
  FolderOpen,
  MessageSquare,
  Users,
  Users2,
  Image,
  KeyRound
} from 'lucide-react';

export type HttpMethod = 'GET' | 'POST';
export type ApiDocsTab = 'curl' | 'js' | 'php' | 'python';
export type ApiDocsGroupId = 'auth' | 'messages' | 'instance' | 'chats' | 'contacts' | 'groups' | 'media';

export type LocalizedText = {
  ru: string;
  en: string;
};

export type ApiDocsField = {
  name: string;
  type: string;
  required?: boolean;
  description: LocalizedText;
  example?: string;
};

export type ApiDocsEndpoint = {
  id: string;
  groupId: ApiDocsGroupId;
  method: HttpMethod;
  title: LocalizedText;
  description: LocalizedText;
  path: string;
  backendPath: string;
  fields: ApiDocsField[];
  response: Record<string, unknown>;
};

export type ApiDocsGroup = {
  id: ApiDocsGroupId;
  title: LocalizedText;
  icon: React.ReactNode;
  defaultOpen?: boolean;
};

export type LocalizedApiDocsField = Omit<ApiDocsField, 'description'> & {
  description: string;
};

export type LocalizedApiDocsEndpoint = Omit<ApiDocsEndpoint, 'title' | 'description' | 'fields'> & {
  title: string;
  description: string;
  fields: LocalizedApiDocsField[];
};

export type LocalizedApiDocsGroup = Omit<ApiDocsGroup, 'title'> & {
  title: string;
};

const text = (ru: string, en: string): LocalizedText => ({ ru, en });

const instanceIdField: ApiDocsField = {
  name: 'instanceId',
  type: 'string',
  required: true,
  description: text('ID инстанса', 'Instance ID'),
  example: 'cmrbnksr60002u20sn3uch0z5'
};

const remoteJidField: ApiDocsField = {
  name: 'remoteJid',
  type: 'string',
  required: true,
  description: text('Номер получателя', 'Recipient number'),
  example: '+992922772244'
};

const messageTextField: ApiDocsField = {
  name: 'messageText',
  type: 'string',
  required: true,
  description: text('Текст сообщения', 'Message text'),
  example: 'Hello, this is a test message from AsiaMsg API Docs.'
};

const urlField = (name: string, ru: string, en: string, example: string, required = true): ApiDocsField => ({
  name,
  type: 'string',
  required,
  description: text(ru, en),
  example
});

const simpleJson = (value: unknown) => value as Record<string, unknown>;

export const apiDocsGroups: ApiDocsGroup[] = [
  { id: 'messages', title: text('Сообщения', 'Messages'), icon: <MessageSquare className="h-4 w-4" />, defaultOpen: true },
  { id: 'instance', title: text('Инстанс', 'Instance'), icon: <KeyRound className="h-4 w-4" />, defaultOpen: true },
  { id: 'chats', title: text('Чаты', 'Chats'), icon: <FolderOpen className="h-4 w-4" />, defaultOpen: true },
  { id: 'contacts', title: text('Контакты', 'Contacts'), icon: <Users className="h-4 w-4" />, defaultOpen: true },
  { id: 'groups', title: text('Группы', 'Groups'), icon: <Users2 className="h-4 w-4" />, defaultOpen: true },
  { id: 'media', title: text('Медиа', 'Media'), icon: <Image className="h-4 w-4" />, defaultOpen: true }
];

export const apiDocsEndpoints: ApiDocsEndpoint[] = [
  {
    id: 'messages-chat',
    groupId: 'messages',
    method: 'POST',
    title: text('CHAT', 'CHAT'),
    description: text('Отправка текстового сообщения в WhatsApp чат.', 'Send a text message to a WhatsApp chat.'),
    path: '/api/messages/text',
    backendPath: '/api/messages/text',
    fields: [instanceIdField, remoteJidField, messageTextField, {
      name: 'messageType',
      type: 'text',
      required: true,
      description: text('Тип сообщения', 'Message type'),
      example: 'text'
    }],
    response: simpleJson({
      success: true,
      data: {
        id: 'cmx123abc',
        instanceId: 'cmrbnksr60002u20sn3uch0z5',
        direction: 'outbound',
        remoteJid: '+992922772244',
        messageId: 'BAE5A1A1F...',
        payload: { text: 'Hello, this is a test message from AsiaMsg API Docs.', type: 'text' },
        status: 'sent',
        sentAt: '2026-07-08T12:07:00.000Z'
      }
    })
  },
  {
    id: 'messages-image',
    groupId: 'messages',
    method: 'POST',
    title: text('IMAGE', 'IMAGE'),
    description: text('Отправка изображения в WhatsApp чат.', 'Send an image to a WhatsApp chat.'),
    path: '/api/messages/image',
    backendPath: '/api/messages/image',
    fields: [
      instanceIdField,
      remoteJidField,
      urlField('imageUrl', 'URL изображения', 'Image URL', 'https://example.com/image.jpg'),
      urlField('messageText', 'Подпись к изображению', 'Image caption', 'AsiaMsg image', false)
    ],
    response: simpleJson({
      success: true,
      data: {
        id: 'cmx123img',
        instanceId: 'cmrbnksr60002u20sn3uch0z5',
        direction: 'outbound',
        remoteJid: '+992922772244',
        messageId: 'BAE5A1IMG...',
        payload: { imageUrl: 'https://example.com/image.jpg', caption: 'AsiaMsg image' },
        status: 'sent',
        sentAt: '2026-07-08T12:07:00.000Z'
      }
    })
  },
  {
    id: 'messages-sticker',
    groupId: 'messages',
    method: 'POST',
    title: text('STICKER', 'STICKER'),
    description: text('Отправка стикера в WhatsApp чат.', 'Send a sticker to a WhatsApp chat.'),
    path: '/api/messages/sticker',
    backendPath: '/api/messages/sticker',
    fields: [instanceIdField, remoteJidField, urlField('stickerUrl', 'URL стикера', 'Sticker URL', 'https://example.com/sticker.webp')],
    response: simpleJson({ success: true, data: { status: 'sent', type: 'sticker' } })
  },
  {
    id: 'messages-document',
    groupId: 'messages',
    method: 'POST',
    title: text('DOCUMENT', 'DOCUMENT'),
    description: text('Отправка документа в WhatsApp чат.', 'Send a document to a WhatsApp chat.'),
    path: '/api/messages/document',
    backendPath: '/api/messages/document',
    fields: [
      instanceIdField,
      remoteJidField,
      urlField('documentUrl', 'URL документа', 'Document URL', 'https://example.com/invoice.pdf'),
      urlField('fileName', 'Имя файла', 'File name', 'invoice.pdf', false),
      urlField('messageText', 'Текст сообщения', 'Message text', 'Invoice attached', false)
    ],
    response: simpleJson({ success: true, data: { status: 'sent', type: 'document' } })
  },
  {
    id: 'messages-audio',
    groupId: 'messages',
    method: 'POST',
    title: text('AUDIO', 'AUDIO'),
    description: text('Отправка аудио в WhatsApp чат.', 'Send an audio message to a WhatsApp chat.'),
    path: '/api/messages/audio',
    backendPath: '/api/messages/audio',
    fields: [instanceIdField, remoteJidField, urlField('audioUrl', 'URL аудио', 'Audio URL', 'https://example.com/audio.mp3')],
    response: simpleJson({ success: true, data: { status: 'sent', type: 'audio' } })
  },
  {
    id: 'messages-voice',
    groupId: 'messages',
    method: 'POST',
    title: text('VOICE', 'VOICE'),
    description: text('Отправка голосового сообщения в WhatsApp чат.', 'Send a voice note to a WhatsApp chat.'),
    path: '/api/messages/voice',
    backendPath: '/api/messages/voice',
    fields: [instanceIdField, remoteJidField, urlField('voiceUrl', 'URL голосового', 'Voice URL', 'https://example.com/voice.ogg')],
    response: simpleJson({ success: true, data: { status: 'sent', type: 'voice' } })
  },
  {
    id: 'messages-video',
    groupId: 'messages',
    method: 'POST',
    title: text('VIDEO', 'VIDEO'),
    description: text('Отправка видео в WhatsApp чат.', 'Send a video to a WhatsApp chat.'),
    path: '/api/messages/video',
    backendPath: '/api/messages/video',
    fields: [instanceIdField, remoteJidField, urlField('videoUrl', 'URL видео', 'Video URL', 'https://example.com/video.mp4')],
    response: simpleJson({ success: true, data: { status: 'sent', type: 'video' } })
  },
  {
    id: 'messages-contact',
    groupId: 'messages',
    method: 'POST',
    title: text('CONTACT', 'CONTACT'),
    description: text('Отправка контакта в WhatsApp чат.', 'Send a contact card to a WhatsApp chat.'),
    path: '/api/messages/contact',
    backendPath: '/api/messages/contact',
    fields: [instanceIdField, remoteJidField, urlField('name', 'Имя контакта', 'Contact name', 'John Doe'), urlField('phoneNumber', 'Номер контакта', 'Contact phone', '+992922772244')],
    response: simpleJson({ success: true, data: { status: 'sent', type: 'contact' } })
  },
  {
    id: 'messages-location',
    groupId: 'messages',
    method: 'POST',
    title: text('LOCATION', 'LOCATION'),
    description: text('Отправка геолокации в WhatsApp чат.', 'Send a location to a WhatsApp chat.'),
    path: '/api/messages/location',
    backendPath: '/api/messages/location',
    fields: [
      instanceIdField,
      remoteJidField,
      urlField('latitude', 'Широта', 'Latitude', '38.5598'),
      urlField('longitude', 'Долгота', 'Longitude', '68.7870')
    ],
    response: simpleJson({ success: true, data: { status: 'sent', type: 'location' } })
  },
  {
    id: 'messages-vcard',
    groupId: 'messages',
    method: 'POST',
    title: text('VCARD', 'VCARD'),
    description: text('Отправка vCard в WhatsApp чат.', 'Send a vCard to a WhatsApp chat.'),
    path: '/api/messages/vcard',
    backendPath: '/api/messages/vcard',
    fields: [instanceIdField, remoteJidField, urlField('vcard', 'vCard', 'vCard', 'BEGIN:VCARD...')],
    response: simpleJson({ success: true, data: { status: 'sent', type: 'vcard' } })
  },
  {
    id: 'messages-reaction',
    groupId: 'messages',
    method: 'POST',
    title: text('REACTION', 'REACTION'),
    description: text('Отправка реакции на сообщение.', 'Send a reaction to a message.'),
    path: '/api/messages/reaction',
    backendPath: '/api/messages/reaction',
    fields: [
      instanceIdField,
      remoteJidField,
      urlField('messageId', 'ID сообщения', 'Message ID', 'BAE5A1A1F...'),
      urlField('emoji', 'Эмодзи', 'Emoji', '👍')
    ],
    response: simpleJson({ success: true, data: { status: 'sent', type: 'reaction' } })
  },
  {
    id: 'messages-delete',
    groupId: 'messages',
    method: 'POST',
    title: text('DELETE', 'DELETE'),
    description: text('Удаление сообщения в WhatsApp чате.', 'Delete a message in a WhatsApp chat.'),
    path: '/api/messages/delete',
    backendPath: '/api/messages/delete',
    fields: [instanceIdField, remoteJidField, urlField('messageId', 'ID сообщения', 'Message ID', 'BAE5A1A1F...')],
    response: simpleJson({ success: true, data: { status: 'deleted' } })
  },
  {
    id: 'messages-resend-status',
    groupId: 'messages',
    method: 'POST',
    title: text('RESENDBYSTATUS', 'RESENDBYSTATUS'),
    description: text('Повторная отправка по статусу.', 'Resend messages by status.'),
    path: '/api/messages/resend-by-status',
    backendPath: '/api/messages/resend-by-status',
    fields: [instanceIdField, urlField('status', 'Статус', 'Status', 'failed')],
    response: simpleJson({ success: true, data: { status: 'queued' } })
  },
  {
    id: 'messages-resend-id',
    groupId: 'messages',
    method: 'POST',
    title: text('RESENDBYID', 'RESENDBYID'),
    description: text('Повторная отправка по ID.', 'Resend a message by ID.'),
    path: '/api/messages/resend-by-id',
    backendPath: '/api/messages/resend-by-id',
    fields: [instanceIdField, urlField('messageId', 'ID сообщения', 'Message ID', 'BAE5A1A1F...')],
    response: simpleJson({ success: true, data: { status: 'queued' } })
  },
  {
    id: 'messages-clear',
    groupId: 'messages',
    method: 'POST',
    title: text('CLEAR', 'CLEAR'),
    description: text('Очистка сообщений.', 'Clear messages.'),
    path: '/api/messages/clear',
    backendPath: '/api/messages/clear',
    fields: [instanceIdField],
    response: simpleJson({ success: true })
  },
  {
    id: 'messages-list',
    groupId: 'messages',
    method: 'GET',
    title: text('MESSAGES', 'MESSAGES'),
    description: text('Получить список сообщений.', 'Get message list.'),
    path: '/api/messages',
    backendPath: '/api/messages',
    fields: [instanceIdField],
    response: simpleJson({ success: true, data: [] })
  },
  {
    id: 'messages-statistics',
    groupId: 'messages',
    method: 'GET',
    title: text('STATISTICS', 'STATISTICS'),
    description: text('Получить статистику сообщений.', 'Get message statistics.'),
    path: '/api/messages/statistics',
    backendPath: '/api/messages/statistics',
    fields: [instanceIdField],
    response: simpleJson({ success: true, data: { total: 0, sent: 0, failed: 0 } })
  },
  {
    id: 'instance-status',
    groupId: 'instance',
    method: 'GET',
    title: text('STATUS', 'STATUS'),
    description: text('Проверить статус инстанса.', 'Check the instance status.'),
    path: '/api/instances/{instanceId}/status',
    backendPath: '/api/instances/{instanceId}/status',
    fields: [instanceIdField],
    response: simpleJson({ success: true, data: { status: 'CONNECTED' } })
  },
  {
    id: 'instance-qr',
    groupId: 'instance',
    method: 'GET',
    title: text('QR', 'QR'),
    description: text('Получить QR-код для авторизации.', 'Get a QR code for authorization.'),
    path: '/api/instances/{instanceId}/qr',
    backendPath: '/api/instances/{instanceId}/qr',
    fields: [instanceIdField],
    response: simpleJson({ success: true, data: { qrCode: 'data:image/png;base64,...', expiresAt: '2026-07-08T12:07:00.000Z' } })
  },
  {
    id: 'instance-qrcode',
    groupId: 'instance',
    method: 'GET',
    title: text('QRCODE', 'QRCODE'),
    description: text('Получить QR-код в виде картинки.', 'Get a QR code as an image.'),
    path: '/api/instances/{instanceId}/qrcode',
    backendPath: '/api/instances/{instanceId}/qrcode',
    fields: [instanceIdField],
    response: simpleJson({ success: true, data: { qrCode: 'data:image/png;base64,...' } })
  },
  {
    id: 'instance-me',
    groupId: 'instance',
    method: 'GET',
    title: text('ME', 'ME'),
    description: text('Информация о текущей сессии WhatsApp.', 'Information about the current WhatsApp session.'),
    path: '/api/instances/{instanceId}/me',
    backendPath: '/api/instances/{instanceId}/me',
    fields: [instanceIdField],
    response: simpleJson({ success: true, data: { id: 'cmrbnksr60002u20sn3uch0z5', jid: '992927188976@s.whatsapp.net' } })
  },
  {
    id: 'instance-settings',
    groupId: 'instance',
    method: 'GET',
    title: text('SETTINGS', 'SETTINGS'),
    description: text('Получить настройки инстанса.', 'Get instance settings.'),
    path: '/api/instances/{instanceId}/settings',
    backendPath: '/api/instances/{instanceId}/settings',
    fields: [instanceIdField],
    response: simpleJson({ success: true, data: { webhookUrl: '', autoReconnect: true } })
  },
  {
    id: 'instance-logout',
    groupId: 'instance',
    method: 'POST',
    title: text('LOGOUT', 'LOGOUT'),
    description: text('Выйти из WhatsApp-сессии.', 'Log out the WhatsApp session.'),
    path: '/api/instances/{instanceId}/logout',
    backendPath: '/api/instances/{instanceId}/logout',
    fields: [instanceIdField],
    response: simpleJson({ success: true })
  },
  {
    id: 'instance-restart',
    groupId: 'instance',
    method: 'POST',
    title: text('RESTART', 'RESTART'),
    description: text('Перезапустить инстанс.', 'Restart the instance.'),
    path: '/api/instances/{instanceId}/restart',
    backendPath: '/api/instances/{instanceId}/restart',
    fields: [instanceIdField],
    response: simpleJson({ success: true })
  },
  {
    id: 'instance-settings-update',
    groupId: 'instance',
    method: 'POST',
    title: text('SETTINGS', 'SETTINGS'),
    description: text('Сохранить настройки инстанса.', 'Save instance settings.'),
    path: '/api/instances/{instanceId}/settings',
    backendPath: '/api/instances/{instanceId}/settings',
    fields: [instanceIdField],
    response: simpleJson({ success: true })
  },
  {
    id: 'instance-clear',
    groupId: 'instance',
    method: 'POST',
    title: text('CLEAR', 'CLEAR'),
    description: text('Очистить данные инстанса.', 'Clear instance data.'),
    path: '/api/instances/{instanceId}/clear',
    backendPath: '/api/instances/{instanceId}/clear',
    fields: [instanceIdField],
    response: simpleJson({ success: true })
  },
  {
    id: 'chats-list',
    groupId: 'chats',
    method: 'GET',
    title: text('CHATS', 'CHATS'),
    description: text('Получить список чатов.', 'Get chats list.'),
    path: '/api/chats',
    backendPath: '/api/chats',
    fields: [instanceIdField],
    response: simpleJson({ success: true, data: [] })
  },
  {
    id: 'chats-ids',
    groupId: 'chats',
    method: 'GET',
    title: text('IDS', 'IDS'),
    description: text('Получить ID чатов.', 'Get chat IDs.'),
    path: '/api/chats/ids',
    backendPath: '/api/chats/ids',
    fields: [instanceIdField],
    response: simpleJson({ success: true, data: [] })
  },
  {
    id: 'chats-messages',
    groupId: 'chats',
    method: 'GET',
    title: text('MESSAGES', 'MESSAGES'),
    description: text('Получить сообщения чата.', 'Get chat messages.'),
    path: '/api/chats/{chatId}/messages',
    backendPath: '/api/chats/{chatId}/messages',
    fields: [instanceIdField, urlField('chatId', 'ID чата', 'Chat ID', '1203630...')],
    response: simpleJson({ success: true, data: [] })
  },
  {
    id: 'chats-archive',
    groupId: 'chats',
    method: 'POST',
    title: text('ARCHIVE', 'ARCHIVE'),
    description: text('Архивировать чат.', 'Archive a chat.'),
    path: '/api/chats/{chatId}/archive',
    backendPath: '/api/chats/{chatId}/archive',
    fields: [instanceIdField, urlField('chatId', 'ID чата', 'Chat ID', '1203630...')],
    response: simpleJson({ success: true })
  },
  {
    id: 'chats-unarchive',
    groupId: 'chats',
    method: 'POST',
    title: text('UNARCHIVE', 'UNARCHIVE'),
    description: text('Убрать чат из архива.', 'Unarchive a chat.'),
    path: '/api/chats/{chatId}/unarchive',
    backendPath: '/api/chats/{chatId}/unarchive',
    fields: [instanceIdField, urlField('chatId', 'ID чата', 'Chat ID', '1203630...')],
    response: simpleJson({ success: true })
  },
  {
    id: 'chats-clear-messages',
    groupId: 'chats',
    method: 'POST',
    title: text('CLEARMESSAGES', 'CLEARMESSAGES'),
    description: text('Очистить сообщения в чате.', 'Clear chat messages.'),
    path: '/api/chats/{chatId}/clear-messages',
    backendPath: '/api/chats/{chatId}/clear-messages',
    fields: [instanceIdField, urlField('chatId', 'ID чата', 'Chat ID', '1203630...')],
    response: simpleJson({ success: true })
  },
  {
    id: 'chats-delete',
    groupId: 'chats',
    method: 'POST',
    title: text('DELETE', 'DELETE'),
    description: text('Удалить чат.', 'Delete a chat.'),
    path: '/api/chats/{chatId}/delete',
    backendPath: '/api/chats/{chatId}/delete',
    fields: [instanceIdField, urlField('chatId', 'ID чата', 'Chat ID', '1203630...')],
    response: simpleJson({ success: true })
  },
  {
    id: 'chats-read',
    groupId: 'chats',
    method: 'POST',
    title: text('READ', 'READ'),
    description: text('Отметить чат прочитанным.', 'Mark chat as read.'),
    path: '/api/chats/{chatId}/read',
    backendPath: '/api/chats/{chatId}/read',
    fields: [instanceIdField, urlField('chatId', 'ID чата', 'Chat ID', '1203630...')],
    response: simpleJson({ success: true })
  },
  {
    id: 'contacts-block',
    groupId: 'contacts',
    method: 'POST',
    title: text('BLOCK', 'BLOCK'),
    description: text('Заблокировать контакт.', 'Block a contact.'),
    path: '/api/contacts/{contactId}/block',
    backendPath: '/api/contacts/{contactId}/block',
    fields: [instanceIdField, urlField('contactId', 'ID контакта', 'Contact ID', '992927188976')],
    response: simpleJson({ success: true })
  },
  {
    id: 'contacts-unblock',
    groupId: 'contacts',
    method: 'POST',
    title: text('UNBLOCK', 'UNBLOCK'),
    description: text('Разблокировать контакт.', 'Unblock a contact.'),
    path: '/api/contacts/{contactId}/unblock',
    backendPath: '/api/contacts/{contactId}/unblock',
    fields: [instanceIdField, urlField('contactId', 'ID контакта', 'Contact ID', '992927188976')],
    response: simpleJson({ success: true })
  },
  {
    id: 'contacts-list',
    groupId: 'contacts',
    method: 'GET',
    title: text('CONTACTS', 'CONTACTS'),
    description: text('Получить список контактов.', 'Get contacts list.'),
    path: '/api/contacts',
    backendPath: '/api/contacts',
    fields: [instanceIdField],
    response: simpleJson({ success: true, data: [] })
  },
  {
    id: 'contacts-ids',
    groupId: 'contacts',
    method: 'GET',
    title: text('IDS', 'IDS'),
    description: text('Получить ID контактов.', 'Get contact IDs.'),
    path: '/api/contacts/ids',
    backendPath: '/api/contacts/ids',
    fields: [instanceIdField],
    response: simpleJson({ success: true, data: [] })
  },
  {
    id: 'contacts-contact',
    groupId: 'contacts',
    method: 'GET',
    title: text('CONTACT', 'CONTACT'),
    description: text('Получить контакт по ID.', 'Get a contact by ID.'),
    path: '/api/contacts/{contactId}',
    backendPath: '/api/contacts/{contactId}',
    fields: [instanceIdField, urlField('contactId', 'ID контакта', 'Contact ID', '992927188976')],
    response: simpleJson({ success: true, data: { id: '992927188976', name: 'Bunyod' } })
  },
  {
    id: 'contacts-blocked',
    groupId: 'contacts',
    method: 'GET',
    title: text('BLOCKED', 'BLOCKED'),
    description: text('Получить заблокированные контакты.', 'Get blocked contacts.'),
    path: '/api/contacts/blocked',
    backendPath: '/api/contacts/blocked',
    fields: [instanceIdField],
    response: simpleJson({ success: true, data: [] })
  },
  {
    id: 'contacts-invalid',
    groupId: 'contacts',
    method: 'GET',
    title: text('INVALID', 'INVALID'),
    description: text('Проверить недействительные контакты.', 'Get invalid contacts.'),
    path: '/api/contacts/invalid',
    backendPath: '/api/contacts/invalid',
    fields: [instanceIdField],
    response: simpleJson({ success: true, data: [] })
  },
  {
    id: 'contacts-check',
    groupId: 'contacts',
    method: 'GET',
    title: text('CHECK', 'CHECK'),
    description: text('Проверить контакт.', 'Check a contact.'),
    path: '/api/contacts/check',
    backendPath: '/api/contacts/check',
    fields: [instanceIdField, remoteJidField],
    response: simpleJson({ success: true, data: { valid: true } })
  },
  {
    id: 'contacts-image',
    groupId: 'contacts',
    method: 'GET',
    title: text('IMAGE', 'IMAGE'),
    description: text('Получить аватар контакта.', 'Get contact image.'),
    path: '/api/contacts/image',
    backendPath: '/api/contacts/image',
    fields: [instanceIdField, remoteJidField],
    response: simpleJson({ success: true, data: { imageUrl: 'https://example.com/avatar.jpg' } })
  },
  {
    id: 'groups-list',
    groupId: 'groups',
    method: 'GET',
    title: text('GROUPS', 'GROUPS'),
    description: text('Получить список групп.', 'Get groups list.'),
    path: '/api/groups',
    backendPath: '/api/groups',
    fields: [instanceIdField],
    response: simpleJson({ success: true, data: [] })
  },
  {
    id: 'groups-ids',
    groupId: 'groups',
    method: 'GET',
    title: text('IDS', 'IDS'),
    description: text('Получить ID групп.', 'Get group IDs.'),
    path: '/api/groups/ids',
    backendPath: '/api/groups/ids',
    fields: [instanceIdField],
    response: simpleJson({ success: true, data: [] })
  },
  {
    id: 'groups-group',
    groupId: 'groups',
    method: 'GET',
    title: text('GROUP', 'GROUP'),
    description: text('Получить группу по ID.', 'Get a group by ID.'),
    path: '/api/groups/{groupId}',
    backendPath: '/api/groups/{groupId}',
    fields: [instanceIdField, urlField('groupId', 'ID группы', 'Group ID', '1203630...')],
    response: simpleJson({ success: true, data: { id: '1203630...', subject: 'AsiaMsg Team' } })
  },
  {
    id: 'media-upload',
    groupId: 'media',
    method: 'POST',
    title: text('UPLOAD', 'UPLOAD'),
    description: text('Загрузить медиа-файл.', 'Upload media file.'),
    path: '/api/media/upload',
    backendPath: '/api/media/upload',
    fields: [instanceIdField, urlField('fileUrl', 'URL файла', 'File URL', 'https://example.com/file.pdf')],
    response: simpleJson({ success: true, data: { url: 'https://example.com/file.pdf' } })
  },
  {
    id: 'media-delete',
    groupId: 'media',
    method: 'POST',
    title: text('DELETE', 'DELETE'),
    description: text('Удалить медиа-файл.', 'Delete media file.'),
    path: '/api/media/delete',
    backendPath: '/api/media/delete',
    fields: [instanceIdField, urlField('mediaId', 'ID медиа', 'Media ID', 'cmx123media')],
    response: simpleJson({ success: true })
  },
  {
    id: 'media-delete-by-date',
    groupId: 'media',
    method: 'POST',
    title: text('DELETEBYDATE', 'DELETEBYDATE'),
    description: text('Удалить медиа по дате.', 'Delete media by date.'),
    path: '/api/media/delete-by-date',
    backendPath: '/api/media/delete-by-date',
    fields: [instanceIdField, urlField('date', 'Дата', 'Date', '2026-07-08')],
    response: simpleJson({ success: true })
  }
];

export const apiDocsCodeSamples: Record<ApiDocsTab, { get: string; post: string }> = {
  curl: {
    get: `curl --location --request GET 'https://api.asiamsg.com/api/instances/YOUR_INSTANCE_ID/qr' \\
--header 'Authorization: Bearer YOUR_TOKEN'`,
    post: `curl --location --request POST 'https://api.asiamsg.com/api/messages/text' \\
--header 'Authorization: Bearer YOUR_TOKEN' \\
--header 'Content-Type: application/json' \\
--data-raw '{
  "instanceId": "YOUR_INSTANCE_ID",
  "remoteJid": "+992922772244",
  "messageText": "Salom test sms",
  "messageType": "text"
}'`
  },
  js: {
    get: `await fetch('https://api.asiamsg.com/api/instances/YOUR_INSTANCE_ID/qr', {
  headers: { Authorization: 'Bearer YOUR_TOKEN' }
});`,
    post: `await fetch('https://api.asiamsg.com/api/messages/text', {
  method: 'POST',
  headers: {
    Authorization: 'Bearer YOUR_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    instanceId: 'YOUR_INSTANCE_ID',
    remoteJid: '+992922772244',
    messageText: 'Salom test sms',
    messageType: 'text'
  })
});`
  },
  php: {
    get: `<?php
$ch = curl_init('https://api.asiamsg.com/api/instances/YOUR_INSTANCE_ID/qr');
curl_setopt_array($ch, [
  CURLOPT_HTTPHEADER => ['Authorization: Bearer YOUR_TOKEN']
]);`,
    post: `<?php
$ch = curl_init('https://api.asiamsg.com/api/messages/text');
curl_setopt_array($ch, [
  CURLOPT_POST => true,
  CURLOPT_HTTPHEADER => [
    'Authorization: Bearer YOUR_TOKEN',
    'Content-Type: application/json'
  ],
  CURLOPT_POSTFIELDS => json_encode([
    'instanceId' => 'YOUR_INSTANCE_ID',
    'remoteJid' => '+992922772244',
    'messageText' => 'Salom test sms',
    'messageType' => 'text'
  ])
]);`
  },
  python: {
    get: `import requests

requests.get(
    'https://api.asiamsg.com/api/instances/YOUR_INSTANCE_ID/qr',
    headers={'Authorization': 'Bearer YOUR_TOKEN'}
)`,
    post: `import requests

requests.post(
    'https://api.asiamsg.com/api/messages/text',
    headers={'Authorization': 'Bearer YOUR_TOKEN'},
    json={
        'instanceId': 'YOUR_INSTANCE_ID',
        'remoteJid': '+992922772244',
        'messageText': 'Salom test sms',
        'messageType': 'text'
    }
)`
  }
};
