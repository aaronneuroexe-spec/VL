declare module 'livekit-client' {
  export function connect(url: string, token: string, opts?: any): Promise<Room>;

  export class Room {
    localParticipant: any;
    on(event: string, cb: (...args: any[]) => void): void;
    disconnect(): void;
  }

  export class LocalAudioTrack {
    constructor(track: MediaStreamTrack);
  }

  export interface Participant { [key: string]: any }
  export interface TrackPublication { [key: string]: any }
  export interface RemoteTrack { [key: string]: any }

  export default {
    connect: connect,
    Room: Room,
    LocalAudioTrack: LocalAudioTrack,
  };
}
