import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Pill, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [seeding, setSeeding] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const { error } = await signIn(email, password);
    if (error) {
      toast.error(error.message || 'Login failed');
    }
    setLoading(false);
  };

  const handleSeed = async () => {
    setSeeding(true);
    try {
      const { data, error } = await supabase.functions.invoke('seed-database');
      if (error) throw error;
      toast.success(data?.message || 'Database seeded!');
    } catch (err: any) {
      toast.error('Seeding failed: ' + (err?.message || 'Unknown error'));
    }
    setSeeding(false);
  };

  const fillCredentials = (role: string) => {
    const creds: Record<string, { email: string; password: string }> = {
      pharmacy: { email: 'pharmacy1@pharmalink.ng', password: 'password123' },
      vendor: { email: 'vendor1@pharmalink.ng', password: 'password123' },
      admin: { email: 'admin@pharmalink.ng', password: 'password123' },
    };
    const c = creds[role];
    if (c) {
      setEmail(c.email);
      setPassword(c.password);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex flex-col items-center gap-2">
          <div className="flex items-center gap-2 text-primary">
            <Pill className="h-10 w-10" />
            <h1 className="text-3xl font-bold">PharmaLink</h1>
          </div>
          <p className="text-muted-foreground text-sm">Pharmacy Supply Chain Management</p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Sign In</CardTitle>
            <CardDescription>Enter your credentials to access your portal</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" required />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Sign In
              </Button>
            </form>

            <div className="mt-4 text-center">
              <Button variant="link" onClick={() => navigate('/register')}>Don't have an account? Register</Button>
            </div>

            <div className="mt-4 space-y-3">
              <p className="text-xs text-muted-foreground text-center">Quick login (demo)</p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => fillCredentials('pharmacy')}>Pharmacy</Button>
                <Button variant="outline" size="sm" className="flex-1" onClick={() => fillCredentials('vendor')}>Vendor</Button>
                <Button variant="outline" size="sm" className="flex-1" onClick={() => fillCredentials('admin')}>Admin</Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Button variant="secondary" className="w-full" onClick={handleSeed} disabled={seeding}>
          {seeding ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Seed Demo Data
        </Button>
      </div>
    </div>
  );
};

export default Login;
