import React from 'react';
import { Copy } from 'lucide-react';
import { MethodBadge } from './MethodBadge';
import { ApiRequestTester } from './ApiRequestTester';
import type { LocalizedApiDocsEndpoint } from './apiDocsData';

type Props = {
  endpoint: LocalizedApiDocsEndpoint;
  apiBaseUrl: string;
  isRu: boolean;
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
  showDocumentField?: boolean;
  documentUrlLabel?: string;
  documentUrlPlaceholder?: string;
  documentUrlHint?: string;
  documentUrl?: string;
  onDocumentUrlChange?: (value: string) => void;
  fileNameLabel?: string;
  fileNamePlaceholder?: string;
  fileNameHint?: string;
  fileName?: string;
  onFileNameChange?: (value: string) => void;
  textLabel: string;
  textPlaceholder: string;
  textHint: string;
  sendLabel: string;
  sendingLabel: string;
  isSending: boolean;
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
  onAuthInstanceIdChange: (value: string) => void;
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
  isRu,
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
  showDocumentField,
  documentUrlLabel,
  documentUrlPlaceholder,
  documentUrlHint,
  documentUrl,
  onDocumentUrlChange,
  fileNameLabel,
  fileNamePlaceholder,
  fileNameHint,
  fileName,
  onFileNameChange,
  textLabel,
  textPlaceholder,
  textHint,
  sendLabel,
  sendingLabel,
  isSending,
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
  onAuthInstanceIdChange,
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
  const isAuthEndpoint = endpoint.groupId === 'auth';
  const isImage = endpoint.id === 'messages-image';
  const isDocument = endpoint.id === 'messages-document';
  const resolvedUrl = url
    .replace('{instanceId}', authInstanceId || 'YOUR_INSTANCE_ID')
    .replace(':instanceId', authInstanceId || 'YOUR_INSTANCE_ID');
  const body = isImage
    ? {
        instanceId: authInstanceId || 'YOUR_INSTANCE_ID',
        remoteJid: remoteJid || '+992922772244',
        imageUrl: imageUrl || 'https://example.com/image.jpg',
        messageText: messageText || 'Hello, this is a test caption from AsiaMsg API Docs.',
        messageType: 'image'
      }
    : isDocument
      ? {
          instanceId: authInstanceId || 'YOUR_INSTANCE_ID',
          remoteJid: remoteJid || '+992922772244',
          documentUrl: documentUrl || 'https://example.com/invoice.pdf',
          fileName: fileName || 'invoice.pdf',
          messageText: messageText || 'Hello, this is a test document from AsiaMsg API Docs.',
          messageType: 'document'
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
  const curlRequest = isAuthEndpoint
    ? `curl --location --request ${endpoint.method} '${resolvedUrl}' \\
--header 'Authorization: Bearer ${authToken || 'YOUR_TOKEN'}'`
    : `curl --location --request POST '${url}' \\
--header 'Authorization: Bearer ${authToken || 'YOUR_TOKEN'}' \\
--header 'Content-Type: application/json' \\
--data-raw '${curlPayload}'`;
  const responseJson = responseBodyJson ?? JSON.stringify(endpoint.response, null, 2);

  if (isAuthEndpoint) {
    return (
      <div className="min-w-0 space-y-5">
        <section className="rounded-[24px] border border-slate-200/80 bg-white p-5 shadow-[0_18px_60px_rgba(15,23,42,0.06)] dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <MethodBadge method={endpoint.method} className="px-2.5 py-1 text-[11px]" />
            <span className="font-mono text-slate-500 dark:text-slate-400">{endpoint.path}</span>

            <button
              type="button"
              onClick={() => onCopy(resolvedUrl, `url-${endpoint.id}`)}
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
            <section className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {isRu ? 'Запрос' : 'Request'}
              </h3>
              <p className="mt-1 text-xs text-slate-400">
                {isRu ? 'Введите данные и отправьте запрос в backend.' : 'Enter data and send the request to backend.'}
              </p>

              <div className="mt-5 space-y-4">
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Instance ID</span>
                  <input
                    value={authInstanceId}
                    onChange={e => onAuthInstanceIdChange(e.target.value)}
                    placeholder="cmrbnksr60002u20sn3uch0z5"
                    className="h-11 w-full rounded-md border border-slate-300 bg-white px-3 text-sm outline-none transition focus:border-blue-500 dark:border-slate-700 dark:bg-slate-900 dark:text-white"
                  />
                  <div className="text-xs text-slate-400">instanceId * string</div>
                </label>

                <button
                  type="button"
                  onClick={onSendClick}
                  disabled={isSending}
                  className="inline-flex h-11 items-center justify-center rounded-md bg-blue-600 px-5 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSending ? sendingLabel : sendLabel}
                </button>
              </div>
            </section>

            <div className="space-y-4">
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                      {isRu ? 'Пример запроса' : 'Request example'}
                    </h3>
                    <p className="mt-1 text-xs text-slate-400">
                      {isRu ? 'Используйте Instance ID в пути и Bearer Token в заголовке.' : 'Use Instance ID in path and Bearer Token in header.'}
                    </p>
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

              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
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
              </div>
            </div>
          </div>
        </section>
      </div>
    );
  }

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
              showDocumentField={showDocumentField}
              documentUrlLabel={documentUrlLabel}
              documentUrlPlaceholder={documentUrlPlaceholder}
              documentUrlHint={documentUrlHint}
              documentUrl={documentUrl}
              onDocumentUrlChange={onDocumentUrlChange}
              fileNameLabel={fileNameLabel}
              fileNamePlaceholder={fileNamePlaceholder}
              fileNameHint={fileNameHint}
              fileName={fileName}
              onFileNameChange={onFileNameChange}
              textLabel={textLabel}
              textPlaceholder={textPlaceholder}
              textHint={textHint}
              sendLabel={sendLabel}
              sendingLabel={sendingLabel}
              isSending={isSending}
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
