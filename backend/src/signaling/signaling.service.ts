import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface TURNServer {
  urls: string[];
  username: string;
  credential: string;
}

@Injectable()
export class SignalingService {
  constructor(private configService: ConfigService) {}

  getTURNServers(): TURNServer[] {
    const turnHost = this.configService.get<string>('TURN_HOST');
    const turnUser = this.configService.get<string>('TURN_USER');
    const turnPass = this.configService.get<string>('TURN_PASS');
    const turnSecret = this.configService.get<string>('TURN_SECRET');

    if (!turnHost || !turnUser || !turnPass) {
      return [];
    }

    return [
      {
        urls: [
          `turn:${turnHost}:3478`,
          `turns:${turnHost}:5349`,
        ],
        username: turnUser,
        credential: turnPass,
      },
      {
        urls: [
          `turn:${turnHost}:3478?transport=udp`,
          `turn:${turnHost}:3478?transport=tcp`,
          `turns:${turnHost}:5349?transport=tcp`,
        ],
        username: turnUser,
        credential: turnPass,
      },
    ];
  }

  getSTUNServers(): RTCIceServer[] {
    return [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      { urls: 'stun:stun2.l.google.com:19302' },
    ];
  }

  getWebRTCConfiguration(): RTCConfiguration {
    return {
      iceServers: [
        ...this.getSTUNServers(),
        ...this.getTURNServers(),
      ],
      iceCandidatePoolSize: 10,
    };
  }

  validateSDP(sdp: string): boolean {
    // Basic SDP validation
    return sdp.includes('v=0') && sdp.includes('m=');
  }

  validateICECandidate(candidate: string): boolean {
    // Basic ICE candidate validation
    return candidate.includes('candidate:') && candidate.includes('typ ');
  }
}
