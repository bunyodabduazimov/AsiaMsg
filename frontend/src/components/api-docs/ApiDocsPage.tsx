import React, { useEffect, useMemo, useState } from 'react';
import { KeyRound, ShieldCheck, ShieldOff } from 'lucide-react';
import { ApiDocsSidebar } from './ApiDocsSidebar';
import { ApiEndpointDetails } from './ApiEndpointDetails';
import {
  apiDocsEndpoints,
  apiDocsGroups,
  type ApiDocsEndpoint,
  type ApiDocsGroup,
  type LocalizedApiDocsEndpoint,
  type LocalizedApiDocsField,
  type LocalizedApiDocsGroup,
  type LocalizedText
} from './apiDocsData';
import { getDefaultApiBaseUrl, normalizeApiBaseUrl } from '../../lib/api';
import type { AppState } from '../../types';

type Props = {
  state: AppState;
  accessToken: string | null;
};

const draftStorageKey = 'asiamsg.apiDocs.chatDraft';
const pickText = (text: LocalizedText, isRu: boolean) => (isRu ? text.ru : text.en);

const authDocsGroups: ApiDocsGroup[] = [
  { id: 'auth', title: { ru: 'Авторизация', en: 'Auth' }, icon: <KeyRound className="h-4 w-4" />, defaultOpen: true }
];

const authDocsEndpoints: ApiDocsEndpoint[] = [
  {
    id: 'auth-qr',
    groupId: 'auth',
    method: 'GET',
    title: { ru: 'QR', en: 'QR' },
    description: {
      ru: 'Получить QR-код для авторизации WhatsApp.',
      en: 'Get a QR code for WhatsApp authorization.'
    },
    path: '/api/instances/{instanceId}/qr',
    backendPath: '/api/instances/{instanceId}/qr',
    fields: [
      {
        name: 'instanceId',
        type: 'string',
        required: true,
        description: { ru: 'ID инстанса', en: 'Instance ID' },
        example: 'cmrbnksr60002u20sn3uch0z5'
      }
    ],
    response: {
      success: true,
      data: { qrCode: 'data:image/png;base64,...', expiresAt: '2026-07-08T12:07:00.000Z' }
    }
  },
  {
    id: 'auth-status',
    groupId: 'auth',
    method: 'GET',
    title: { ru: 'STATUS', en: 'STATUS' },
    description: {
      ru: 'Проверить текущий статус инстанса.',
      en: 'Check the current instance status.'
    },
    path: '/api/instances/{instanceId}',
    backendPath: '/api/instances/{instanceId}',
    fields: [
      {
        name: 'instanceId',
        type: 'string',
        required: true,
        description: { ru: 'ID инстанса', en: 'Instance ID' },
        example: 'cmrbnksr60002u20sn3uch0z5'
      }
    ],
    response: {
      success: true,
      data: { id: 'cmrbnksr60002u20sn3uch0z5', status: 'CONNECTED', qrCode: null }
    }
  },
  {
    id: 'auth-connect',
    groupId: 'auth',
    method: 'POST',
    title: { ru: 'CONNECT', en: 'CONNECT' },
    description: {
      ru: 'Запустить подключение инстанса и ожидать QR.',
      en: 'Start instance connection and wait for QR.'
    },
    path: '/api/instances/{instanceId}/connect',
    backendPath: '/api/instances/{instanceId}/connect',
    fields: [
      {
        name: 'instanceId',
        type: 'string',
        required: true,
        description: { ru: 'ID инстанса', en: 'Instance ID' },
        example: 'cmrbnksr60002u20sn3uch0z5'
      }
    ],
    response: {
      success: true,
      data: { id: 'cmrbnksr60002u20sn3uch0z5', status: 'CONNECTING', qrCode: 'data:image/png;base64,...' }
    }
  },
  {
    id: 'auth-disconnect',
    groupId: 'auth',
    method: 'POST',
    title: { ru: 'DISCONNECT', en: 'DISCONNECT' },
    description: {
      ru: 'Отключить WhatsApp-сессию инстанса.',
      en: 'Disconnect the WhatsApp session of the instance.'
    },
    path: '/api/instances/{instanceId}/disconnect',
    backendPath: '/api/instances/{instanceId}/disconnect',
    fields: [
      {
        name: 'instanceId',
        type: 'string',
        required: true,
        description: { ru: 'ID инстанса', en: 'Instance ID' },
        example: 'cmrbnksr60002u20sn3uch0z5'
      }
    ],
    response: {
      success: true,
      data: { id: 'cmrbnksr60002u20sn3uch0z5', status: 'DISCONNECTED' }
    }
  }
];

