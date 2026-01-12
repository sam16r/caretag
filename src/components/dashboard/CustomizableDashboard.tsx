import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  LayoutDashboard,
  GripVertical,
  Plus,
  X,
  Save,
  RotateCcw,
  Calendar,
  Users,
  AlertTriangle,
  Stethoscope,
  Activity,
  Clock,
  TrendingUp,
  Bell,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useDashboardStats, useRecentPatients, useTodayAppointments, useActiveEmergencies } from '@/hooks/useDashboardData';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface Widget {
  id: string;
  type: string;
  title: string;
  icon: React.ReactNode;
  size: 'small' | 'medium' | 'large';
}

const availableWidgets: Widget[] = [
  { id: 'stats-patients', type: 'stat', title: 'Total Patients', icon: <Users className="h-4 w-4" />, size: 'small' },
  { id: 'stats-appointments', type: 'stat', title: "Today's Appointments", icon: <Calendar className="h-4 w-4" />, size: 'small' },
  { id: 'stats-emergencies', type: 'stat', title: 'Active Emergencies', icon: <AlertTriangle className="h-4 w-4" />, size: 'small' },
  { id: 'stats-prescriptions', type: 'stat', title: 'Active Prescriptions', icon: <Stethoscope className="h-4 w-4" />, size: 'small' },
  { id: 'appointments-list', type: 'list', title: "Today's Schedule", icon: <Clock className="h-4 w-4" />, size: 'medium' },
  { id: 'recent-patients', type: 'list', title: 'Recent Patients', icon: <Users className="h-4 w-4" />, size: 'medium' },
  { id: 'emergency-alerts', type: 'list', title: 'Emergency Alerts', icon: <AlertTriangle className="h-4 w-4" />, size: 'medium' },
  { id: 'quick-stats', type: 'chart', title: 'Quick Stats Overview', icon: <TrendingUp className="h-4 w-4" />, size: 'large' },
];

const defaultLayout = ['stats-patients', 'stats-appointments', 'stats-emergencies', 'stats-prescriptions', 'appointments-list', 'recent-patients'];

