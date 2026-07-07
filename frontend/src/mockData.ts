import { Instance, Message, ApiToken, Webhook, LogEntry, AppState } from './types';

export const initialInstances: Instance[] = [
  {
    id: 'inst-01',
    name: 'Sales Bot',
    number: '+7 999 123-45-67',
    provider: 'Baileys',
    status: 'Connected',
    lastActive: '1 мин. назад',
    messagesToday: 200,
    qrCode: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=300&h=300&fit=crop',
    webhookUrl: 'https://api.example.com/webhook/crm',
    createdDate: '12.05.2025 14:22:10'
  },
  {
    id: 'inst-02',
    name: 'Support Line',
    number: '+62 812 3456 7890',
    provider: 'Baileys',
    status: 'Waiting QR',
    lastActive: '5 мин. назад',
    messagesToday: 28,
    qrCode: 'https://upload.wikimedia.org/wikipedia/commons/d/d0/QR_code_for_mobile_English_Wikipedia.svg',
    webhookUrl: 'https://api.example.com/webhook/support',
    createdDate: '10.05.2025 09:12:15'
  },
  {
    id: 'inst-03',
    name: 'Notifications',
    number: '+91 98765 43210',
    provider: 'Baileys',
    status: 'Connected',
    lastActive: '2 мин. назад',
    messagesToday: 156,
    qrCode: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=300&h=300&fit=crop',
    webhookUrl: 'https://api.example.com/webhook/alerts',
    createdDate: '08.05.2025 18:35:40'
  },
  {
    id: 'inst-04',
    name: 'Marketing',
    number: '+66 81 234 5678',
    provider: 'Baileys',
    status: 'Disconnected',
    lastActive: '15 мин. назад',
    messagesToday: 0,
    qrCode: '',
    webhookUrl: 'https://api.example.com/webhook/marketing',
    createdDate: '05.05.2025 11:24:02'
  },
  {
    id: 'inst-05',
    name: 'Sales Bot 2',
    number: '+65 9123 4567',
    provider: 'Baileys',
    status: 'Reconnecting',
    lastActive: '1 мин. назад',
    messagesToday: 12,
    qrCode: '',
    webhookUrl: 'https://api.example.com/webhook/crm2',
    createdDate: '15.05.2025 16:45:00'
  },
  {
    id: 'inst-06',
    name: 'Customer Care',
    number: '+62 812 9876 5432',
    provider: 'Baileys',
    status: 'Connected',
    lastActive: '3 мин. назад',
    messagesToday: 89,
    qrCode: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?w=300&h=300&fit=crop',
    webhookUrl: 'https://api.example.com/webhook/care',
    createdDate: '11.05.2025 10:11:12'
  },
  {
    id: 'inst-07',
    name: 'Promo Alerts',
    number: '+7 900 111-22-33',
    provider: 'Baileys',
    status: 'Waiting QR',
    lastActive: '7 мин. назад',
    messagesToday: 0,
    qrCode: 'https://upload.wikimedia.org/wikipedia/commons/d/d0/QR_code_for_mobile_English_Wikipedia.svg',
    webhookUrl: 'https://api.example.com/webhook/promo',
    createdDate: '09.05.2025 12:44:00'
  },
  {
    id: 'inst-08',
    name: 'HR Desk',
    number: '+66 91 234 5670',
    provider: 'Baileys',
    status: 'Disconnected',
    lastActive: '1 ч. назад',
    messagesToday: 0,
    qrCode: '',
    webhookUrl: 'https://api.example.com/webhook/hr',
    createdDate: '01.05.2025 14:15:30'
  }
];

