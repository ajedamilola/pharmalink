import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import Logo from '/logo-green.png';

const Register = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    email: '',
    password: '',
    name: '',
    role: '' as 'pharmacy' | 'vendor' | '',
    location: '',
    businessName: '',
  });

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.role) { toast.error('Please select a role'); return; }
    setLoading(true);

    try {
      // Sign up with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: form.email,
        password: form.password
      });
      if (authError) throw authError;
      if (!authData.user) throw new Error('Registration failed');

      // Create user record
      const { data: userData, error: userError } = await supabase.from('users').insert({
        auth_id: authData.user.id,
        email: form.email,
        name: form.name,
        role: form.role as any,
      }).select().single();
      if (userError) throw userError;

      // Create pharmacy or vendor record
      if (form.role === 'pharmacy') {
        await supabase.from('pharmacies').insert({
          user_id: userData.id,
          name: form.businessName || form.name,
          location: form.location,
          wallet_balance: 0,
        });
      } else if (form.role === 'vendor') {
        await supabase.from('vendors').insert({
          user_id: userData.id,
          name: form.businessName || form.name,
          location: form.location,
          verification_status: 'pending',
          cac_status: 'pending',
          nafdac_status: 'pending',
          license_status: 'pending',
        });
      }

      toast.success('Registration successful! You can now sign in.');
      navigate('/login');
    } catch (err: any) {
      toast.error(err.message || 'Registration failed');
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
          <p className="text-muted-foreground text-sm">Register your business</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Create Account</CardTitle>
            <CardDescription>Join the PharmaLink supply chain network</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleRegister} className="space-y-4">
              <div className="space-y-2">
                <Label>Account Type</Label>
                <Select value={form.role} onValueChange={(v: 'pharmacy' | 'vendor') => setForm({ ...form, role: v })}>
                  <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pharmacy">Pharmacy</SelectItem>
                    <SelectItem value="vendor">Vendor / Supplier</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Full Name</Label>
                <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Your name" required />
              </div>
              <div className="space-y-2">
                <Label>Business Name</Label>
                <Input value={form.businessName} onChange={e => setForm({ ...form, businessName: e.target.value })} placeholder="Business name" required />
              </div>
              <div className="space-y-2">
                <Label>Location</Label>
                <Select value={form.location} onValueChange={v => setForm({ ...form, location: v })}>
                  <SelectTrigger><SelectValue placeholder="Select location" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Lagos">Lagos</SelectItem>
                    <SelectItem value="Abuja">Abuja</SelectItem>
                    <SelectItem value="Kano">Kano</SelectItem>
                    <SelectItem value="Port Harcourt">Port Harcourt</SelectItem>
                    <SelectItem value="Ibadan">Ibadan</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Email</Label>
                <Input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="email@example.com" required />
              </div>
              <div className="space-y-2">
                <Label>Password</Label>
                <Input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="••••••••" required minLength={6} />
              </div>
              {form.role === 'vendor' && (
                <p className="text-xs text-muted-foreground bg-muted p-2 rounded">
                  Vendor accounts require verification before products can be listed. You'll be notified once verified.
                </p>
              )}
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Register
              </Button>
            </form>
            <div className="mt-4 text-center">
              <Button variant="link" onClick={() => navigate('/login')}>Already have an account? Sign In</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Register;
