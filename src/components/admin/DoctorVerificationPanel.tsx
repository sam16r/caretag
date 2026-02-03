import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Shield,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  FileText,
  User,
  Phone,
  Mail,
  MapPin,
  GraduationCap,
  Building2,
  ExternalLink,
  AlertTriangle,
  Loader2,
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

type VerificationStatus = 'pending' | 'verified' | 'rejected' | 'all';

interface DoctorProfile {
  id: string;
  full_name: string;
  email: string;
  mobile_number: string | null;
  specialization: string | null;
  primary_qualification: string | null;
  years_of_experience: number | null;
  medical_council_number: string | null;
  registering_authority: string | null;
  registration_year: number | null;
  degree_certificate_url: string | null;
  id_proof_url: string | null;
  professional_photo_url: string | null;
  clinic_name: string | null;
  clinic_address: string | null;
  city: string | null;
  state: string | null;
  verification_status: string | null;
  created_at: string;
}

const statusColors: Record<string, string> = {
  pending: 'bg-warning/10 text-warning border-warning/20',
  verified: 'bg-success/10 text-success border-success/20',
  rejected: 'bg-destructive/10 text-destructive border-destructive/20',
};

const statusIcons: Record<string, React.ReactNode> = {
  pending: <Clock className="h-3.5 w-3.5" />,
  verified: <CheckCircle className="h-3.5 w-3.5" />,
  rejected: <XCircle className="h-3.5 w-3.5" />,
};