export const initialMessages: Message[] = [
  {
    id: 'msg-01',
    number: '+7 999 123-45-67',
    instance: 'Sales Bot',
    type: 'Исходящее',
    status: 'Доставлено',
    time: '18.05.2025 14:21:10',
    messageText: 'Здравствуйте! Спасибо за интерес к нашему продукту. Чем можем помочь?',
    details: 'Успешно отправлено через инстанс Sales Bot',
    statusHistory: [
      { status: 'Создано', time: '18.05.2025 14:20:58' },
      { status: 'Отправлено', time: '18.05.2025 14:21:00' },
      { status: 'Доставлено', time: '18.05.2025 14:21:10' }
    ]
  },
  {
    id: 'msg-02',
    number: '+7 981 765-43-21',
    instance: 'Support Line',
    type: 'Входящее',
    status: 'Отправлено',
    time: '18.05.2025 14:19:32',
    messageText: 'Здравствуйте! Хотел бы узнать о тарифах.',
    details: 'Входящее сообщение получено на инстанс Support Line',
    statusHistory: [
      { status: 'Получено системой', time: '18.05.2025 14:19:32' }
    ]
  },
  {
    id: 'msg-03',
    number: '+7 495 123-98-76',
    instance: 'Marketing',
    type: 'Исходящее',
    status: 'Доставлено',
    time: '18.05.2025 14:18:45',
    messageText: 'Конечно! У нас есть 3 тарифа: \n• Starter – для небольших команд \n• Business – для растущих компаний \n• Enterprise – для крупных бизнесов\nКакой формат вам подходит?',
    details: 'Доставлено до адресата',
    statusHistory: [
      { status: 'Создано', time: '18.05.2025 14:18:35' },
      { status: 'Отправлено', time: '18.05.2025 14:18:40' },
      { status: 'Доставлено', time: '18.05.2025 14:18:45' }
    ]
  },
  {
    id: 'msg-04',
    number: '+7 926 555-12-34',
    instance: 'Notifications',
    type: 'Исходящее',
    status: 'Ошибка',
    time: '18.05.2025 14:17:03',
    messageText: 'Внимание: ваш тестовый период подходит к концу. Продлите подписку.',
    details: 'Ошибка: инстанс отключен или отсутствует интернет-соединение на телефоне',
    statusHistory: [
      { status: 'Создано', time: '18.05.2025 14:16:50' },
      { status: 'Попытка отправки', time: '18.05.2025 14:16:55' },
      { status: 'Ошибка', time: '18.05.2025 14:17:03' }
    ]
  },
  {
    id: 'msg-05',
    number: '+7 903 111-22-33',
    instance: 'Sales Bot',
    type: 'Входящее',
    status: 'Доставлено',
    time: '18.05.2025 14:16:22',
    messageText: 'Интересует тариф Business. Можно получить счет для юрлица?',
    details: 'Входящее сообщение, успешно передано в CRM по webhook',
    statusHistory: [
      { status: 'Получено', time: '18.05.2025 14:16:22' }
    ]
  },
  {
    id: 'msg-06',
    number: '+7 917 654-32-10',
    instance: 'Support Line',
    type: 'Исходящее',
    status: 'В очереди',
    time: '18.05.2025 14:15:11',
    messageText: 'Высылаем вам реквизиты для оплаты. Ожидайте.',
    details: 'Сообщение поставлено в очередь на отправку из-за лимитов частоты',
    statusHistory: [
      { status: 'Создано', time: '18.05.2025 14:15:11' },
      { status: 'В очереди', time: '18.05.2025 14:15:11' }
    ]
  },
  {
    id: 'msg-07',
    number: '+7 999 888-77-66',
    instance: 'Marketing',
    type: 'Исходящее',
    status: 'Доставлено',
    time: '18.05.2025 14:13:55',
    messageText: 'Промокод на скидку 15%: ASIAMSG2025',
    details: 'Успешная доставка',
    statusHistory: [
      { status: 'Создано', time: '18.05.2025 14:13:50' },
      { status: 'Доставлено', time: '18.05.2025 14:13:55' }
    ]
  },
  {
    id: 'msg-08',
    number: '+7 984 321-09-87',
    instance: 'Notifications',
    type: 'Входящее',
    status: 'Отправлено',
    time: '18.05.2025 14:12:41',
    messageText: 'Спасибо за информацию!',
    details: 'Входящее сообщение на инстанс',
    statusHistory: [
      { status: 'Получено', time: '18.05.2025 14:12:41' }
    ]
  }
];

