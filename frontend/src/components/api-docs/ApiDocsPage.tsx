import React, { useEffect, useMemo, useState } from 'react';
import { ApiDocsSidebar } from './ApiDocsSidebar';
import { ApiEndpointDetails } from './ApiEndpointDetails';
import {
  apiDocsEndpoints,
  apiDocsGroups,
  type LocalizedApiDocsField,
  type LocalizedApiDocsEndpoint,
  type LocalizedApiDocsGroup,
  type LocalizedText
} from './apiDocsData';
import { getDefaultApiBaseUrl, normalizeApiBaseUrl } from '../../lib/api';
import type { AppState } from '../../types';

type Props = {
  state: AppState;
  apiKey: string | null;
  instanceApiKeys?: Record<string, string>;
};

const draftStorageKey = 'chatapi.apiDocs.chatDraft';
const pickText = (text: LocalizedText, isRu: boolean) => (isRu ? text.ru : text.en);

const ruGroupTitles: Record<string, string> = {
  messages: 'Сообщения',
  instance: 'Инстанс',
  chats: 'Чаты',
  contacts: 'Контакты',
  groups: 'Группы',
  media: 'Медиа'
};

const ruEndpointMeta: Record<
  string,
  {
    title?: string;
    description?: string;
    fields?: Record<string, string>;
  }
> = {
  'messages-chat': {
    description: 'Отправка текстового сообщения в WhatsApp чат.',
    fields: {
      instanceId: 'ID инстанса',
      remoteJid: 'Номер получателя',
      messageText: 'Текст сообщения',
      messageType: 'Тип сообщения'
    }
  },
  'messages-image': {
    description: 'Отправка изображения в WhatsApp чат.',
    fields: {
      instanceId: 'ID инстанса',
      remoteJid: 'Номер получателя',
      imageUrl: 'URL изображения',
      messageText: 'Подпись к изображению'
    }
  },
  'messages-sticker': {
    description: 'Отправка стикера в WhatsApp чат.',
    fields: {
      instanceId: 'ID инстанса',
      remoteJid: 'Номер получателя',
      stickerUrl: 'URL стикера'
    }
  },
  'messages-document': {
    description: 'Отправка документа в WhatsApp чат.',
    fields: {
      instanceId: 'ID инстанса',
      remoteJid: 'Номер получателя',
      documentUrl: 'URL документа',
      fileName: 'Имя файла',
      messageText: 'Текст сообщения'
    }
  },
  'messages-audio': {
    description: 'Отправка аудио в WhatsApp чат.',
    fields: {
      instanceId: 'ID инстанса',
      remoteJid: 'Номер получателя',
      audioUrl: 'URL аудио'
    }
  },
  'messages-voice': {
    description: 'Отправка голосового сообщения в WhatsApp чат.',
    fields: {
      instanceId: 'ID инстанса',
      remoteJid: 'Номер получателя',
      voiceUrl: 'URL голосового'
    }
  },
  'messages-video': {
    description: 'Отправка видео в WhatsApp чат.',
    fields: {
      instanceId: 'ID инстанса',
      remoteJid: 'Номер получателя',
      videoUrl: 'URL видео'
    }
  },
  'messages-contact': {
    description: 'Отправка контакта в WhatsApp чат.',
    fields: {
      instanceId: 'ID инстанса',
      remoteJid: 'Номер получателя',
      name: 'Имя контакта',
      phoneNumber: 'Номер контакта'
    }
  },
  'messages-location': {
    description: 'Отправка геолокации в WhatsApp чат.',
    fields: {
      instanceId: 'ID инстанса',
      remoteJid: 'Номер получателя',
      latitude: 'Широта',
      longitude: 'Долгота'
    }
  },
  'messages-vcard': {
    description: 'Отправка vCard в WhatsApp чат.',
    fields: {
      instanceId: 'ID инстанса',
      remoteJid: 'Номер получателя',
      vcard: 'vCard'
    }
  },
  'messages-reaction': {
    description: 'Отправка реакции на сообщение.',
    fields: {
      instanceId: 'ID инстанса',
      remoteJid: 'Номер получателя',
      messageId: 'ID сообщения',
      emoji: 'Эмодзи'
    }
  },
  'messages-delete': {
    description: 'Удаление сообщения в WhatsApp чате.',
    fields: {
      instanceId: 'ID инстанса',
      remoteJid: 'Номер получателя',
      messageId: 'ID сообщения'
    }
  },
  'messages-resend-status': {
    description: 'Повторная отправка по статусу.',
    fields: {
      instanceId: 'ID инстанса',
      status: 'Статус'
    }
  },
  'messages-resend-id': {
    description: 'Повторная отправка по ID.',
    fields: {
      instanceId: 'ID инстанса',
      messageId: 'ID сообщения'
    }
  },
  'messages-clear': {
    description: 'Очистка сообщений.',
    fields: {
      instanceId: 'ID инстанса'
    }
  },
  'messages-list': {
    description: 'Получить список сообщений.',
    fields: {
      instanceId: 'ID инстанса'
    }
  },
  'messages-statistics': {
    description: 'Получить статистику сообщений.',
    fields: {
      instanceId: 'ID инстанса'
    }
  }
};

