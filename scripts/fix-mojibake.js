const fs = require('fs');
const path = require('path');

const roots = process.argv.slice(2);

const suspicious = /[ÃÂÐÑРГѓЃЀЁё]/;
const cyrillic = /[\u0400-\u04FF]/g;

function score(text) {
  const cyr = (text.match(cyrillic) || []).length;
  const bad = (text.match(suspicious) || []).length;
  return cyr * 3 - bad * 2;
}

function decodeIfBetter(text) {
  if (!suspicious.test(text)) return text;
  let decoded;
  try {
    decoded = Buffer.from(text, 'latin1').toString('utf8');
  } catch {
    return text;
  }
  return score(decoded) > score(text) ? decoded : text;
}

function replaceQuoted(text) {
  return text.replace(/(['"`])([^'"`\\\n\r]*[ÃÂÐÑРГѓЃЀЁё][^'"`\\\n\r]*)\1/g, (match, quote, content) => {
    return quote + decodeIfBetter(content) + quote;
  });
}

function replaceJsxText(text) {
  return text.replace(/>([^<>{}\n\r]*[ÃÂÐÑРГѓЃЀЁё][^<>{}\n\r]*)</g, (match, content) => {
    return '>' + decodeIfBetter(content) + '<';
  });
}

function processFile(filePath) {
  const original = fs.readFileSync(filePath, 'utf8');
  let updated = original;

  updated = replaceQuoted(updated);
  updated = replaceJsxText(updated);

  if (filePath.endsWith('App.tsx')) {
    updated = updated
      .replace(/РЇР·С‹Рє РёР·РјРµРЅС‘РЅ РЅР° СЂСѓСЃСЃРєРёР№/g, 'Язык изменён на русский')
      .replace(/РЎРІРµС‚Р»Р°СЏ С‚РµРјР° РІРєР»СЋС‡РµРЅР°/g, 'Светлая тема включена')
      .replace(/РўС‘РјРЅР°СЏ С‚РµРјР° РІРєР»СЋС‡РµРЅР°/g, 'Тёмная тема включена')
      .replace(/РЎРёСЃС‚РµРјРЅР°СЏ С‚РµРјР° РІС‹Р±СЂР°РЅР°/g, 'Системная тема выбрана')
      .replace(/Р’С‹Р±РµСЂРёС‚Рµ РєР»РёРµРЅС‚Р° РґР»СЏ РѕС‚РїРѕРґ?Р°РІРєРё СЃРѕРѕР±С‰РµРЅРёСЏ/g, 'Выберите клиента для отправки сообщения')
      .replace(/Р’С‹Р±РµСЂРёС‚Рµ РєР»РёРµРЅС‚Р° РґР»СЏ РѕС‚РїСЂР°РІРєРё СЃРѕРѕР±С‰РµРЅРёСЏ/g, 'Выберите клиента для отправки сообщения')
      .replace(/Р”РѕР±Р°РІРёС‚СЊ WhatsApp РЅРѕРјРµСЂ/g, 'Добавить WhatsApp номер')
      .replace(/РРЅС‚РµРіСЂР°С†РёСЏ РЅРѕРІРѕРіРѕ РєР°РЅР°Р»Р° СЃРІСЏР·Рё/g, 'Интеграция нового канала связи')
      .replace(/РќР°Р·РІР°РЅРёРµ РёРЅСЃС‚Р°РЅСЃР°/g, 'Название инстанса')
      .replace(/РќР°РїСЂРёРјРµСЂ, Sales Bot/g, 'Например, Sales Bot')
      .replace(/РќРѕРјРµСЂ С‚РµР»РµС„РѕРЅР°/g, 'Номер телефона')
      .replace(/РџСЂРѕРІР°Р№РґРµСЂ Р°РІС‚РѕСЂРёР·Р°С†РёРё/g, 'Провайдер авторизации')
      .replace(/РћС‚РјРµРЅР°/g, 'Отмена')
      .replace(/РџРѕРґРєР»СЋС‡РёС‚СЊ/g, 'Подключить')
      .replace(/РџСЂРѕС„РёР»СЊ СЃРѕС…СЂР°РЅС‘РЅ/g, 'Профиль сохранён')
      .replace(/РџРѕРґРєР»СЋС‡РµРЅРѕ Рє СЂРµР°Р»СЊРЅРѕРјСѓ API/g, 'Подключено к реальному API')
      .replace(/РЎРµСЃСЃРёСЏ СѓСЃС‚Р°СЂРµР»Р°. Р’РѕР№РґРёС‚Рµ Р·Р°РЅРѕРІРѕ\./g, 'Сессия устарела. Войдите заново.')
      .replace(/РџСЂРѕРІРµРґ?РµРЅ?Рѕ?\s+Г?Р?Р?Р? РёРЅСЃС‚Р°РЅСЃ[^\n]*/g, 'Реальный инстанс создан через API')
      .replace(/РЎС‚Р°С‚СѓСЃ СЃРёРЅС…СЂРѕРЅРёР·РёСЂРѕРІР°РЅ СЃ API/g, 'Статус синхронизирован с API')
      .replace(/РЎРѕРѕР±С‰РµРЅРёСЏ РїРѕРєР° РґРѕСЃС‚СѓРїРЅС‹ С‚РѕР»СЊРєРѕ С‡РµСЂРµР· backend API/g, 'Сообщения пока доступны только через backend API')
      .replace(/РўРѕРєРµРЅС‹ РїРѕРєР° РґРѕСЃС‚СѓРїРЅС‹ С‚РѕР»СЊРєРѕ С‡РµСЂРµР· backend API/g, 'Токены пока доступны только через backend API')
      .replace(/РўРѕРєРµРЅС‹ РґРѕСЃС‚СѓРїРЅС‹ С‚РѕР»СЊРєРѕ РґР»СЏ С‡С‚РµРЅРёСЏ С‡РµСЂРµР· backend API/g, 'Токены доступны только для чтения через backend API')
      .replace(/Р“?\uFFFD?В?…?/?/g, '')
      .replace(/triggerToast\(lang === 'RU' \? '.*?' : 'Language set to English'\);/s, "triggerToast(lang === 'RU' ? 'Язык изменён на русский' : 'Language set to English');")
      .replace(/theme === 'light'\n\s*\? \(state\.language === 'RU' \? '.*?' : 'Light theme activated'\)\n\s*: theme === 'dark'\n\s*\? \(state\.language === 'RU' \? '.*?' : 'Dark theme activated'\)\n\s*: \(state\.language === 'RU' \? '.*?' : 'System theme selected'\);/s, "theme === 'light'\n        ? (state.language === 'RU' ? 'Светлая тема включена' : 'Light theme activated')\n        : theme === 'dark'\n          ? (state.language === 'RU' ? 'Тёмная тема включена' : 'Dark theme activated')\n          : (state.language === 'RU' ? 'Системная тема выбрана' : 'System theme selected');")
      .replace(/triggerToast\(state\.language === 'RU' \? '.*?' : 'Profile saved successfully'\);/s, "triggerToast(state.language === 'RU' ? 'Профиль сохранён' : 'Profile saved successfully');")
      .replace(/triggerToast\(state\.language === 'RU' \? '.*?' : 'Connected to the real API'\);/s, "triggerToast(state.language === 'RU' ? 'Подключено к реальному API' : 'Connected to the real API');")
      .replace(/handleAuthRequired\(state\.language === 'RU' \? '.*?' : 'Session expired\. Please sign in again\.'\);/g, "handleAuthRequired(state.language === 'RU' ? 'Сессия устарела. Войдите заново.' : 'Session expired. Please sign in again.');")
      .replace(/triggerToast\(state\.language === 'RU' \? '.*?' : 'Backend connection cleared'\);/s, "triggerToast(state.language === 'RU' ? 'Подключение сброшено' : 'Backend connection cleared');")
      .replace(/triggerToast\(state\.language === 'RU' \? '.*?' : 'Instance created via API'\);/s, "triggerToast(state.language === 'RU' ? 'Реальный инстанс создан через API' : 'Instance created via API');")
      .replace(/triggerToast\(state\.language === 'RU' \? '.*?' : 'Status synced with API'\);/s, "triggerToast(state.language === 'RU' ? 'Статус синхронизирован с API' : 'Status synced with API');")
      .replace(/triggerToast\(state\.language === 'RU' \? '.*?' : 'Messages are available through the backend API only'\);/s, "triggerToast(state.language === 'RU' ? 'Сообщения пока доступны только через backend API' : 'Messages are available through the backend API only');")
      .replace(/triggerToast\(state\.language === 'RU' \? '.*?' : 'Tokens are available through the backend API only'\);/s, "triggerToast(state.language === 'RU' ? 'Токены пока доступны только через backend API' : 'Tokens are available through the backend API only');")
      .replace(/triggerToast\(state\.language === 'RU' \? '.*?' : 'Tokens are read-only from the backend API'\);/s, "triggerToast(state.language === 'RU' ? 'Токены доступны только для чтения через backend API' : 'Tokens are read-only from the backend API');")
      .replace(/triggerToast\(state\.language === 'RU' \? '.*?' : 'Webhooks are available through the backend API only'\);/s, "triggerToast(state.language === 'RU' ? 'Webhook пока доступны только через backend API' : 'Webhooks are available through the backend API only');")
      .replace(/triggerToast\(state\.language === 'RU' \? '.*?' : 'Webhooks are read-only from the backend API'\);/s, "triggerToast(state.language === 'RU' ? 'Webhook доступны только для чтения через backend API' : 'Webhooks are read-only from the backend API');")
      .replace(/triggerToast\(state\.language === 'RU' \? '.*?' : 'Logs come from the backend API only'\);/s, "triggerToast(state.language === 'RU' ? 'Логи приходят только из backend API' : 'Logs come from the backend API only');")
      .replace(/triggerToast\(state\.language === 'RU' \? '.*?' : 'Select client to start messaging'\)/s, "triggerToast(state.language === 'RU' ? 'Выберите клиента для отправки сообщения' : 'Select client to start messaging')")
      .replace(/Ã¢ÂÂ/g, '✓')
      .replace(/ÃÂ/g, '×');
  }

  if (updated !== original) {
    fs.writeFileSync(filePath, updated, 'utf8');
    console.log(`fixed: ${filePath}`);
  }
}

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      walk(full);
      continue;
    }
    if (full.endsWith('.tsx') || full.endsWith('.ts')) {
      processFile(full);
    }
  }
}

for (const root of roots) {
  walk(root);
}
