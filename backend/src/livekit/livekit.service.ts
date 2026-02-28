import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AccessToken,
  RoomServiceClient,
  VideoGrant,
} from 'livekit-server-sdk';

@Injectable()
export class LiveKitService {
  private readonly logger = new Logger(LiveKitService.name);
  private roomService: RoomServiceClient;

  constructor(private config: ConfigService) {
    const httpUrl = this.livekitUrl.replace(/^ws/, 'http');
    this.roomService = new RoomServiceClient(httpUrl, this.apiKey, this.apiSecret);
  }

  private get apiKey(): string {
    return this.config.get<string>('LIVEKIT_API_KEY');
  }

  private get apiSecret(): string {
    return this.config.get<string>('LIVEKIT_API_SECRET');
  }

  private get livekitUrl(): string {
    return this.config.get<string>('LIVEKIT_URL', 'ws://localhost:7880');
  }

  /**
   * Создать токен для участника голосового/видео канала.
   * Без VideoGrant токен бесполезен — это был критический баг.
   */
  async createToken(
    room: string,
    identity: string,
    opts: {
      canPublish?: boolean;
      canSubscribe?: boolean;
      canPublishData?: boolean;
      ttl?: string;
    } = {},
  ): Promise<{ token: string; url: string }> {
    const at = new AccessToken(this.apiKey, this.apiSecret, {
      identity,
      ttl: opts.ttl ?? '4h',
    });

    const grant: VideoGrant = {
      roomJoin: true,
      room,
      canPublish: opts.canPublish ?? true,
      canSubscribe: opts.canSubscribe ?? true,
      canPublishData: opts.canPublishData ?? true,
    };

    at.addGrant(grant);

    const token = await at.toJwt();
    this.logger.debug(`Token created for identity=${identity} room=${room}`);

    return { token, url: this.livekitUrl };
  }

  /**
   * Токен только на прослушивание — для whisper-таргетов, наблюдателей.
   */
  createViewerToken(room: string, identity: string): Promise<{ token: string; url: string }> {
    return this.createToken(room, identity, {
      canPublish: false,
      canSubscribe: true,
      canPublishData: false,
    });
  }

  /**
   * Имя комнаты по channelId — единый формат во всём приложении.
   */
  roomName(channelId: string): string {
    return `channel:${channelId}`;
  }

  /**
   * Имя whisper-комнаты — живёт 10 минут, удаляется после.
   */
  whisperRoomName(fromUserId: string): string {
    return `whisper:${fromUserId}:${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
  }

  async getParticipants(roomName: string) {
    try {
      return await this.roomService.listParticipants(roomName);
    } catch {
      return [];
    }
  }

  async removeParticipant(roomName: string, identity: string): Promise<void> {
    try {
      await this.roomService.removeParticipant(roomName, identity);
    } catch (e) {
      this.logger.warn(`removeParticipant failed: ${e.message}`);
    }
  }

  async deleteRoom(roomName: string): Promise<void> {
    try {
      await this.roomService.deleteRoom(roomName);
    } catch (e) {
      this.logger.warn(`deleteRoom failed: ${e.message}`);
    }
  }
}