export function CustomizableDashboard() {
  const navigate = useNavigate();
  const [layout, setLayout] = useState<string[]>(() => {
    const saved = localStorage.getItem('dashboard-layout');
    return saved ? JSON.parse(saved) : defaultLayout;
  });
  const [isEditing, setIsEditing] = useState(false);
  const [draggedWidget, setDraggedWidget] = useState<string | null>(null);

  const { data: stats, isLoading: statsLoading } = useDashboardStats();
  const { data: recentPatients, isLoading: patientsLoading } = useRecentPatients(4);
  const { data: todayAppointments, isLoading: appointmentsLoading } = useTodayAppointments();
  const { data: emergencies, isLoading: emergenciesLoading } = useActiveEmergencies();

  useEffect(() => {
    localStorage.setItem('dashboard-layout', JSON.stringify(layout));
  }, [layout]);

  const addWidget = (widgetId: string) => {
    if (!layout.includes(widgetId)) {
      setLayout([...layout, widgetId]);
      toast.success('Widget added');
    }
  };

  const removeWidget = (widgetId: string) => {
    setLayout(layout.filter((id) => id !== widgetId));
    toast.info('Widget removed');
  };

  const handleDragStart = (widgetId: string) => {
    setDraggedWidget(widgetId);
  };

  const handleDragOver = (e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    if (!draggedWidget || draggedWidget === targetId) return;

    const newLayout = [...layout];
    const draggedIndex = newLayout.indexOf(draggedWidget);
    const targetIndex = newLayout.indexOf(targetId);

    newLayout.splice(draggedIndex, 1);
    newLayout.splice(targetIndex, 0, draggedWidget);
    setLayout(newLayout);
  };

  const handleDragEnd = () => {
    setDraggedWidget(null);
  };

  const resetLayout = () => {
    setLayout(defaultLayout);
    toast.success('Layout reset to default');
  };

  const renderWidget = (widgetId: string) => {
    const widget = availableWidgets.find((w) => w.id === widgetId);
    if (!widget) return null;

    const isBeingDragged = draggedWidget === widgetId;

    // Stat widgets
    if (widget.type === 'stat') {
      let value: number | string = 0;
      let loading = statsLoading;
      let onClick = () => {};
      let colorClass = '';

      switch (widgetId) {
        case 'stats-patients':
          value = stats?.totalPatients || 0;
          onClick = () => navigate('/patients');
          colorClass = 'stat-glow-primary';
          break;
        case 'stats-appointments':
          value = stats?.todayAppointments || 0;
          onClick = () => navigate('/appointments');
          colorClass = 'stat-glow-accent';
          break;
        case 'stats-emergencies':
          value = stats?.activeEmergencies || 0;
          onClick = () => navigate('/emergency');
          colorClass = (stats?.activeEmergencies || 0) > 0 ? 'stat-glow-emergency' : '';
          break;
        case 'stats-prescriptions':
          value = stats?.activePrescriptions || 0;
          onClick = () => navigate('/prescriptions');
          colorClass = 'stat-glow-success';
          break;
      }

      return (
        <Card
          className={`card-interactive ${colorClass} ${isBeingDragged ? 'opacity-50' : ''}`}
          onClick={isEditing ? undefined : onClick}
          draggable={isEditing}
          onDragStart={() => handleDragStart(widgetId)}
          onDragOver={(e) => handleDragOver(e, widgetId)}
          onDragEnd={handleDragEnd}
        >
          <CardContent className="p-5 relative">
            {isEditing && (
              <div className="absolute top-2 right-2 flex items-center gap-1">
                <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeWidget(widgetId);
                  }}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">{widget.title}</p>
                {loading ? (
                  <Skeleton className="h-10 w-16 mt-1" />
                ) : (
                  <p className="text-3xl font-bold">{value}</p>
                )}
              </div>
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                {widget.icon}
              </div>
            </div>
          </CardContent>
        </Card>
      );
    }

    // List widgets
    if (widget.type === 'list') {
      return (
        <Card
          className={`card-elevated col-span-2 ${isBeingDragged ? 'opacity-50' : ''}`}
          draggable={isEditing}
          onDragStart={() => handleDragStart(widgetId)}
          onDragOver={(e) => handleDragOver(e, widgetId)}
          onDragEnd={handleDragEnd}
        >
          <CardHeader className="pb-3 flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-lg">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                {widget.icon}
              </div>
              {widget.title}
            </CardTitle>
            {isEditing && (
              <div className="flex items-center gap-1">
                <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6"
                  onClick={() => removeWidget(widgetId)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            )}
          </CardHeader>
          <CardContent className="space-y-2">
            {widgetId === 'appointments-list' && (
              appointmentsLoading ? (
                <Skeleton className="h-16 w-full" />
              ) : todayAppointments?.slice(0, 3).map((apt) => (
                <div
                  key={apt.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/40 hover:bg-muted/70 cursor-pointer"
                  onClick={() => !isEditing && navigate(`/patients/${apt.patient_id}`)}
                >
                  <span className="font-medium">{(apt.patients as any)?.full_name}</span>
                  <Badge variant="secondary">{format(new Date(apt.scheduled_at), 'h:mm a')}</Badge>
                </div>
              )) || <p className="text-muted-foreground text-sm">No appointments today</p>
            )}
            {widgetId === 'recent-patients' && (
              patientsLoading ? (
                <Skeleton className="h-16 w-full" />
              ) : recentPatients?.slice(0, 3).map((patient) => (
                <div
                  key={patient.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/40 hover:bg-muted/70 cursor-pointer"
                  onClick={() => !isEditing && navigate(`/patients/${patient.id}`)}
                >
                  <span className="font-medium">{patient.full_name}</span>
                  <Badge variant="outline">{patient.caretag_id}</Badge>
                </div>
              )) || <p className="text-muted-foreground text-sm">No patients yet</p>
            )}
            {widgetId === 'emergency-alerts' && (
              emergenciesLoading ? (
                <Skeleton className="h-16 w-full" />
              ) : emergencies?.slice(0, 3).map((em) => (
                <div
                  key={em.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-emergency/5 border border-emergency/20 cursor-pointer"
                  onClick={() => !isEditing && navigate(`/patients/${em.patient_id}`)}
                >
                  <span className="font-medium text-emergency">{em.description}</span>
                  <Badge variant="destructive">{em.severity}</Badge>
                </div>
              )) || <p className="text-muted-foreground text-sm">No active emergencies</p>
            )}
          </CardContent>
        </Card>
      );
    }

    return null;
  };

  const unusedWidgets = availableWidgets.filter((w) => !layout.includes(w.id));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <LayoutDashboard className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-semibold">Your Dashboard</h2>
            <p className="text-sm text-muted-foreground">
              {isEditing ? 'Drag widgets to rearrange' : 'Click widgets to navigate'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isEditing && (
            <>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="gap-2">
                    <Plus className="h-4 w-4" />
                    Add Widget
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add Widget</DialogTitle>
                  </DialogHeader>
                  <div className="grid grid-cols-2 gap-3 mt-4">
                    {unusedWidgets.map((widget) => (
                      <Button
                        key={widget.id}
                        variant="outline"
                        className="h-auto py-4 flex flex-col items-center gap-2"
                        onClick={() => {
                          addWidget(widget.id);
                        }}
                      >
                        {widget.icon}
                        <span className="text-xs">{widget.title}</span>
                      </Button>
                    ))}
                    {unusedWidgets.length === 0 && (
                      <p className="col-span-2 text-center text-muted-foreground py-8">
                        All widgets are already on your dashboard
                      </p>
                    )}
                  </div>
                </DialogContent>
              </Dialog>
              <Button variant="outline" size="sm" onClick={resetLayout} className="gap-2">
                <RotateCcw className="h-4 w-4" />
                Reset
              </Button>
            </>
          )}
          <Button
            variant={isEditing ? 'default' : 'outline'}
            size="sm"
            onClick={() => {
              setIsEditing(!isEditing);
              if (isEditing) toast.success('Dashboard saved');
            }}
            className="gap-2"
          >
            {isEditing ? (
              <>
                <Save className="h-4 w-4" />
                Done
              </>
            ) : (
              <>
                <LayoutDashboard className="h-4 w-4" />
                Customize
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Widgets Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {layout.map((widgetId) => (
          <div
            key={widgetId}
            className={availableWidgets.find((w) => w.id === widgetId)?.size === 'medium' ? 'md:col-span-2' : ''}
          >
            {renderWidget(widgetId)}
          </div>
        ))}
      </div>

      {layout.length === 0 && (
        <Card className="card-elevated">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <LayoutDashboard className="h-12 w-12 text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground mb-4">Your dashboard is empty</p>
            <Button onClick={() => setLayout(defaultLayout)} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Default Widgets
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
