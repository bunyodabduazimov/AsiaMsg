# ChatAPI

Платформа для управления WhatsApp-инстансами через Baileys.

## Стек

- Backend: Node.js + Express + TypeScript
- WhatsApp: Baileys
- Database: MySQL через Prisma ORM
- Cache/Queue: Redis
- Frontend: React + Vite + TypeScript + Tailwind CSS
- WebSocket: Socket.IO

## Структура

- `backend/`
- `frontend/`

## Текущее состояние

Собран стартовый каркас проекта:

- базовая архитектура
- backend и frontend скелеты
- Prisma-схема под MySQL
- Auth-модуль с JWT и Refresh Token
- OpenAPI-документация для Auth

## Запуск

1. Создать `.env` файлы на основе `.env.example`.
2. Поднять MySQL и Redis через `docker-compose.yml`.
3. Установить зависимости в `backend/` и `frontend/`.
4. Запустить миграции Prisma.
5. Запустить backend и frontend.

## Следующий шаг

После запуска можно продолжить с модулем `Instances`.
