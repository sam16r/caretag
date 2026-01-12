import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import { toast } from 'sonner';
import { Star, MessageSquare, TrendingUp, ThumbsUp, ThumbsDown } from 'lucide-react';
import { format } from 'date-fns';
import { useAuth } from '@/hooks/useAuth';

export function PatientFeedback() {
  const { user, role } = useAuth();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [formData, setFormData] = useState({
    doctor_id: '',
    rating: 5,
    comment: '',
    is_anonymous: false
  });

  const { data: feedbacks, isLoading } = useQuery({
    queryKey: ['feedbacks'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('feedback')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      return data;
    }
  });

  const { data: doctors } = useQuery({
    queryKey: ['doctors-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, specialization')
        .order('full_name');
      
      if (error) throw error;
      return data;
    }
  });

  const { data: patients } = useQuery({
    queryKey: ['patients-list'],
    queryFn: async () => {
      const { data, error } = await supabase.from('patients').select('id, full_name').order('full_name');
      if (error) throw error;
      return data;
    }
  });

  const [selectedPatient, setSelectedPatient] = useState('');

  const createMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('feedback').insert({
        patient_id: selectedPatient,
        doctor_id: formData.doctor_id,
        rating: formData.rating,
        comment: formData.comment,
        is_anonymous: formData.is_anonymous
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['feedbacks'] });
      setIsOpen(false);
      setFormData({ doctor_id: '', rating: 5, comment: '', is_anonymous: false });
      setSelectedPatient('');
      toast.success('Feedback submitted successfully');
    },
    onError: () => toast.error('Failed to submit feedback')
  });

  // Calculate stats
  const stats = {
    total: feedbacks?.length || 0,
    avgRating: feedbacks?.length ? (feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length).toFixed(1) : '0',
    positive: feedbacks?.filter(f => f.rating >= 4).length || 0,
    negative: feedbacks?.filter(f => f.rating <= 2).length || 0
  };

  // Rating distribution
  const ratingDistribution = [5, 4, 3, 2, 1].map(rating => ({
    rating,
    count: feedbacks?.filter(f => f.rating === rating).length || 0,
    percentage: feedbacks?.length ? ((feedbacks.filter(f => f.rating === rating).length / feedbacks.length) * 100) : 0
  }));

  const renderStars = (rating: number, interactive = false, onRate?: (r: number) => void) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(star => (
          <Star
            key={star}
            className={`h-5 w-5 ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'} ${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : ''}`}
            onClick={() => interactive && onRate?.(star)}
          />
        ))}
      </div>
    );
  };

  if (isLoading) {
    return <div className="space-y-4">
      <div className="grid grid-cols-4 gap-4">{[1,2,3,4].map(i => <Skeleton key={i} className="h-24" />)}</div>
      <Skeleton className="h-64" />
    </div>;
  }

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <MessageSquare className="h-8 w-8 text-primary" />
              <div>
                <p className="text-sm text-muted-foreground">Total Reviews</p>
                <p className="text-3xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Star className="h-8 w-8 text-yellow-400 fill-yellow-400" />
              <div>
                <p className="text-sm text-muted-foreground">Average Rating</p>
                <p className="text-3xl font-bold">{stats.avgRating}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <ThumbsUp className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-sm text-muted-foreground">Positive (4-5★)</p>
                <p className="text-3xl font-bold">{stats.positive}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <ThumbsDown className="h-8 w-8 text-destructive" />
              <div>
                <p className="text-sm text-muted-foreground">Negative (1-2★)</p>
                <p className="text-3xl font-bold">{stats.negative}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Rating Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Rating Distribution</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {ratingDistribution.map(({ rating, count, percentage }) => (
              <div key={rating} className="flex items-center gap-2">
                <span className="w-8 text-sm">{rating}★</span>
                <Progress value={percentage} className="flex-1" />
                <span className="w-12 text-sm text-right text-muted-foreground">{count}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent Feedback */}
        <Card className="md:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Recent Feedback</CardTitle>
            <Dialog open={isOpen} onOpenChange={setIsOpen}>
              <DialogTrigger asChild>
                <Button size="sm">Submit Feedback</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Submit Feedback</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid gap-2">
                    <Label>Patient</Label>
                    <Select value={selectedPatient} onValueChange={setSelectedPatient}>
                      <SelectTrigger><SelectValue placeholder="Select patient" /></SelectTrigger>
                      <SelectContent>
                        {patients?.map(p => <SelectItem key={p.id} value={p.id}>{p.full_name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Doctor</Label>
                    <Select value={formData.doctor_id} onValueChange={v => setFormData({ ...formData, doctor_id: v })}>
                      <SelectTrigger><SelectValue placeholder="Select doctor" /></SelectTrigger>
                      <SelectContent>
                        {doctors?.map(d => (
                          <SelectItem key={d.id} value={d.id}>
                            {d.full_name} {d.specialization && `(${d.specialization})`}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2">
                    <Label>Rating</Label>
                    <div className="flex justify-center py-2">
                      {renderStars(formData.rating, true, r => setFormData({ ...formData, rating: r }))}
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label>Comment</Label>
                    <Textarea 
                      value={formData.comment} 
                      onChange={e => setFormData({ ...formData, comment: e.target.value })}
                      placeholder="Share your experience..."
                      rows={4}
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Switch 
                      checked={formData.is_anonymous} 
                      onCheckedChange={v => setFormData({ ...formData, is_anonymous: v })}
                    />
                    <Label>Submit anonymously</Label>
                  </div>
                  <Button onClick={() => createMutation.mutate()} disabled={!selectedPatient || !formData.doctor_id}>
                    Submit Feedback
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </CardHeader>
          <CardContent>
            {feedbacks?.length === 0 ? (
              <p className="text-center py-8 text-muted-foreground">No feedback yet</p>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {feedbacks?.slice(0, 10).map(feedback => {
                  const doctor = doctors?.find(d => d.id === feedback.doctor_id);
                  return (
                  <div key={feedback.id} className="border-b pb-4 last:border-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">
                            {feedback.is_anonymous ? 'Anonymous' : 'Patient'}
                          </span>
                          <span className="text-muted-foreground">→</span>
                          <span className="font-medium">{doctor?.full_name || 'Unknown'}</span>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          {renderStars(feedback.rating)}
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(feedback.created_at), 'MMM d, yyyy')}
                          </span>
                        </div>
                      </div>
                      <Badge variant={feedback.rating >= 4 ? 'default' : feedback.rating <= 2 ? 'destructive' : 'secondary'}>
                        {feedback.rating}/5
                      </Badge>
                    </div>
                    {feedback.comment && (
                      <p className="mt-2 text-sm text-muted-foreground">{feedback.comment}</p>
                    )}
                  </div>
                  );
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