export const initialTokens: ApiToken[] = [
  {
    id: 'tok-01',
    name: 'Integration: CRM Sync',
    instance: 'Sales Bot',
    scopes: ['messages:send', 'contacts:read', 'webhooks:write'],
    lastUsed: '18.06.2025 14:21',
    created: '12.06.2025 09:15',
    expires: '12.07.2025',
    status: 'Активен',
    tokenKey: 'amsg_live_58c2a49f82d54a2cb49247bf23d130a7f3',
    messagesCount: 12456,
    webhooksCalled: 1248
  },
  {
    id: 'tok-02',
    name: 'Support System',
    instance: 'Support Line',
    scopes: ['messages:send', 'messages:read'],
    lastUsed: '18.06.2025 11:32',
    created: '01.06.2025 16:40',
    expires: '01.09.2025',
    status: 'Активен',
    tokenKey: 'amsg_live_93d1b827ac83d47fb38210e2010e2',
    messagesCount: 4310,
    webhooksCalled: 54
  },
  {
    id: 'tok-03',
    name: 'Analytics Export',
    instance: 'Marketing',
    scopes: ['reports:read'],
    lastUsed: '17.06.2025 19:05',
    created: '28.05.2025 10:22',
    expires: '28.06.2025',
    status: 'Истекает скоро',
    tokenKey: 'amsg_live_02ba14a78c19a918e9d2b90306d2b9',
    messagesCount: 122,
    webhooksCalled: 0
  },
  {
    id: 'tok-04',
    name: 'Webhook Processor',
    instance: 'Sales Bot 2',
    scopes: ['webhooks:read', 'webhooks:write'],
    lastUsed: '16.06.2025 09:41',
    created: '10.05.2025 14:10',
    expires: '10.08.2025',
    status: 'Активен',
    tokenKey: 'amsg_live_61e2a84fb1a140d29381e9f9c108f9c1',
    messagesCount: 2901,
    webhooksCalled: 295
  },
  {
    id: 'tok-05',
    name: 'Batch Notifications',
    instance: 'Notifications',
    scopes: ['messages:send'],
    lastUsed: '—',
    created: '03.05.2025 12:30',
    expires: '03.07.2025',
    status: 'Активен',
    tokenKey: 'amsg_live_19ca248abefc03018e27c13e810a3e81',
    messagesCount: 0,
    webhooksCalled: 0
  },
  {
    id: 'tok-06',
    name: 'Old Integration',
    instance: 'HR Desk',
    scopes: ['users:read'],
    lastUsed: '—',
    created: '15.04.2025 08:55',
    expires: '15.05.2025',
    status: 'Отозван',
    tokenKey: 'amsg_live_01bcfa3910c2837f19128ca23e0da23e',
    messagesCount: 15482,
    webhooksCalled: 341
  },
  {
    id: 'tok-07',
    name: 'Test Token',
    instance: 'Test Instance',
    scopes: ['messages:send'],
    lastUsed: '10.06.2025 16:05',
    created: '22.04.2025 13:20',
    expires: '22.06.2025',
    status: 'Активен',
    tokenKey: 'amsg_live_09cf38d7c0f1820a23d47bf183bc083bc',
    messagesCount: 15,
    webhooksCalled: 1
  },
  {
    id: 'tok-08',
    name: 'Reporting Service',
    instance: 'Promo Alerts',
    scopes: ['reports:read', 'messages:read'],
    lastUsed: '—',
    created: '18.04.2025 11:45',
    expires: '18.06.2025',
    status: 'Истекает скоро',
    tokenKey: 'amsg_live_72cb0a29efb928f103d18ba3cbb03cbb',
    messagesCount: 0,
    webhooksCalled: 0
  }
];

