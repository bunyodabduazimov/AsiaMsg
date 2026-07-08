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
  numberLabel: string;
  numberPlaceholder: string;
  numberHint: string;
  showImageField?: boolean;
  imageUrlLabel?: string;
  imageUrlPlaceholder?: string;
  imageUrlHint?: string;
  imageUrl?: string;
  onImageUrlChange?: (value: string) => void;
  textLabel: string;
  textPlaceholder: string;
  textHint: string;
  sendLabel: string;
  fieldSummary: string;
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
  remoteJid: string;
  messageText: string;
  responseBodyJson?: string | null;
  onRemoteJidChange: (value: string) => void;
  onMessageTextChange: (value: string) => void;
  onSendClick: () => void;
  copiedKey: string | null;
  onCopy: (text: string, key: string) => void;
};

export const ApiEndpointDetails: React.FC<Props> = ({
  endpoint,
  apiBaseUrl,
  requestTitle,
  requestDescription,
  numberLabel,
  numberPlaceholder,
  numberHint,
  showImageField,
  imageUrlLabel,
  imageUrlPlaceholder,
  imageUrlHint,
  imageUrl,
  onImageUrlChange,
  textLabel,
  textPlaceholder,
  textHint,
  sendLabel,
  fieldSummary,
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
  remoteJid,
  messageText,
  responseBodyJson,
  onRemoteJidChange,
  onMessageTextChange,
  onSendClick,
  copiedKey,
  onCopy
}) => {
  const url = `${apiBaseUrl}${endpoint.backendPath}`;
  const isImage = endpoint.id === 'messages-image';
  const body = isImage
    ? {
        instanceId: authInstanceId || 'YOUR_INSTANCE_ID',
        remoteJid: remoteJid || '+992922772244',
        imageUrl: imageUrl || 'https://example.com/image.jpg',
        messageText: messageText || 'Hello, this is a test caption from AsiaMsg API Docs.',
        messageType: 'image'
      }
    : {
        instanceId: authInstanceId || 'YOUR_INSTANCE_ID',
        remoteJid: remoteJid || '+992922772244',
        messageText: messageText || 'Hello, this is a test message from AsiaMsg API Docs.',
        messageType: 'text'
      };
  const curlPayload = JSON.stringify(
    body,
    null,
    2
  );
  const curlRequest = `curl --location --request POST '${url}' \\
--header 'Authorization: Bearer ${authToken || 'YOUR_TOKEN'}' \\
--header 'Content-Type: application/json' \\
--data-raw '${curlPayload}'`;
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
              numberLabel={numberLabel}
              numberPlaceholder={numberPlaceholder}
              numberHint={numberHint}
              showImageField={showImageField}
              imageLabel={imageUrlLabel}
              imagePlaceholder={imageUrlPlaceholder}
              imageHint={imageUrlHint}
              imageUrl={imageUrl}
              onImageUrlChange={onImageUrlChange}
              textLabel={textLabel}
              textPlaceholder={textPlaceholder}
              textHint={textHint}
              sendLabel={sendLabel}
              fieldSummary={fieldSummary}
              remoteJid={remoteJid}
              messageText={messageText}
              onRemoteJidChange={onRemoteJidChange}
              onMessageTextChange={onMessageTextChange}
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
