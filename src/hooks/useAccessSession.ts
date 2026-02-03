import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

interface AccessSession {
  id: string;
  doctor_id: string;
  patient_id: string;
  started_at: string;
  ended_at: string | null;
  status: 'active' | 'completed' | 'expired';
  notes: string | null;
}

export function useAccessSession(patientId?: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Check if there's an active session for this patient
  const { data: activeSession, isLoading: sessionLoading } = useQuery({
    queryKey: ['access-session', patientId, user?.id],
    queryFn: async () => {
      if (!patientId || !user?.id) return null;
      
      const { data, error } = await supabase
        .from('access_sessions')
        .select('*')
        .eq('doctor_id', user.id)
        .eq('patient_id', patientId)
        .eq('status', 'active')
        .is('ended_at', null)
        .maybeSingle();

      if (error) throw error;
      return data as AccessSession | null;
    },
    enabled: !!patientId && !!user?.id,
  });

  // Start a new session (called when scanning CareTag)
  const startSessionMutation = useMutation({
    mutationFn: async (patientId: string) => {
      if (!user?.id) throw new Error('Not authenticated');

      // First, close ALL existing active sessions for this doctor (not just this patient)
      await supabase
        .from('access_sessions')
        .update({ status: 'completed', ended_at: new Date().toISOString() })
        .eq('doctor_id', user.id)
        .eq('status', 'active');

      // Create new session
      const { data, error } = await supabase
        .from('access_sessions')
        .insert({
          doctor_id: user.id,
          patient_id: patientId,
          status: 'active',
        })
        .select()
        .single();

      if (error) throw error;
      return data as AccessSession;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['access-session'] });
      queryClient.invalidateQueries({ queryKey: ['active-sessions'] });
    },
    onError: (error) => {
      console.error('Failed to start access session:', error);
      toast.error('Failed to start access session');
    },
  });

  // End session (called when submitting/closing patient record)
  const endSessionMutation = useMutation({
    mutationFn: async ({ sessionId, notes }: { sessionId: string; notes?: string }) => {
      const { error } = await supabase
        .from('access_sessions')
        .update({ 
          status: 'completed', 
          ended_at: new Date().toISOString(),
          notes: notes || null,
        })
        .eq('id', sessionId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['access-session'] });
      queryClient.invalidateQueries({ queryKey: ['active-sessions'] });
      toast.success('Session ended successfully');
    },
    onError: (error) => {
      console.error('Failed to end access session:', error);
      toast.error('Failed to end session');
    },
  });

  const startSession = useCallback((patientId: string) => {
    return startSessionMutation.mutateAsync(patientId);
  }, [startSessionMutation]);

  const endSession = useCallback((sessionId: string, notes?: string) => {
    return endSessionMutation.mutateAsync({ sessionId, notes });
  }, [endSessionMutation]);

  return {
    activeSession,
    sessionLoading,
    hasActiveSession: !!activeSession,
    startSession,
    endSession,
    isStarting: startSessionMutation.isPending,
    isEnding: endSessionMutation.isPending,
  };
}

// Hook to get all active sessions for the current doctor
export function useActiveSessions() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['active-sessions', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from('access_sessions')
        .select(`
          *,
          patients:patient_id (
            id,
            full_name,
            caretag_id,
            emergency_contact_name,
            emergency_contact_phone
          )
        `)
        .eq('doctor_id', user.id)
        .eq('status', 'active')
        .is('ended_at', null)
        .order('started_at', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!user?.id,
  });
}
