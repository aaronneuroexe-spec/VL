# Troubleshooting Guide

Руководство по решению типичных проблем VoxLink.

## Содержание

- [Общие проблемы](#общие-проблемы)
- [Проблемы с подключением](#проблемы-с-подключением)
- [Проблемы с голосом](#проблемы-с-голосом)
- [Проблемы с базой данных](#проблемы-с-базой-данных)
- [Проблемы с производительностью](#проблемы-с-производительностью)
- [Логи и диагностика](#логи-и-диагностика)

## Общие проблемы

### Проблема: Сервисы не запускаются

**Симптомы:**
- `docker-compose up` завершается с ошибкой
- Контейнеры постоянно перезапускаются

**Решение:**

```bash
# 1. Проверить логи
docker-compose logs

# 2. Проверить порты
sudo netstat -tlnp | grep -E '3000|4000|5432|6379'

# 3. Очистить старые контейнеры
docker-compose down
docker system prune -f

# 4. Пересобрать образы
docker-compose build --no-cache
docker-compose up -d
```

### Проблема: Не могу зайти в систему

**Симптомы:**
- Ошибка "Invalid token"
- Ошибка "User not found"

**Решение:**

```bash
# 1. Проверить что пользователь существует
docker-compose exec db psql -U voxlink -d voxlink -c "SELECT * FROM users;"

# 2. Создать нового пользователя
docker-compose exec db psql -U voxlink -d voxlink -c "
INSERT INTO users (username, email, role, status) 
VALUES ('admin', 'admin@voxlink.com', 'admin', 'online')
ON CONFLICT (username) DO NOTHING;
"

# 3. Создать новый invite token
curl -X POST http://localhost:4000/api/auth/invite \
  -H "Content-Type: application/json" \
  -d '{"role": "admin", "expiresInHours": 24}'
```

### Проблема: Frontend не загружается

**Симптомы:**
- Белый экран
- Ошибки в консоли браузера

**Решение:**

```bash
# 1. Проверить что frontend контейнер запущен
docker-compose ps frontend

# 2. Проверить логи
docker-compose logs frontend

# 3. Проверить переменные окружения
docker-compose exec frontend env | grep VITE_

# 4. Пересобрать frontend
cd frontend
npm run build
cd ../infra
docker-compose restart frontend
```

## Проблемы с подключением

### Проблема: WebSocket не подключается

**Симптомы:**
- "WebSocket connection failed"
- Постоянные переподключения

**Решение:**

```bash
# 1. Проверить что порт открыт
curl -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" \
  http://localhost:4000/ws

# 2. Проверить nginx конфигурацию
docker-compose exec nginx nginx -t

# 3. Проверить логи WebSocket
docker-compose logs backend | grep -i websocket

# 4. Проверить CORS настройки
curl -H "Origin: http://localhost:3000" \
  -H "Access-Control-Request-Method: GET" \
  -H "Access-Control-Request-Headers: X-Requested-With" \
  -X OPTIONS http://localhost:4000/api/channels
```

### Проблема: Не могу присоединиться к каналу

**Симптомы:**
- Ошибка "Channel not found"
- Ошибка "Access denied"

**Решение:**

```bash
# 1. Проверить что канал существует
docker-compose exec db psql -U voxlink -d voxlink -c \
  "SELECT id, name, type FROM channels;"

# 2. Проверить права доступа
docker-compose exec db psql -U voxlink -d voxlink -c \
  "SELECT u.username, c.name, c.is_private FROM users u 
   JOIN channels c ON c.created_by_id = u.id;"

# 3. Создать публичный канал
curl -X POST http://localhost:4000/api/channels \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "general", "type": "text", "isPrivate": false}'
```

## Проблемы с голосом

### Проблема: Нет звука в голосовом канале

**Симптомы:**
- Вижу других пользователей, но не слышу
- Другие не слышат меня

**Решение:**

```typescript
// 1. Проверить разрешения браузера
navigator.mediaDevices.getUserMedia({ audio: true })
  .then(stream => {
    console.log('Audio tracks:', stream.getAudioTracks());
    stream.getAudioTracks().forEach(track => {
      console.log('Track enabled:', track.enabled);
      console.log('Track muted:', track.muted);
    });
  });

// 2. Проверить TURN сервер
turnutils_stunclient yourdomain.com

// 3. Проверить WebRTC соединение
pc.onconnectionstatechange = () => {
  console.log('Connection state:', pc.connectionState);
};

// 4. Проверить статистику
const stats = await pc.getStats();
stats.forEach(report => {
  if (report.type === 'media-source') {
    console.log('Audio level:', report.audioLevel);
  }
});
```

### Проблема: Высокая задержка голоса

**Симптомы:**
- Задержка более 500ms
- Эхо в голосовом канале

**Решение:**

```bash
# 1. Проверить использование TURN
# Если все соединения идут через TURN, это нормально
# Но можно оптимизировать для прямого P2P

# 2. Проверить сетевую задержку
ping yourdomain.com

# 3. Оптимизировать кодек
# Использовать Opus с меньшей задержкой
const pc = new RTCPeerConnection({
  iceServers: [...],
  // Оптимизация для низкой задержки
  bundlePolicy: 'max-bundle',
  rtcpMuxPolicy: 'require',
});
```

### Проблема: TURN сервер не работает

**Симптомы:**
- "TURN server connection failed"
- Пользователи за NAT не могут подключиться

**Решение:**

```bash
# 1. Проверить что coturn запущен
sudo systemctl status coturn

# 2. Проверить логи
sudo journalctl -u coturn -n 50

# 3. Проверить конфигурацию
sudo cat /etc/coturn/turnserver.conf

# 4. Тестировать TURN
turnutils_client yourdomain.com -u turnuser -w turnpass

# 5. Проверить firewall
sudo ufw status
sudo ufw allow 3478/udp
sudo ufw allow 49152:65535/udp
```

## Проблемы с базой данных

### Проблема: Ошибка подключения к БД

**Симптомы:**
- "Database connection failed"
- "Connection refused"

**Решение:**

```bash
# 1. Проверить что PostgreSQL запущен
docker-compose ps db

# 2. Проверить логи
docker-compose logs db

# 3. Проверить подключение
docker-compose exec db psql -U voxlink -d voxlink -c "SELECT 1;"

# 4. Проверить переменные окружения
docker-compose exec backend env | grep DATABASE_URL

# 5. Пересоздать базу данных (ВНИМАНИЕ: потеря данных!)
docker-compose down
docker volume rm voxlink_db-data
docker-compose up -d
```

### Проблема: Медленные запросы

**Симптомы:**
- Долгая загрузка сообщений
- Таймауты запросов

**Решение:**

```sql
-- 1. Проверить индексы
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename IN ('messages', 'channels', 'users');

-- 2. Создать недостающие индексы
CREATE INDEX CONCURRENTLY idx_messages_channel_created 
ON messages(channel_id, created_at DESC);

CREATE INDEX CONCURRENTLY idx_users_status 
ON users(status);

-- 3. Анализ производительности
EXPLAIN ANALYZE 
SELECT * FROM messages 
WHERE channel_id = 'uuid' 
ORDER BY created_at DESC 
LIMIT 50;

-- 4. Очистка старых данных
DELETE FROM messages 
WHERE created_at < NOW() - INTERVAL '90 days' 
AND is_deleted = true;
```

## Проблемы с производительностью

### Проблема: Высокое использование памяти

**Симптомы:**
- Сервер тормозит
- Out of memory ошибки

**Решение:**

```bash
# 1. Проверить использование ресурсов
docker stats

# 2. Ограничить память в docker-compose.yml
services:
  backend:
    deploy:
      resources:
        limits:
          memory: 2G
        reservations:
          memory: 1G

# 3. Оптимизировать Node.js
# В .env добавить:
NODE_OPTIONS=--max-old-space-size=2048

# 4. Очистить неиспользуемые данные
docker system prune -a
```

### Проблема: Медленная загрузка страниц

**Симптомы:**
- Долгая загрузка frontend
- Медленный API

**Решение:**

```bash
# 1. Включить кэширование в nginx
# Уже настроено в infra/nginx/nginx.conf

# 2. Оптимизировать сборку frontend
cd frontend
npm run build -- --mode production

# 3. Использовать CDN для статики
# Настроить в nginx или использовать внешний CDN

# 4. Включить gzip
# Уже настроено в nginx
```

## Логи и диагностика

### Просмотр логов

```bash
# Все сервисы
docker-compose logs -f

# Конкретный сервис
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f db

# Последние 100 строк
docker-compose logs --tail=100 backend

# С фильтром
docker-compose logs backend | grep ERROR
```

### Диагностические команды

```bash
# Проверка здоровья всех сервисов
curl http://localhost:4000/health

# Проверка метрик
curl http://localhost:4000/metrics

# Проверка подключения к БД
docker-compose exec db pg_isready -U voxlink

# Проверка Redis
docker-compose exec redis redis-cli ping

# Проверка WebSocket
curl -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" \
  http://localhost:4000/ws
```

### Сбор информации для отчёта об ошибке

```bash
# Создать диагностический отчёт
cat > diagnose.sh << 'EOF'
#!/bin/bash
echo "=== VoxLink Diagnostic Report ===" > report.txt
echo "Date: $(date)" >> report.txt
echo "" >> report.txt

echo "=== Docker Status ===" >> report.txt
docker-compose ps >> report.txt
echo "" >> report.txt

echo "=== System Resources ===" >> report.txt
docker stats --no-stream >> report.txt
echo "" >> report.txt

echo "=== Health Check ===" >> report.txt
curl -s http://localhost:4000/health >> report.txt
echo "" >> report.txt

echo "=== Recent Errors ===" >> report.txt
docker-compose logs --tail=50 | grep -i error >> report.txt
echo "" >> report.txt

echo "Report saved to report.txt"
EOF

chmod +x diagnose.sh
./diagnose.sh
```

## Получение помощи

Если проблема не решена:

1. **Проверьте FAQ**: [docs/faq.md](./faq.md)
2. **Создайте issue** на GitHub с:
   - Описанием проблемы
   - Шагами для воспроизведения
   - Логами (используйте `diagnose.sh`)
   - Версией VoxLink
   - Информацией о системе

3. **Проверьте документацию**:
   - [API Documentation](./api.md)
   - [Deployment Guide](./deployment.md)
   - [WebRTC Guide](./webrtc.md)