export function DoctorVerificationPanel() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<VerificationStatus>('pending');
  const [selectedDoctor, setSelectedDoctor] = useState<DoctorProfile | null>(null);
  const [isReviewDialogOpen, setIsReviewDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  // Fetch doctors with pending/all verification status
  const { data: doctors, isLoading } = useQuery({
    queryKey: ['doctor-verifications', statusFilter],
    queryFn: async () => {
      let query = supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (statusFilter !== 'all') {
        query = query.eq('verification_status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as DoctorProfile[];
    },
  });

  // Update verification status mutation
  const updateVerificationMutation = useMutation({
    mutationFn: async ({ doctorId, status, reason }: { doctorId: string; status: string; reason?: string }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          verification_status: status,
          // We could add a rejection_reason field if needed
        })
        .eq('id', doctorId);

      if (error) throw error;

      // Log the action
      await supabase.from('audit_logs').insert({
        user_id: (await supabase.auth.getUser()).data.user?.id,
        action: `doctor_verification_${status}`,
        entity_type: 'profile',
        entity_id: doctorId,
        details: { status, reason },
      });
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['doctor-verifications'] });
      toast.success(`Doctor ${variables.status === 'verified' ? 'verified' : 'rejected'} successfully`);
      setIsReviewDialogOpen(false);
      setSelectedDoctor(null);
      setRejectionReason('');
    },
    onError: (error) => {
      toast.error('Failed to update verification status');
      console.error(error);
    },
  });

  const filteredDoctors = doctors?.filter(doctor => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    return (
      doctor.full_name.toLowerCase().includes(searchLower) ||
      doctor.email.toLowerCase().includes(searchLower) ||
      doctor.medical_council_number?.toLowerCase().includes(searchLower)
    );
  });

  const pendingCount = doctors?.filter(d => d.verification_status === 'pending').length || 0;

  const handleVerify = () => {
    if (!selectedDoctor) return;
    updateVerificationMutation.mutate({ doctorId: selectedDoctor.id, status: 'verified' });
  };

  const handleReject = () => {
    if (!selectedDoctor || !rejectionReason.trim()) {
      toast.error('Please provide a reason for rejection');
      return;
    }
    updateVerificationMutation.mutate({ 
      doctorId: selectedDoctor.id, 
      status: 'rejected',
      reason: rejectionReason 
    });
  };

  const openDocument = (url: string | null) => {
    if (!url) {
      toast.error('Document not available');
      return;
    }
    // Get public URL from Supabase storage
    const { data } = supabase.storage.from('doctor-documents').getPublicUrl(url);
    window.open(data.publicUrl, '_blank');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            Doctor Verification
          </h2>
          <p className="text-muted-foreground text-sm mt-1">
            Review and verify doctor credentials
          </p>
        </div>
        {pendingCount > 0 && (
          <Badge variant="outline" className="bg-warning/10 text-warning border-warning/30 gap-1.5 px-3 py-1.5">
            <Clock className="h-3.5 w-3.5" />
            {pendingCount} pending verification{pendingCount > 1 ? 's' : ''}
          </Badge>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, or registration..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as VerificationStatus)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="verified">Verified</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
            <SelectItem value="all">All</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Doctor List */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      ) : filteredDoctors && filteredDoctors.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredDoctors.map((doctor) => (
            <Card 
              key={doctor.id} 
              className="cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => {
                setSelectedDoctor(doctor);
                setIsReviewDialogOpen(true);
              }}
            >
              <CardContent className="p-5">
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <User className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold truncate">{doctor.full_name}</h3>
                        <p className="text-sm text-muted-foreground">{doctor.specialization || 'General Practitioner'}</p>
                      </div>
                      <Badge 
                        variant="outline" 
                        className={`${statusColors[doctor.verification_status || 'pending']} gap-1 flex-shrink-0`}
                      >
                        {statusIcons[doctor.verification_status || 'pending']}
                        {doctor.verification_status || 'pending'}
                      </Badge>
                    </div>
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <GraduationCap className="h-3.5 w-3.5" />
                        <span className="truncate">{doctor.primary_qualification || 'Not specified'}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <FileText className="h-3.5 w-3.5" />
                        <span className="font-mono">{doctor.medical_council_number || 'No registration'}</span>
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Applied: {format(new Date(doctor.created_at), 'MMM d, yyyy')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="py-12 text-center">
            <CheckCircle className="h-12 w-12 text-success/50 mx-auto mb-4" />
            <h3 className="text-lg font-medium">No doctors to verify</h3>
            <p className="text-muted-foreground mt-1 text-sm">
              {statusFilter === 'pending' 
                ? 'All pending verifications have been processed' 
                : 'No doctors found with the selected filter'}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Review Dialog */}
      <Dialog open={isReviewDialogOpen} onOpenChange={setIsReviewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Review Doctor Application
            </DialogTitle>
            <DialogDescription>
              Verify the credentials and documentation before approving
            </DialogDescription>
          </DialogHeader>

          {selectedDoctor && (
            <div className="space-y-6 py-4">
              {/* Personal Info */}
              <div className="space-y-3">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Personal Information
                </h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-muted-foreground text-xs">Full Name</p>
                    <p className="font-medium">{selectedDoctor.full_name}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-muted-foreground text-xs">Email</p>
                    <p className="font-medium flex items-center gap-1">
                      <Mail className="h-3.5 w-3.5" />
                      {selectedDoctor.email}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-muted-foreground text-xs">Mobile</p>
                    <p className="font-medium flex items-center gap-1">
                      <Phone className="h-3.5 w-3.5" />
                      {selectedDoctor.mobile_number || 'Not provided'}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-muted-foreground text-xs">Application Date</p>
                    <p className="font-medium">{format(new Date(selectedDoctor.created_at), 'PPP')}</p>
                  </div>
                </div>
              </div>

              {/* Professional Info */}
              <div className="space-y-3">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  <GraduationCap className="h-4 w-4" />
                  Professional Details
                </h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-muted-foreground text-xs">Qualification</p>
                    <p className="font-medium">{selectedDoctor.primary_qualification || 'Not specified'}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-muted-foreground text-xs">Specialization</p>
                    <p className="font-medium">{selectedDoctor.specialization || 'General'}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-muted-foreground text-xs">Years of Experience</p>
                    <p className="font-medium">{selectedDoctor.years_of_experience || 0} years</p>
                  </div>
                </div>
              </div>

              {/* Registration Info */}
              <div className="space-y-3">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  Medical Registration
                </h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="p-3 rounded-lg bg-primary/5 border border-primary/20">
                    <p className="text-muted-foreground text-xs">Registration Number</p>
                    <p className="font-mono font-semibold text-primary">
                      {selectedDoctor.medical_council_number || 'Not provided'}
                    </p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-muted-foreground text-xs">Registering Authority</p>
                    <p className="font-medium text-xs">{selectedDoctor.registering_authority || 'Not specified'}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50 col-span-2">
                    <p className="text-muted-foreground text-xs">Registration Year</p>
                    <p className="font-medium">{selectedDoctor.registration_year || 'Not specified'}</p>
                  </div>
                </div>
              </div>

              {/* Practice Info */}
              <div className="space-y-3">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Practice Details
                </h4>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-muted-foreground text-xs">Clinic/Hospital</p>
                    <p className="font-medium">{selectedDoctor.clinic_name || 'Not specified'}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50">
                    <p className="text-muted-foreground text-xs">Location</p>
                    <p className="font-medium flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      {selectedDoctor.city || 'N/A'}, {selectedDoctor.state || 'N/A'}
                    </p>
                  </div>
                  {selectedDoctor.clinic_address && (
                    <div className="p-3 rounded-lg bg-muted/50 col-span-2">
                      <p className="text-muted-foreground text-xs">Address</p>
                      <p className="font-medium">{selectedDoctor.clinic_address}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Documents */}
              <div className="space-y-3">
                <h4 className="font-semibold text-sm flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Uploaded Documents
                </h4>
                <div className="grid grid-cols-3 gap-3">
                  <Button
                    variant="outline"
                    className="h-auto py-3 flex flex-col items-center gap-2"
                    onClick={() => openDocument(selectedDoctor.degree_certificate_url)}
                    disabled={!selectedDoctor.degree_certificate_url}
                  >
                    <GraduationCap className="h-5 w-5" />
                    <span className="text-xs">Degree Certificate</span>
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="outline"
                    className="h-auto py-3 flex flex-col items-center gap-2"
                    onClick={() => openDocument(selectedDoctor.id_proof_url)}
                    disabled={!selectedDoctor.id_proof_url}
                  >
                    <FileText className="h-5 w-5" />
                    <span className="text-xs">ID Proof</span>
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="outline"
                    className="h-auto py-3 flex flex-col items-center gap-2"
                    onClick={() => openDocument(selectedDoctor.professional_photo_url)}
                    disabled={!selectedDoctor.professional_photo_url}
                  >
                    <User className="h-5 w-5" />
                    <span className="text-xs">Photo</span>
                    <ExternalLink className="h-3 w-3" />
                  </Button>
                </div>
              </div>

              {/* Verification Note */}
              <div className="p-4 rounded-lg bg-warning/10 border border-warning/20 flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-warning flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-warning">Manual Verification Required</p>
                  <p className="text-muted-foreground mt-1">
                    Please verify the Medical Council Registration Number on the{' '}
                    <a 
                      href="https://www.nmc.org.in/information-desk/indian-medical-register/" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary underline"
                    >
                      NMC Portal
                    </a>{' '}
                    before approving.
                  </p>
                </div>
              </div>

              {/* Rejection Reason (only if rejecting) */}
              {selectedDoctor.verification_status === 'pending' && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Rejection Reason (required if rejecting)</label>
                  <Textarea
                    placeholder="Enter reason for rejection..."
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    className="resize-none"
                    rows={3}
                  />
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsReviewDialogOpen(false)}>
              Cancel
            </Button>
            {selectedDoctor?.verification_status === 'pending' && (
              <>
                <Button 
                  variant="destructive" 
                  onClick={handleReject}
                  disabled={updateVerificationMutation.isPending}
                >
                  {updateVerificationMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <XCircle className="h-4 w-4 mr-2" />
                  )}
                  Reject
                </Button>
                <Button 
                  onClick={handleVerify}
                  disabled={updateVerificationMutation.isPending}
                  className="bg-success hover:bg-success/90"
                >
                  {updateVerificationMutation.isPending ? (
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <CheckCircle className="h-4 w-4 mr-2" />
                  )}
                  Verify Doctor
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
