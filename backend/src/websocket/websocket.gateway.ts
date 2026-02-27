import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
} from '@nestjs/websockets';
import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { WebsocketService } from './websocket.service';
import { MessagesService } from '../messages/messages.service';
import { ChannelsService } from '../channels/channels.service';
import { UsersService } from '../users/users.service';
import { User } from '../users/entities/user.entity';

interface AuthenticatedSocket extends Socket {
  user?: User;
}

@WebSocketGateway({
  // CORS will be configured at runtime in afterInit using ConfigService to avoid process.env usage in decorators
  transports: ['polling', 'websocket'],
  namespace: '/',
})
export class WebsocketGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(WebsocketGateway.name);

  constructor(
    private jwtService: JwtService,
    private websocketService: WebsocketService,
    private messagesService: MessagesService,
    private channelsService: ChannelsService,
    private usersService: UsersService,
    private configService: ConfigService,
  ) {}

  afterInit(server: Server) {
    try {
      const frontendUrl = this.configService.get<string>('FRONTEND_URL');
      const nodeEnv = this.configService.get<string>('NODE_ENV', 'development');

      let origin = frontendUrl;
      if (!origin && nodeEnv !== 'production') {
        origin = 'http://localhost:3000';
      }

      const corsOptions = {
        origin,
        credentials: true,
        methods: ['GET', 'POST'],
      };

      // Apply to engine.io options if present
      // (engine.opts.cors) or socket.io server opts (server.opts.cors)
      try {
        if ((server as any).engine && (server as any).engine.opts) {
          (server as any).engine.opts.cors = { ...(server as any).engine.opts.cors, ...corsOptions };
        }
      } catch {}

      try {
        if ((server as any).opts) {
          (server as any).opts.cors = { ...(server as any).opts.cors, ...corsOptions };
        }
      } catch {}

      this.logger.log('WebSocket Gateway initialized');
    } catch (e) {
      this.logger.error('Failed to configure WebSocket CORS', e as any);
    }
  }

  // ─── Подключение / отключение ────────────────────────────────────────────

  async handleConnection(client: AuthenticatedSocket) {
    try {
      // Extract token from auth payload or Authorization header (supporting "Bearer <token>" case-insensitive)
      let token = client.handshake.auth?.token;
      const authHeader = client.handshake.headers.authorization as string | undefined;

      if (!token && authHeader) {
        const parts = authHeader.split(' ');
        if (parts.length === 2 && /^Bearer$/i.test(parts[0])) {
          token = parts[1];
        } else {
          token = authHeader;
        }
      }

      // Fallback: support token passed via query string during handshake (e.g., ?token=...)
      if (!token && client.handshake.query) {
        const q = client.handshake.query as any;
        if (q.token && typeof q.token === 'string') {
          token = q.token;
        }
      }

      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);
      const user = await this.usersService.findById(payload.sub);

      if (!user) {
        client.disconnect();
        return;
      }

      // Attach found user both to `client.user` (legacy in this codebase) and `client.data.user` (socket.io standard)
      client.user = user;
      try {
        (client as any).data = (client as any).data || {};
        (client as any).data.user = user;
      } catch {}
      await this.usersService.updateStatus(user.id, 'online');
      await client.join(`user:${user.id}`);

      this.server.emit('presence', { userId: user.id, status: 'online' });
      this.logger.log(`${user.username} connected`);
    } catch (e) {
      this.logger.warn(`WebSocket auth failed: ${e?.message ?? e}`);
      client.disconnect();
    }
  }

  async handleDisconnect(client: AuthenticatedSocket) {
    if (client.user) {
      await this.usersService.updateStatus(client.user.id, 'offline');
      this.server.emit('presence', { userId: client.user.id, status: 'offline' });
      this.logger.log(`${client.user.username} disconnected`);
    }
  }

  // ─── Каналы ───────────────────────────────────────────────────────────────

  @SubscribeMessage('channel:join')
  async handleJoinChannel(
    @MessageBody() data: { channelId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    if (!client.user) return;

    try {
      const channel = await this.channelsService.findOne(data.channelId, client.user);
      await client.join(`channel:${data.channelId}`);

      const members = await this.websocketService.getChannelMembers(data.channelId);
      const messages = await this.messagesService.findAll(data.channelId, client.user, 50);

      this.server.to(`channel:${data.channelId}`).emit('channel:member_joined', {
        channelId: data.channelId,
        user: { id: client.user.id, username: client.user.username, avatar: client.user.avatar },
      });

      client.emit('channel:ready', {
        channelId: data.channelId,
        messages: messages.reverse(),
        members,
      });
    } catch (e) {
      client.emit('error', { message: e?.message });
    }
  }

  @SubscribeMessage('channel:leave')
  async handleLeaveChannel(
    @MessageBody() data: { channelId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    if (!client.user) return;
    await client.leave(`channel:${data.channelId}`);
    this.server.to(`channel:${data.channelId}`).emit('channel:member_left', {
      channelId: data.channelId,
      userId: client.user.id,
    });
  }

  // ─── Сообщения ────────────────────────────────────────────────────────────

  @SubscribeMessage('message:send')
  async handleSendMessage(
    @MessageBody() data: { channelId: string; content: string; attachments?: any[]; replyToId?: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    if (!client.user) return;

    try {
      const message = await this.messagesService.create(
        { content: data.content, attachments: data.attachments, replyToId: data.replyToId },
        client.user,
        data.channelId,
      );

      this.server.to(`channel:${data.channelId}`).emit('message:new', {
        id: message.id,
        channelId: data.channelId,
        content: message.content,
        attachments: message.attachments,
        replyToId: message.replyToId,
        author: { id: client.user.id, username: client.user.username, avatar: client.user.avatar },
        createdAt: message.createdAt,
      });
    } catch (e) {
      client.emit('error', { message: e?.message });
    }
  }

  // ─── Typing indicator ────────────────────────────────────────────────────

  @SubscribeMessage('typing:start')
  handleTypingStart(
    @MessageBody() data: { channelId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    if (!client.user) return;
    client.to(`channel:${data.channelId}`).emit('typing', {
      channelId: data.channelId,
      userId: client.user.id,
      username: client.user.username,
      isTyping: true,
    });
  }

  @SubscribeMessage('typing:stop')
  handleTypingStop(
    @MessageBody() data: { channelId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    if (!client.user) return;
    client.to(`channel:${data.channelId}`).emit('typing', {
      channelId: data.channelId,
      userId: client.user.id,
      username: client.user.username,
      isTyping: false,
    });
  }

  // ─── Guild presence ───────────────────────────────────────────────────────

  @SubscribeMessage('guild:join')
  async handleGuildJoin(
    @MessageBody() data: { guildId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    if (!client.user) return;
    await client.join(`guild:${data.guildId}`);
  }

  @SubscribeMessage('guild:leave')
  async handleGuildLeave(
    @MessageBody() data: { guildId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    if (!client.user) return;
    await client.leave(`guild:${data.guildId}`);
  }

  // ─── Voice presence (только присутствие, аудио идёт через LiveKit) ───────

  @SubscribeMessage('voice:joined')
  handleVoiceJoined(
    @MessageBody() data: { channelId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    if (!client.user) return;
    this.server.to(`channel:${data.channelId}`).emit('voice:participant_joined', {
      channelId: data.channelId,
      user: { id: client.user.id, username: client.user.username, avatar: client.user.avatar },
    });
  }

  @SubscribeMessage('voice:left')
  handleVoiceLeft(
    @MessageBody() data: { channelId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    if (!client.user) return;
    this.server.to(`channel:${data.channelId}`).emit('voice:participant_left', {
      channelId: data.channelId,
      userId: client.user.id,
    });
  }
}

