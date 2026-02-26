import { useState, useRef, useEffect } from 'react';
import { Monitor, X, Maximize2, Volume2, VolumeX } from 'lucide-react';
import { usePeerConnection } from '@/hooks/usePeerConnection';
import { wsService } from '@/services/websocket';

interface ScreenShareProps {
  channelId: string;
  userId: string;
  onClose: () => void;
}

export function ScreenShare({ channelId, userId, onClose }: ScreenShareProps) {
  const [isSharing, setIsSharing] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);

  const startScreenShare = async () => {
    try {
      setError(null);
      
      // Get screen capture stream
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 30 },
        },
        audio: true,
      });

      streamRef.current = stream;

      // Set up video element
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }

      // Set up WebRTC peer connection for screen sharing
      const pc = new RTCPeerConnection({
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'turn:yourdomain.com:3478', username: 'turnuser', credential: 'turnpass' },
        ],
      });

      peerConnectionRef.current = pc;

      // Add screen stream tracks
      stream.getTracks().forEach(track => {
        pc.addTrack(track, stream);
      });

      // Handle ICE candidates
      pc.onicecandidate = (event) => {
        if (event.candidate) {
          wsService.sendIceCandidate(userId, event.candidate);
        }
      };

      // Handle connection state changes
      pc.onconnectionstatechange = () => {
        console.log('Screen share connection state:', pc.connectionState);
        if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
          stopScreenShare();
        }
      };

      // Handle stream end (user stops sharing)
      stream.getVideoTracks()[0].onended = () => {
        stopScreenShare();
      };

      setIsSharing(true);

      // Notify other users about screen share
      wsService.getSocket()?.emit('screen_share_started', {
        channelId,
        userId,
        streamId: `screen_${userId}_${Date.now()}`,
      });

    } catch (err: any) {
      setError(err.message);
      console.error('Failed to start screen share:', err);
    }
  };

  const stopScreenShare = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsSharing(false);
    setError(null);

    // Notify other users
    wsService.getSocket()?.emit('screen_share_stopped', {
      channelId,
      userId,
    });

    onClose();
  };

  const toggleMute = () => {
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach(track => {
        track.enabled = !track.enabled;
      });
      setIsMuted(!isMuted);
    }
  };

  const toggleFullscreen = () => {
    if (videoRef.current) {
      if (!document.fullscreenElement) {
        videoRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  useEffect(() => {
    return () => {
      stopScreenShare();
    };
  }, []);

  if (!isSharing) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Start Screen Sharing
          </h3>
          
          {error && (
            <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}

          <p className="text-gray-600 mb-6">
            Share your screen with other users in the channel. You can share your entire screen or a specific application.
          </p>

          <div className="flex space-x-3">
            <button
              onClick={startScreenShare}
              className="flex-1 btn-primary flex items-center justify-center"
            >
              <Monitor className="w-4 h-4 mr-2" />
              Share Screen
            </button>
            <button
              onClick={onClose}
              className="btn-secondary"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`fixed inset-0 bg-black z-50 ${isFullscreen ? '' : 'm-4 rounded-lg overflow-hidden'}`}>
      {/* Controls overlay */}
      <div className="absolute top-4 right-4 z-10 flex space-x-2">
        <button
          onClick={toggleMute}
          className={`p-2 rounded-md transition-colors ${
            isMuted 
              ? 'bg-red-600 text-white hover:bg-red-700' 
              : 'bg-gray-800 text-white hover:bg-gray-700'
          }`}
        >
          {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
        </button>
        
        <button
          onClick={toggleFullscreen}
          className="p-2 rounded-md bg-gray-800 text-white hover:bg-gray-700 transition-colors"
        >
          <Maximize2 className="w-5 h-5" />
        </button>
        
        <button
          onClick={stopScreenShare}
          className="p-2 rounded-md bg-red-600 text-white hover:bg-red-700 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Status indicator */}
      <div className="absolute top-4 left-4 z-10">
        <div className="bg-red-600 text-white px-3 py-1 rounded-full text-sm font-medium">
          ● Live
        </div>
      </div>

      {/* Video element */}
      <video
        ref={videoRef}
        className="w-full h-full object-contain"
        autoPlay
        muted={false}
        playsInline
      />

      {/* Instructions */}
      <div className="absolute bottom-4 left-4 z-10 bg-black bg-opacity-75 text-white p-3 rounded-lg">
        <p className="text-sm">
          Screen sharing active. Click the X button to stop sharing.
        </p>
      </div>
    </div>
  );
}
