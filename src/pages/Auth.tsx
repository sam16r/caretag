import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Activity, Shield, Stethoscope, AlertCircle } from 'lucide-react';
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
        <Activity className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-sidebar flex-col justify-between p-12">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-sidebar-primary">
            <Activity className="h-6 w-6 text-sidebar-primary-foreground" />
          </div>
          <span className="text-2xl font-bold text-sidebar-foreground">CareTag</span>
        </div>
        
        <div className="space-y-8">
          <h1 className="text-4xl font-bold text-sidebar-foreground leading-tight">
            Medical Records<br />Made Simple
          </h1>
          <p className="text-lg text-sidebar-foreground/80">
            Access patient data instantly with CareTag RFID technology. 
            Streamline consultations, prescriptions, and emergency care.
          </p>
          
          <div className="space-y-4">
            <div className="flex items-center gap-4 text-sidebar-foreground/80">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sidebar-accent">
                <Stethoscope className="h-5 w-5" />
              </div>
              <span>Instant patient record access via RFID/QR</span>
            </div>
            <div className="flex items-center gap-4 text-sidebar-foreground/80">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sidebar-accent">
                <Shield className="h-5 w-5" />
              </div>
              <span>Secure role-based access control</span>
            </div>
            <div className="flex items-center gap-4 text-sidebar-foreground/80">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-sidebar-accent">
                <Activity className="h-5 w-5" />
              </div>
              <span>Real-time vitals from wearable devices</span>
            </div>
          </div>
        </div>
        
        <p className="text-sm text-sidebar-foreground/60">
          © 2024 CareTag Healthcare Systems
        </p>
      </div>
      
      {/* Right side - Auth form */}
      <div className="flex w-full lg:w-1/2 items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex lg:hidden items-center justify-center gap-3 mb-8">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <Activity className="h-6 w-6 text-primary-foreground" />
            </div>
            <span className="text-2xl font-bold text-foreground">CareTag</span>
          </div>
          
          <Card className="border-border/50 shadow-lg">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Welcome</CardTitle>
              <CardDescription>
                Sign in to your account or create a new one
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="login">Sign In</TabsTrigger>
                  <TabsTrigger value="signup">Sign Up</TabsTrigger>
                </TabsList>
                
                <TabsContent value="login" className="space-y-4 mt-4">
                  <form onSubmit={handleLogin} className="space-y-4">
                    {loginError && (
                      <div className="flex items-center gap-2 p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                        <AlertCircle className="h-4 w-4 flex-shrink-0" />
                        {loginError}
                      </div>
                    )}
                    
                    <div className="space-y-2">
                      <Label htmlFor="login-email">Email</Label>
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="doctor@hospital.com"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="login-password">Password</Label>
                      <Input
                        id="login-password"
                        type="password"
                        placeholder="••••••••"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        required
                      />
                    </div>
                    
                    <Button type="submit" className="w-full" disabled={isLoading}>
                      {isLoading ? 'Signing in...' : 'Sign In'}
                    </Button>
                  </form>
                </TabsContent>
                
                <TabsContent value="signup" className="space-y-4 mt-4">
                  <form onSubmit={handleSignup} className="space-y-4">
                    {signupError && (
                      <div className="flex items-center gap-2 p-3 rounded-md bg-destructive/10 text-destructive text-sm">
                        <AlertCircle className="h-4 w-4 flex-shrink-0" />
                        {signupError}
                      </div>
                    )}
                    
                    <div className="space-y-2">
                      <Label htmlFor="signup-name">Full Name</Label>
                      <Input
                        id="signup-name"
                        type="text"
                        placeholder="Dr. John Smith"
                        value={signupFullName}
                        onChange={(e) => setSignupFullName(e.target.value)}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="signup-email">Email</Label>
                      <Input
                        id="signup-email"
                        type="email"
                        placeholder="doctor@hospital.com"
                        value={signupEmail}
                        onChange={(e) => setSignupEmail(e.target.value)}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="signup-role">Role</Label>
                      <Select value={signupRole} onValueChange={(v) => setSignupRole(v as 'doctor' | 'admin')}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your role" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="doctor">Doctor</SelectItem>
                          <SelectItem value="admin">Hospital Admin</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="signup-password">Password</Label>
                      <Input
                        id="signup-password"
                        type="password"
                        placeholder="••••••••"
                        value={signupPassword}
                        onChange={(e) => setSignupPassword(e.target.value)}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="signup-confirm-password">Confirm Password</Label>
                      <Input
                        id="signup-confirm-password"
                        type="password"
                        placeholder="••••••••"
                        value={signupConfirmPassword}
                        onChange={(e) => setSignupConfirmPassword(e.target.value)}
                        required
                      />
                    </div>
                    
                    <Button type="submit" className="w-full" disabled={isLoading}>
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
