import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Brain, 
  AlertTriangle, 
  Stethoscope, 
  FlaskConical, 
  UserCheck, 
  Lightbulb,
  Clock,
  Plus,
  X,
  Loader2,
  ShieldAlert
} from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface SmartDiagnosisProps {
  patientId: string;
  patientName: string;
}

interface DiagnosisResult {
  chiefComplaint: string;
  clinicalImpression: string;
  differentialDiagnoses: Array<{
    diagnosis: string;
    probability: string;
    icdCode?: string;
    reasoning: string;
    supportingFindings: string[];
    againstFindings?: string[];
    urgency: string;
  }>;
  redFlags: Array<{
    finding: string;
    implication: string;
    action: string;
  }>;
  recommendedInvestigations: Array<{
    test: string;
    rationale: string;
    priority: string;
  }>;
  recommendedActions: Array<{
    action: string;
    timing: string;
    rationale: string;
  }>;
  specialistReferrals: Array<{
    specialty: string;
    urgency: string;
    reason: string;
  }>;
  clinicalPearls: string[];
  disclaimer: string;
  generatedAt: string;
}

export function SmartDiagnosis({ patientId, patientName }: SmartDiagnosisProps) {
  const [open, setOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<DiagnosisResult | null>(null);
  
  // Form state
  const [chiefComplaint, setChiefComplaint] = useState('');
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [symptomInput, setSymptomInput] = useState('');
  const [duration, setDuration] = useState('');
  const [severity, setSeverity] = useState('');

  const addSymptom = () => {
    if (symptomInput.trim() && !symptoms.includes(symptomInput.trim())) {
      setSymptoms([...symptoms, symptomInput.trim()]);
      setSymptomInput('');
    }
  };

  const removeSymptom = (symptom: string) => {
    setSymptoms(symptoms.filter(s => s !== symptom));
  };

  const handleAnalyze = async () => {
    if (!chiefComplaint.trim()) {
      toast.error('Please enter the chief complaint');
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('You must be logged in');
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/smart-diagnosis`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            patientId,
            chiefComplaint,
            symptoms,
            duration,
            severity,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to analyze');
      }

      const data = await response.json();
      setResult(data);
      toast.success('Diagnosis analysis complete');
    } catch (error: any) {
      console.error('Smart diagnosis error:', error);
      toast.error(error.message || 'Failed to generate diagnosis');
    } finally {
      setIsLoading(false);
    }
  };

  const resetForm = () => {
    setChiefComplaint('');
    setSymptoms([]);
    setSymptomInput('');
    setDuration('');
    setSeverity('');
    setResult(null);
  };

  const getProbabilityColor = (prob: string) => {
    switch (prob) {
      case 'high': return 'bg-emergency/10 text-emergency border-emergency/30';
      case 'moderate': return 'bg-warning/10 text-warning border-warning/30';
      case 'low': return 'bg-muted text-muted-foreground';
      default: return 'bg-muted';
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'emergent': return 'destructive';
      case 'urgent': return 'default';
      case 'routine': return 'secondary';
      default: return 'outline';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'immediate': return 'destructive';
      case 'soon': return 'default';
      case 'routine': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <Dialog open={open} onOpenChange={(isOpen) => {
      setOpen(isOpen);
      if (!isOpen) resetForm();
    }}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Brain className="h-4 w-4" />
          Smart Diagnosis
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl w-[95vw] h-auto max-h-[90vh] flex flex-col p-0">
        <DialogHeader className="p-6 pb-4 border-b">
          <DialogTitle className="flex items-center gap-2 text-xl">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Brain className="h-5 w-5 text-primary" />
            </div>
            AI-Powered Differential Diagnosis
            <Badge variant="secondary" className="ml-2">Beta</Badge>
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Analyzing: <strong>{patientName}</strong>
          </p>
        </DialogHeader>

        <ScrollArea className="flex-1 overflow-auto">
          <div className="p-6 space-y-6">
            {!result ? (
              <>
                {/* Input Form */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="chiefComplaint">Chief Complaint *</Label>
                    <Textarea
                      id="chiefComplaint"
                      placeholder="What is the patient's main complaint? (e.g., 'Persistent headache for 3 days')"
                      value={chiefComplaint}
                      onChange={(e) => setChiefComplaint(e.target.value)}
                      className="mt-1.5"
                      rows={2}
                    />
                  </div>

                  <div>
                    <Label>Symptoms</Label>
                    <div className="flex gap-2 mt-1.5">
                      <Input
                        placeholder="Add symptom (e.g., fever, nausea)"
                        value={symptomInput}
                        onChange={(e) => setSymptomInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSymptom())}
                      />
                      <Button type="button" variant="outline" size="icon" onClick={addSymptom}>
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                    {symptoms.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-2">
                        {symptoms.map((symptom) => (
                          <Badge key={symptom} variant="secondary" className="gap-1">
                            {symptom}
                            <X
                              className="h-3 w-3 cursor-pointer hover:text-destructive"
                              onClick={() => removeSymptom(symptom)}
                            />
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="duration">Duration</Label>
                      <Input
                        id="duration"
                        placeholder="e.g., 3 days, 2 weeks"
                        value={duration}
                        onChange={(e) => setDuration(e.target.value)}
                        className="mt-1.5"
                      />
                    </div>
                    <div>
                      <Label htmlFor="severity">Severity</Label>
                      <Select value={severity} onValueChange={setSeverity}>
                        <SelectTrigger className="mt-1.5">
                          <SelectValue placeholder="Select severity" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="mild">Mild</SelectItem>
                          <SelectItem value="moderate">Moderate</SelectItem>
                          <SelectItem value="severe">Severe</SelectItem>
                          <SelectItem value="critical">Critical</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <Button onClick={handleAnalyze} disabled={isLoading} className="w-full gap-2">
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Analyzing Patient Data...
                    </>
                  ) : (
                    <>
                      <Brain className="h-4 w-4" />
                      Generate Differential Diagnosis
                    </>
                  )}
                </Button>

                {isLoading && (
                  <div className="space-y-4">
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-48 w-full" />
                    <Skeleton className="h-24 w-full" />
                  </div>
                )}
              </>
            ) : (
              <>
                {/* Results */}
                <Tabs defaultValue="diagnoses" className="w-full">
                  <TabsList className="w-full grid grid-cols-4 mb-4">
                    <TabsTrigger value="diagnoses" className="gap-1 text-xs">
                      <Stethoscope className="h-3 w-3" />
                      Diagnoses
                    </TabsTrigger>
                    <TabsTrigger value="investigations" className="gap-1 text-xs">
                      <FlaskConical className="h-3 w-3" />
                      Tests
                    </TabsTrigger>
                    <TabsTrigger value="actions" className="gap-1 text-xs">
                      <Clock className="h-3 w-3" />
                      Actions
                    </TabsTrigger>
                    <TabsTrigger value="referrals" className="gap-1 text-xs">
                      <UserCheck className="h-3 w-3" />
                      Referrals
                    </TabsTrigger>
                  </TabsList>

                  {/* Clinical Impression - Always visible */}
                  <Card className="mb-4 border-primary/20 bg-primary/5">
                    <CardContent className="p-4">
                      <p className="text-sm font-medium text-primary mb-1">Clinical Impression</p>
                      <p className="text-sm">{result.clinicalImpression}</p>
                    </CardContent>
                  </Card>

                  {/* Red Flags */}
                  {result.redFlags && result.redFlags.length > 0 && (
                    <Card className="mb-4 border-destructive/30 bg-destructive/5">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm flex items-center gap-2 text-destructive">
                          <ShieldAlert className="h-4 w-4" />
                          Red Flags - Urgent Attention Required
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {result.redFlags.map((flag, i) => (
                          <div key={i} className="text-sm p-2 bg-background rounded">
                            <p className="font-medium">{flag.finding}</p>
                            <p className="text-muted-foreground text-xs">{flag.implication}</p>
                            <p className="text-destructive text-xs mt-1">Action: {flag.action}</p>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  )}

                  <TabsContent value="diagnoses" className="space-y-3 mt-0">
                    {result.differentialDiagnoses?.map((dx, i) => (
                      <Card key={i} className={`${getProbabilityColor(dx.probability)} border`}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <h4 className="font-semibold">{dx.diagnosis}</h4>
                              {dx.icdCode && (
                                <span className="text-xs text-muted-foreground">ICD-10: {dx.icdCode}</span>
                              )}
                            </div>
                            <div className="flex gap-2">
                              <Badge variant={getUrgencyColor(dx.urgency)} className="capitalize">
                                {dx.urgency}
                              </Badge>
                              <Badge variant="outline" className="capitalize">
                                {dx.probability} probability
                              </Badge>
                            </div>
                          </div>
                          <p className="text-sm mb-3">{dx.reasoning}</p>
                          <div className="grid grid-cols-2 gap-4 text-xs">
                            <div>
                              <p className="font-medium text-success mb-1">Supporting Findings:</p>
                              <ul className="list-disc list-inside space-y-0.5">
                                {dx.supportingFindings?.map((f, j) => (
                                  <li key={j}>{f}</li>
                                ))}
                              </ul>
                            </div>
                            {dx.againstFindings && dx.againstFindings.length > 0 && (
                              <div>
                                <p className="font-medium text-destructive mb-1">Against:</p>
                                <ul className="list-disc list-inside space-y-0.5">
                                  {dx.againstFindings.map((f, j) => (
                                    <li key={j}>{f}</li>
                                  ))}
                                </ul>
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </TabsContent>

                  <TabsContent value="investigations" className="space-y-2 mt-0">
                    {result.recommendedInvestigations?.map((inv, i) => (
                      <Card key={i}>
                        <CardContent className="p-4 flex items-start justify-between">
                          <div>
                            <h4 className="font-medium">{inv.test}</h4>
                            <p className="text-sm text-muted-foreground">{inv.rationale}</p>
                          </div>
                          <Badge variant={getPriorityColor(inv.priority)} className="capitalize shrink-0">
                            {inv.priority}
                          </Badge>
                        </CardContent>
                      </Card>
                    ))}
                  </TabsContent>

                  <TabsContent value="actions" className="space-y-2 mt-0">
                    {result.recommendedActions?.map((action, i) => (
                      <Card key={i}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between mb-1">
                            <h4 className="font-medium">{action.action}</h4>
                            <Badge variant="outline" className="capitalize shrink-0">
                              {action.timing?.replace('_', ' ')}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">{action.rationale}</p>
                        </CardContent>
                      </Card>
                    ))}
                  </TabsContent>

                  <TabsContent value="referrals" className="space-y-2 mt-0">
                    {result.specialistReferrals && result.specialistReferrals.length > 0 ? (
                      result.specialistReferrals.map((ref, i) => (
                        <Card key={i}>
                          <CardContent className="p-4 flex items-start justify-between">
                            <div>
                              <h4 className="font-medium">{ref.specialty}</h4>
                              <p className="text-sm text-muted-foreground">{ref.reason}</p>
                            </div>
                            <Badge variant={getUrgencyColor(ref.urgency)} className="capitalize shrink-0">
                              {ref.urgency}
                            </Badge>
                          </CardContent>
                        </Card>
                      ))
                    ) : (
                      <p className="text-center text-muted-foreground py-4">No specialist referrals recommended</p>
                    )}
                  </TabsContent>
                </Tabs>

                {/* Clinical Pearls */}
                {result.clinicalPearls && result.clinicalPearls.length > 0 && (
                  <Card className="border-accent/30 bg-accent/5">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm flex items-center gap-2">
                        <Lightbulb className="h-4 w-4 text-accent" />
                        Clinical Pearls
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="pt-0">
                      <ul className="list-disc list-inside text-sm space-y-1">
                        {result.clinicalPearls.map((pearl, i) => (
                          <li key={i}>{pearl}</li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {/* Disclaimer */}
                <div className="p-3 bg-muted rounded-lg text-xs text-muted-foreground flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  <p>{result.disclaimer}</p>
                </div>

                <Button variant="outline" onClick={resetForm} className="w-full">
                  New Analysis
                </Button>
              </>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
