# WebRTC Signaling Guide

Полное руководство по настройке и использованию WebRTC в VoxLink.

## Содержание

- [Обзор](#обзор)
- [Архитектура](#архитектура)
- [Настройка TURN сервера](#настройка-turn-сервера)
- [Клиентская реализация](#клиентская-реализация)
- [Troubleshooting](#troubleshooting)

## Обзор

VoxLink использует WebRTC для peer-to-peer голосовой связи. Сигналинг происходит через WebSocket, а медиа-потоки идут напрямую между клиентами.

### Преимущества WebRTC

- **Низкая задержка**: Прямое соединение между пользователями
- **Высокое качество**: Адаптивное качество в зависимости от сети
- **Безопасность**: Шифрование на уровне протокола
- **Масштабируемость**: P2P для малых групп, SFU для больших

## Архитектура

```
┌─────────┐         ┌─────────┐
│ Client A│◄───────►│ Client B│
└────┬────┘  P2P    └────┬────┘
     │                   │
     │  Signaling        │
     │  (WebSocket)      │
     │                   │
     └─────────┬─────────┘
               │
          ┌────▼────┐
          │ Backend │
          │ (NestJS)│
          └────┬────┘
               │
          ┌────▼────┐
          │  TURN   │
          │ Server  │
          └─────────┘
```

### Flow подключения

1. **Клиент A** подключается к голосовому каналу
2. **Backend** уведомляет других участников
3. **Клиент A** создаёт RTCPeerConnection и offer
4. **Offer** отправляется через WebSocket клиенту B
5. **Клиент B** создаёт answer и отправляет обратно
6. **ICE candidates** обмениваются для NAT traversal
7. **P2P соединение** устанавливается

## Настройка TURN сервера

### Зачем нужен TURN?

TURN сервер помогает пользователям за NAT/firewall установить соединение, когда прямой P2P невозможен.

### Установка coturn

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install coturn -y

# CentOS/RHEL
sudo yum install coturn -y
```

### Конфигурация

Файл: `infra/coturn/turnserver.conf`

```conf
listening-port=3478
tls-listening-port=5349
listening-ip=0.0.0.0
external-ip=<YOUR_PUBLIC_IP>
relay-ip=0.0.0.0
min-port=49152
max-port=65535

fingerprint
lt-cred-mech
use-auth-secret
static-auth-secret=YOUR_SECRET_HERE
realm=voxlink

user=turnuser:turnpass
```

### Firewall

```bash
# UDP для STUN/TURN
sudo ufw allow 3478/udp
sudo ufw allow 3478/tcp

# TLS
sudo ufw allow 5349/tcp
sudo ufw allow 5349/udp

# Relay порты
sudo ufw allow 49152:65535/udp
```

### Тестирование TURN

```bash
# Установить утилиты
sudo apt install coturn-utils

# Тест STUN
turnutils_stunclient yourdomain.com

# Тест TURN
turnutils_client yourdomain.com -u turnuser -w turnpass
```

## Клиентская реализация

### Получение конфигурации

```typescript
// Получить WebRTC конфигурацию с сервера
const response = await fetch('/api/signaling/config');
const config = await response.json();

const rtcConfig: RTCConfiguration = {
  iceServers: [
    ...config.stunServers,
    ...config.turnServers.map(turn => ({
      urls: turn.urls,
      username: turn.username,
      credential: turn.credential,
    })),
  ],
  iceCandidatePoolSize: 10,
};
```

### Создание PeerConnection

```typescript
const pc = new RTCPeerConnection(rtcConfig);

// Получить локальный медиа-поток
const stream = await navigator.mediaDevices.getUserMedia({
  audio: true,
  video: false,
});

// Добавить треки в соединение
stream.getTracks().forEach(track => {
  pc.addTrack(track, stream);
});

// Обработка удалённого потока
pc.ontrack = (event) => {
  const [remoteStream] = event.streams;
  // Отобразить удалённый поток
  remoteAudio.srcObject = remoteStream;
};
```

### Сигналинг через WebSocket

```typescript
// Отправка offer
const offer = await pc.createOffer();
await pc.setLocalDescription(offer);

socket.emit('webrtc_offer', {
  to: targetUserId,
  offer: offer,
});

// Получение offer
socket.on('webrtc_offer', async (data) => {
  await pc.setRemoteDescription(data.offer);
  const answer = await pc.createAnswer();
  await pc.setLocalDescription(answer);
  
  socket.emit('webrtc_answer', {
    to: data.from,
    answer: answer,
  });
});

// Обмен ICE candidates
pc.onicecandidate = (event) => {
  if (event.candidate) {
    socket.emit('webrtc_ice', {
      to: targetUserId,
      candidate: event.candidate,
    });
  }
};

socket.on('webrtc_ice', async (data) => {
  await pc.addIceCandidate(data.candidate);
});
```

### Управление соединением

```typescript
// Mute/Unmute
const toggleMute = () => {
  localStream.getAudioTracks().forEach(track => {
    track.enabled = !track.enabled;
  });
};

// Отключение
const disconnect = () => {
  pc.close();
  localStream.getTracks().forEach(track => track.stop());
};
```

## Troubleshooting

### Проблема: Не могу подключиться к голосовому каналу

**Возможные причины:**
1. TURN сервер не настроен
2. Firewall блокирует порты
3. Неверные credentials

**Решение:**
```bash
# Проверить TURN сервер
turnutils_stunclient yourdomain.com

# Проверить логи
docker-compose logs coturn

# Проверить конфигурацию
cat infra/coturn/turnserver.conf
```

### Проблема: Высокая задержка

**Возможные причины:**
1. Используется TURN вместо прямого P2P
2. Плохое интернет-соединение
3. Перегрузка сервера

**Решение:**
- Проверить статистику соединения
- Убедиться что используется P2P когда возможно
- Оптимизировать кодек (Opus)

### Проблема: Нет звука

**Возможные причины:**
1. Микрофон заблокирован браузером
2. Неверные настройки аудио
3. Проблемы с кодеком

**Решение:**
```typescript
// Проверить разрешения
const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

// Проверить треки
console.log(stream.getAudioTracks());

// Проверить состояние
stream.getAudioTracks().forEach(track => {
  console.log('Track enabled:', track.enabled);
  console.log('Track muted:', track.muted);
});
```

### Проблема: Соединение обрывается

**Возможные причины:**
1. Нестабильное интернет-соединение
2. Таймауты ICE
3. Проблемы с TURN сервером

**Решение:**
```typescript
// Мониторинг состояния соединения
pc.onconnectionstatechange = () => {
  console.log('Connection state:', pc.connectionState);
  
  if (pc.connectionState === 'disconnected') {
    // Попытка переподключения
    reconnect();
  }
};

// Статистика соединения
const stats = await pc.getStats();
stats.forEach(report => {
  console.log(report);
});
```

## Best Practices

### 1. Используйте адаптивное качество

```typescript
// Настройка ограничений для адаптивного качества
const constraints = {
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
  },
  video: {
    width: { ideal: 1280, max: 1920 },
    height: { ideal: 720, max: 1080 },
    frameRate: { ideal: 30, max: 60 },
  },
};
```

### 2. Мониторинг качества

```typescript
// Регулярная проверка статистики
setInterval(async () => {
  const stats = await pc.getStats();
  // Анализ качества и адаптация
}, 5000);
```

### 3. Graceful degradation

```typescript
// Fallback если WebRTC не поддерживается
if (!RTCPeerConnection) {
  // Использовать альтернативный метод
}
```

### 4. Оптимизация для мобильных

```typescript
// Меньшее разрешение для мобильных
const isMobile = /Android|iPhone|iPad/i.test(navigator.userAgent);
const videoConstraints = isMobile 
  ? { width: 640, height: 480 }
  : { width: 1280, height: 720 };
```

## Дополнительные ресурсы

- [WebRTC Specification](https://www.w3.org/TR/webrtc/)
- [coturn Documentation](https://github.com/coturn/coturn)
- [MDN WebRTC Guide](https://developer.mozilla.org/en-US/docs/Web/API/WebRTC_API)