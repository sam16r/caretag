import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Stethoscope, AlertCircle, Sparkles, ArrowLeft, ArrowRight, Loader2, Mail, Check, Activity } from 'lucide-react';
import { z } from 'zod';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import logoSvg from '@/assets/logo.svg';
import { SignupStepper } from '@/components/auth/SignupStepper';
import { AccountSetupStep } from '@/components/auth/signup-steps/AccountSetupStep';
import { ProfessionalDetailsStep } from '@/components/auth/signup-steps/ProfessionalDetailsStep';
import { DoctorVerificationStep } from '@/components/auth/signup-steps/DoctorVerificationStep';
import { PracticeDetailsStep } from '@/components/auth/signup-steps/PracticeDetailsStep';
import { ReviewSubmitStep } from '@/components/auth/signup-steps/ReviewSubmitStep';

const emailSchema = z.string().email('Please enter a valid email address');
const passwordSchema = z.string().min(6, 'Password must be at least 6 characters');
const phoneSchema = z.string().min(10, 'Please enter a valid mobile number');

const SIGNUP_STEPS = [
  { title: 'Account', description: 'Basic account details' },
  { title: 'Professional', description: 'Your qualifications' },
  { title: 'Verification', description: 'Doctor verification' },
  { title: 'Practice', description: 'Your practice info' },
  { title: 'Review', description: 'Review & submit' }
];