export const initialWebhooks: Webhook[] = [
  {
    id: 'web-01',
    endpoint: 'CRM Sync',
    endpointUrl: 'https://api.example.com/webhook/crm',
    event: 'message.received',
    method: 'POST',
    status: 'Активен',
    code: 200,
    lastDelivery: '18.05.2025 14:21:10',
    duration: '126 мс',
    secret: 'whsec_7d2f91a82b3d4f10a12e3f45a76b3f7a',
    payload: `{\n  "event": "message.received",\n  "instance_id": "689f0a5b2e1c7d8a1234567",\n  "message": {\n    "id": "wamId.HBgMNTYwODM9...",\n    "from": "+79991245567",\n    "type": "text",\n    "text": { "body": "Привет!" }\n  },\n  "timestamp": 1747560070\n}`
  } as any,
  {
    id: 'web-02',
    endpoint: 'Billing Alerts',
    endpointUrl: 'https://billing.example.com/hook',
    event: 'invoice.paid',
    method: 'POST',
    status: 'Активен',
    code: 200,
    lastDelivery: '18.05.2025 14:18:04',
    duration: '98 мс',
    secret: 'whsec_3bc9d927ab1a238fcd839210e3012a9e',
    payload: `{\n  "event": "invoice.paid",\n  "amount": 2900,\n  "currency": "RUB",\n  "customer_id": "cust_92a7fb",\n  "timestamp": 1747559884\n}`
  } as any,
  {
    id: 'web-03',
    endpoint: 'Lead Events',
    endpointUrl: 'https://leads.example.com/webhook',
    event: 'lead.created',
    method: 'POST',
    status: 'Активен',
    code: 200,
    lastDelivery: '18.05.2025 14:17:33',
    duration: '110 мс',
    secret: 'whsec_92d7fb2ac3189a0b0f71927cb83e10fa',
    payload: `{\n  "event": "lead.created",\n  "name": "Иван Петров",\n  "phone": "+79031112233",\n  "utm_source": "yandex",\n  "timestamp": 1747559853\n}`
  } as any,
  {
    id: 'web-04',
    endpoint: 'Delivery Status',
    endpointUrl: 'https://status.example.com/hook',
    event: 'message.status.updated',
    method: 'POST',
    status: 'Пауза',
    code: 200,
    lastDelivery: '18.05.2025 13:58:21',
    duration: '95 мс',
    secret: 'whsec_01ba83fd8d03c27e8a01fca317da23a1',
    payload: `{\n  "event": "message.status.updated",\n  "message_id": "wamId.A82Cd90b3F...",\n  "status": "delivered",\n  "timestamp": 1747558701\n}`
  } as any,
  {
    id: 'web-05',
    endpoint: 'Error Tracker',
    endpointUrl: 'https://errors.example.com/webhook',
    event: 'error.occurred',
    method: 'POST',
    status: 'Ошибка',
    code: 500,
    lastDelivery: '18.05.2025 14:42:11',
    duration: '412 мс',
    secret: 'whsec_88ccaf238d7fb276fa83e91d0ca73bf1',
    payload: `{\n  "event": "error.occurred",\n  "error_code": 500,\n  "error_message": "Internal Server Error during delivery",\n  "timestamp": 1747561331\n}`
  } as any,
  {
    id: 'web-06',
    endpoint: 'Analytics',
    endpointUrl: 'https://analytics.example.com/webhook',
    event: 'message.delivered',
    method: 'POST',
    status: 'Активен',
    code: 200,
    lastDelivery: '18.05.2025 13:35:05',
    duration: '87 мс',
    secret: 'whsec_02fbc387cd10af1e389b7fae120da349',
    payload: `{\n  "event": "message.delivered",\n  "message_id": "wamId.82d83b9c02",\n  "recipient": "+79998887766",\n  "timestamp": 1747557305\n}`
  } as any,
  {
    id: 'web-07',
    endpoint: 'Custom Integration',
    endpointUrl: 'https://custom.example.com/webhook',
    event: 'customer.updated',
    method: 'POST',
    status: 'Пауза',
    code: 400,
    lastDelivery: '18.05.2025 12:44:59',
    duration: '301 мс',
    secret: 'whsec_18fc92be8d17ca83bf872e39cd19ab40',
    payload: `{\n  "event": "customer.updated",\n  "error": "Bad Request: Missing customer_id",\n  "timestamp": 1747554299\n}`
  } as any,
  {
    id: 'web-08',
    endpoint: 'Internal Monitor',
    endpointUrl: 'https://monitor.example.com/hook',
    event: '* (все события)',
    method: 'POST',
    status: 'Активен',
    code: 200,
    lastDelivery: '18.05.2025 12:36:12',
    duration: '76 мс',
    secret: 'whsec_09fa82cb37fde28ca01e23da826c71be',
    payload: `{\n  "event": "system.status.ok",\n  "system_load": 0.32,\n  "active_sockets": 24,\n  "timestamp": 1747553772\n}`
  } as any
];

