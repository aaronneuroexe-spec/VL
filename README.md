# VoxLink - Voice Communication Platform

VoxLink — это современная платформа для голосового общения, разработанная специально для гильдий и сообществ. Поддерживает текстовые чаты, голосовые каналы, стримы и календарь событий.

## 🚀 Быстрый старт

### Локальная разработка

```bash
# Клонирование и установка зависимостей
git clone <repo-url>
cd voxlink

# Запуск через Docker Compose
cd infra
docker-compose up --build

# Backend: http://localhost:4000
# Frontend: http://localhost:3000
```

### Развёртывание на VPS

```bash
# На сервере
git clone <repo-url>
cd voxlink/infra
docker-compose pull
docker-compose up -d --build

# Настройка nginx и SSL
sudo certbot --nginx -d yourdomain.com
```

## 🏗️ Архитектура

- **Backend**: Node.js 20+ + NestJS + TypeScript
- **Frontend**: React + Vite + TypeScript + Tailwind CSS (PWA)
- **Database**: PostgreSQL
- **Real-time**: WebSocket (Socket.IO)
- **Media**: WebRTC (P2P → SFU)
- **TURN/STUN**: coturn
- **Containerization**: Docker + docker-compose
- **CI/CD**: GitHub Actions

## 📁 Структура проекта

```
voxlink/
├── backend/          # NestJS API сервер
├── frontend/         # React PWA приложение
├── infra/           # Docker, nginx, coturn конфиги
├── scripts/         # Скрипты развёртывания и бэкапов
└── .github/         # CI/CD workflows
```

## 🔧 Конфигурация

Скопируйте `env.example` в `.env` и настройте переменные окружения:

```bash
# Linux/Mac
cp env.example .env

# Windows
copy env.example .env
```

Основные переменные:
- `DATABASE_URL` - подключение к PostgreSQL
- `JWT_SECRET` - секрет для JWT токенов
- `TURN_HOST` - адрес TURN сервера
- `SMTP_*` - настройки почты для magic-link

## 🎯 Основные функции

- **Аутентификация**: Magic-link + invite tokens
- **Каналы**: Текстовые, голосовые, стримы
- **WebRTC**: P2P голос/видео с TURN поддержкой
- **События**: Календарь рейдов и активностей
- **Модерация**: Бан, мут, логи действий
- **PWA**: Установка как приложение

## 🧪 Тестирование

### Быстрый тест (Linux/Mac)

```bash
# Автоматический тест всех компонентов
./scripts/quick-test.sh
```

### Быстрый тест (Windows)

```cmd
# Двойной клик или запуск из командной строки
scripts\quick-test-launcher.bat
```

Или создайте EXE файл:
```powershell
.\scripts\build-exe.ps1
.\VoxLink-QuickTest.exe
```

**Подробнее:** [WINDOWS-QUICKSTART.md](WINDOWS-QUICKSTART.md)

### Unit тесты

```bash
# Backend тесты
cd backend
npm test

# Frontend тесты
cd frontend
npm test

# E2E тесты
npm run test:e2e
```

## 📊 Мониторинг

- Health check: `/health`
- Метрики: `/metrics` (Prometheus)
- Логи: Winston + структурированные логи

## 🔒 Безопасность

- JWT с коротким TTL
- Rate limiting
- CORS настройки
- Валидация входных данных
- Логирование действий модерации

## 📚 Документация

- [API Documentation](./docs/api.md)
- [WebRTC Signaling](./docs/webrtc.md)
- [Deployment Guide](./docs/deployment.md)
- [Troubleshooting](./docs/troubleshooting.md)

## 🤝 Вклад в проект

1. Fork репозитория
2. Создайте feature branch
3. Commit изменения
4. Push в branch
5. Создайте Pull Request

## 📄 Лицензия

MIT License - см. [LICENSE](LICENSE)
