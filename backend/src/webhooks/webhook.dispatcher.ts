import { Prisma, type Message } from '@prisma/client';
import { prisma } from '../database';

type WebhookSettings = {
  webhookUrl: string | null;
  webhookSecret: string | null;
  webhookRetryCount?: number | null;
  webhookOnReceived?: boolean | null;
  webhookOnCreate?: boolean | null;
  webhookOnAck?: boolean | null;
  webhookDownloadMedia?: boolean | null;
  webhookOnReaction?: boolean | null;
};

type DispatchMessageCreateInput = {
  message: Message;
  settings: WebhookSettings | null;
};

type WebhookPayload = {
  event: string;
  instanceId: string;
  messageId: string | null;
  timestamp: string;
  data: {
    id: string;
    direction: string;
    remoteJid: string;
    status: string | null;
    sentAt: string | null;
    payload: Prisma.InputJsonValue;
  };
};

type WebhookDeliveryResult = {
  statusCode: number | null;
  responseBody: Prisma.InputJsonValue | null;
  errorMessage: string | null;
};

type WebhookMessagePayload = {
  id: string;
  direction: 'inbound' | 'outbound';
  remoteJid: string;
  status: string | null;
  sentAt: string | null;
  payload: Prisma.InputJsonValue;
};

class WebhookDispatcher {
  async dispatchMessageCreate({ message, settings }: DispatchMessageCreateInput) {
    if (!settings?.webhookUrl || !settings.webhookOnCreate) {
      return;
    }

    const requestBody: WebhookPayload = {
      event: 'message.created',
      instanceId: message.instanceId,
      messageId: message.messageId,
      timestamp: new Date().toISOString(),
      data: this.buildMessageData(message)
    };

    await this.deliver({
      instanceId: message.instanceId,
      eventType: requestBody.event,
      targetUrl: settings.webhookUrl,
      retryCount: settings.webhookRetryCount ?? 0,
      secret: settings.webhookSecret,
      requestBody
    });
  }

  async dispatchTestWebhook(input: {
    instanceId: string;
    settings: WebhookSettings | null;
    payload?: Prisma.InputJsonValue;
  }) {
    if (!input.settings?.webhookUrl) {
      return {
        statusCode: null,
        responseBody: null,
        errorMessage: 'Webhook URL is not configured'
      } satisfies WebhookDeliveryResult;
    }

    const requestBody: WebhookPayload = {
      event: 'webhook.test',
      instanceId: input.instanceId,
      messageId: null,
      timestamp: new Date().toISOString(),
      data: {
        id: `test-${input.instanceId}`,
        direction: 'outbound',
        remoteJid: input.instanceId,
        status: 'test',
        sentAt: new Date().toISOString(),
        payload: input.payload ?? {
          message: 'AsiaMsg webhook test'
        }
      }
    };

    return this.deliver({
      instanceId: input.instanceId,
      eventType: requestBody.event,
      targetUrl: input.settings.webhookUrl,
      retryCount: input.settings.webhookRetryCount ?? 0,
      secret: input.settings.webhookSecret,
      requestBody
    });
  }

  async dispatchMessageReceived(input: {
    instanceId: string;
    settings: WebhookSettings | null;
    messageId: string | null;
    remoteJid: string;
    sentAt: Date | null;
    payload: Prisma.InputJsonValue;
  }) {
    if (!input.settings?.webhookUrl) {
      return;
    }

    const requestBody: WebhookPayload = {
      event: 'message.received',
      instanceId: input.instanceId,
      messageId: input.messageId,
      timestamp: new Date().toISOString(),
      data: {
        id: input.messageId ?? '',
        direction: 'inbound',
        remoteJid: input.remoteJid,
        status: 'received',
        sentAt: input.sentAt?.toISOString() ?? null,
        payload: input.payload
      }
    };

    await this.deliver({
      instanceId: input.instanceId,
      eventType: requestBody.event,
      targetUrl: input.settings.webhookUrl,
      retryCount: input.settings.webhookRetryCount ?? 0,
      secret: input.settings.webhookSecret,
      requestBody
    });
  }

  async dispatchMessageAck(input: {
    instanceId: string;
    settings: WebhookSettings | null;
    messageId: string | null;
    remoteJid: string;
    ack: string | number | null;
    sentAt: Date | null;
    payload: Prisma.InputJsonValue;
  }) {
    if (!input.settings?.webhookUrl || !input.settings.webhookOnAck) {
      return;
    }

    const requestBody: WebhookPayload = {
      event: 'message.ack',
      instanceId: input.instanceId,
      messageId: input.messageId,
      timestamp: new Date().toISOString(),
      data: {
        id: input.messageId ?? '',
        direction: 'outbound',
        remoteJid: input.remoteJid,
        status: input.ack === null ? null : `ack:${input.ack}`,
        sentAt: input.sentAt?.toISOString() ?? null,
        payload: input.payload
      }
    };

    await this.deliver({
      instanceId: input.instanceId,
      eventType: requestBody.event,
      targetUrl: input.settings.webhookUrl,
      retryCount: input.settings.webhookRetryCount ?? 0,
      secret: input.settings.webhookSecret,
      requestBody
    });
  }

