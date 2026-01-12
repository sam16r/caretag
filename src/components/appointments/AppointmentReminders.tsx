import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Bell,
  Clock,
  Send,
  CheckCircle,
  Calendar,
  Phone,
  Mail,
  Loader2,
} from 'lucide-react';
import { format, addHours, isWithinInterval, addDays } from 'date-fns';
import { toast } from 'sonner';

interface ReminderSettings {
  sms24h: boolean;
  sms1h: boolean;
  email24h: boolean;
  email1h: boolean;
}

export function AppointmentReminders() {
  const queryClient = useQueryClient();
  const [settings, setSettings] = useState<ReminderSettings>(() => {
    const saved = localStorage.getItem('reminder-settings');
    return saved ? JSON.parse(saved) : {
      sms24h: true,
      sms1h: true,
      email24h: true,
      email1h: false,
    };
  });

  // Fetch upcoming appointments that need reminders
  const { data: upcomingAppointments, isLoading } = useQuery({
    queryKey: ['upcoming-appointments-reminders'],
    queryFn: async () => {
      const now = new Date();
      const tomorrow = addDays(now, 1);
      
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          patients:patient_id (
            full_name,
            phone,
            email
          )
        `)
        .gte('scheduled_at', now.toISOString())
        .lte('scheduled_at', tomorrow.toISOString())
        .eq('status', 'scheduled')
        .order('scheduled_at', { ascending: true });

      if (error) throw error;
      return data;
    },
  });

  // Send reminder mutation
  const sendReminderMutation = useMutation({
    mutationFn: async ({ appointmentId, reminderType }: { appointmentId: string; reminderType: string }) => {
      const { data, error } = await supabase.functions.invoke('send-appointment-reminder', {
        body: { appointmentId, reminderType },
      });

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      toast.success('Reminder sent successfully');
      queryClient.invalidateQueries({ queryKey: ['upcoming-appointments-reminders'] });
    },
    onError: (error) => {
      console.error('Failed to send reminder:', error);
      toast.error('Failed to send reminder');
    },
  });

  const updateSettings = (key: keyof ReminderSettings, value: boolean) => {
    const newSettings = { ...settings, [key]: value };
    setSettings(newSettings);
    localStorage.setItem('reminder-settings', JSON.stringify(newSettings));
    toast.success('Reminder settings updated');
  };

  const getTimeUntilAppointment = (scheduledAt: string) => {
    const now = new Date();
    const appointmentTime = new Date(scheduledAt);
    const diffMs = appointmentTime.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    if (diffHours > 0) {
      return `${diffHours}h ${diffMins}m`;
    }
    return `${diffMins}m`;
  };

  const isWithin24Hours = (scheduledAt: string) => {
    const now = new Date();
    const appointmentTime = new Date(scheduledAt);
    return isWithinInterval(appointmentTime, { start: now, end: addHours(now, 24) });
  };

  const isWithin1Hour = (scheduledAt: string) => {
    const now = new Date();
    const appointmentTime = new Date(scheduledAt);
    return isWithinInterval(appointmentTime, { start: now, end: addHours(now, 1) });
  };

  return (
    <Card className="card-elevated">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Bell className="h-4 w-4 text-primary" />
          </div>
          Appointment Reminders
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Settings */}
        <div className="p-4 rounded-xl bg-muted/50 space-y-4">
          <h3 className="font-semibold text-sm">Automatic Reminder Settings</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center justify-between p-3 rounded-lg bg-background">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="sms24h" className="text-sm">SMS - 24 hours before</Label>
              </div>
              <Switch
                id="sms24h"
                checked={settings.sms24h}
                onCheckedChange={(checked) => updateSettings('sms24h', checked)}
              />
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-background">
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="sms1h" className="text-sm">SMS - 1 hour before</Label>
              </div>
              <Switch
                id="sms1h"
                checked={settings.sms1h}
                onCheckedChange={(checked) => updateSettings('sms1h', checked)}
              />
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-background">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="email24h" className="text-sm">Email - 24 hours before</Label>
              </div>
              <Switch
                id="email24h"
                checked={settings.email24h}
                onCheckedChange={(checked) => updateSettings('email24h', checked)}
              />
            </div>
            <div className="flex items-center justify-between p-3 rounded-lg bg-background">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <Label htmlFor="email1h" className="text-sm">Email - 1 hour before</Label>
              </div>
              <Switch
                id="email1h"
                checked={settings.email1h}
                onCheckedChange={(checked) => updateSettings('email1h', checked)}
              />
            </div>
          </div>
        </div>

        {/* Upcoming appointments needing reminders */}
        <div className="space-y-3">
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            Upcoming Appointments (Next 24 Hours)
          </h3>

          {isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-20 w-full rounded-xl" />
              ))}
            </div>
          ) : upcomingAppointments && upcomingAppointments.length > 0 ? (
            <div className="space-y-2">
              {upcomingAppointments.map((apt) => {
                const patient = apt.patients as any;
                const within1h = isWithin1Hour(apt.scheduled_at);
                
                return (
                  <div
                    key={apt.id}
                    className={`p-4 rounded-xl border transition-all ${
                      within1h ? 'bg-warning/5 border-warning/20' : 'bg-muted/40 border-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${
                          within1h ? 'bg-warning/10' : 'bg-primary/10'
                        }`}>
                          <Calendar className={`h-5 w-5 ${within1h ? 'text-warning' : 'text-primary'}`} />
                        </div>
                        <div>
                          <p className="font-semibold">{patient?.full_name || 'Unknown Patient'}</p>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground">
                            <span>{format(new Date(apt.scheduled_at), 'MMM d, h:mm a')}</span>
                            <Badge variant={within1h ? 'default' : 'secondary'} className={within1h ? 'bg-warning text-warning-foreground' : ''}>
                              In {getTimeUntilAppointment(apt.scheduled_at)}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {patient?.phone && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-2"
                            onClick={() => sendReminderMutation.mutate({
                              appointmentId: apt.id,
                              reminderType: 'sms',
                            })}
                            disabled={sendReminderMutation.isPending}
                          >
                            {sendReminderMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Phone className="h-4 w-4" />
                            )}
                            SMS
                          </Button>
                        )}
                        {patient?.email && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="gap-2"
                            onClick={() => sendReminderMutation.mutate({
                              appointmentId: apt.id,
                              reminderType: 'email',
                            })}
                            disabled={sendReminderMutation.isPending}
                          >
                            {sendReminderMutation.isPending ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Mail className="h-4 w-4" />
                            )}
                            Email
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-8">
              <CheckCircle className="h-12 w-12 text-success/30 mx-auto mb-3" />
              <p className="text-muted-foreground">No upcoming appointments in the next 24 hours</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
