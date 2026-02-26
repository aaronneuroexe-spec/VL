# Детальный план интеграции компонентов VoxLink

## 📋 Содержание

1. [WebRTC Native (webrtc-main)](#1-webrtc-native-webrtc-main)
2. [Opus Codec (opus-main)](#2-opus-codec-opus-main)
3. [coturn TURN Server](#3-coturn-turn-server)
4. [ws WebSocket Library](#4-ws-websocket-library)

---

## 1. WebRTC Native (webrtc-main)

### 📊 Текущее состояние

**Frontend:**
- ✅ Используется браузерный WebRTC API (`RTCPeerConnection`)
- ✅ Реализован P2P (peer-to-peer) режим
- ✅ Есть базовая сигнализация через WebSocket
- ❌ Нет SFU (Selective Forwarding Unit)
- ❌ Нет записи звонков на backend
- ❌ Нет транскодирования

**Backend:**
- ❌ Нет нативного WebRTC
- ❌ `MediaService` содержит только заглушки
- ❌ Нет обработки медиа-потоков

### 🎯 Что даст интеграция

1. **SFU (Selective Forwarding Unit)**
   - Масштабирование до 100+ участников
   - Экономия bandwidth (не нужно отправлять всем)
   - Централизованное управление потоками

2. **Запись звонков**
   - Запись на сервере
   - Хранение в облаке
   - Транскрипция (опционально)

3. **Транскодирование**
   - Адаптация качества под клиента
   - Поддержка разных кодеков
   - Оптимизация для мобильных

4. **Микширование аудио**
   - Объединение нескольких потоков
   - Снижение нагрузки на клиентов

### 🔧 Технические детали

#### Структура webrtc-main

```
webrtc-main/
├── scripts/
│   ├── build.mjs          # Сборка WebRTC
│   ├── depot_tools.mjs    # Установка depot_tools
│   ├── enlistment.mjs     # Клонирование WebRTC
│   ├── gn.mjs             # GN build system
│   ├── package.mjs        # Упаковка бинарников
│   └── platform.mjs       # Платформо-специфичные настройки
├── patches/               # Патчи для WebRTC
└── package.json
```

#### Требования для сборки

**Windows:**
- Visual Studio 2019+ (MSVC)
- Windows SDK 10.0+
- Python 3.x
- Git
- depot_tools (Google)

**Linux:**
- GCC 7+ или Clang
- Python 3.x
- Git
- depot_tools
- Ninja build system

**Mac:**
- Xcode Command Line Tools
- Python 3.x
- Git
- depot_tools

#### Размер и зависимости

- **Исходники WebRTC:** ~15-20 GB
- **Время сборки:** 2-4 часа (зависит от CPU)
- **Бинарники:** ~500-800 MB (release)
- **Зависимости:** abseil-cpp, protobuf, и др.

### 📝 План интеграции

#### Шаг 1: Подготовка бинарников

**Вариант A: Использовать готовые бинарники (рекомендуется)**
```bash
# Скачать последний релиз с GitHub
# https://github.com/bengreenier/webrtc/releases
# Распаковать в vendor/webrtc/
```

**Вариант B: Собрать самостоятельно**
```bash
cd Внедрять/webrtc-main
npm install
npm run bootstrap  # Установит depot_tools и клонирует WebRTC
npm run build      # Соберёт WebRTC (2-4 часа!)
npm run package    # Упакует бинарники
```

#### Шаг 2: Создание Node.js Addon

**Структура:**
```
backend/
├── native/
│   ├── webrtc-addon/
│   │   ├── binding.gyp      # Конфигурация сборки
│   │   ├── src/
│   │   │   ├── addon.cpp    # C++ код
│   │   │   └── webrtc_wrapper.h
│   │   └── package.json
```

**binding.gyp:**
```json
{
  "targets": [
    {
      "target_name": "webrtc_addon",
      "sources": ["src/addon.cpp"],
      "include_dirs": [
        "<!@(node -e \"require('node-addon-api').include\")",
        "vendor/webrtc/include",
        "vendor/webrtc/include/third_party/abseil-cpp"
      ],
      "libraries": [
        "-lwebrtc"
      ],
      "library_dirs": [
        "vendor/webrtc/release"
      ],
      "defines": [
        "WEBRTC_POSIX",
        "NAPI_DISABLE_CPP_EXCEPTIONS"
      ],
      "cflags_cc": ["-std=c++17"],
      "conditions": [
        ["OS=='win'", {
          "defines": ["WEBRTC_WIN", "NOMINMAX"],
          "msvs_settings": {
            "VCCLCompilerTool": {
              "LanguageStandard": "stdcpp17"
            }
          }
        }]
      ]
    }
  ]
}
```

**Пример addon.cpp:**
```cpp
#include <napi.h>
#include "api/peer_connection_interface.h"
#include "api/create_peerconnection_factory.h"

class SFUPeerConnection : public Napi::ObjectWrap<SFUPeerConnection> {
public:
  static Napi::Object Init(Napi::Env env, Napi::Object exports);
  SFUPeerConnection(const Napi::CallbackInfo& info);
  
  // Методы для работы с WebRTC
  Napi::Value CreatePeerConnection(const Napi::CallbackInfo& info);
  Napi::Value AddTrack(const Napi::CallbackInfo& info);
  Napi::Value RemoveTrack(const Napi::CallbackInfo& info);
  
private:
  rtc::scoped_refptr<webrtc::PeerConnectionInterface> peer_connection_;
};

// Реализация методов...
```

#### Шаг 3: Интеграция в MediaService

```typescript
// backend/src/media/media.service.ts
import { Injectable } from '@nestjs/common';
import * as webrtcAddon from '../native/webrtc-addon/build/Release/webrtc_addon.node';

@Injectable()
export class MediaService {
  private sfuInstances: Map<string, any> = new Map();

  async createSFU(channelId: string): Promise<string> {
    const sfu = new webrtcAddon.SFU();
    sfu.initialize({
      audioCodec: 'opus',
      videoCodec: 'VP8',
    });
    
    this.sfuInstances.set(channelId, sfu);
    return channelId;
  }

  async addStreamToSFU(channelId: string, userId: string, stream: any): Promise<void> {
    const sfu = this.sfuInstances.get(channelId);
    if (!sfu) throw new Error('SFU not found');
    
    sfu.addStream(userId, stream);
  }

  async startRecording(channelId: string, userId: string): Promise<{ streamId: string }> {
    const sfu = this.sfuInstances.get(channelId);
    if (!sfu) throw new Error('SFU not found');
    
    const recording = sfu.startRecording(userId);
    return { streamId: recording.id };
  }
}
```

### ⚠️ Сложности и проблемы

1. **Сложность сборки**
   - Требует много времени и ресурсов
   - Много зависимостей
   - Платформо-специфичные настройки

2. **Размер бинарников**
   - Большой размер (~500-800 MB)
   - Увеличит размер Docker образа

3. **Отладка**
   - C++ код сложнее отлаживать
   - Нужны навыки работы с native addons

4. **Производительность**
   - Требует оптимизации
   - Может быть узким местом

### 💡 Альтернативы

1. **Использовать готовые решения:**
   - [mediasoup](https://mediasoup.org/) - Node.js SFU
   - [Janus](https://janus.conf.meetecho.com/) - WebRTC Gateway
   - [Kurento](https://www.kurento.org/) - Media Server

2. **Гибридный подход:**
   - P2P для малых групп (< 10 участников)
   - SFU для больших групп

---

## 2. Opus Codec (opus-main)

### 📊 Текущее состояние

- ❌ Не интегрирован
- ✅ Упоминается в конфигурации (`codec: 'opus'`)
- ❌ Нет нативного кодирования/декодирования

### 🎯 Что даст интеграция

1. **Высокое качество аудио**
   - От 6 kbps (узкополосная речь) до 510 kbps (стерео музыка)
   - Адаптивный битрейт
   - Низкая задержка

2. **Улучшенная обработка потери пакетов**
   - Встроенный FEC (Forward Error Correction)
   - Packet Loss Concealment
   - Deep Redundancy (DRED) в Opus 1.5+

3. **Оптимизация для разных сценариев**
   - VoIP режим (низкая задержка)
   - Audio режим (высокое качество)
   - Restricted Low Delay (баланс)

### 🔧 Технические детали

#### Структура opus-main

```
opus-main/
├── include/          # Заголовочные файлы
│   └── opus.h
├── src/              # Исходники кодера/декодера
├── silk/             # SILK кодек (речь)
├── celt/             # CELT кодек (музыка)
├── dnn/              # Deep Neural Network (DRED)
└── tests/            # Тесты
```

#### Требования для сборки

**Все платформы:**
- C компилятор (GCC/Clang/MSVC)
- Autotools (autoconf, automake, libtool)
- Make

**Опционально:**
- CMake (альтернатива autotools)
- Meson (альтернатива autotools)

#### Размер и зависимости

- **Исходники:** ~5-10 MB
- **Время сборки:** 5-15 минут
- **Библиотека:** ~200-500 KB (libopus.so/libopus.a)
- **Зависимости:** Нет внешних зависимостей (self-contained)

### 📝 План интеграции

#### Шаг 1: Сборка libopus

**Linux/Mac:**
```bash
cd Внедрять/opus-main
./autogen.sh
./configure --prefix=/usr/local
make
make check  # Запустить тесты
sudo make install
```

**Windows (CMake):**
```bash
cd Внедрять/opus-main
mkdir build && cd build
cmake .. -DCMAKE_INSTALL_PREFIX=C:/opus
cmake --build . --config Release
cmake --install . --config Release
```

#### Шаг 2: Node.js интеграция

**Вариант A: Использовать готовый пакет (рекомендуется)**
```bash
npm install @discordjs/opus
# или
npm install node-opus
```

**Вариант B: Создать свой wrapper через FFI**
```typescript
// backend/src/media/opus-wrapper.ts
import ffi from 'ffi-napi';
import ref from 'ref-napi';

const opus = ffi.Library('libopus', {
  'opus_encoder_create': ['pointer', ['int', 'int', 'int', 'pointer']],
  'opus_encode': ['int', ['pointer', 'pointer', 'int', 'pointer', 'int']],
  'opus_decoder_create': ['pointer', ['int', 'int', 'pointer']],
  'opus_decode': ['int', ['pointer', 'pointer', 'int', 'pointer', 'int', 'int']],
  // ... другие функции
});

export class OpusEncoder {
  private encoder: Buffer;
  
  constructor(sampleRate: number, channels: number, application: number) {
    const error = ref.alloc('int');
    this.encoder = opus.opus_encoder_create(
      sampleRate,
      channels,
      application,
      error
    );
  }
  
  encode(pcm: Buffer, frameSize: number): Buffer {
    const maxDataBytes = 4000;
    const data = Buffer.alloc(maxDataBytes);
    const length = opus.opus_encode(
      this.encoder,
      pcm,
      frameSize,
      data,
      maxDataBytes
    );
    return data.slice(0, length);
  }
}
```

#### Шаг 3: Интеграция в WebRTC

```typescript
// backend/src/media/media.service.ts
import { OpusEncoder, OpusDecoder } from './opus-wrapper';

@Injectable()
export class MediaService {
  private opusEncoders: Map<string, OpusEncoder> = new Map();
  
  createOpusEncoder(userId: string): OpusEncoder {
    const encoder = new OpusEncoder(
      48000,  // sample rate
      2,      // channels (stereo)
      2048    // application: OPUS_APPLICATION_VOIP
    );
    this.opusEncoders.set(userId, encoder);
    return encoder;
  }
  
  encodeAudio(userId: string, pcmData: Buffer): Buffer {
    const encoder = this.opusEncoders.get(userId);
    if (!encoder) throw new Error('Encoder not found');
    
    return encoder.encode(pcmData, 960); // 20ms frame at 48kHz
  }
}
```

### ⚠️ Сложности и проблемы

1. **Интеграция с WebRTC**
   - WebRTC уже использует Opus по умолчанию
   - Нужна интеграция только для кастомной обработки

2. **Производительность**
   - Кодирование требует CPU
   - Нужна оптимизация для реального времени

3. **Синхронизация**
   - Нужна правильная обработка временных меток
   - Буферизация для плавности

### 💡 Рекомендации

1. **Использовать готовые пакеты**
   - `@discordjs/opus` - хорошо поддерживается
   - `node-opus` - альтернатива

2. **Оптимизация**
   - Использовать аппаратное ускорение (если доступно)
   - Настроить complexity для баланса качество/CPU

---

## 3. coturn TURN Server

### 📊 Текущее состояние

- ✅ Уже интегрирован через Docker
- ✅ Конфигурация в `infra/coturn/turnserver.conf`
- ✅ Используется в `infra/docker-compose.yml`
- ⚠️ Исходники доступны для кастомизации

### 🎯 Что можно улучшить

1. **Кастомная сборка**
   - Оптимизация под конкретную платформу
   - Включение/отключение функций
   - Снижение размера

2. **Интеграция с базой данных**
   - Динамическое управление пользователями
   - Интеграция с Redis/PostgreSQL
   - Мониторинг и статистика

3. **Расширенная конфигурация**
   - Настройка под нагрузку
   - Географическое распределение
   - Балансировка

### 🔧 Технические детали

#### Текущая конфигурация

```conf
# infra/coturn/turnserver.conf
listening-port=3478
tls-listening-port=5349
external-ip=<SERVER_PUBLIC_IP>
relay-ip=0.0.0.0
min-port=49152
max-port=65535
static-auth-secret=YOUR_STATIC_SECRET
realm=voxlink
```

#### Опции для улучшения

**Интеграция с Redis:**
```conf
redis-userdb="host=redis port=6379 dbname=0 password=password"
redis-statsdb="host=redis port=6379 dbname=1 password=password"
```

**Интеграция с PostgreSQL:**
```conf
psql-userdb="host=db port=5432 dbname=voxlink user=voxlink password=password connect_timeout=30"
```

**Мониторинг Prometheus:**
```conf
prometheus
```

### 📝 План улучшений

#### Шаг 1: Кастомная сборка (опционально)

```bash
cd Внедрять/coturn-master
./configure \
  --prefix=/usr/local \
  --with-mysql \
  --with-postgresql \
  --with-redis \
  --with-prometheus
make
sudo make install
```

#### Шаг 2: Интеграция с базой данных

```sql
-- Создать таблицу для TURN пользователей
CREATE TABLE turnusers (
  realm VARCHAR(127) DEFAULT '',
  name VARCHAR(256),
  hmackey VARCHAR(128),
  PRIMARY KEY (realm, name)
);

-- Добавить пользователя
INSERT INTO turnusers (realm, name, hmackey)
VALUES ('voxlink', 'user123', 'hmackey_value');
```

#### Шаг 3: Мониторинг

```typescript
// backend/src/monitoring/monitoring.service.ts
async getTURNStats(): Promise<any> {
  // Запрос к Prometheus endpoint coturn
  const response = await fetch('http://coturn:9641/metrics');
  const metrics = await response.text();
  // Парсинг метрик...
}
```

### ⚠️ Сложности и проблемы

1. **Не критично**
   - Текущая конфигурация работает
   - Улучшения опциональны

2. **Сложность настройки**
   - Нужно понимание TURN/STUN протоколов
   - Требует тестирования

### 💡 Рекомендации

1. **Оставить как есть**
   - Текущая конфигурация достаточна
   - Улучшения можно делать постепенно

2. **При необходимости:**
   - Добавить интеграцию с БД для динамических пользователей
   - Настроить мониторинг

---

## 4. ws WebSocket Library

### 📊 Текущее состояние

- ✅ Используется Socket.IO (`socket.io`)
- ✅ Реализована базовая функциональность
- ⚠️ Socket.IO более тяжеловесный, чем `ws`

### 🎯 Что даст замена

1. **Производительность**
   - Меньший размер (~50 KB vs ~200 KB)
   - Меньше накладных расходов
   - Быстрее для простых случаев

2. **Простота**
   - Проще API
   - Меньше абстракций
   - Легче отладка

3. **Совместимость**
   - Стандартный WebSocket протокол
   - Лучшая совместимость с браузерами

### 🔧 Технические детали

#### Сравнение Socket.IO vs ws

| Характеристика | Socket.IO | ws |
|---------------|-----------|-----|
| Размер | ~200 KB | ~50 KB |
| Производительность | Средняя | Высокая |
| Автопереподключение | ✅ | ❌ (нужно реализовать) |
| Комнаты | ✅ | ❌ (нужно реализовать) |
| Бинарные данные | ✅ | ✅ |
| События | ✅ | ✅ (через сообщения) |

#### Текущее использование Socket.IO

```typescript
// backend/src/websocket/websocket.gateway.ts
@WebSocketGateway({
  cors: { origin: '*' },
  namespace: '/',
})
export class WebsocketGateway {
  @WebSocketServer()
  server: Server;  // Socket.IO Server
}
```

### 📝 План замены (если нужно)

#### Шаг 1: Установка ws

```bash
cd backend
npm install ws
npm install @types/ws --save-dev
```

#### Шаг 2: Создание WebSocket сервера

```typescript
// backend/src/websocket/websocket-server.ts
import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'http';

export class WSServer {
  private wss: WebSocketServer;
  private rooms: Map<string, Set<WebSocket>> = new Map();
  
  constructor(server: any) {
    this.wss = new WebSocketServer({ server });
    this.setupHandlers();
  }
  
  private setupHandlers() {
    this.wss.on('connection', (ws: WebSocket, req: IncomingMessage) => {
      // Аутентификация
      const token = this.extractToken(req);
      if (!this.authenticate(token)) {
        ws.close(1008, 'Unauthorized');
        return;
      }
      
      // Обработка сообщений
      ws.on('message', (data: Buffer) => {
        this.handleMessage(ws, data);
      });
      
      // Обработка закрытия
      ws.on('close', () => {
        this.handleDisconnect(ws);
      });
    });
  }
  
  // Реализация комнат, переподключения и т.д.
}
```

### ⚠️ Сложности и проблемы

1. **Потеря функциональности**
   - Нужно реализовать комнаты вручную
   - Нужно реализовать автопереподключение
   - Больше кода для поддержки

2. **Миграция**
   - Нужно обновить frontend
   - Нужно обновить все обработчики событий

### 💡 Рекомендации

1. **Оставить Socket.IO**
   - Уже работает
   - Есть нужная функциональность
   - Замена не критична

2. **Если нужна оптимизация:**
   - Сначала оптимизировать Socket.IO
   - Использовать ws только для специфичных случаев

---

## 🎯 Итоговые рекомендации

### Приоритет 1: WebRTC Native (высокий)
- **Зачем:** SFU, запись, масштабирование
- **Сложность:** Высокая
- **Время:** 2-3 недели
- **Альтернатива:** Использовать mediasoup

### Приоритет 2: Opus Codec (средний)
- **Зачем:** Улучшение качества аудио
- **Сложность:** Средняя
- **Время:** 1 неделя
- **Альтернатива:** Использовать готовые пакеты

### Приоритет 3: coturn (низкий)
- **Зачем:** Улучшения (опционально)
- **Сложность:** Низкая
- **Время:** 2-3 дня
- **Рекомендация:** Оставить как есть

### Приоритет 4: ws (низкий)
- **Зачем:** Оптимизация (опционально)
- **Сложность:** Средняя
- **Время:** 3-5 дней
- **Рекомендация:** Оставить Socket.IO

---

## 📚 Полезные ресурсы

- [WebRTC Native API](https://webrtc.googlesource.com/src/)
- [Opus Codec Documentation](https://opus-codec.org/docs/)
- [coturn Wiki](https://github.com/coturn/coturn/wiki)
- [ws Documentation](https://github.com/websockets/ws)
- [mediasoup Documentation](https://mediasoup.org/documentation/)

---

**Готов начать интеграцию?** 🚀