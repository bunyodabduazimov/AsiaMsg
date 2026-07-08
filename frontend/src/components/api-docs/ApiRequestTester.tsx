import React from 'react';

type Props = {
  numberLabel: string;
  numberPlaceholder: string;
  numberHint: string;
  showImageField?: boolean;
  imageLabel?: string;
  imagePlaceholder?: string;
  imageHint?: string;
  imageUrl?: string;
  onImageUrlChange?: (value: string) => void;
  textLabel: string;
  textPlaceholder: string;
  textHint: string;
  sendLabel: string;
  fieldSummary: string;
  remoteJid: string;
  messageText: string;
  onRemoteJidChange: (value: string) => void;
  onMessageTextChange: (value: string) => void;
  onSendClick: () => void;
};

export const ApiRequestTester: React.FC<Props> = ({
  numberLabel,
  numberPlaceholder,
  numberHint,
  showImageField,
  imageLabel,
  imagePlaceholder,
  imageHint,
  imageUrl,
  onImageUrlChange,
  textLabel,
  textPlaceholder,
  textHint,
  sendLabel,
  fieldSummary,
  remoteJid,
  messageText,
  onRemoteJidChange,
  onMessageTextChange,
  onSendClick
}) => {
  return (
    <section className="rounded-[18px] border border-slate-200/80 bg-white p-5 shadow-[0_12px_40px_rgba(15,23,42,0.06)] dark:border-slate-800 dark:bg-slate-900">
      <div className="space-y-4">
        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{numberLabel}</span>
          <input
            value={remoteJid}
            onChange={e => onRemoteJidChange(e.target.value)}
            placeholder={numberPlaceholder}
            className="h-11 w-full rounded-md border border-slate-300 bg-slate-50 px-3 text-sm outline-none transition focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
          />
          <div className="text-xs text-slate-400">{numberHint}</div>
        </label>

        {showImageField ? (
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{imageLabel}</span>
            <input
              value={imageUrl ?? ''}
              onChange={e => onImageUrlChange?.(e.target.value)}
              placeholder={imagePlaceholder}
              className="h-11 w-full rounded-md border border-slate-300 bg-slate-50 px-3 text-sm outline-none transition focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />
            <div className="text-xs text-slate-400">{imageHint}</div>
          </label>
        ) : null}

        <label className="block space-y-2">
          <span className="text-sm font-medium text-slate-700 dark:text-slate-200">{textLabel}</span>
          <textarea
            value={messageText}
            onChange={e => onMessageTextChange(e.target.value)}
            rows={4}
            placeholder={textPlaceholder}
            className="w-full rounded-md border border-slate-300 bg-slate-50 px-3 py-3 text-sm outline-none transition focus:border-blue-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
          />
          <div className="text-xs text-slate-400">{textHint}</div>
        </label>

        <button
          type="button"
          onClick={onSendClick}
          className="inline-flex h-11 items-center justify-center rounded-md bg-blue-600 px-5 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          {sendLabel}
        </button>

        <div className="pt-1 text-xs text-slate-400">{fieldSummary}</div>
      </div>
    </section>
  );
};
