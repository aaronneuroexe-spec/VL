# Testing Guide

Полное руководство по тестированию VoxLink.

## Содержание

- [Быстрый тест](#быстрый-тест)
- [Unit тесты](#unit-тесты)
- [Integration тесты](#integration-тесты)
- [E2E тесты](#e2e-тесты)
- [Load тесты](#load-тесты)
- [Ручное тестирование](#ручное-тестирование)

## Быстрый тест

### Автоматический тест развёртывания

```bash
# Запустить все тесты развёртывания
./scripts/test-deployment.sh
```

Этот скрипт проверяет:
- ✅ Health endpoints
- ✅ Database connectivity
- ✅ WebSocket connectivity
- ✅ Создание тестовых каналов

### Ручная проверка

```bash
# 1. Запустить сервисы
cd infra
docker-compose up -d

# 2. Проверить здоровье
curl http://localhost:4000/health

# 3. Проверить frontend
curl http://localhost:3000

# 4. Проверить API docs
curl http://localhost:4000/api/docs
```

## Unit тесты

### Backend тесты

```bash
cd backend

# Запустить все тесты
npm test

# Запустить с покрытием
npm run test:cov

# Запустить в watch режиме
npm run test:watch

# Запустить конкретный тест
npm test -- auth.service.spec.ts
```

### Frontend тесты

```bash
cd frontend

# Запустить все тесты
npm test

# Запустить с UI
npm run test:ui

# Запустить с покрытием
npm run test:coverage
```

## Integration тесты

### Backend Integration

```bash
cd backend

# Запустить E2E тесты
npm run test:e2e

# Тесты требуют запущенной БД
# Используется test database из docker-compose
```

### API тесты

```bash
# Тест аутентификации
curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"token": "test-token", "username": "testuser"}'

# Тест создания канала
TOKEN="your-jwt-token"
curl -X POST http://localhost:4000/api/channels \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "test-channel", "type": "text"}'

# Тест отправки сообщения
CHANNEL_ID="channel-uuid"
curl -X POST http://localhost:4000/api/channels/$CHANNEL_ID/messages \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content": "Test message"}'
```

## E2E тесты

### Сценарий 1: Полный цикл пользователя

```bash
# 1. Создать invite token
INVITE_TOKEN=$(curl -X POST http://localhost:4000/api/auth/invite \
  -H "Content-Type: application/json" \
  -d '{"role": "member"}' | jq -r '.inviteToken')

# 2. Зарегистрироваться
LOGIN_RESPONSE=$(curl -X POST http://localhost:4000/api/auth/login \
  -H "Content-Type: application/json" \
  -d "{\"token\": \"$INVITE_TOKEN\", \"username\": \"testuser\"}")

TOKEN=$(echo $LOGIN_RESPONSE | jq -r '.access_token')

# 3. Получить каналы
curl -X GET http://localhost:4000/api/channels \
  -H "Authorization: Bearer $TOKEN"

# 4. Создать канал
CHANNEL_RESPONSE=$(curl -X POST http://localhost:4000/api/channels \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "e2e-test", "type": "text"}')

CHANNEL_ID=$(echo $CHANNEL_RESPONSE | jq -r '.id')

# 5. Отправить сообщение
curl -X POST http://localhost:4000/api/channels/$CHANNEL_ID/messages \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"content": "E2E test message"}'

# 6. Получить сообщения
curl -X GET http://localhost:4000/api/channels/$CHANNEL_ID/messages \
  -H "Authorization: Bearer $TOKEN"
```

## Load тесты

### Нагрузочное тестирование

```bash
# Тест с 10 пользователями на 5 минут
./scripts/load-test.sh 10 voice-general 300

# Тест с 50 пользователями на 10 минут
./scripts/load-test.sh 50 voice-general 600
```

### Ручной load test

```bash
# Установить k6
sudo apt install k6

# Создать тест скрипт
cat > load-test.js << 'EOF'
import http from 'k6/http';
import { check } from 'k6';

export let options = {
  vus: 10,
  duration: '5m',
};

export default function () {
  let res = http.get('http://localhost:4000/health');
  check(res, { 'status was 200': (r) => r.status == 200 });
}
EOF

# Запустить тест
k6 run load-test.js
```

## Ручное тестирование

### Чеклист функциональности

#### ✅ Аутентификация
- [ ] Создание invite token
- [ ] Вход по invite token
- [ ] Magic link отправка
- [ ] Вход по magic link
- [ ] Обновление токена
- [ ] Выход из системы

#### ✅ Каналы
- [ ] Создание текстового канала
- [ ] Создание голосового канала
- [ ] Создание приватного канала
- [ ] Редактирование канала
- [ ] Удаление канала
- [ ] Поиск каналов

#### ✅ Сообщения
- [ ] Отправка текстового сообщения
- [ ] Редактирование сообщения
- [ ] Удаление сообщения
- [ ] Ответ на сообщение
- [ ] Прикрепление файлов
- [ ] Поиск сообщений

#### ✅ Голосовые каналы
- [ ] Подключение к голосовому каналу
- [ ] Mute/Unmute микрофона
- [ ] Deafen/Undeafen
- [ ] Отключение от канала
- [ ] Качество звука
- [ ] Задержка

#### ✅ WebSocket
- [ ] Подключение к WebSocket
- [ ] Присоединение к каналу
- [ ] Получение сообщений в реальном времени
- [ ] Typing indicators
- [ ] Presence updates
- [ ] Переподключение при обрыве

#### ✅ WebRTC
- [ ] Получение WebRTC конфигурации
- [ ] Создание peer connection
- [ ] Обмен SDP offer/answer
- [ ] Обмен ICE candidates
- [ ] Установка P2P соединения
- [ ] Использование TURN сервера

#### ✅ События
- [ ] Создание события
- [ ] Редактирование события
- [ ] Удаление события
- [ ] Просмотр предстоящих событий
- [ ] Фильтрация по каналу

#### ✅ Администрирование
- [ ] Просмотр статистики
- [ ] Бан пользователя
- [ ] Разбан пользователя
- [ ] Удаление канала
- [ ] Удаление сообщения
- [ ] Просмотр активности пользователя

### Тестирование на разных устройствах

#### Desktop (Chrome/Firefox)
- [ ] Полная функциональность
- [ ] Голосовые каналы
- [ ] Screen sharing
- [ ] Уведомления

#### Mobile (iOS Safari/Android Chrome)
- [ ] Адаптивный UI
- [ ] Голосовые каналы
- [ ] Push-to-talk
- [ ] PWA установка

### Тестирование производительности

```bash
# 1. Проверить время загрузки
time curl http://localhost:3000

# 2. Проверить время ответа API
time curl http://localhost:4000/api/channels

# 3. Мониторинг ресурсов
docker stats

# 4. Проверить метрики
curl http://localhost:4000/metrics
```

### Тестирование безопасности

```bash
# 1. Тест rate limiting
for i in {1..150}; do
  curl http://localhost:4000/api/channels
done

# 2. Тест CORS
curl -H "Origin: http://evil.com" \
  -H "Access-Control-Request-Method: GET" \
  -X OPTIONS http://localhost:4000/api/channels

# 3. Тест валидации
curl -X POST http://localhost:4000/api/channels \
  -H "Content-Type: application/json" \
  -d '{"invalid": "data"}'
```

## Автоматизированный тест-план

Создайте файл `test-plan.sh`:

```bash
#!/bin/bash

echo "🧪 VoxLink Test Plan"
echo "==================="

# 1. Health checks
echo "1. Testing health endpoints..."
curl -f http://localhost:4000/health || exit 1
echo "✅ Health check passed"

# 2. Authentication
echo "2. Testing authentication..."
# ... тесты аутентификации

# 3. Channels
echo "3. Testing channels..."
# ... тесты каналов

# 4. Messages
echo "4. Testing messages..."
# ... тесты сообщений

# 5. WebSocket
echo "5. Testing WebSocket..."
# ... тесты WebSocket

echo "✅ All tests passed!"
```

## Отчёт о тестировании

После тестирования создайте отчёт:

```markdown
# Test Report - VoxLink v1.0.0

## Test Date: 2024-01-01
## Tester: [Your Name]

### Test Environment
- OS: Ubuntu 22.04
- Docker: 24.0.0
- Node.js: 20.10.0

### Test Results
- ✅ Authentication: 10/10 tests passed
- ✅ Channels: 8/8 tests passed
- ✅ Messages: 12/12 tests passed
- ✅ WebSocket: 6/6 tests passed
- ✅ WebRTC: 4/5 tests passed (1 known issue)

### Issues Found
1. [Issue description]
2. [Issue description]

### Recommendations
- [Recommendation 1]
- [Recommendation 2]
```