type RequestValues = {
  remoteJid: string;
  messageText: string;
  imageUrl: string;
  documentUrl: string;
  fileName: string;
  stickerUrl: string;
  audioUrl: string;
  voiceUrl: string;
  videoUrl: string;
  name: string;
  phoneNumber: string;
  latitude: string;
  longitude: string;
  vcard: string;
  messageId: string;
  emoji: string;
  status: string;
  chatId: string;
  contactId: string;
  groupId: string;
  fileUrl: string;
  mediaId: string;
  date: string;
};

const defaultRequestValues: RequestValues = {
  remoteJid: '+992922772244',
  messageText: 'Hello, this is a test message from ChatAPI API Docs.',
  imageUrl: 'https://png.pngtree.com/png-vector/20240827/ourmid/pngtree-purple-flower-and-leaves-frame-template-illustration-png-image_13588629.png',
  documentUrl: 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
  fileName: 'dummy.pdf',
  stickerUrl: 'https://example.com/sticker.webp',
  audioUrl: 'https://example.com/audio.mp3',
  voiceUrl: 'https://example.com/voice.ogg',
  videoUrl: 'https://example.com/video.mp4',
  name: 'John Doe',
  phoneNumber: '+992922772244',
  latitude: '38.5598',
  longitude: '68.7870',
  vcard: 'BEGIN:VCARD...',
  messageId: 'BAE5A1A1F...',
  emoji: '👍',
  status: 'failed',
  chatId: '1203630...',
  contactId: '992927188976',
  groupId: '1203630...',
  fileUrl: 'https://example.com/file.pdf',
  mediaId: 'cmx123media',
  date: '2026-07-08'
};

