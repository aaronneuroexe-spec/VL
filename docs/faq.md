# VoxLink FAQ

Frequently asked questions about VoxLink platform.

## General Questions

### What is VoxLink?

VoxLink is a modern voice communication platform designed for communities and guilds. It provides high-quality voice chat, text messaging, and event management features.

### What makes VoxLink different from Discord/Slack?

- **WebRTC-based**: Direct peer-to-peer connections for better voice quality
- **Self-hosted**: Complete control over your data and privacy
- **Lightweight**: Minimal resource usage compared to other platforms
- **Customizable**: Open-source with extensive customization options

### Is VoxLink free to use?

Yes, VoxLink is open-source and free to use. You can host it on your own server at no cost.

## Installation & Setup

### What are the system requirements?

**Minimum Requirements:**
- 2 CPU cores
- 4GB RAM
- 20GB storage
- Ubuntu 20.04+ or CentOS 8+

**Recommended:**
- 4+ CPU cores
- 8GB+ RAM
- 50GB+ SSD storage
- Public IP address for TURN server

### Can I run VoxLink on a VPS?

Yes, VoxLink is designed to run on VPS providers like DigitalOcean, Linode, AWS, or any cloud provider.

### Do I need a domain name?

While not strictly required, a domain name is recommended for:
- SSL certificates
- TURN server functionality
- Professional appearance

## Technical Questions

### What technologies does VoxLink use?

**Backend:**
- Node.js 20+
- NestJS framework
- PostgreSQL database
- Redis for caching
- Socket.IO for WebSocket

**Frontend:**
- React 18
- TypeScript
- Vite build tool
- Tailwind CSS
- WebRTC for voice

### How does WebRTC work in VoxLink?

VoxLink uses WebRTC for peer-to-peer voice communication:
1. Users connect through WebSocket for signaling
2. WebRTC establishes direct audio connections
3. TURN server helps with NAT traversal
4. Up to 6 users can connect P2P, then switches to SFU

### What is a TURN server and why do I need it?

A TURN server helps users behind restrictive firewalls or NAT to connect via WebRTC. It's essential for:
- Corporate networks
- Mobile networks
- Some home routers
- Public WiFi connections

## Voice Communication

### How many people can join a voice channel?

- **P2P mode**: Up to 6 users for optimal quality
- **SFU mode**: 50+ users (planned feature)
- **Current limit**: 6 users per voice channel

### What audio codecs are supported?

- **Primary**: Opus codec (high quality, low latency)
- **Fallback**: G.711 for compatibility
- **Bitrate**: 64kbps to 128kbps adaptive

### Can I record voice conversations?

Recording functionality is available for administrators. Recordings are stored locally and can be exported.

### How do I fix audio quality issues?

1. **Check your internet connection** - stable connection is crucial
2. **Close other applications** - reduce CPU/memory usage
3. **Use wired connection** - avoid WiFi if possible
4. **Check TURN server** - ensure it's properly configured
5. **Update browser** - use latest Chrome/Firefox

## User Management

### How do I invite users?

**Method 1: Invite Tokens**
1. Admin creates invite token via API or admin panel
2. Share token with new users
3. Users enter token + username to join

**Method 2: Magic Links**
1. Admin creates magic link invite
2. Link sent via email
3. Users click link to join automatically

### Can I import users from other platforms?

Currently, manual import is supported via API. Bulk import tools are planned for future releases.

### How do I manage user permissions?

User roles and permissions are managed through:
- **Admin**: Full system access
- **Moderator**: Channel management
- **Member**: Basic user access
- **Banned**: Restricted access

## Security & Privacy

### Is my data secure?

Yes, VoxLink prioritizes security:
- **Encrypted communication**: All data encrypted in transit
- **Self-hosted**: Your data stays on your server
- **No telemetry**: No data sent to external services
- **Regular updates**: Security patches and updates

### Can I enable 2FA?

Two-factor authentication is planned for future releases. Currently, JWT tokens provide secure authentication.

### How do I backup my data?

Use the built-in backup script:
```bash
./scripts/backup.sh backup
```

Backups include:
- Database (users, messages, channels)
- Configuration files
- User uploads (if any)

