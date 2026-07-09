import React from 'react';
import { Copy } from 'lucide-react';
import { MethodBadge } from './MethodBadge';
import { ApiRequestTester } from './ApiRequestTester';
import type { LocalizedApiDocsEndpoint } from './apiDocsData';

type Props = {
  endpoint: LocalizedApiDocsEndpoint;
  apiBaseUrl: string;
  requestTitle: string;
  requestDescription: string;
  instances: Array<{
    id: string;
    name: string;
    number: string;
  }>;
  selectedInstanceId: string;
  instanceSelectLabel: string;
  instanceSelectPlaceholder: string;
  sendLabel: string;
  sendingLabel: string;
  isSending: boolean;
  responseTitle: string;
  responseDescription: string;
  copyUrlLabel: string;
  copiedUrlLabel: string;
  copyLabel: string;
  copiedLabel: string;
  curlTitle: string;
  curlDescription: string;
  authInstanceId: string;
  authToken: string;
  values: Record<string, string>;
  onFieldChange: (name: string, value: string) => void;
  responseBodyJson?: string | null;
  onSendClick: () => void;
  copiedKey: string | null;
  onCopy: (text: string, key: string) => void;
};

const replacePathParams = (path: string, values: Record<string, string>, fallback = 'YOUR_INSTANCE_ID') =>
  path.replace(/\{(\w+)\}|:(\w+)/g, (_, braceName: string, colonName: string) => {
    const name = braceName || colonName;
    return values[name]?.trim() || fallback;
  });

