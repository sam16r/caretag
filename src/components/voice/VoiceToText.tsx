import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mic, MicOff, Square, Loader2, Copy, Check, Trash2, Save } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useQueryClient } from '@tanstack/react-query';

interface VoiceToTextProps {
  onTranscriptChange?: (text: string) => void;
  onSave?: (text: string) => void;
  placeholder?: string;
  initialValue?: string;
  label?: string;
  patientId?: string;
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: SpeechRecognitionErrorEvent) => void;
  onend: () => void;
  start: () => void;
  stop: () => void;
}

declare global {
  interface Window {
    SpeechRecognition: new () => SpeechRecognition;
    webkitSpeechRecognition: new () => SpeechRecognition;
  }
}

export function VoiceToText({
  onTranscriptChange,
  onSave,
  placeholder = 'Click the microphone to start dictating clinical notes...',
  initialValue = '',
  label = 'Clinical Notes',
  patientId,
}: VoiceToTextProps) {
  const [transcript, setTranscript] = useState(initialValue);
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [copied, setCopied] = useState(false);
  const [interimTranscript, setInterimTranscript] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    // Check if Speech Recognition is supported
    const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognitionAPI) {
      setIsSupported(false);
      return;
    }

    const recognition = new SpeechRecognitionAPI() as SpeechRecognition;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = '';
      let interim = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript + ' ';
        } else {
          interim += result[0].transcript;
        }
      }

      if (finalTranscript) {
        setTranscript((prev) => {
          const newTranscript = prev + finalTranscript;
          onTranscriptChange?.(newTranscript);
          return newTranscript;
        });
      }
      
      setInterimTranscript(interim);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error('Speech recognition error:', event.error);
      if (event.error === 'not-allowed') {
        toast.error('Microphone access denied. Please enable microphone permissions.');
      } else if (event.error !== 'aborted') {
        toast.error(`Speech recognition error: ${event.error}`);
      }
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
      setInterimTranscript('');
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.stop();
    };
  }, [onTranscriptChange]);

  const startListening = () => {
    if (!recognitionRef.current) return;

    try {
      recognitionRef.current.start();
      setIsListening(true);
      toast.success('Listening... Speak now');
    } catch (error) {
      console.error('Failed to start speech recognition:', error);
      toast.error('Failed to start voice recognition');
    }
  };

  const stopListening = () => {
    if (!recognitionRef.current) return;

    recognitionRef.current.stop();
    setIsListening(false);
    setInterimTranscript('');
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(transcript);
      setCopied(true);
      toast.success('Copied to clipboard');
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error('Failed to copy');
    }
  };

  const handleClear = () => {
    setTranscript('');
    setInterimTranscript('');
    onTranscriptChange?.('');
    toast.info('Transcript cleared');
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setTranscript(newText);
    onTranscriptChange?.(newText);
  };

  const handleSave = async () => {
    if (!transcript.trim()) {
      toast.error('Nothing to save');
      return;
    }

    if (!patientId) {
      toast.error('Patient ID is required to save voice notes');
      return;
    }

    setIsSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('You must be logged in to save notes');
        return;
      }

      const { error } = await supabase.from('medical_records').insert({
        patient_id: patientId,
        doctor_id: user.id,
        record_type: 'Voice Note',
        notes: transcript.trim(),
      });

      if (error) throw error;

      toast.success('Voice note saved successfully');
      onSave?.(transcript);
      setTranscript('');
      setInterimTranscript('');
      queryClient.invalidateQueries({ queryKey: ['medical-records', patientId] });
      queryClient.invalidateQueries({ queryKey: ['patient-timeline', patientId] });
    } catch (error: any) {
      console.error('Error saving voice note:', error);
      toast.error(error.message || 'Failed to save voice note');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isSupported) {
    return (
      <Card className="card-elevated">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <MicOff className="h-5 w-5 text-muted-foreground" />
            {label}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4">
            <MicOff className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground">
              Voice recognition is not supported in your browser.
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Please use Chrome, Edge, or Safari for voice features.
            </p>
          </div>
          <Textarea
            placeholder={placeholder}
            value={transcript}
            onChange={handleTextChange}
            className="mt-4 min-h-[150px]"
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="card-elevated">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <div className={`h-8 w-8 rounded-lg flex items-center justify-center ${isListening ? 'bg-emergency/10' : 'bg-primary/10'}`}>
              {isListening ? (
                <Mic className="h-4 w-4 text-emergency animate-pulse" />
              ) : (
                <Mic className="h-4 w-4 text-primary" />
              )}
            </div>
            {label}
            {isListening && (
              <Badge variant="destructive" className="animate-pulse">
                Recording
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            {transcript && (
              <>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleCopy}
                  className="h-8 w-8"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-success" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleClear}
                  className="h-8 w-8 text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="relative">
          <Textarea
            placeholder={placeholder}
            value={transcript + (interimTranscript ? ` ${interimTranscript}` : '')}
            onChange={handleTextChange}
            className={`min-h-[150px] pr-4 transition-all ${isListening ? 'border-emergency/50 ring-2 ring-emergency/20' : ''}`}
            disabled={isListening}
          />
          {interimTranscript && (
            <span className="absolute bottom-3 right-3 text-xs text-muted-foreground italic">
              Processing...
            </span>
          )}
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isListening ? (
              <Button
                variant="destructive"
                onClick={stopListening}
                className="gap-2"
              >
                <Square className="h-4 w-4" />
                Stop Recording
              </Button>
            ) : (
              <Button
                variant="default"
                onClick={startListening}
                className="gap-2"
              >
                <Mic className="h-4 w-4" />
                Start Dictation
              </Button>
            )}
            
            {patientId && transcript.trim() && !isListening && (
              <Button
                variant="secondary"
                onClick={handleSave}
                disabled={isSaving}
                className="gap-2"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Save className="h-4 w-4" />
                )}
                Save Note
              </Button>
            )}
          </div>

          <p className="text-xs text-muted-foreground">
            {transcript.split(/\s+/).filter(Boolean).length} words
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs text-muted-foreground bg-muted/50 p-3 rounded-lg">
          <div className="flex items-center gap-1">
            <div className={`h-2 w-2 rounded-full ${isListening ? 'bg-emergency animate-pulse' : 'bg-muted-foreground'}`} />
            <span>{isListening ? 'Listening' : 'Ready'}</span>
          </div>
          <span>•</span>
          <span>Speak clearly and naturally</span>
          <span>•</span>
          <span>Say &quot;period&quot; or &quot;comma&quot; for punctuation</span>
        </div>
      </CardContent>
    </Card>
  );
}