export const ApiDocsPage: React.FC<Props> = ({ state, apiKey, instanceApiKeys = {} }) => {
  const isRu = state.language === 'RU';
  const apiBaseUrl = normalizeApiBaseUrl(getDefaultApiBaseUrl());
  const [selectedId, setSelectedId] = useState(apiDocsEndpoints[0]?.id ?? '');
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>(() =>
    apiDocsGroups.reduce<Record<string, boolean>>((acc, group) => {
      acc[group.id] = true;
      return acc;
    }, {})
  );
  const [instanceId, setInstanceId] = useState('');
  const [requestValues, setRequestValues] = useState<RequestValues>(defaultRequestValues);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [responseBodyJson, setResponseBodyJson] = useState<string | null>(null);
  const [requestSending, setRequestSending] = useState(false);

  // Get API key for currently selected instance
  const currentApiKey = useMemo(() => {
    if (instanceId && instanceApiKeys[instanceId]) {
      return instanceApiKeys[instanceId];
    }
    return apiKey;
  }, [instanceId, instanceApiKeys, apiKey]);

  const selectedInstance = useMemo(() => {
    if (state.selectedInstanceId) {
      return state.instances.find(instance => instance.id === state.selectedInstanceId) ?? state.instances[0] ?? null;
    }
    return state.instances[0] ?? null;
  }, [state.instances, state.selectedInstanceId]);

  const localizedGroups: LocalizedApiDocsGroup[] = useMemo(
    () =>
      apiDocsGroups.map(group => ({
        ...group,
        title: isRu ? ruGroupTitles[group.id] ?? pickText(group.title, true) : pickText(group.title, false)
      })),
    [isRu]
  );

  const localizedEndpoints: LocalizedApiDocsEndpoint[] = useMemo(
    () =>
      apiDocsEndpoints.map(endpoint => {
        const ruMeta = ruEndpointMeta[endpoint.id];

        return {
          ...endpoint,
          title: isRu && ruMeta?.title ? ruMeta.title : pickText(endpoint.title, isRu),
          description: isRu && ruMeta?.description ? ruMeta.description : pickText(endpoint.description, isRu),
          fields: endpoint.fields.map(
            (field): LocalizedApiDocsField => ({
              ...field,
              description: isRu && ruMeta?.fields?.[field.name] ? ruMeta.fields[field.name] : pickText(field.description, isRu)
            })
          )
        };
      }),
    [isRu]
  );

  const selectedEndpoint = useMemo(
    () => localizedEndpoints.find(endpoint => endpoint.id === selectedId) ?? localizedEndpoints[0],
    [localizedEndpoints, selectedId]
  );

  const endpointsByGroup = useMemo(() => {
    const grouped = new Map<string, LocalizedApiDocsEndpoint[]>();
    for (const endpoint of localizedEndpoints) {
      const current = grouped.get(endpoint.groupId) ?? [];
      current.push(endpoint);
      grouped.set(endpoint.groupId, current);
    }
    return grouped;
  }, [localizedEndpoints]);

  const requestFieldValues = useMemo(
    () => ({
      ...requestValues,
      instanceId
    }),
    [instanceId, requestValues]
  );

  const updateRequestField = (name: string, value: string) => {
    if (name === 'instanceId') {
      setInstanceId(value);
      return;
    }

    setRequestValues(prev => ({ ...prev, [name]: value }));
  };

  const buildRequestPayload = (endpoint: LocalizedApiDocsEndpoint, values: Record<string, string>) => {
    const take = (name: string, fallback = '') => values[name]?.trim() || fallback;

    switch (endpoint.id) {
      case 'messages-chat':
        return {
          instanceId: take('instanceId', 'YOUR_INSTANCE_ID'),
          remoteJid: take('remoteJid', '+992922772244'),
          messageText: take('messageText', 'Hello, this is a test message from ChatAPI API Docs.'),
          messageType: 'text'
        };
      case 'messages-image':
        return {
          instanceId: take('instanceId', 'YOUR_INSTANCE_ID'),
          remoteJid: take('remoteJid', '+992922772244'),
          imageUrl: take('imageUrl', defaultRequestValues.imageUrl),
          messageText: take('messageText', 'Hello, this is a test image caption.'),
          messageType: 'image'
        };
      case 'messages-sticker':
        return {
          instanceId: take('instanceId', 'YOUR_INSTANCE_ID'),
          remoteJid: take('remoteJid', '+992922772244'),
          stickerUrl: take('stickerUrl', defaultRequestValues.stickerUrl)
        };
      case 'messages-document':
        return {
          instanceId: take('instanceId', 'YOUR_INSTANCE_ID'),
          remoteJid: take('remoteJid', '+992922772244'),
          documentUrl: take('documentUrl', defaultRequestValues.documentUrl),
          fileName: take('fileName', defaultRequestValues.fileName),
          messageText: take('messageText', 'Invoice attached'),
          messageType: 'document'
        };
      case 'messages-audio':
        return {
          instanceId: take('instanceId', 'YOUR_INSTANCE_ID'),
          remoteJid: take('remoteJid', '+992922772244'),
          audioUrl: take('audioUrl', defaultRequestValues.audioUrl)
        };
      case 'messages-voice':
        return {
          instanceId: take('instanceId', 'YOUR_INSTANCE_ID'),
          remoteJid: take('remoteJid', '+992922772244'),
          voiceUrl: take('voiceUrl', defaultRequestValues.voiceUrl)
        };
      case 'messages-video':
        return {
          instanceId: take('instanceId', 'YOUR_INSTANCE_ID'),
          remoteJid: take('remoteJid', '+992922772244'),
          videoUrl: take('videoUrl', defaultRequestValues.videoUrl)
        };
      case 'messages-contact':
        return {
          instanceId: take('instanceId', 'YOUR_INSTANCE_ID'),
          remoteJid: take('remoteJid', '+992922772244'),
          name: take('name', defaultRequestValues.name),
          phoneNumber: take('phoneNumber', defaultRequestValues.phoneNumber)
        };
      case 'messages-location':
        return {
          instanceId: take('instanceId', 'YOUR_INSTANCE_ID'),
          remoteJid: take('remoteJid', '+992922772244'),
          latitude: take('latitude', defaultRequestValues.latitude),
          longitude: take('longitude', defaultRequestValues.longitude)
        };
      case 'messages-vcard':
        return {
          instanceId: take('instanceId', 'YOUR_INSTANCE_ID'),
          remoteJid: take('remoteJid', '+992922772244'),
          vcard: take('vcard', defaultRequestValues.vcard)
        };
      case 'messages-reaction':
        return {
          instanceId: take('instanceId', 'YOUR_INSTANCE_ID'),
          remoteJid: take('remoteJid', '+992922772244'),
          messageId: take('messageId', defaultRequestValues.messageId),
          emoji: take('emoji', defaultRequestValues.emoji)
        };
      case 'messages-delete':
        return {
          instanceId: take('instanceId', 'YOUR_INSTANCE_ID'),
          remoteJid: take('remoteJid', '+992922772244'),
          messageId: take('messageId', defaultRequestValues.messageId)
        };
      case 'messages-resend-status':
        return {
          instanceId: take('instanceId', 'YOUR_INSTANCE_ID'),
          status: take('status', defaultRequestValues.status)
        };
      case 'messages-resend-id':
        return {
          instanceId: take('instanceId', 'YOUR_INSTANCE_ID'),
          messageId: take('messageId', defaultRequestValues.messageId)
        };
      case 'messages-clear':
      case 'messages-list':
      case 'messages-statistics':
        return {
          instanceId: take('instanceId', 'YOUR_INSTANCE_ID')
        };
      default:
        return endpoint.fields.reduce<Record<string, string>>((acc, field) => {
          if (field.name === 'messageType') {
            return acc;
          }
          acc[field.name] = take(field.name, field.example ?? '');
          return acc;
        }, {});
    }
  };

  const replacePathParams = (path: string, values: Record<string, string>, fallback = 'YOUR_INSTANCE_ID') =>
    path.replace(/\{(\w+)\}|:(\w+)/g, (_, braceName: string, colonName: string) => {
      const name = braceName || colonName;
      return values[name]?.trim() || fallback;
    });

  const isImageEndpoint = selectedEndpoint?.id === 'messages-image';
  const isDocumentEndpoint = selectedEndpoint?.id === 'messages-document';

  const copyToClipboard = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedKey(key);
    window.setTimeout(() => setCopiedKey(null), 1200);
  };

  useEffect(() => {
    const savedDraft = window.localStorage.getItem(draftStorageKey);
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft) as { instanceId?: string };
        setInstanceId(parsed.instanceId ?? selectedInstance?.id ?? '');
        return;
      } catch {
        window.localStorage.removeItem(draftStorageKey);
      }
    }

    setInstanceId(selectedInstance?.id ?? '');
  }, [apiKey, selectedInstance?.id]);

  const saveDraft = () => {
    window.localStorage.setItem(draftStorageKey, JSON.stringify({ instanceId }));
  };

  const sendPreview = async () => {
    if (requestSending) return;
    saveDraft();

    if (!instanceId.trim() || !currentApiKey?.trim()) {
      setResponseBodyJson(
        JSON.stringify(
          {
            success: false,
            message: isRu ? 'Введите Instance ID и X-API-Key' : 'Enter Instance ID and X-API-Key'
          },
          null,
          2
        )
      );
      return;
    }

    try {
      setRequestSending(true);
      const payload = buildRequestPayload(selectedEndpoint, requestFieldValues);
      const url = `${apiBaseUrl}${replacePathParams(selectedEndpoint.backendPath, requestFieldValues, instanceId.trim())}`;
      if (selectedEndpoint.method === 'GET') {
        const query = new URLSearchParams();
        Object.entries(payload).forEach(([key, value]) => {
          if (value) query.set(key, String(value));
        });
        const queryString = query.toString();
        const response = await fetch(queryString ? `${url}?${queryString}` : url, {
          method: 'GET',
          headers: {
            'X-API-Key': currentApiKey?.trim() ?? ''
          }
        });

        const rawText = await response.text();
        let responsePayload: unknown = rawText;

        try {
          responsePayload = rawText ? JSON.parse(rawText) : { success: true };
        } catch {
          responsePayload = rawText || { success: response.ok };
        }

        setResponseBodyJson(JSON.stringify(responsePayload, null, 2));
        return;
      }

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': currentApiKey?.trim() ?? ''
        },
        body: JSON.stringify(payload)
      });

      const rawText = await response.text();
      let responsePayload: unknown = rawText;

      try {
        responsePayload = rawText ? JSON.parse(rawText) : { success: true };
      } catch {
        responsePayload = rawText || { success: response.ok };
      }

      setResponseBodyJson(JSON.stringify(responsePayload, null, 2));
    } catch (error) {
      setResponseBodyJson(
        JSON.stringify(
          {
            success: false,
            message: error instanceof Error ? error.message : 'Request failed'
          },
          null,
          2
        )
      );
    } finally {
      setRequestSending(false);
    }
  };

  const strings = isRu
    ? {
        pageTitle: 'API документация',
        pageDescription: 'Интерактивная справка по API ChatAPI и примерам запросов.',
        instanceSelectLabel: 'Выбор инстанса',
        instanceSelectPlaceholder: 'Выберите инстанс',
        requestTitle: 'Запрос',
        requestDescription: isImageEndpoint
          ? 'Поля для отправки изображения в WhatsApp чат.'
          : isDocumentEndpoint
            ? 'Поля для отправки документа в WhatsApp чат.'
            : 'Поля для отправки сообщения в WhatsApp чат.',
        numberLabel: 'Номер',
        numberPlaceholder: '+992922772244',
        numberHint: 'remoteJid * string',
        textLabel: isImageEndpoint ? 'Подпись' : 'Текст',
        textPlaceholder: isImageEndpoint
          ? 'Hello, это тестовая подпись для изображения.'
          : 'Hello, это тестовое сообщение из ChatAPI API Docs.',
        textHint: 'messageText * string',
        imageUrlLabel: 'URL изображения',
        imageUrlPlaceholder: 'https://example.com/image.jpg',
        imageUrlHint: 'imageUrl * string',
        documentUrlLabel: 'URL документа',
        documentUrlPlaceholder: 'https://example.com/invoice.pdf',
        documentUrlHint: 'documentUrl * string',
        fileNameLabel: 'Имя файла',
        fileNamePlaceholder: 'invoice.pdf',
        fileNameHint: 'fileName string',
        sendLabel: 'Отправить',
        sendingLabel: 'Отправка...',
        responseTitle: 'Ответ',
        responseDescription: 'Пример ответа после отправки сообщения.',
        curlTitle: 'cURL',
        curlDescription: 'Скопируйте запрос и вставьте в Postman или curl.',
        copyUrlLabel: 'Copy URL',
        copiedUrlLabel: 'Скопировано',
        copyLabel: 'Copy',
        copiedLabel: 'Скопировано'
      }
    : {
        pageTitle: 'API Documentation',
        pageDescription: 'Interactive API reference for ChatAPI with request examples.',
        instanceSelectLabel: 'Select instance',
        instanceSelectPlaceholder: 'Choose an instance',
        requestTitle: 'Request',
        requestDescription: isImageEndpoint
          ? 'Fields for sending an image to WhatsApp chat.'
          : isDocumentEndpoint
            ? 'Fields for sending a document to WhatsApp chat.'
            : 'Fields for sending a message to WhatsApp chat.',
        numberLabel: 'Number',
        numberPlaceholder: '+992922772244',
        numberHint: 'remoteJid * string',
        textLabel: isImageEndpoint ? 'Caption' : 'Text',
        textPlaceholder: isImageEndpoint
          ? 'Hello, this is a test image caption.'
          : 'Hello, this is a test message from ChatAPI API Docs.',
        textHint: 'messageText * string',
        imageUrlLabel: 'Image URL',
        imageUrlPlaceholder: 'https://example.com/image.jpg',
        imageUrlHint: 'imageUrl * string',
        documentUrlLabel: 'Document URL',
        documentUrlPlaceholder: 'https://example.com/invoice.pdf',
        documentUrlHint: 'documentUrl * string',
        fileNameLabel: 'File name',
        fileNamePlaceholder: 'invoice.pdf',
        fileNameHint: 'fileName string',
        sendLabel: 'Send',
        sendingLabel: 'Sending...',
        responseTitle: 'Response',
        responseDescription: 'Example response after sending the message.',
        curlTitle: 'cURL request for Postman',
        curlDescription: 'Copy the request and paste it into Postman or curl.',
        copyUrlLabel: 'Copy URL',
        copiedUrlLabel: 'Copied',
        copyLabel: 'Copy',
        copiedLabel: 'Copied'
      };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">{strings.pageTitle}</h1>
          <p className="mt-1 text-xs text-slate-400 dark:text-slate-500">{strings.pageDescription}</p>
        </div>
      </div>

      <div className="grid items-start gap-6 grid-cols-1 lg:grid-cols-[300px_minmax(0,1fr)]">
        <ApiDocsSidebar
          groups={localizedGroups}
          endpointsByGroup={endpointsByGroup}
          selectedEndpointId={selectedEndpoint.id}
          onSelectEndpoint={setSelectedId}
          openGroups={openGroups}
          onToggleGroup={groupId => setOpenGroups(prev => ({ ...prev, [groupId]: !prev[groupId] }))}
        />

        <ApiEndpointDetails
          endpoint={selectedEndpoint}
          apiBaseUrl={apiBaseUrl}
          requestTitle={strings.requestTitle}
          requestDescription={selectedEndpoint?.description ?? strings.requestDescription}
          instances={state.instances}
          selectedInstanceId={instanceId}
          instanceSelectLabel={strings.instanceSelectLabel}
          instanceSelectPlaceholder={strings.instanceSelectPlaceholder}
          sendLabel={strings.sendLabel}
          sendingLabel={strings.sendingLabel}
          isSending={requestSending}
          responseTitle={strings.responseTitle}
          responseDescription={strings.responseDescription}
          curlTitle={strings.curlTitle}
          curlDescription={strings.curlDescription}
          copyUrlLabel={strings.copyUrlLabel}
          copiedUrlLabel={strings.copiedUrlLabel}
          copyLabel={strings.copyLabel}
          copiedLabel={strings.copiedLabel}
          authInstanceId={instanceId}
          authToken={currentApiKey ?? ''}
          values={requestFieldValues}
          onFieldChange={updateRequestField}
          responseBodyJson={responseBodyJson}
          onSendClick={sendPreview}
          copiedKey={copiedKey}
          onCopy={copyToClipboard}
        />
      </div>
    </div>
  );
};