export const ApiDocsPage: React.FC<Props> = ({ state, accessToken }) => {
  const isRu = state.language === 'RU';
  const apiBaseUrl = normalizeApiBaseUrl(getDefaultApiBaseUrl());
  const [selectedId, setSelectedId] = useState(authDocsEndpoints[0]?.id ?? apiDocsEndpoints[0]?.id ?? '');
  const [authOpen, setAuthOpen] = useState(false);
  const [instanceId, setInstanceId] = useState('');
  const [token, setToken] = useState('');
  const [remoteJid, setRemoteJid] = useState('+992922772244');
  const [messageText, setMessageText] = useState('Hello, this is a test message from AsiaMsg API Docs.');
  const [imageUrl, setImageUrl] = useState('https://png.pngtree.com/png-vector/20240827/ourmid/pngtree-purple-flower-and-leaves-frame-template-illustration-png-image_13588629.png');
  const [documentUrl, setDocumentUrl] = useState('https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf');
  const [fileName, setFileName] = useState('dummy.pdf');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [responseBodyJson, setResponseBodyJson] = useState<string | null>(null);
  const [requestSending, setRequestSending] = useState(false);

  const selectedInstance = useMemo(() => {
    if (state.selectedInstanceId) {
      return state.instances.find(instance => instance.id === state.selectedInstanceId) ?? state.instances[0] ?? null;
    }
    return state.instances[0] ?? null;
  }, [state.instances, state.selectedInstanceId]);

  const localizedGroups: LocalizedApiDocsGroup[] = useMemo(
    () =>
      [...authDocsGroups, ...apiDocsGroups].map(group => ({
        ...group,
        title: pickText(group.title, isRu)
      })),
    [isRu]
  );

  const localizedEndpoints: LocalizedApiDocsEndpoint[] = useMemo(
    () =>
      [...authDocsEndpoints, ...apiDocsEndpoints].map(endpoint => ({
        ...endpoint,
        title: pickText(endpoint.title, isRu),
        description: pickText(endpoint.description, isRu),
        fields: endpoint.fields.map(
          (field): LocalizedApiDocsField => ({
            ...field,
            description: pickText(field.description, isRu)
          })
        )
      })),
    [isRu]
  );

  const selectedEndpoint = useMemo(
    () => localizedEndpoints.find(endpoint => endpoint.id === selectedId) ?? localizedEndpoints[0],
    [localizedEndpoints, selectedId]
  );
  const isImageEndpoint = selectedEndpoint?.id === 'messages-image';
  const isDocumentEndpoint = selectedEndpoint?.id === 'messages-document';

  const fieldSummary = useMemo(
    () =>
      selectedEndpoint
        ? selectedEndpoint.fields.map(field => `${field.name}${field.required ? ' *' : ''} ${field.type}`).join(' · ')
        : '',
    [selectedEndpoint]
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

  const isAuthorized = Boolean(instanceId.trim() && token.trim());

  const copyToClipboard = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedKey(key);
    window.setTimeout(() => setCopiedKey(null), 1200);
  };

  useEffect(() => {
    const savedDraft = window.localStorage.getItem(draftStorageKey);
    if (savedDraft) {
      try {
        const parsed = JSON.parse(savedDraft) as { instanceId?: string; token?: string };
        setInstanceId(parsed.instanceId ?? selectedInstance?.id ?? '');
        setToken(parsed.token ?? accessToken ?? '');
        return;
      } catch {
        window.localStorage.removeItem(draftStorageKey);
      }
    }

    setInstanceId(selectedInstance?.id ?? '');
    setToken(accessToken ?? '');
  }, [accessToken, selectedInstance?.id]);

  const saveDraft = () => {
    window.localStorage.setItem(draftStorageKey, JSON.stringify({ instanceId, token }));
  };

  const resetDraft = () => {
    window.localStorage.removeItem(draftStorageKey);
    setInstanceId(selectedInstance?.id ?? '');
    setToken(accessToken ?? '');
  };

  const sendPreview = async () => {
    if (requestSending) return;
    saveDraft();
    const apiBaseUrl = normalizeApiBaseUrl(getDefaultApiBaseUrl());
    const isAuthEndpoint = selectedEndpoint.groupId === 'auth';

    if (!instanceId.trim() || !token.trim()) {
      setResponseBodyJson(
        JSON.stringify(
          {
            success: false,
            message: isRu ? 'Введите Instance ID и Token' : 'Enter Instance ID and Token'
          },
          null,
          2
        )
      );
      return;
    }

    try {
      setRequestSending(true);
      if (isAuthEndpoint) {
        const authPath = selectedEndpoint.backendPath
          .replace('{instanceId}', encodeURIComponent(instanceId.trim()))
          .replace(':instanceId', encodeURIComponent(instanceId.trim()));
        const response = await fetch(`${apiBaseUrl}${authPath}`, {
          method: selectedEndpoint.method,
          headers: {
            Authorization: `Bearer ${token.trim()}`
          }
        });

        const rawText = await response.text();
        let responsePayload: unknown = rawText;

        try {
          responsePayload = rawText ? JSON.parse(rawText) : { success: response.ok };
        } catch {
          responsePayload = rawText || { success: response.ok };
        }

        setResponseBodyJson(JSON.stringify(responsePayload, null, 2));
        return;
      }

      const payload = isImageEndpoint
        ? {
            instanceId: instanceId.trim(),
            remoteJid: remoteJid.trim(),
            imageUrl: imageUrl.trim(),
            messageText: messageText.trim(),
            messageType: 'image'
          }
        : isDocumentEndpoint
          ? {
              instanceId: instanceId.trim(),
              remoteJid: remoteJid.trim(),
              documentUrl: documentUrl.trim(),
              fileName: fileName.trim(),
              messageText: messageText.trim(),
              messageType: 'document'
            }
          : {
            instanceId: instanceId.trim(),
            remoteJid: remoteJid.trim(),
            messageText: messageText.trim(),
            messageType: 'text'
          };

      const response = await fetch(`${apiBaseUrl}${selectedEndpoint.backendPath}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token.trim()}`
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
        pageDescription: 'Интерактивная справка по API AsiaMsg и примерам запросов.',
        authButton: 'Авторизация',
        authorized: 'Авторизован',
        notAuthorized: 'Не авторизован',
        modalTitle: 'Авторизация',
        modalDescription: 'Введите Instance ID (сессия) и Token для запросов.',
        close: 'Закрыть',
        reset: 'Сбросить',
        save: 'Сохранить',
        instanceLabel: 'Instance ID (сессия)',
        tokenLabel: 'Token',
        instancePlaceholder: 'Введите Instance ID',
        tokenPlaceholder: 'Введите Token',
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
          : 'Hello, это тестовое сообщение из AsiaMsg API Docs.',
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
        pageDescription: 'Interactive API reference for AsiaMsg with request examples.',
        authButton: 'Authorization',
        authorized: 'Authorized',
        notAuthorized: 'Not authorized',
        modalTitle: 'Authorization',
        modalDescription: 'Enter Instance ID (session) and Token for requests.',
        close: 'Close',
        reset: 'Reset',
        save: 'Save',
        instanceLabel: 'Instance ID (session)',
        tokenLabel: 'Token',
        instancePlaceholder: 'Enter Instance ID',
        tokenPlaceholder: 'Enter Token',
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
          : 'Hello, this is a test message from AsiaMsg API Docs.',
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

        <button
          type="button"
          onClick={() => setAuthOpen(true)}
          className={`inline-flex items-center gap-3 rounded-2xl border bg-white px-4 py-2 text-left shadow-sm transition hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 ${
            isAuthorized
              ? 'border-emerald-200 text-emerald-700 dark:border-emerald-900/60 dark:text-emerald-300'
              : 'border-rose-200 text-rose-700 dark:border-rose-900/60 dark:text-rose-300'
          }`}
        >
          <span
            className={`inline-flex h-8 w-8 items-center justify-center rounded-full ${
              isAuthorized ? 'bg-emerald-100 dark:bg-emerald-500/15' : 'bg-rose-100 dark:bg-rose-500/15'
            }`}
          >
            {isAuthorized ? <ShieldCheck className="h-4 w-4" /> : <ShieldOff className="h-4 w-4" />}
          </span>
          <span className="flex flex-col leading-tight">
            <span className="text-xs font-semibold uppercase tracking-[0.18em] opacity-70">{strings.authButton}</span>
            <span className="text-sm font-bold">{isAuthorized ? strings.authorized : strings.notAuthorized}</span>
          </span>
        </button>
      </div>

      <div className="grid items-start gap-6 grid-cols-1 lg:grid-cols-[300px_minmax(0,1fr)]">
        <ApiDocsSidebar
          groups={localizedGroups}
          endpointsByGroup={endpointsByGroup}
          selectedEndpointId={selectedEndpoint.id}
          onSelectEndpoint={setSelectedId}
        />

        <ApiEndpointDetails
          endpoint={selectedEndpoint}
          apiBaseUrl={apiBaseUrl}
          isRu={isRu}
          requestTitle={strings.requestTitle}
          requestDescription={strings.requestDescription}
          numberLabel={strings.numberLabel}
          numberPlaceholder={strings.numberPlaceholder}
          numberHint={strings.numberHint}
          showImageField={isImageEndpoint}
          imageUrlLabel={strings.imageUrlLabel}
          imageUrlPlaceholder={strings.imageUrlPlaceholder}
          imageUrlHint={strings.imageUrlHint}
          imageUrl={imageUrl}
          onImageUrlChange={setImageUrl}
          showDocumentField={isDocumentEndpoint}
          documentUrlLabel={strings.documentUrlLabel}
          documentUrlPlaceholder={strings.documentUrlPlaceholder}
          documentUrlHint={strings.documentUrlHint}
          documentUrl={documentUrl}
          onDocumentUrlChange={setDocumentUrl}
          fileNameLabel={strings.fileNameLabel}
          fileNamePlaceholder={strings.fileNamePlaceholder}
          fileNameHint={strings.fileNameHint}
          fileName={fileName}
          onFileNameChange={setFileName}
          textLabel={strings.textLabel}
          textPlaceholder={strings.textPlaceholder}
          textHint={strings.textHint}
          sendLabel={strings.sendLabel}
          sendingLabel={strings.sendingLabel}
          isSending={requestSending}
          fieldSummary={fieldSummary}
          responseTitle={strings.responseTitle}
          responseDescription={strings.responseDescription}
          curlTitle={strings.curlTitle}
          curlDescription={strings.curlDescription}
          copyUrlLabel={strings.copyUrlLabel}
          copiedUrlLabel={strings.copiedUrlLabel}
          copyLabel={strings.copyLabel}
          copiedLabel={strings.copiedLabel}
          authInstanceId={instanceId}
          authToken={token}
          onAuthInstanceIdChange={setInstanceId}
          responseBodyJson={responseBodyJson}
          remoteJid={remoteJid}
          messageText={messageText}
          onRemoteJidChange={setRemoteJid}
          onMessageTextChange={setMessageText}
          onSendClick={sendPreview}
          copiedKey={copiedKey}
          onCopy={copyToClipboard}
        />
      </div>

      {authOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4 py-6">
          <div className="w-full max-w-2xl rounded-[24px] border border-slate-200 bg-white p-5 shadow-2xl dark:border-slate-800 dark:bg-slate-900">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900 dark:text-white">{strings.modalTitle}</h2>
                <p className="mt-1 text-xs text-slate-400">{strings.modalDescription}</p>
              </div>
              <button
                type="button"
                onClick={() => setAuthOpen(false)}
                className="rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                {strings.close}
              </button>
            </div>

            <div className="mt-4 grid gap-4 md:grid-cols-1">
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{strings.instanceLabel}</span>
                <input
                  value={instanceId}
                  onChange={e => setInstanceId(e.target.value)}
                  placeholder={strings.instancePlaceholder}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{strings.tokenLabel}</span>
                <input
                  value={token}
                  onChange={e => setToken(e.target.value)}
                  placeholder={strings.tokenPlaceholder}
                  className="h-11 w-full rounded-xl border border-slate-200 bg-slate-50 px-3 text-sm outline-none transition focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                />
              </label>
            </div>

            <div className="mt-5 flex justify-end gap-3">
              <button
                type="button"
                onClick={resetDraft}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
              >
                {strings.reset}
              </button>
              <button
                type="button"
                onClick={() => {
                  saveDraft();
                  setAuthOpen(false);
                }}
                className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                {strings.save}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