  async dispatchMediaDownload(input: {
    instanceId: string;
    settings: WebhookSettings | null;
    messageId: string | null;
    remoteJid: string;
    sentAt: Date | null;
    payload: Prisma.InputJsonValue;
  }) {
    if (!input.settings?.webhookUrl || !input.settings.webhookDownloadMedia) {
      return;
    }

    const requestBody: WebhookPayload = {
      event: 'media.download',
      instanceId: input.instanceId,
      messageId: input.messageId,
      timestamp: new Date().toISOString(),
      data: {
        id: input.messageId ?? '',
        direction: 'inbound',
        remoteJid: input.remoteJid,
        status: 'downloaded',
        sentAt: input.sentAt?.toISOString() ?? null,
        payload: input.payload
      }
    };

    await this.deliver({
      instanceId: input.instanceId,
      eventType: requestBody.event,
      targetUrl: input.settings.webhookUrl,
      retryCount: input.settings.webhookRetryCount ?? 0,
      secret: input.settings.webhookSecret,
      requestBody
    });
  }

  async dispatchMessageReaction(input: {
    instanceId: string;
    settings: WebhookSettings | null;
    messageId: string | null;
    remoteJid: string;
    reaction: string | null;
    sentAt: Date | null;
    payload: Prisma.InputJsonValue;
  }) {
    if (!input.settings?.webhookUrl || !input.settings.webhookOnReaction) {
      return;
    }

    const requestBody: WebhookPayload = {
      event: 'message.reaction',
      instanceId: input.instanceId,
      messageId: input.messageId,
      timestamp: new Date().toISOString(),
      data: {
        id: input.messageId ?? '',
        direction: 'outbound',
        remoteJid: input.remoteJid,
        status: input.reaction,
        sentAt: input.sentAt?.toISOString() ?? null,
        payload: input.payload
      }
    };

    await this.deliver({
      instanceId: input.instanceId,
      eventType: requestBody.event,
      targetUrl: input.settings.webhookUrl,
      retryCount: input.settings.webhookRetryCount ?? 0,
      secret: input.settings.webhookSecret,
      requestBody
    });
  }

  private async deliver(input: {
    instanceId: string;
    eventType: string;
    targetUrl: string;
    retryCount: number;
    secret: string | null;
    requestBody: WebhookPayload;
  }): Promise<WebhookDeliveryResult> {
    const maxAttempts = Math.max(1, Math.min(11, input.retryCount + 1));
    let statusCode: number | null = null;
    let responseBody: Prisma.InputJsonValue | null = null;
    let errorMessage: string | null = null;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 10000);

        const response = await fetch(input.targetUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'User-Agent': 'AsiaMsg-Webhook/1.0',
            'X-AsiaMsg-Event': input.eventType,
            ...(input.secret ? { 'X-AsiaMsg-Secret': input.secret } : {})
          },
          body: JSON.stringify(input.requestBody),
          signal: controller.signal
        });

        clearTimeout(timer);
        statusCode = response.status;
        responseBody = await this.parseResponseBody(response);
        errorMessage = response.ok ? null : `Webhook returned HTTP ${response.status}`;

        if (response.ok) {
          break;
        }
      } catch (error) {
        statusCode = null;
        responseBody = null;
        errorMessage = error instanceof Error ? error.message : 'Webhook request failed';
      }

      if (attempt < maxAttempts) {
        await this.delay(Math.min(2000, attempt * 500));
      }
    }

    await prisma.webhookLog.create({
      data: {
        instanceId: input.instanceId,
        eventType: input.eventType,
        targetUrl: input.targetUrl,
        statusCode,
        requestBody: input.requestBody as unknown as Prisma.InputJsonValue,
        responseBody: responseBody ?? Prisma.JsonNull,
        error: errorMessage
      }
    });

    return {
      statusCode,
      responseBody,
      errorMessage
    };
  }

  private buildMessageData(message: Pick<Message, 'id' | 'direction' | 'remoteJid' | 'status' | 'sentAt' | 'payload'>): WebhookMessagePayload {
    return {
      id: message.id,
      direction: message.direction as 'inbound' | 'outbound',
      remoteJid: message.remoteJid,
      status: message.status,
      sentAt: message.sentAt?.toISOString() ?? null,
      payload: message.payload as Prisma.InputJsonValue
    };
  }

  private async parseResponseBody(response: Response): Promise<Prisma.InputJsonValue | null> {
    const text = await response.text();
    if (!text) return null;

    try {
      return JSON.parse(text) as Prisma.InputJsonValue;
    } catch {
      return { text };
    }
  }

  private delay(ms: number) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

export const webhookDispatcher = new WebhookDispatcher();
