import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Activity, Shield, Stethoscope, AlertCircle, Sparkles } from 'lucide-react';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';

const emailSchema = z.string().email('Please enter a valid email address');
const passwordSchema = z.string().min(6, 'Password must be at least 6 characters');

export default function Auth() {
  const navigate = useNavigate();
  const { signIn, signUp, user, loading } = useAuth();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('login');
  
  // Login form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  
  // Signup form
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
  const [signupFullName, setSignupFullName] = useState('');
  const [signupRole, setSignupRole] = useState<'doctor' | 'admin'>('doctor');
  const [signupError, setSignupError] = useState('');

  useEffect(() => {
    if (user && !loading) {
      navigate('/');
    }
  }, [user, loading, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    
    try {
      emailSchema.parse(loginEmail);
      passwordSchema.parse(loginPassword);
    } catch (err) {
      if (err instanceof z.ZodError) {
        setLoginError(err.errors[0].message);
        return;
      }
    }
    
    setIsLoading(true);
    const { error } = await signIn(loginEmail, loginPassword);
    setIsLoading(false);
    
    if (error) {
      if (error.message.includes('Invalid login credentials')) {
        setLoginError('Invalid email or password. Please try again.');
      } else {
        setLoginError(error.message);
      }
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError('');
    
    try {
      emailSchema.parse(signupEmail);
      passwordSchema.parse(signupPassword);
    } catch (err) {
      if (err instanceof z.ZodError) {
        setSignupError(err.errors[0].message);
        return;
      }
    }
    
    if (signupPassword !== signupConfirmPassword) {
      setSignupError('Passwords do not match');
      return;
    }
    
    if (!signupFullName.trim()) {
      setSignupError('Please enter your full name');
      return;
    }
    
    setIsLoading(true);
    const { error } = await signUp(signupEmail, signupPassword, signupFullName, signupRole);
    setIsLoading(false);
    
    if (error) {
      if (error.message.includes('already registered')) {
        setSignupError('This email is already registered. Please log in instead.');
      } else {
        setSignupError(error.message);
      }
    } else {
      toast({
        title: 'Account created successfully!',
        description: 'You can now log in with your credentials.',
      });
      setActiveTab('login');
      setLoginEmail(signupEmail);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-12 w-12 rounded-2xl gradient-primary flex items-center justify-center shadow-lg shadow-primary/30 animate-pulse">
            <Activity className="h-6 w-6 text-primary-foreground" />
          </div>
          <span className="text-muted-foreground font-medium">Loading CareTag...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-sidebar flex-col justify-between p-12 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-sidebar-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-80 h-80 bg-sidebar-primary/5 rounded-full blur-3xl" />
        
        <div className="flex items-center gap-3 relative z-10">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-sidebar-primary to-sidebar-primary/80 shadow-lg shadow-sidebar-primary/30">
            <Activity className="h-6 w-6 text-sidebar-primary-foreground" />
          </div>
          <span className="text-2xl font-bold text-sidebar-foreground tracking-tight">CareTag</span>
        </div>
        
        <div className="space-y-10 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-sidebar-accent/50 text-sidebar-foreground/80 text-sm font-medium mb-6">
              <Sparkles className="h-4 w-4" />
              Healthcare Made Simple
            </div>
            <h1 className="text-5xl font-bold text-sidebar-foreground leading-tight tracking-tight">
              Medical Records<br />at Your Fingertips
            </h1>
          </div>
          <p className="text-lg text-sidebar-foreground/70 leading-relaxed max-w-md">
            Access patient data instantly with CareTag RFID technology. 
            Streamline consultations, prescriptions, and emergency care.
          </p>
          
          <div className="space-y-5">
            <div className="flex items-center gap-4 text-sidebar-foreground/80">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sidebar-accent/60 shadow-sm">
                <Stethoscope className="h-6 w-6" />
              </div>
              <div>
                <p className="font-semibold text-sidebar-foreground">Instant Access</p>
                <p className="text-sm text-sidebar-foreground/60">Patient records via RFID/QR scan</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sidebar-foreground/80">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sidebar-accent/60 shadow-sm">
                <Shield className="h-6 w-6" />
              </div>
              <div>
                <p className="font-semibold text-sidebar-foreground">Secure & Compliant</p>
                <p className="text-sm text-sidebar-foreground/60">Role-based access control</p>
              </div>
            </div>
            <div className="flex items-center gap-4 text-sidebar-foreground/80">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-sidebar-accent/60 shadow-sm">
                <Activity className="h-6 w-6" />
              </div>
              <div>
                <p className="font-semibold text-sidebar-foreground">Real-time Monitoring</p>
                <p className="text-sm text-sidebar-foreground/60">Live vitals from wearables</p>
              </div>
            </div>
          </div>
        </div>
        
        <p className="text-sm text-sidebar-foreground/40 relative z-10">
          © 2024 CareTag Healthcare Systems. All rights reserved.
        </p>
      </div>
      
      {/* Right side - Auth form */}
      <div className="flex w-full lg:w-1/2 items-center justify-center p-8 bg-muted/30">
        <div className="w-full max-w-md animate-fade-in">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center justify-center gap-3 mb-10">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl gradient-primary shadow-lg shadow-primary/30">
              <Activity className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold tracking-tight">CareTag</span>
          </div>
          
          <Card className="border-border/50 shadow-xl shadow-black/5 rounded-2xl">
            <CardHeader className="text-center pb-2 pt-8">
              <CardTitle className="text-2xl font-bold tracking-tight">Welcome back</CardTitle>
              <CardDescription className="text-base">
                Sign in to your account to continue
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 pt-4">
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2 h-11 rounded-xl p-1">
                  <TabsTrigger value="login" className="rounded-lg font-medium">Sign In</TabsTrigger>
                  <TabsTrigger value="signup" className="rounded-lg font-medium">Sign Up</TabsTrigger>
                </TabsList>
                
                <TabsContent value="login" className="space-y-4 mt-6">
                  <form onSubmit={handleLogin} className="space-y-4">
                    {loginError && (
                      <div className="flex items-center gap-2 p-3.5 rounded-xl bg-destructive/10 text-destructive text-sm font-medium">
                        <AlertCircle className="h-4 w-4 flex-shrink-0" />
                        {loginError}
                      </div>
                    )}
                    
                    <div className="space-y-2">
                      <Label htmlFor="login-email" className="text-sm font-medium">Email</Label>
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="doctor@hospital.com"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        className="h-11 rounded-xl"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="login-password" className="text-sm font-medium">Password</Label>
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="••••••••"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        className="h-11 rounded-xl"
                        required
                      />
                    </div>
                    
                    <Button type="submit" className="w-full h-11 rounded-xl font-semibold shadow-lg shadow-primary/25" disabled={isLoading}>
                      {isLoading ? 'Signing in...' : 'Sign In'}
                    </Button>
                  </form>
                </TabsContent>
                
                <TabsContent value="signup" className="space-y-4 mt-6">
                  <form onSubmit={handleSignup} className="space-y-4">
                    {signupError && (
                      <div className="flex items-center gap-2 p-3.5 rounded-xl bg-destructive/10 text-destructive text-sm font-medium">
                        <AlertCircle className="h-4 w-4 flex-shrink-0" />
                        {signupError}
                      </div>
                    )}
                    
                    <div className="space-y-2">
                      <Label htmlFor="signup-name" className="text-sm font-medium">Full Name</Label>
                      <Input
                        id="signup-name"
                        type="text"
                        placeholder="Dr. John Smith"
                        value={signupFullName}
                        onChange={(e) => setSignupFullName(e.target.value)}
                        className="h-11 rounded-xl"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="signup-email" className="text-sm font-medium">Email</Label>
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="doctor@hospital.com"
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                        className="h-11 rounded-xl"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="signup-role" className="text-sm font-medium">Role</Label>
                      <Select value={signupRole} onValueChange={(v) => setSignupRole(v as 'doctor' | 'admin')}>
                        <SelectTrigger className="h-11 rounded-xl">
                          <SelectValue placeholder="Select your role" />
                        </SelectTrigger>
                        <SelectContent className="rounded-xl">
                          <SelectItem value="doctor" className="rounded-lg">Doctor</SelectItem>
                          <SelectItem value="admin" className="rounded-lg">Hospital Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="signup-password" className="text-sm font-medium">Password</Label>
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="••••••••"
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        className="h-11 rounded-xl"
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="signup-confirm-password" className="text-sm font-medium">Confirm Password</Label>
                      <Input
                        id="signup-confirm-password"
                        type="password"
                        placeholder="••••••••"
                        value={signupConfirmPassword}
                        onChange={(e) => setSignupConfirmPassword(e.target.value)}
                        className="h-11 rounded-xl"
                        required
                      />
                    </div>
                    
                    <Button type="submit" className="w-full h-11 rounded-xl font-semibold shadow-lg shadow-primary/25" disabled={isLoading}>
                      {isLoading ? 'Creating account...' : 'Create Account'}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
