import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';
import Logo from '/logo-green.png';

const OTPVerification = () => {
  const { appUser, setOtpVerified, signOut } = useAuth();
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const sendOtp = async () => {
    if (!appUser) return;
    setLoading(true);
    // Insert mock OTP
    await supabase.from('otp_sessions').insert({
      user_id: appUser.id,
      otp_code: '123456',
      expires_at: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
    });
    setSent(true);
    toast.info('OTP sent! (Mock OTP: 123456)');
    setLoading(false);
  };

  const verifyOtp = async () => {
    if (!appUser) return;
    setLoading(true);
    const { data } = await supabase
      .from('otp_sessions')
      .select('*')
      .eq('user_id', appUser.id)
      .eq('otp_code', otp)
      .eq('verified', false)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data) {
      await supabase.from('otp_sessions').update({ verified: true }).eq('id', data.id);
      setOtpVerified(true);
      toast.success('OTP verified! Redirecting...');
    } else {
      toast.error('Invalid OTP code');
    }
    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-2 text-primary">
            <img src={Logo} alt="logo" width={40} height={40} className='' />
            <h1 className="text-3xl font-bold">PharmaLink</h1>
          </div>
          <p className="text-muted-foreground text-sm">Admin Two-Step Verification</p>
        </div>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-accent" />
              <CardTitle>OTP Verification</CardTitle>
            </div>
            <CardDescription>
              {sent ? 'Enter the 6-digit code sent to your account' : 'Click below to receive your verification code'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!sent ? (
              <Button onClick={sendOtp} className="w-full" disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Send OTP Code
              </Button>
            ) : (
              <>
                <Input
                  value={otp}
                  onChange={e => setOtp(e.target.value)}
                  placeholder="Enter 6-digit OTP"
                  maxLength={6}
                  className="text-center text-lg tracking-widest"
                />
                <Button onClick={verifyOtp} className="w-full" disabled={loading || otp.length !== 6}>
                  {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Verify & Continue
                </Button>
              </>
            )}
            <Button variant="ghost" className="w-full" onClick={signOut}>
              Back to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OTPVerification;
