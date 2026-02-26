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
import { Logger, UseGuards } from '@nestjs/common';
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
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  },
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
  ) {}

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway initialized');
  }

  async handleConnection(client: AuthenticatedSocket) {
    try {
      // Authenticate user from JWT token
      const token = client.handshake.auth.token || client.handshake.headers.authorization?.replace('Bearer ', '');
      
      if (!token) {
        this.logger.warn('Connection rejected: No token provided');
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token);
      const user = await this.usersService.findById(payload.sub);
      
      if (!user) {
        this.logger.warn('Connection rejected: Invalid user');
        client.disconnect();
        return;
      }

      client.user = user;
      await this.usersService.updateStatus(user.id, 'online');
      
      this.logger.log(`User ${user.username} connected`);
      
      // Join user to their personal room
      await client.join(`user_${user.id}`);
      
      // Notify about user presence
      this.server.emit('presence_update', {
        userId: user.id,
        username: user.username,
        status: 'online',
      });

    } catch (error) {
      this.logger.error('Connection error:', error);
      client.disconnect();
    }
  }

  async handleDisconnect(client: AuthenticatedSocket) {
    if (client.user) {
      await this.usersService.updateStatus(client.user.id, 'offline');
      
      this.logger.log(`User ${client.user.username} disconnected`);
      
      // Notify about user presence
      this.server.emit('presence_update', {
        userId: client.user.id,
        username: client.user.username,
        status: 'offline',
      });
    }
  }

  @SubscribeMessage('join_channel')
  async handleJoinChannel(
    @MessageBody() data: { channelId: string; token: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    try {
      if (!client.user) {
        client.emit('error', { message: 'Not authenticated' });
        return;
      }

      const channel = await this.channelsService.findOne(data.channelId, client.user);
      
      // Join the channel room
      await client.join(`channel_${data.channelId}`);
      
      // Get channel members
      const members = await this.websocketService.getChannelMembers(data.channelId);
      
      // Notify channel about new member
      this.server.to(`channel_${data.channelId}`).emit('channel_joined', {
        channelId: data.channelId,
        user: {
          id: client.user.id,
          username: client.user.username,
          avatar: client.user.avatar,
        },
        members,
      });

      // Send recent messages to the new member
      const messages = await this.messagesService.findAll(data.channelId, client.user, 50);
      client.emit('channel_messages', {
        channelId: data.channelId,
        messages: messages.reverse(), // Send in chronological order
      });

    } catch (error) {
      client.emit('error', { message: error?.message || 'Unknown error' });
    }
  }

  @SubscribeMessage('leave_channel')
  async handleLeaveChannel(
    @MessageBody() data: { channelId: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    if (!client.user) {
      client.emit('error', { message: 'Not authenticated' });
      return;
    }

    await client.leave(`channel_${data.channelId}`);
    
    // Notify channel about member leaving
    this.server.to(`channel_${data.channelId}`).emit('channel_left', {
      channelId: data.channelId,
      userId: client.user.id,
      username: client.user.username,
    });
  }

  @SubscribeMessage('send_message')
  async handleSendMessage(
    @MessageBody() data: { channelId: string; content: string; attachments?: any[]; replyToId?: string },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    try {
      if (!client.user) {
        client.emit('error', { message: 'Not authenticated' });
        return;
      }

      const message = await this.messagesService.create({
        content: data.content,
        attachments: data.attachments,
        replyToId: data.replyToId,
      }, client.user, data.channelId);

      // Broadcast message to channel
      this.server.to(`channel_${data.channelId}`).emit('message', {
        id: message.id,
        channelId: data.channelId,
        content: message.content,
        attachments: message.attachments,
        replyToId: message.replyToId,
        author: {
          id: client.user.id,
          username: client.user.username,
          avatar: client.user.avatar,
        },
        createdAt: message.createdAt,
      });

    } catch (error) {
      client.emit('error', { message: error?.message || 'Unknown error' });
    }
  }

  @SubscribeMessage('typing')
  async handleTyping(
    @MessageBody() data: { channelId: string; isTyping: boolean },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    if (!client.user) {
      return;
    }

    // Broadcast typing status to channel (except sender)
    client.to(`channel_${data.channelId}`).emit('typing', {
      channelId: data.channelId,
      userId: client.user.id,
      username: client.user.username,
      isTyping: data.isTyping,
    });
  }

  @SubscribeMessage('signal')
  async handleSignal(
    @MessageBody() data: { to: string; data: any },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    if (!client.user) {
      client.emit('error', { message: 'Not authenticated' });
      return;
    }

    // Forward signaling data to target user
    this.server.to(`user_${data.to}`).emit('signal', {
      from: client.user.id,
      data: data.data,
    });
  }

  @SubscribeMessage('webrtc_offer')
  async handleWebRTCOffer(
    @MessageBody() data: { to: string; offer: RTCSessionDescriptionInit },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    if (!client.user) {
      client.emit('error', { message: 'Not authenticated' });
      return;
    }

    this.server.to(`user_${data.to}`).emit('webrtc_offer', {
      from: client.user.id,
      offer: data.offer,
    });
  }

  @SubscribeMessage('webrtc_answer')
  async handleWebRTCAnswer(
    @MessageBody() data: { to: string; answer: RTCSessionDescriptionInit },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    if (!client.user) {
      client.emit('error', { message: 'Not authenticated' });
      return;
    }

    this.server.to(`user_${data.to}`).emit('webrtc_answer', {
      from: client.user.id,
      answer: data.answer,
    });
  }

  @SubscribeMessage('webrtc_ice')
  async handleWebRTCIce(
    @MessageBody() data: { to: string; candidate: RTCIceCandidateInit },
    @ConnectedSocket() client: AuthenticatedSocket,
  ) {
    if (!client.user) {
      client.emit('error', { message: 'Not authenticated' });
      return;
    }

    this.server.to(`user_${data.to}`).emit('webrtc_ice', {
      from: client.user.id,
      candidate: data.candidate,
    });
  }
}
