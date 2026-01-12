import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Brain, AlertTriangle, TrendingUp, Activity, Heart, Droplets, CheckCircle2, ArrowRight, Sparkles, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

interface HealthInsights {
  overallStatus: 'good' | 'moderate' | 'concerning' | 'critical';
  summary: string;
  risks: Array<{ title: string; severity: 'low' | 'medium' | 'high'; description: string }>;
  recommendations: Array<{ category: string; title: string; priority: string; details: string }>;
  vitalsTrend: { heartRate: string; bloodPressure: string; oxygenation: string };
  nextSteps: string[];
}

interface AIHealthInsightsProps {
  patientId: string;
  patientName: string;
}

export function AIHealthInsights({ patientId, patientName }: AIHealthInsightsProps) {
  const [open, setOpen] = useState(false);

  const { data: insights, isLoading, error, refetch } = useQuery({
    queryKey: ['health-insights', patientId],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke('health-insights', {
        body: { patientId }
      });

      if (error) {
        console.error('Error fetching health insights:', error);
        throw error;
      }

      if (data.error) {
        throw new Error(data.error);
      }

      return data as HealthInsights;
    },
    enabled: open, // Only fetch when dialog is opened
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: 1
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'good': return 'bg-emerald-500';
      case 'moderate': return 'bg-amber-500';
      case 'concerning': return 'bg-orange-500';
      case 'critical': return 'bg-red-500';
      default: return 'bg-slate-500';
    }
  };

  const getStatusBg = (status: string) => {
    switch (status) {
      case 'good': return 'from-emerald-500 to-emerald-600';
      case 'moderate': return 'from-amber-500 to-amber-600';
      case 'concerning': return 'from-orange-500 to-orange-600';
      case 'critical': return 'from-red-500 to-red-600';
      default: return 'from-slate-500 to-slate-600';
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'high': return <Badge className="bg-red-500/10 text-red-600 border-red-200">High Risk</Badge>;
      case 'medium': return <Badge className="bg-amber-500/10 text-amber-600 border-amber-200">Medium Risk</Badge>;
      default: return <Badge className="bg-slate-500/10 text-slate-600 border-slate-200">Low Risk</Badge>;
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'increasing': return <TrendingUp className="h-4 w-4 text-red-500" />;
      case 'decreasing': return <TrendingUp className="h-4 w-4 text-emerald-500 rotate-180" />;
      case 'fluctuating': return <Activity className="h-4 w-4 text-amber-500" />;
      default: return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2 bg-primary hover:bg-primary/90 text-white shadow-sm">
          <Brain className="h-4 w-4" />
          AI Insights
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto bg-background border-border/50 shadow-xl">
        <DialogHeader className="pb-4 border-b border-border/50">
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <div className="p-2 rounded-lg bg-primary/10">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            AI Health Insights
          </DialogTitle>
          <DialogDescription className="text-muted-foreground">
            AI-powered health analysis for <span className="font-medium text-foreground">{patientName}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {isLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-24 rounded-xl bg-muted/50" />
              <Skeleton className="h-32 rounded-xl bg-muted/50" />
              <Skeleton className="h-48 rounded-xl bg-muted/50" />
            </div>
          ) : error ? (
            <Card className="border-red-200 bg-red-50/50">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="font-semibold text-lg text-foreground">Failed to Generate Insights</h3>
                <p className="text-muted-foreground mt-2 text-sm">{(error as Error).message}</p>
                <Button onClick={() => refetch()} className="mt-4 gap-2 bg-primary hover:bg-primary/90">
                  <RefreshCw className="h-4 w-4" />
                  Try Again
                </Button>
              </CardContent>
            </Card>
          ) : insights ? (
            <>
              {/* Overall Status */}
              <Card className="overflow-hidden border-0 shadow-md">
                <div className={`bg-gradient-to-r ${getStatusBg(insights.overallStatus)} p-5 text-white`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
                        <Activity className="h-5 w-5" />
                      </div>
                      <div>
                        <p className="text-white/80 text-sm">Overall Status</p>
                        <h3 className="font-bold text-xl capitalize">{insights.overallStatus}</h3>
                      </div>
                    </div>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => refetch()}
                      className="text-white hover:bg-white/20 rounded-full"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="mt-3 text-white/90 text-sm leading-relaxed">{insights.summary}</p>
                </div>
              </Card>

              {/* Vitals Trends */}
              <Card className="border-border/50 shadow-sm">
                <CardContent className="p-5">
                  <h4 className="font-semibold mb-4 flex items-center gap-2 text-foreground">
                    <div className="p-1.5 rounded-md bg-primary/10">
                      <Activity className="h-4 w-4 text-primary" />
                    </div>
                    Vitals Trends
                  </h4>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-br from-red-50 to-red-100/50 border border-red-100">
                      <div className="p-2 rounded-lg bg-white shadow-sm">
                        <Heart className="h-5 w-5 text-red-500" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground font-medium">Heart Rate</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="font-semibold text-foreground capitalize">{insights.vitalsTrend.heartRate}</span>
                          {getTrendIcon(insights.vitalsTrend.heartRate)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-br from-blue-50 to-blue-100/50 border border-blue-100">
                      <div className="p-2 rounded-lg bg-white shadow-sm">
                        <Activity className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground font-medium">Blood Pressure</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="font-semibold text-foreground capitalize">{insights.vitalsTrend.bloodPressure}</span>
                          {getTrendIcon(insights.vitalsTrend.bloodPressure)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 rounded-xl bg-gradient-to-br from-cyan-50 to-cyan-100/50 border border-cyan-100">
                      <div className="p-2 rounded-lg bg-white shadow-sm">
                        <Droplets className="h-5 w-5 text-cyan-500" />
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground font-medium">Oxygenation</p>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="font-semibold text-foreground capitalize">{insights.vitalsTrend.oxygenation}</span>
                          {getTrendIcon(insights.vitalsTrend.oxygenation)}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Health Risks */}
              {insights.risks.length > 0 && (
                <Card className="border-border/50 shadow-sm">
                  <CardContent className="p-5">
                    <h4 className="font-semibold mb-4 flex items-center gap-2 text-foreground">
                      <div className="p-1.5 rounded-md bg-amber-500/10">
                        <AlertTriangle className="h-4 w-4 text-amber-600" />
                      </div>
                      Identified Health Risks
                    </h4>
                    <div className="space-y-3">
                      {insights.risks.map((risk, i) => (
                        <div key={i} className="p-4 rounded-xl bg-gradient-to-r from-amber-50/50 to-transparent border border-amber-100">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-semibold text-foreground">{risk.title}</span>
                            {getSeverityBadge(risk.severity)}
                          </div>
                          <p className="text-sm text-muted-foreground leading-relaxed">{risk.description}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Recommendations */}
              {insights.recommendations.length > 0 && (
                <Card className="border-border/50 shadow-sm">
                  <CardContent className="p-5">
                    <h4 className="font-semibold mb-4 flex items-center gap-2 text-foreground">
                      <div className="p-1.5 rounded-md bg-emerald-500/10">
                        <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                      </div>
                      Recommendations
                    </h4>
                    <div className="space-y-3">
                      {insights.recommendations.map((rec, i) => (
                        <div key={i} className="flex items-start gap-3 p-4 rounded-xl bg-slate-50/50 border border-slate-100">
                          <Badge className="shrink-0 capitalize bg-primary/10 text-primary border-primary/20 hover:bg-primary/20">
                            {rec.category}
                          </Badge>
                          <div>
                            <p className="font-semibold text-foreground">{rec.title}</p>
                            <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{rec.details}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Next Steps */}
              {insights.nextSteps.length > 0 && (
                <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20 shadow-sm">
                  <CardContent className="p-5">
                    <h4 className="font-semibold mb-4 text-foreground flex items-center gap-2">
                      <div className="p-1.5 rounded-md bg-primary/10">
                        <ArrowRight className="h-4 w-4 text-primary" />
                      </div>
                      Suggested Next Steps
                    </h4>
                    <ul className="space-y-2.5">
                      {insights.nextSteps.map((step, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm">
                          <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                            <span className="text-xs font-semibold text-primary">{i + 1}</span>
                          </div>
                          <span className="text-foreground leading-relaxed">{step}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              )}

              {/* Disclaimer */}
              <div className="flex items-start gap-2 p-3 rounded-lg bg-slate-100/50 border border-slate-200">
                <AlertTriangle className="h-4 w-4 text-slate-500 shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  AI-generated insights are for clinical decision support only. Always verify with clinical judgment and patient assessment.
                </p>
              </div>
            </>
          ) : null}
        </div>
      </DialogContent>
    </Dialog>
  );
}