export default function Auth() {
  const navigate = useNavigate();
  const { signIn, signUp, user, loading } = useAuth();
  const { toast } = useToast();
  
  const [isLoading, setIsLoading] = useState(false);
  const [view, setView] = useState<'login' | 'signup' | 'success' | 'forgot-password' | 'reset-sent'>('login');
  const [signupStep, setSignupStep] = useState(0);
  
  // Login form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  
  // Forgot password
  const [resetEmail, setResetEmail] = useState('');
  const [resetError, setResetError] = useState('');
  
  // Signup form data
  const [accountData, setAccountData] = useState({
    fullName: '',
    email: '',
    mobileNumber: '',
    password: '',
    confirmPassword: ''
  });
  
  const [professionalData, setProfessionalData] = useState({
    primaryQualification: '',
    specialization: '',
    yearsOfExperience: '',
    languagesSpoken: [] as string[]
  });
  
  const [verificationData, setVerificationData] = useState({
    medicalCouncilNumber: '',
    registeringAuthority: '',
    registrationYear: '',
    degreeCertificate: null as File | null,
    idProof: null as File | null,
    professionalPhoto: null as File | null
  });
  
  const [practiceData, setPracticeData] = useState({
    clinicName: '',
    clinicAddress: '',
    city: '',
    state: '',
    consultationType: ''
  });
  
  const [termsAccepted, setTermsAccepted] = useState(false);
  
  // Errors
  const [accountErrors, setAccountErrors] = useState<Record<string, string>>({});
  const [professionalErrors, setProfessionalErrors] = useState<Record<string, string>>({});
  const [verificationErrors, setVerificationErrors] = useState<Record<string, string>>({});
  const [practiceErrors, setPracticeErrors] = useState<Record<string, string>>({});
  const [termsError, setTermsError] = useState('');

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

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setResetError('');
    
    try {
      emailSchema.parse(resetEmail);
    } catch (err) {
      if (err instanceof z.ZodError) {
        setResetError(err.errors[0].message);
        return;
      }
    }
    
    setIsLoading(true);
    
    const { error } = await supabase.auth.resetPasswordForEmail(resetEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    
    setIsLoading(false);
    
    if (error) {
      setResetError(error.message);
      return;
    }
    
    setView('reset-sent');
  };

  const validateAccountStep = () => {
    const errors: Record<string, string> = {};
    
    if (!accountData.fullName.trim()) {
      errors.fullName = 'Full name is required';
    }
    
    try {
      emailSchema.parse(accountData.email);
    } catch {
      errors.email = 'Please enter a valid email address';
    }
    
    try {
      phoneSchema.parse(accountData.mobileNumber.replace(/\s/g, ''));
    } catch {
      errors.mobileNumber = 'Please enter a valid mobile number';
    }
    
    try {
      passwordSchema.parse(accountData.password);
    } catch {
      errors.password = 'Password must be at least 6 characters';
    }
    
    if (accountData.password !== accountData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }
    
    setAccountErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateProfessionalStep = () => {
    const errors: Record<string, string> = {};
    
    if (!professionalData.primaryQualification) {
      errors.primaryQualification = 'Primary qualification is required';
    }
    
    if (!professionalData.yearsOfExperience) {
      errors.yearsOfExperience = 'Years of experience is required';
    }
    
    if (professionalData.languagesSpoken.length === 0) {
      errors.languagesSpoken = 'Please select at least one language';
    }
    
    setProfessionalErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateVerificationStep = () => {
    const errors: Record<string, string> = {};
    
    if (!verificationData.medicalCouncilNumber.trim()) {
      errors.medicalCouncilNumber = 'Registration number is required';
    }
    
    if (!verificationData.registeringAuthority) {
      errors.registeringAuthority = 'Registering authority is required';
    }
    
    if (!verificationData.registrationYear) {
      errors.registrationYear = 'Registration year is required';
    }
    
    if (!verificationData.degreeCertificate) {
      errors.degreeCertificate = 'Degree certificate is required';
    }
    
    if (!verificationData.idProof) {
      errors.idProof = 'ID proof is required';
    }
    
    if (!verificationData.professionalPhoto) {
      errors.professionalPhoto = 'Professional photo is required';
    }
    
    setVerificationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validatePracticeStep = () => {
    const errors: Record<string, string> = {};
    
    if (!practiceData.clinicName.trim()) {
      errors.clinicName = 'Clinic/Hospital name is required';
    }
    
    if (!practiceData.clinicAddress.trim()) {
      errors.clinicAddress = 'Address is required';
    }
    
    if (!practiceData.city.trim()) {
      errors.city = 'City is required';
    }
    
    if (!practiceData.state) {
      errors.state = 'State is required';
    }
    
    if (!practiceData.consultationType) {
      errors.consultationType = 'Please select a consultation type';
    }
    
    setPracticeErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNextStep = () => {
    let isValid = false;
    
    switch (signupStep) {
      case 0:
        isValid = validateAccountStep();
        break;
      case 1:
        isValid = validateProfessionalStep();
        break;
      case 2:
        isValid = validateVerificationStep();
        break;
      case 3:
        isValid = validatePracticeStep();
        break;
      default:
        isValid = true;
    }
    
    if (isValid) {
      setSignupStep(prev => Math.min(prev + 1, SIGNUP_STEPS.length - 1));
    }
  };

  const handlePrevStep = () => {
    setSignupStep(prev => Math.max(prev - 1, 0));
  };

  const uploadFile = async (file: File, userId: string, folder: string): Promise<string | null> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}/${folder}/${Date.now()}.${fileExt}`;
    
    const { error } = await supabase.storage
      .from('doctor-documents')
      .upload(fileName, file);
    
    if (error) {
      console.error('Upload error:', error);
      return null;
    }
    
    return fileName;
  };

  const handleSubmit = async () => {
    if (!termsAccepted) {
      setTermsError('Please accept the terms and conditions');
      return;
    }
    setTermsError('');
    
    setIsLoading(true);
    
    try {
      // Create the user account
      const { error: signUpError } = await signUp(
        accountData.email,
        accountData.password,
        accountData.fullName,
        'doctor'
      );
      
      if (signUpError) {
        if (signUpError.message.includes('already registered')) {
          toast({
            title: 'Email already registered',
            description: 'This email is already registered. Please log in instead.',
            variant: 'destructive'
          });
        } else {
          toast({
            title: 'Signup failed',
            description: signUpError.message,
            variant: 'destructive'
          });
        }
        setIsLoading(false);
        return;
      }
      
      // Get the user session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (session?.user) {
        // Upload files
        const [degreeUrl, idProofUrl, photoUrl] = await Promise.all([
          verificationData.degreeCertificate ? uploadFile(verificationData.degreeCertificate, session.user.id, 'degree') : null,
          verificationData.idProof ? uploadFile(verificationData.idProof, session.user.id, 'id-proof') : null,
          verificationData.professionalPhoto ? uploadFile(verificationData.professionalPhoto, session.user.id, 'photo') : null
        ]);
        
        // Update profile with additional data
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            mobile_number: accountData.mobileNumber,
            specialization: professionalData.specialization,
            primary_qualification: professionalData.primaryQualification,
            years_of_experience: parseInt(professionalData.yearsOfExperience) || 0,
            languages_spoken: professionalData.languagesSpoken,
            medical_council_number: verificationData.medicalCouncilNumber,
            registering_authority: verificationData.registeringAuthority,
            registration_year: parseInt(verificationData.registrationYear) || null,
            degree_certificate_url: degreeUrl,
            id_proof_url: idProofUrl,
            professional_photo_url: photoUrl,
            clinic_name: practiceData.clinicName,
            clinic_address: practiceData.clinicAddress,
            city: practiceData.city,
            state: practiceData.state,
            consultation_type: practiceData.consultationType,
            verification_status: 'pending'
          })
          .eq('id', session.user.id);
        
        if (profileError) {
          console.error('Profile update error:', profileError);
        }
      }
      
      setView('success');
    } catch (error) {
      console.error('Signup error:', error);
      toast({
        title: 'Something went wrong',
        description: 'Please try again later.',
        variant: 'destructive'
      });
    }
    
    setIsLoading(false);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="h-12 w-12 rounded-2xl flex items-center justify-center animate-pulse">
            <img src={logoSvg} alt="CareTag Logo" className="h-12 w-12" />
          </div>
          <div className="flex flex-col items-center gap-1">
            <span className="text-foreground font-semibold">CareTag</span>
            <span className="text-muted-foreground text-sm italic">Your Health, Simplified</span>
          </div>
        </div>
      </div>
    );
  }

  // Success screen after signup
  if (view === 'success') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-8">
        <Card className="w-full max-w-md border-border/50 shadow-xl shadow-black/5 rounded-2xl text-center">
          <CardContent className="p-8">
            <div className="mx-auto h-16 w-16 rounded-full bg-success/10 flex items-center justify-center mb-6">
              <Shield className="h-8 w-8 text-success" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Application Submitted!</h2>
            <p className="text-muted-foreground mb-6">
              Your doctor registration application has been submitted successfully. 
              Our team will verify your credentials within 24-48 hours.
            </p>
            <div className="p-4 rounded-xl bg-muted/50 border border-border mb-6">
              <p className="text-sm">
                <span className="font-medium">Verification Status:</span>{' '}
                <span className="text-warning">Pending Review</span>
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                You'll receive an email once your account is verified.
              </p>
            </div>
            <Button 
              className="w-full h-11 rounded-xl font-semibold"
              onClick={() => setView('login')}
            >
              Back to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Reset email sent confirmation
  if (view === 'reset-sent') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-8">
        <Card className="w-full max-w-md border-border/50 shadow-xl shadow-black/5 rounded-2xl text-center">
          <CardContent className="p-8">
            <div className="mx-auto h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-6">
              <Mail className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Check Your Email</h2>
            <p className="text-muted-foreground mb-6">
              We've sent a password reset link to <span className="font-medium text-foreground">{resetEmail}</span>. 
              Click the link in the email to reset your password.
            </p>
            <div className="p-4 rounded-xl bg-muted/50 border border-border mb-6">
              <p className="text-xs text-muted-foreground">
                Didn't receive the email? Check your spam folder or try again.
              </p>
            </div>
            <div className="space-y-3">
              <Button 
                className="w-full h-11 rounded-xl font-semibold"
                onClick={() => setView('login')}
              >
                Back to Login
              </Button>
              <Button 
                variant="ghost"
                className="w-full h-11 rounded-xl"
                onClick={() => {
                  setView('forgot-password');
                  setResetEmail('');
                }}
              >
                Try Different Email
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Forgot password view
  if (view === 'forgot-password') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-8">
        <div className="w-full max-w-md animate-fade-in">
          {/* Logo */}
          <div className="flex flex-col items-center gap-2 mb-8">
            <div className="flex items-center gap-3">
              <img src={logoSvg} alt="CareTag Logo" className="h-11 w-11" />
              <span className="text-2xl font-bold tracking-tight">CareTag</span>
            </div>
            <span className="text-sm text-muted-foreground italic">Your Health, Simplified</span>
          </div>
          
          <Card className="border-border/50 shadow-xl shadow-black/5 rounded-2xl">
            <CardHeader className="text-center pb-2 pt-8">
              <CardTitle className="text-2xl font-bold tracking-tight">Forgot Password?</CardTitle>
              <CardDescription className="text-base">
                Enter your email and we'll send you a reset link
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 pt-4">
              <form onSubmit={handleForgotPassword} className="space-y-4">
                {resetError && (
                  <div className="flex items-center gap-2 p-3.5 rounded-xl bg-destructive/10 text-destructive text-sm font-medium">
                    <AlertCircle className="h-4 w-4 flex-shrink-0" />
                    {resetError}
                  </div>
                )}
                
                <div className="space-y-2">
                  <Label htmlFor="reset-email" className="text-sm font-medium">Email Address</Label>
                  <Input
                    id="reset-email"
                    type="email"
                    placeholder="doctor@hospital.com"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="h-11 rounded-xl"
                    required
                  />
                </div>
                
                <Button 
                  type="submit" 
                  className="w-full h-11 rounded-xl font-semibold shadow-lg shadow-primary/25" 
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Sending...
                    </>
                  ) : (
                    'Send Reset Link'
                  )}
                </Button>
              </form>
              
              <div className="mt-6 text-center">
                <button 
                  className="text-sm text-primary font-medium hover:underline inline-flex items-center gap-1"
                  onClick={() => {
                    setView('login');
                    setResetError('');
                  }}
                >
                  <ArrowLeft className="h-3.5 w-3.5" />
                  Back to Login
                </button>
              </div>
            </CardContent>
          </Card>
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
          <img src={logoSvg} alt="CareTag Logo" className="h-11 w-11" />
          <span className="text-2xl font-bold text-sidebar-foreground tracking-tight">CareTag</span>
        </div>
        
        <div className="space-y-10 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-sidebar-accent/50 text-sidebar-foreground/80 text-sm font-medium mb-6">
              <Sparkles className="h-4 w-4" />
              Your Health, Simplified
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
                <p className="font-semibold text-sidebar-foreground">Verified Doctors Only</p>
                <p className="text-sm text-sidebar-foreground/60">Ensuring patient safety and trust</p>
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
      <div className="flex w-full lg:w-1/2 items-center justify-center p-6 sm:p-8 bg-muted/30 overflow-y-auto">
        <div className="w-full max-w-md animate-fade-in">
          {/* Mobile logo */}
          <div className="flex lg:hidden flex-col items-center gap-2 mb-8">
            <div className="flex items-center gap-3">
              <img src={logoSvg} alt="CareTag Logo" className="h-11 w-11" />
              <span className="text-2xl font-bold tracking-tight">CareTag</span>
            </div>
            <span className="text-sm text-muted-foreground italic">Your Health, Simplified</span>
          </div>
          
          {view === 'login' ? (
            <Card className="border-border/50 shadow-xl shadow-black/5 rounded-2xl">
              <CardHeader className="text-center pb-2 pt-8">
                <CardTitle className="text-2xl font-bold tracking-tight">Welcome back</CardTitle>
                <CardDescription className="text-base">
                  Sign in to your account to continue
                </CardDescription>
              </CardHeader>
              <CardContent className="p-6 pt-4">
                <form onSubmit={handleLogin} className="space-y-4">
                  {loginError && (
                    <div className="flex items-center gap-2 p-3.5 rounded-xl bg-destructive/10 text-destructive text-sm font-medium">
                      <AlertCircle className="h-4 w-4 flex-shrink-0" />
                      {loginError}
                    </div>
                  )}
                  
                  <div className="space-y-2">
                    <Label htmlFor="login-email" className="text-sm font-medium">Email or Mobile Number</Label>
                    <Input
                      id="login-email"
                      type="text"
                      placeholder="doctor@hospital.com"
                      value={loginEmail}
                      onChange={(e) => setLoginEmail(e.target.value)}
                      className="h-11 rounded-xl"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="login-password" className="text-sm font-medium">Password</Label>
                      <button 
                        type="button" 
                        className="text-xs text-primary font-medium hover:underline"
                        onClick={() => setView('forgot-password')}
                      >
                        Forgot Password?
                      </button>
                    </div>
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
                  
                  <div className="p-3 rounded-xl bg-primary/5 border border-primary/20">
                    <p className="text-xs text-muted-foreground text-center">
                      <Shield className="h-3.5 w-3.5 inline mr-1" />
                      Only verified doctors can access this app.
                    </p>
                  </div>
                  
                  <Button 
                    type="submit" 
                    className="w-full h-11 rounded-xl font-semibold shadow-lg shadow-primary/25" 
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Signing in...
                      </>
                    ) : (
                      'Sign In'
                    )}
                  </Button>
                </form>
                
                <div className="mt-6 text-center">
                  <p className="text-sm text-muted-foreground">
                    New doctor?{' '}
                    <button 
                      className="text-primary font-medium hover:underline"
                      onClick={() => {
                        setView('signup');
                        setSignupStep(0);
                      }}
                    >
                      Create an account
                    </button>
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="border-border/50 shadow-xl shadow-black/5 rounded-2xl">
              <CardHeader className="pb-4 pt-6">
                <div className="flex items-center gap-3 mb-4">
                  <button 
                    onClick={() => setView('login')}
                    className="h-8 w-8 rounded-lg border border-border flex items-center justify-center hover:bg-muted transition-colors"
                  >
                    <ArrowLeft className="h-4 w-4" />
                  </button>
                  <div>
                    <CardTitle className="text-xl font-bold tracking-tight">Doctor Registration</CardTitle>
                    <CardDescription className="text-sm">
                      Step {signupStep + 1} of {SIGNUP_STEPS.length}
                    </CardDescription>
                  </div>
                </div>
                <SignupStepper currentStep={signupStep} steps={SIGNUP_STEPS} />
              </CardHeader>
              <CardContent className="p-6 pt-2">
                <div className="min-h-[350px]">
                  {signupStep === 0 && (
                    <AccountSetupStep
                      data={accountData}
                      onChange={(data) => setAccountData(prev => ({ ...prev, ...data }))}
                      errors={accountErrors}
                    />
                  )}
                  
                  {signupStep === 1 && (
                    <ProfessionalDetailsStep
                      data={professionalData}
                      onChange={(data) => setProfessionalData(prev => ({ ...prev, ...data }))}
                      errors={professionalErrors}
                    />
                  )}
                  
                  {signupStep === 2 && (
                    <DoctorVerificationStep
                      data={verificationData}
                      onChange={(data) => setVerificationData(prev => ({ ...prev, ...data }))}
                      errors={verificationErrors}
                    />
                  )}
                  
                  {signupStep === 3 && (
                    <PracticeDetailsStep
                      data={practiceData}
                      onChange={(data) => setPracticeData(prev => ({ ...prev, ...data }))}
                      errors={practiceErrors}
                    />
                  )}
                  
                  {signupStep === 4 && (
                    <ReviewSubmitStep
                      data={{
                        account: accountData,
                        professional: professionalData,
                        verification: verificationData,
                        practice: practiceData,
                        termsAccepted
                      }}
                      onTermsChange={setTermsAccepted}
                      error={termsError}
                    />
                  )}
                </div>
                
                <div className="flex gap-3 mt-6">
                  {signupStep > 0 && (
                    <Button
                      type="button"
                      variant="outline"
                      className="flex-1 h-11 rounded-xl font-medium"
                      onClick={handlePrevStep}
                      disabled={isLoading}
                    >
                      <ArrowLeft className="h-4 w-4 mr-2" />
                      Previous
                    </Button>
                  )}
                  
                  {signupStep < SIGNUP_STEPS.length - 1 ? (
                    <Button
                      type="button"
                      className="flex-1 h-11 rounded-xl font-semibold shadow-lg shadow-primary/25"
                      onClick={handleNextStep}
                    >
                      Next
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  ) : (
                    <Button
                      type="button"
                      className="flex-1 h-11 rounded-xl font-semibold shadow-lg shadow-primary/25"
                      onClick={handleSubmit}
                      disabled={isLoading}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin mr-2" />
                          Submitting...
                        </>
                      ) : (
                        'Submit for Verification'
                      )}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
