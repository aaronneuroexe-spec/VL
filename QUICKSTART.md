# VoxLink Quick Start Guide

Get VoxLink up and running in 5 minutes!

## Prerequisites

- Docker and Docker Compose installed
- Git installed
- 4GB+ RAM available

## 1. Clone and Setup

```bash
# Clone the repository
git clone <your-repo-url>
cd voxlink

# Copy environment file
# Linux/Mac:
cp env.example .env

# Windows:
copy env.example .env
```

## 2. Configure Environment

Edit `.env` file with your settings:

```bash
# Essential settings (change these!)
JWT_SECRET=your_super_secret_jwt_key_here
TURN_SECRET=your_turn_secret_here

# Optional: Configure SMTP for magic links
SMTP_HOST=smtp.example.com
SMTP_USER=your_smtp_user
SMTP_PASS=your_smtp_password
```

## 3. Start VoxLink

```bash
cd infra
docker-compose up --build
```

Wait for all services to start (about 2-3 minutes).

## 4. Access VoxLink

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:4000
- **API Docs**: http://localhost:4000/api/docs

## 5. Create First User

### Option A: Use API (Recommended)

```bash
# Create an invite token
curl -X POST http://localhost:4000/api/auth/invite \
  -H "Content-Type: application/json" \
  -d '{"role": "admin", "expiresInHours": 24}'

# Use the returned token to login via frontend
```

### Option B: Direct Database Access

```bash
# Access the database
docker-compose exec db psql -U voxlink -d voxlink

# Create admin user (password: admin123)
INSERT INTO users (username, email, password, role, status) 
VALUES ('admin', 'admin@voxlink.com', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin', 'online');
```

## 6. Login and Start Using

1. Go to http://localhost:3000
2. Enter your invite token and username
3. Start chatting!

## Production Deployment

For production deployment, see [Deployment Guide](docs/deployment.md).

### Quick Production Setup

```bash
# Make scripts executable
chmod +x scripts/deploy.sh
chmod +x scripts/backup.sh

# Deploy to production
./scripts/deploy.sh production
```

## Troubleshooting

### Services won't start

```bash
# Check logs
docker-compose logs

# Restart services
docker-compose restart
```

### Can't connect to voice channels

1. Check if TURN server is configured
2. Ensure ports 3478, 49152-65535 are open
3. Test TURN server: `turnutils_stunclient localhost`

### Database connection issues

```bash
# Check database status
docker-compose exec db pg_isready -U voxlink

# Reset database (WARNING: loses all data)
docker-compose down
docker volume rm voxlink_db-data
docker-compose up -d
```

## Next Steps

- [Read the full documentation](docs/)
- [Configure TURN server](docs/deployment.md#turn-server-setup)
- [Set up SSL certificates](docs/deployment.md#ssltls-configuration)
- [Configure monitoring](docs/deployment.md#monitoring)

## Support

- [FAQ](docs/faq.md) - Common questions and solutions
- [API Documentation](docs/api.md) - Complete API reference
- [GitHub Issues](https://github.com/your-org/voxlink/issues) - Bug reports and feature requests

---

**Need help?** Check the [FAQ](docs/faq.md) or open an issue on GitHub!
