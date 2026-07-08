import React from 'react';
import { KeyRound, MessageSquare } from 'lucide-react';

export type HttpMethod = 'GET' | 'POST';
export type ApiDocsTab = 'curl' | 'js' | 'php' | 'python';
export type ApiDocsGroupId = 'auth' | 'messages';

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

export const apiDocsGroups: ApiDocsGroup[] = [
  { id: 'messages', title: { ru: 'Сообщения', en: 'Messages' }, icon: <MessageSquare className="h-4 w-4" />, defaultOpen: true }
];

export const apiDocsEndpoints: ApiDocsEndpoint[] = [
  {
    id: 'messages-chat',
    groupId: 'messages',
    method: 'POST',
    title: { ru: 'ТЕКСТ', en: 'TEXT' },
    description: {
      ru: 'Отправка текстового сообщения в WhatsApp чат.',
      en: 'Send a text message to a WhatsApp chat.'
    },
    path: '/api/messages/text',
    backendPath: '/api/messages/text',
    fields: [
      {
        name: 'instanceId',
        type: 'string',
        required: true,
        description: { ru: 'ID инстанса', en: 'Instance ID' },
        example: 'cmrazvk4j0002u2uw5shpeuxu'
      },
      {
        name: 'remoteJid',
        type: 'string',
        required: true,
        description: { ru: 'Номер получателя', en: 'Recipient number' },
        example: '+992922772244'
      },
      {
        name: 'messageText',
        type: 'string',
        required: true,
        description: { ru: 'Текст сообщения', en: 'Message text' },
        example: 'Salom test sms'
      },
      {
        name: 'messageType',
        type: 'text',
        required: true,
        description: { ru: 'Тип сообщения', en: 'Message type' },
        example: 'text'
      }
    ],
    response: {
      success: true,
      data: {
        id: 'cmx123abc',
        instanceId: 'cmrazvk4j0002u2uw5shpeuxu',
        direction: 'outbound',
        remoteJid: '+992922772244',
        messageId: 'BAE5A1A1F...',
        payload: {
          text: 'Salom test sms',
          type: 'text'
        },
        status: 'sent',
        sentAt: '2026-07-08T12:07:00.000Z'
      }
    }
  },
  {
    id: 'messages-image',
    groupId: 'messages',
    method: 'POST',
    title: { ru: 'ИЗОБРАЖЕНИЕ', en: 'IMAGE' },
    description: {
      ru: 'Отправка изображения в WhatsApp чат.',
      en: 'Send an image to a WhatsApp chat.'
    },
    path: '/api/messages/image',
    backendPath: '/api/messages/image',
    fields: [
      {
        name: 'instanceId',
        type: 'string',
        required: true,
        description: { ru: 'ID инстанса', en: 'Instance ID' },
        example: 'cmrazvk4j0002u2uw5shpeuxu'
      },
      {
        name: 'remoteJid',
        type: 'string',
        required: true,
        description: { ru: 'Номер получателя', en: 'Recipient number' },
        example: '+992922772244'
      },
      {
        name: 'imageUrl',
        type: 'string',
        required: true,
        description: { ru: 'Ссылка на изображение', en: 'Image URL' },
        example: 'https://example.com/image.jpg'
      },
      {
        name: 'caption',
        type: 'string',
        description: { ru: 'Подпись к изображению', en: 'Image caption' },
        example: 'AsiaMsg image'
      }
    ],
    response: {
      success: true,
      data: {
        id: 'cmx123img',
        instanceId: 'cmrazvk4j0002u2uw5shpeuxu',
        direction: 'outbound',
        remoteJid: '+992922772244',
        messageId: 'BAE5A1IMG...',
        payload: {
          imageUrl: 'https://example.com/image.jpg',
          caption: 'AsiaMsg image'
        },
        status: 'sent',
        sentAt: '2026-07-08T12:07:00.000Z'
      }
    }
  },
  {
    id: 'messages-document',
    groupId: 'messages',
    method: 'POST',
    title: { ru: 'ДОКУМЕНТ', en: 'DOCUMENT' },
    description: {
      ru: 'Отправка документа в WhatsApp чат.',
      en: 'Send a document to a WhatsApp chat.'
    },
    path: '/api/messages/document',
    backendPath: '/api/messages/document',
    fields: [
      {
        name: 'instanceId',
        type: 'string',
        required: true,
        description: { ru: 'ID инстанса', en: 'Instance ID' },
        example: 'cmrazvk4j0002u2uw5shpeuxu'
      },
      {
        name: 'remoteJid',
        type: 'string',
        required: true,
        description: { ru: 'Номер получателя', en: 'Recipient number' },
        example: '+992922772244'
      },
      {
        name: 'documentUrl',
        type: 'string',
        required: true,
        description: { ru: 'Ссылка на документ', en: 'Document URL' },
        example: 'https://example.com/invoice.pdf'
      },
      {
        name: 'fileName',
        type: 'string',
        description: { ru: 'Имя файла', en: 'File name' },
        example: 'invoice.pdf'
      }
    ],
    response: {
      success: true,
      data: {
        id: 'cmx123doc',
        instanceId: 'cmrazvk4j0002u2uw5shpeuxu',
        direction: 'outbound',
        remoteJid: '+992922772244',
        messageId: 'BAE5A1DOC...',
        payload: {
          documentUrl: 'https://example.com/invoice.pdf',
          fileName: 'invoice.pdf'
        },
        status: 'sent',
        sentAt: '2026-07-08T12:07:00.000Z'
      }
    }
  }
];

export const apiDocsCodeSamples: Record<ApiDocsTab, { get: string; post: string }> = {
  curl: {
    get: `# GET endpoint not available
# Use POST /api/messages/text`,
    post: `curl --location --request POST 'https://api.asiamsg.com/api/messages/text' \\
--header 'Authorization: Bearer YOUR_TOKEN' \\
--header 'Content-Type: application/json' \\
--data-raw '{
  "instanceId": "cmrazvk4j0002u2uw5shpeuxu",
  "remoteJid": "+992922772244",
  "messageText": "Salom test sms",
  "messageType": "text"
}'`
  },
  js: {
    get: `// GET endpoint not available`,
    post: `const response = await fetch('https://api.asiamsg.com/api/messages/text', {
  method: 'POST',
  headers: {
    Authorization: 'Bearer YOUR_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    instanceId: 'cmrazvk4j0002u2uw5shpeuxu',
    remoteJid: '+992922772244',
    messageText: 'Salom test sms',
    messageType: 'text'
  })
});`
  },
  php: {
    get: `// GET endpoint not available`,
    post: `<?php
$ch = curl_init('https://api.asiamsg.com/api/messages/text');
curl_setopt_array($ch, [
  CURLOPT_POST => true,
  CURLOPT_HTTPHEADER => [
    'Authorization: Bearer YOUR_TOKEN',
    'Content-Type: application/json'
  ],
  CURLOPT_POSTFIELDS => json_encode([
    'instanceId' => 'cmrazvk4j0002u2uw5shpeuxu',
    'remoteJid' => '+992922772244',
    'messageText' => 'Salom test sms',
    'messageType' => 'text'
  ])
]);`
  },
  python: {
    get: `# GET endpoint not available`,
    post: `import requests

requests.post(
    'https://api.asiamsg.com/api/messages/text',
    headers={'Authorization': 'Bearer YOUR_TOKEN'},
    json={
        'instanceId': 'cmrazvk4j0002u2uw5shpeuxu',
        'remoteJid': '+992922772244',
        'messageText': 'Salom test sms',
        'messageType': 'text'
    }
)`
  }
};