## Troubleshooting

### WebSocket connection failed

**Common causes:**
1. **Firewall blocking ports** - ensure ports 4000, 3478 are open
2. **Proxy issues** - check nginx configuration
3. **SSL problems** - verify certificate validity
4. **Token expired** - refresh authentication

**Solutions:**
```bash
# Check if ports are open
sudo ufw status
sudo netstat -tlnp | grep :4000

# Test WebSocket connection
curl -i -N -H "Connection: Upgrade" -H "Upgrade: websocket" http://localhost:4000/ws
```

### Voice not working

**Checklist:**
1. **Microphone permissions** - allow browser access
2. **TURN server** - verify configuration and connectivity
3. **Browser compatibility** - use Chrome/Firefox latest
4. **Network issues** - test with different network

**Test TURN server:**
```bash
# Install turnutils
sudo apt install coturn-utils

# Test TURN server
turnutils_stunclient yourdomain.com
```

### Database connection errors

**Common solutions:**
```bash
# Check database status
docker-compose logs db

# Test connection
docker-compose exec db psql -U voxlink -d voxlink -c "SELECT 1;"

# Reset database (WARNING: loses data)
docker-compose down
docker volume rm voxlink_db-data
docker-compose up -d
```

### High memory usage

**Optimization steps:**
1. **Limit concurrent connections**
2. **Optimize database queries**
3. **Enable Redis caching**
4. **Monitor resource usage**

```bash
# Check memory usage
docker stats

# Restart services
docker-compose restart
```

## Performance & Scaling

### How many concurrent users can VoxLink handle?

**Current limits:**
- **Text channels**: 1000+ concurrent users
- **Voice channels**: 6 users per channel
- **Total platform**: 500+ users (depending on server specs)

**Scaling factors:**
- Server hardware
- Network bandwidth
- Database performance
- TURN server capacity

### Can I run multiple VoxLink instances?

Yes, you can run multiple instances with:
- **Load balancer**: Distribute users across instances
- **Shared database**: Use external PostgreSQL
- **Shared Redis**: Use external Redis cluster

### How do I monitor performance?

Built-in monitoring includes:
- **Health endpoints**: `/health` and `/metrics`
- **Prometheus metrics**: For detailed monitoring
- **Application logs**: Structured logging with Winston

## Development & Customization

### Can I customize the UI?

Yes, VoxLink is fully customizable:
- **React components**: Modify frontend components
- **Tailwind CSS**: Customize styling
- **Theme system**: Built-in dark/light themes
- **PWA features**: Customizable manifest

### How do I contribute to development?

1. **Fork repository** on GitHub
2. **Create feature branch**
3. **Make changes** with tests
4. **Submit pull request**

### Can I add custom features?

Absolutely! VoxLink is designed for extensibility:
- **Plugin system**: Add custom modules
- **API extensions**: Custom endpoints
- **WebSocket events**: Custom real-time features
- **Database schema**: Custom entities

## Support & Community

### Where can I get help?

- **GitHub Issues**: Bug reports and feature requests
- **Documentation**: Comprehensive guides and API docs
- **Community Discord**: Real-time support (coming soon)
- **Email Support**: For enterprise users

### How do I report bugs?

1. **Check existing issues** on GitHub
2. **Create new issue** with details:
   - VoxLink version
   - Server specifications
   - Error logs
   - Steps to reproduce

### Is there a roadmap?

Yes, upcoming features include:
- **SFU support**: For larger voice channels
- **Mobile apps**: iOS and Android clients
- **Video calling**: WebRTC video support
- **Advanced moderation**: Automated content filtering
- **Integrations**: Discord/Slack migration tools

## Migration

### Can I migrate from Discord?

Migration tools are planned for future releases. Current options:
- **Manual export**: Export Discord data
- **API import**: Use VoxLink import API
- **Third-party tools**: Community-developed tools

### Can I migrate from Slack?

Similar to Discord, migration tools are in development. Manual migration via API is currently supported.

### What data can I migrate?

**Supported:**
- User accounts and profiles
- Channel structure
- Message history
- File attachments

**Not supported yet:**
- Voice recordings
- Custom emojis
- Bot integrations
- Workflow automations