export const initialLogs: LogEntry[] = [
  {
    id: 'log-01',
    time: '18.05.2025 14:12:10.123',
    level: 'ERROR',
    module: 'WhatsApp',
    message: 'Отправка сообщения не удалась',
    resource: 'Sales Bot +7 999 123-45-67',
    status: 'Failed',
    requestId: 'req_01JVP3YK9F8M7ZK2A5R1Q8XJ6B',
    ip: '176.59.120.23',
    userAgent: 'AsiaMsg/1.0 (https://asiamsg.com)',
    trace: '01 Error: SendMessage failed: 5xx Server Error\n02   at WhatsAppClient.send (client.js:532:15)\n03   at processTicksAndRejections (node:internal/process/task_queues:95:5)\n04   at async MessageService.sendMessage (message.service.js:128:9)\n05   at async Controller.send (messages.controller.js:45:7)',
    payload: `{\n  "to": "+79881234567",\n  "type": "text",\n  "text": { "body": "Привет!" },\n  "message_id": "wamId.HBgMMjU0N..."\n}`
  },
  {
    id: 'log-02',
    time: '18.05.2025 14:11:58.456',
    level: 'WARNING',
    module: 'Webhook',
    message: 'Повтор доставки webhook',
    resource: 'Sales Bot +7 999 123-45-67',
    status: 'Retrying',
    requestId: 'req_01JVP3YK9F8M7ZK2A5R1Q8XJ6C',
    ip: '176.59.120.23',
    userAgent: 'AsiaMsg/1.0 (https://asiamsg.com)',
    trace: '01 Warning: webhook retry #1 for endpoint CRM Sync\n02   at WebhookService.dispatchWithRetry (webhook.js:210:11)\n03   at processTicksAndRejections (node:internal/process/task_queues:95:5)',
    payload: `{\n  "webhook_id": "web-01",\n  "endpoint": "https://api.example.com/webhook/crm",\n  "retry_attempt": 1\n}`
  },
  {
    id: 'log-03',
    time: '18.05.2025 14:11:47.789',
    level: 'INFO',
    module: 'Auth',
    message: 'Сессия успешно обновлена',
    resource: 'Support Line +62 812 34 56 7890',
    status: 'Success',
    requestId: 'req_01JVP3YK9F8M7ZK2A5R1Q8XJ6D',
    ip: '183.12.98.45',
    userAgent: 'AsiaMsg/1.0 (https://asiamsg.com)',
    payload: `{\n  "session_id": "sess_82d9ab7c0e81",\n  "instance_id": "inst-02",\n  "status": "authenticated"\n}`
  },
  {
    id: 'log-04',
    time: '18.05.2025 14:11:32.315',
    level: 'INFO',
    module: 'Message',
    message: 'Сообщение отправлено',
    resource: 'Sales Bot +7 999 123-45-67',
    status: 'Success',
    requestId: 'req_01JVP3YK9F8M7ZK2A5R1Q8XJ6E',
    ip: '176.59.120.23',
    userAgent: 'AsiaMsg/1.0 (https://asiamsg.com)',
    payload: `{\n  "to": "+79991234567",\n  "text": "Здравствуйте! Спасибо за интерес..."\n}`
  },
  {
    id: 'log-05',
    time: '18.05.2025 14:11:21.001',
    level: 'WARNING',
    module: 'RateLimit',
    message: 'Превышен лимит запросов',
    resource: 'Marketing +66 81 234 5678',
    status: 'Throttled',
    requestId: 'req_01JVP3YK9F8M7ZK2A5R1Q8XJ6F',
    ip: '45.18.23.90',
    userAgent: 'AsiaMsg/1.0 (https://asiamsg.com)',
    payload: `{\n  "ip": "45.18.23.90",\n  "limit_type": "burst_messages_per_minute",\n  "current_count": 121,\n  "limit": 100\n}`
  },
  {
    id: 'log-06',
    time: '18.05.2025 14:10:59.876',
    level: 'CRITICAL',
    module: 'System',
    message: 'Недоступен внешний сервис',
    resource: '—',
    status: 'Down',
    requestId: 'req_01JVP3YK9F8M7ZK2A5R1Q8XJ6G',
    ip: '127.0.0.1',
    userAgent: 'AsiaMsg-Internal/1.0',
    trace: '01 Critical: External API gateway at gateway.asiamsg.net:443 timed out\n02   at HttpGateway.request (gateway.js:82:19)\n03   at async GatewayHealthCheck.run (check.js:15:9)',
    payload: `{\n  "gateway_url": "https://gateway.asiamsg.net/v1",\n  "timeout_ms": 5000,\n  "error": "ETIMEDOUT"\n}`
  },
  {
    id: 'log-07',
    time: '18.05.2025 14:10:42.654',
    level: 'INFO',
    module: 'Webhook',
    message: 'Webhook доставлен',
    resource: 'Marketing +66 81 234 5678',
    status: 'Success',
    requestId: 'req_01JVP3YK9F8M7ZK2A5R1Q8XJ6H',
    ip: '45.18.23.90',
    userAgent: 'AsiaMsg/1.0',
    payload: `{\n  "webhook_id": "web-06",\n  "status": 200,\n  "body_size": 218\n}`
  },
  {
    id: 'log-08',
    time: '18.05.2025 14:10:28.123',
    level: 'INFO',
    module: 'Instance',
    message: 'Инстанс подключен',
    resource: 'Sales Bot 2 +65 9123 4567',
    status: 'Success',
    requestId: 'req_01JVP3YK9F8M7ZK2A5R1Q8XJ6I',
    ip: '92.122.31.54',
    userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
    payload: `{\n  "instance_id": "inst-05",\n  "status": "connected",\n  "connection_time_ms": 1240\n}`
  },
  {
    id: 'log-09',
    time: '18.05.2025 14:10:10.987',
    level: 'WARNING',
    module: 'Session',
    message: 'Истекает срок сессии',
    resource: 'Support Line +62 812 34 56 7890',
    status: 'Retrying', // Expiring maps to retrying or error
    requestId: 'req_01JVP3YK9F8M7ZK2A5R1Q8XJ6J',
    ip: '183.12.98.45',
    userAgent: 'AsiaMsg/1.0',
    payload: `{\n  "instance_id": "inst-02",\n  "time_remaining_seconds": 300\n}`
  },
  {
    id: 'log-10',
    time: '18.05.2025 14:09:52.321',
    level: 'INFO',
    module: 'API',
    message: 'Запрос к API выполнен',
    resource: '—',
    status: 'Success',
    requestId: 'req_01JVP3YK9F8M7ZK2A5R1Q8XJ6K',
    ip: '176.59.120.23',
    userAgent: 'Axios/1.6.0',
    payload: `{\n  "endpoint": "/v1/messages/send",\n  "method": "POST",\n  "response_status": 200\n}`
  }
];

export const getInitialState = (): AppState => ({
  activeView: 'overview',
  language: 'RU',
  theme: 'light',
  searchQuery: '',
  notificationCount: 3,
  selectedInstanceId: 'inst-01', // Pre-select first to match screenshot
  selectedMessageId: 'msg-01',
  selectedTokenId: 'tok-01',
  selectedWebhookId: 'web-01',
  selectedLogId: 'log-01',
  instances: initialInstances,
  messages: initialMessages,
  tokens: initialTokens,
  webhooks: initialWebhooks,
  logs: initialLogs,
  userProfile: {
    name: 'Администратор',
    email: 'admin@asiamsg.com'
  }
});