const buildRequestPayload = (endpoint: LocalizedApiDocsEndpoint, values: Record<string, string>) => {
  const take = (name: string, fallback = '') => values[name]?.trim() || fallback;

  switch (endpoint.id) {
    case 'messages-chat':
      return {
        instanceId: take('instanceId', 'YOUR_INSTANCE_ID'),
        remoteJid: take('remoteJid', '+992922772244'),
        messageText: take('messageText', 'Hello, this is a test message from AsiaMsg API Docs.'),
        messageType: 'text'
      };
    case 'messages-image':
      return {
        instanceId: take('instanceId', 'YOUR_INSTANCE_ID'),
        remoteJid: take('remoteJid', '+992922772244'),
        imageUrl: take('imageUrl', 'https://example.com/image.jpg'),
        messageText: take('messageText', 'Hello, this is a test image caption.'),
        messageType: 'image'
      };
    case 'messages-sticker':
      return {
        instanceId: take('instanceId', 'YOUR_INSTANCE_ID'),
        remoteJid: take('remoteJid', '+992922772244'),
        stickerUrl: take('stickerUrl', 'https://example.com/sticker.webp')
      };
    case 'messages-document':
      return {
        instanceId: take('instanceId', 'YOUR_INSTANCE_ID'),
        remoteJid: take('remoteJid', '+992922772244'),
        documentUrl: take('documentUrl', 'https://example.com/invoice.pdf'),
        fileName: take('fileName', 'invoice.pdf'),
        messageText: take('messageText', 'Invoice attached'),
        messageType: 'document'
      };
    case 'messages-audio':
      return {
        instanceId: take('instanceId', 'YOUR_INSTANCE_ID'),
        remoteJid: take('remoteJid', '+992922772244'),
        audioUrl: take('audioUrl', 'https://example.com/audio.mp3')
      };
    case 'messages-voice':
      return {
        instanceId: take('instanceId', 'YOUR_INSTANCE_ID'),
        remoteJid: take('remoteJid', '+992922772244'),
        voiceUrl: take('voiceUrl', 'https://example.com/voice.ogg')
      };
    case 'messages-video':
      return {
        instanceId: take('instanceId', 'YOUR_INSTANCE_ID'),
        remoteJid: take('remoteJid', '+992922772244'),
        videoUrl: take('videoUrl', 'https://example.com/video.mp4')
      };
    case 'messages-contact':
      return {
        instanceId: take('instanceId', 'YOUR_INSTANCE_ID'),
        remoteJid: take('remoteJid', '+992922772244'),
        name: take('name', 'John Doe'),
        phoneNumber: take('phoneNumber', '+992922772244')
      };
    case 'messages-location':
      return {
        instanceId: take('instanceId', 'YOUR_INSTANCE_ID'),
        remoteJid: take('remoteJid', '+992922772244'),
        latitude: take('latitude', '38.5598'),
        longitude: take('longitude', '68.7870')
      };
    case 'messages-vcard':
      return {
        instanceId: take('instanceId', 'YOUR_INSTANCE_ID'),
        remoteJid: take('remoteJid', '+992922772244'),
        vcard: take('vcard', 'BEGIN:VCARD...')
      };
    case 'messages-reaction':
      return {
        instanceId: take('instanceId', 'YOUR_INSTANCE_ID'),
        remoteJid: take('remoteJid', '+992922772244'),
        messageId: take('messageId', 'BAE5A1A1F...'),
        emoji: take('emoji', '👍')
      };
    case 'messages-delete':
      return {
        instanceId: take('instanceId', 'YOUR_INSTANCE_ID'),
        remoteJid: take('remoteJid', '+992922772244'),
        messageId: take('messageId', 'BAE5A1A1F...')
      };
    case 'messages-resend-status':
      return {
        instanceId: take('instanceId', 'YOUR_INSTANCE_ID'),
        status: take('status', 'failed')
      };
    case 'messages-resend-id':
      return {
        instanceId: take('instanceId', 'YOUR_INSTANCE_ID'),
        messageId: take('messageId', 'BAE5A1A1F...')
      };
    case 'messages-clear':
      return {
        instanceId: take('instanceId', 'YOUR_INSTANCE_ID')
      };
    case 'messages-list':
    case 'messages-statistics':
      return {
        instanceId: take('instanceId', 'YOUR_INSTANCE_ID')
      };
    case 'instance-logout':
    case 'instance-restart':
    case 'instance-clear':
    case 'instance-status':
    case 'instance-qr':
    case 'instance-qrcode':
    case 'instance-me':
    case 'instance-settings':
      return {
        instanceId: take('instanceId', 'YOUR_INSTANCE_ID')
      };
    case 'instance-settings-update': {
      const payload: Record<string, unknown> = {
        instanceId: take('instanceId', 'YOUR_INSTANCE_ID')
      };
      const webhookUrl = take('webhookUrl', '');
      if (webhookUrl) payload.webhookUrl = webhookUrl;
      const webhookSecret = take('webhookSecret', '');
      if (webhookSecret) payload.webhookSecret = webhookSecret;
      const webhookRetryCount = take('webhookRetryCount', '');
      if (webhookRetryCount) payload.webhookRetryCount = Number(webhookRetryCount);
      const boolFields = ['webhookOnReceived','webhookOnCreate','webhookOnAck','webhookDownloadMedia','webhookOnReaction','autoReconnect','storeIncomingMessages','storeOutgoingMessages'] as const;
      for (const key of boolFields) {
        const val = take(key, '');
        if (val !== '') payload[key] = val === 'true';
      }
      return payload;
    }
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

const buildCurlRequest = (endpoint: LocalizedApiDocsEndpoint, apiBaseUrl: string, authToken: string, values: Record<string, string>) => {
  const url = `${apiBaseUrl}${replacePathParams(endpoint.backendPath, values)}`;
  const payload = buildRequestPayload(endpoint, values);
  const apiKey = authToken || 'asm_YOUR_INSTANCE_ID_YOUR_API_KEY';

  if (endpoint.method === 'GET') {
    const query = new URLSearchParams();
    Object.entries(payload).forEach(([key, value]) => {
      if (value) query.set(key, String(value));
    });
    const queryString = query.toString();
    const finalUrl = queryString ? `${url}?${queryString}` : url;

    return `curl --location --request GET '${finalUrl}' \\\n--header 'X-API-Key: ${apiKey}'`;
  }

  return `curl --location --request POST '${url}' \\\n--header 'X-API-Key: ${apiKey}' \\\n--header 'Content-Type: application/json' \\\n--data-raw '${JSON.stringify(payload, null, 2)}'`;
};

export const ApiEndpointDetails: React.FC<Props> = ({
  endpoint,
  apiBaseUrl,
  requestTitle,
  requestDescription,
  instances,
  selectedInstanceId,
  instanceSelectLabel,
  instanceSelectPlaceholder,
  sendLabel,
  sendingLabel,
  isSending,
  responseTitle,
  responseDescription,
  copyUrlLabel,
  copiedUrlLabel,
  copyLabel,
  copiedLabel,
  curlTitle,
  curlDescription,
  authInstanceId,
  authToken,
  values,
  onFieldChange,
  responseBodyJson,
  onSendClick,
  copiedKey,
  onCopy
}) => {
  const url = `${apiBaseUrl}${replacePathParams(endpoint.backendPath, values, authInstanceId || 'YOUR_INSTANCE_ID')}`;
  const curlRequest = buildCurlRequest(endpoint, apiBaseUrl, authToken, values);
  const responseJson = responseBodyJson ?? JSON.stringify(endpoint.response, null, 2);

  return (
    <div className="min-w-0 space-y-5">
      <section className="rounded-[24px] border border-slate-200/80 bg-white p-5 shadow-[0_18px_60px_rgba(15,23,42,0.06)] dark:border-slate-800 dark:bg-slate-900">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <MethodBadge method={endpoint.method} className="px-2.5 py-1 text-[11px]" />
          <span className="font-mono text-slate-500 dark:text-slate-400">{endpoint.path}</span>

          <button
            type="button"
            onClick={() => onCopy(url, `url-${endpoint.id}`)}
            className="ml-auto inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
          >
            <Copy className="h-3.5 w-3.5" />
            {copiedKey === `url-${endpoint.id}` ? copiedUrlLabel : copyUrlLabel}
          </button>
        </div>

        <div className="mt-1 space-y-2">
          <p className="max-w-3xl text-sm text-slate-500 dark:text-slate-400">{endpoint.description}</p>
        </div>
      </section>

      <section className="rounded-[24px] border border-slate-200/80 bg-white p-5 shadow-[0_18px_60px_rgba(15,23,42,0.06)] dark:border-slate-800 dark:bg-slate-900">
        <div className="grid gap-5 lg:grid-cols-2">
          <section className="rounded-[20px] border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
            <div className="mb-4">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">{requestTitle}</h3>
              <p className="mt-1 text-xs text-slate-400">{requestDescription}</p>
            </div>
            <ApiRequestTester
              fields={endpoint.fields}
              instances={instances}
              values={values}
              selectedInstanceId={selectedInstanceId}
              onFieldChange={onFieldChange}
              onInstanceChange={value => onFieldChange('instanceId', value)}
              instanceSelectLabel={instanceSelectLabel}
              instanceSelectPlaceholder={instanceSelectPlaceholder}
              sendLabel={sendLabel}
              sendingLabel={sendingLabel}
              isSending={isSending}
              onSendClick={onSendClick}
            />
          </section>

          <section className="rounded-[20px] border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
            <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-4 dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">{curlTitle}</h3>
                  <p className="mt-1 text-xs text-slate-400">{curlDescription}</p>
                </div>
                <button
                  type="button"
                  onClick={() => onCopy(curlRequest, `curl-${endpoint.id}`)}
                  className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  <Copy className="h-3.5 w-3.5" />
                  {copiedKey === `curl-${endpoint.id}` ? copiedLabel : copyLabel}
                </button>
              </div>
              <pre className="mt-3 overflow-x-auto rounded-2xl bg-slate-950 p-4 text-xs leading-6 text-amber-300">{curlRequest}</pre>
            </div>

            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white">{responseTitle}</h3>
                <p className="mt-1 text-xs text-slate-400">{responseDescription}</p>
              </div>
              <button
                type="button"
                onClick={() => onCopy(responseJson, `response-${endpoint.id}`)}
                className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <Copy className="h-3.5 w-3.5" />
                {copiedKey === `response-${endpoint.id}` ? copiedLabel : copyLabel}
              </button>
            </div>
            <pre className="mt-4 overflow-x-auto rounded-2xl bg-slate-950 p-4 text-xs leading-6 text-cyan-200">{responseJson}</pre>
          </section>
        </div>
      </section>
    </div>
  );
};
