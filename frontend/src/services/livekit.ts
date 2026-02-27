import {
  Room,
  RoomEvent,
  Track,
  LocalParticipant,
  RemoteParticipant,
  Participant,
  ConnectionState,
  createLocalAudioTrack,
} from 'livekit-client';

export interface VoiceParticipant {
  identity: string;
  name?: string;
  isSpeaking: boolean;
  isMuted: boolean;
  isLocal: boolean;
  audioTrack?: MediaStreamTrack;
}

type ParticipantsCallback = (participants: VoiceParticipant[]) => void;
type StateCallback = (state: ConnectionState) => void;

class LiveKitService {
  private room: Room | null = null;
  private onParticipantsChange: ParticipantsCallback | null = null;
  private onStateChange: StateCallback | null = null;

  // ─── Подключиться к голосовому каналу ────────────────────────────────────

  async connect(url: string, token: string): Promise<void> {
    if (this.room) {
      await this.room.disconnect();
    }

    this.room = new Room({
      adaptiveStream: true,
      dynacast: true,
      audioCaptureDefaults: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });

    this.attachListeners();

    await this.room.connect(url, token);
    await this.room.localParticipant.setMicrophoneEnabled(true);
  }

  // ─── Отключиться ──────────────────────────────────────────────────────────

  async disconnect(): Promise<void> {
    if (this.room) {
      await this.room.disconnect();
      this.room = null;
    }
  }

  // ─── Мут / анмут ─────────────────────────────────────────────────────────

  setMicEnabled(enabled: boolean): void {
    this.room?.localParticipant.setMicrophoneEnabled(enabled);
  }

  isMicEnabled(): boolean {
    return this.room?.localParticipant.isMicrophoneEnabled ?? false;
  }

  // ─── Screen share ─────────────────────────────────────────────────────────

  async setScreenShareEnabled(enabled: boolean): Promise<void> {
    await this.room?.localParticipant.setScreenShareEnabled(enabled);
  }

  // ─── Deaf — глушим все входящие треки ────────────────────────────────────

  setDeafened(deafened: boolean): void {
    if (!this.room) return;
    this.room.remoteParticipants.forEach((p) => {
      p.getTrackPublications().forEach((pub) => {
        if (pub.kind === Track.Kind.Audio && pub.track) {
          pub.track.mediaStreamTrack.enabled = !deafened;
        }
      });
    });
  }

  // ─── Подключиться к whisper комнате (отдельная Room) ─────────────────────

  async connectWhisper(url: string, token: string): Promise<Room> {
    const whisperRoom = new Room();
    await whisperRoom.connect(url, token);
    return whisperRoom;
  }

  // ─── Текущее состояние ────────────────────────────────────────────────────

  getConnectionState(): ConnectionState {
    return this.room?.state ?? ConnectionState.Disconnected;
  }

  getParticipants(): VoiceParticipant[] {
    if (!this.room) return [];
    return this.buildParticipantList();
  }

  // ─── Подписка на изменения ────────────────────────────────────────────────

  onParticipants(cb: ParticipantsCallback): void {
    this.onParticipantsChange = cb;
    // Сразу отдаём текущий список
    if (this.room) cb(this.buildParticipantList());
  }

  onState(cb: StateCallback): void {
    this.onStateChange = cb;
    if (this.room) cb(this.room.state);
  }

  // ─── Приватные хелперы ────────────────────────────────────────────────────

  private attachListeners(): void {
    if (!this.room) return;

    const sync = () => {
      this.onParticipantsChange?.(this.buildParticipantList());
    };

    this.room
      .on(RoomEvent.ConnectionStateChanged, (state) => {
        this.onStateChange?.(state);
      })
      .on(RoomEvent.ParticipantConnected, sync)
      .on(RoomEvent.ParticipantDisconnected, sync)
      .on(RoomEvent.TrackSubscribed, sync)
      .on(RoomEvent.TrackUnsubscribed, sync)
      .on(RoomEvent.ActiveSpeakersChanged, sync)
      .on(RoomEvent.LocalTrackPublished, sync)
      .on(RoomEvent.LocalTrackUnpublished, sync);
  }

  private participantToState(p: Participant): VoiceParticipant {
    const pub = p.getTrackPublication(Track.Source.Microphone);
    return {
      identity: p.identity,
      name: p.name,
      isSpeaking: p.isSpeaking,
      isMuted: !p.isMicrophoneEnabled,
      isLocal: p instanceof LocalParticipant,
      audioTrack: pub?.track?.mediaStreamTrack,
    };
  }

  private buildParticipantList(): VoiceParticipant[] {
    if (!this.room) return [];
    const list: VoiceParticipant[] = [
      this.participantToState(this.room.localParticipant),
    ];
    this.room.remoteParticipants.forEach((p) =>
      list.push(this.participantToState(p)),
    );
    return list;
  }
}

export const livekitService = new LiveKitService();
export default livekitService;
