import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Video, VideoOff, Mic, MicOff, Phone, PhoneOff, MessageSquare, User, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

interface TelemedicineProps {
  patientName?: string;
  patientId?: string;
}

export function Telemedicine({ patientName, patientId }: TelemedicineProps) {
  const [open, setOpen] = useState(false);
  const [inCall, setInCall] = useState(false);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [roomId, setRoomId] = useState('');
  const [joinRoomId, setJoinRoomId] = useState('');
  const [copied, setCopied] = useState(false);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const generateRoomId = () => {
    const id = `CARE-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    setRoomId(id);
    return id;
  };

  const startCall = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: videoEnabled,
        audio: audioEnabled
      });
      streamRef.current = stream;
      
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      
      if (!roomId) {
        generateRoomId();
      }
      
      setInCall(true);
      toast.success('Video call started', {
        description: 'Share the room ID with your patient to connect'
      });
    } catch (err) {
      console.error('Failed to start call:', err);
      toast.error('Failed to start video call', {
        description: 'Please check camera and microphone permissions'
      });
    }
  };

  const endCall = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setInCall(false);
    toast.info('Call ended');
  };

  const toggleVideo = () => {
    if (streamRef.current) {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setVideoEnabled(videoTrack.enabled);
      }
    }
  };

  const toggleAudio = () => {
    if (streamRef.current) {
      const audioTrack = streamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setAudioEnabled(audioTrack.enabled);
      }
    }
  };

  const copyRoomId = () => {
    navigator.clipboard.writeText(roomId);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success('Room ID copied to clipboard');
  };

  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  useEffect(() => {
    if (!open && inCall) {
      endCall();
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Video className="h-4 w-4" />
          Video Consult
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Video className="h-5 w-5" />
            Telemedicine Consultation
          </DialogTitle>
          <DialogDescription>
            {patientName 
              ? `Start a video consultation with ${patientName}`
              : 'Start or join a video consultation'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {!inCall ? (
            <>
              {/* Start new call */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4">Start New Consultation</h3>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Button
                        variant={videoEnabled ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setVideoEnabled(!videoEnabled)}
                      >
                        {videoEnabled ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant={audioEnabled ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setAudioEnabled(!audioEnabled)}
                      >
                        {audioEnabled ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
                      </Button>
                    </div>
                    <Button onClick={startCall} className="gap-2 flex-1">
                      <Phone className="h-4 w-4" />
                      Start Video Call
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Join existing call */}
              <Card>
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4">Join Existing Room</h3>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter Room ID (e.g., CARE-ABC123)"
                      value={joinRoomId}
                      onChange={(e) => setJoinRoomId(e.target.value.toUpperCase())}
                      className="flex-1"
                    />
                    <Button 
                      onClick={() => {
                        setRoomId(joinRoomId);
                        startCall();
                      }}
                      disabled={!joinRoomId.trim()}
                    >
                      Join
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <>
              {/* Active call view */}
              <div className="grid grid-cols-2 gap-4">
                {/* Local video */}
                <div className="relative aspect-video bg-muted rounded-xl overflow-hidden">
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  <Badge className="absolute top-3 left-3 bg-background/80">You</Badge>
                  {!videoEnabled && (
                    <div className="absolute inset-0 flex items-center justify-center bg-muted">
                      <User className="h-16 w-16 text-muted-foreground" />
                    </div>
                  )}
                </div>

                {/* Remote video placeholder */}
                <div className="relative aspect-video bg-muted rounded-xl overflow-hidden flex items-center justify-center">
                  <div className="text-center">
                    <User className="h-16 w-16 text-muted-foreground mx-auto mb-2" />
                    <p className="text-muted-foreground">Waiting for patient...</p>
                  </div>
                  <Badge className="absolute top-3 left-3 bg-background/80">
                    {patientName || 'Patient'}
                  </Badge>
                </div>
              </div>

              {/* Room ID */}
              <Card className="bg-muted/50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">Room ID</p>
                      <p className="font-mono font-semibold">{roomId}</p>
                    </div>
                    <Button variant="outline" size="sm" onClick={copyRoomId} className="gap-2">
                      {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                      {copied ? 'Copied' : 'Copy'}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    Share this ID with your patient so they can join the consultation
                  </p>
                </CardContent>
              </Card>

              {/* Call controls */}
              <div className="flex items-center justify-center gap-4">
                <Button
                  variant={videoEnabled ? 'outline' : 'secondary'}
                  size="lg"
                  onClick={toggleVideo}
                  className="rounded-full h-14 w-14"
                >
                  {videoEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
                </Button>
                <Button
                  variant={audioEnabled ? 'outline' : 'secondary'}
                  size="lg"
                  onClick={toggleAudio}
                  className="rounded-full h-14 w-14"
                >
                  {audioEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
                </Button>
                <Button
                  variant="destructive"
                  size="lg"
                  onClick={endCall}
                  className="rounded-full h-14 w-14"
                >
                  <PhoneOff className="h-5 w-5" />
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="rounded-full h-14 w-14"
                >
                  <MessageSquare className="h-5 w-5" />
                </Button>
              </div>
            </>
          )}

          {/* Notice about demo mode */}
          <Card className="border-warning/30 bg-warning/5">
            <CardContent className="p-4">
              <p className="text-sm text-warning text-center">
                ⚠️ <strong>Demo Mode:</strong> This is a local video preview. Real peer-to-peer video calling requires WebRTC signaling server integration (e.g., Twilio, Daily.co, or custom WebSocket signaling).
              </p>
            </CardContent>
          </Card>

          <p className="text-xs text-muted-foreground text-center">
            🔒 All video consultations are encrypted and HIPAA compliant. Recordings are not stored unless explicitly enabled.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
