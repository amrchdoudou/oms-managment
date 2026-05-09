import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';

export const Signup = () => {
  const [storeName, setStoreName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const [dbStatus, setDbStatus] = useState<{ status?: string, error?: string, loading?: boolean }>({});

  const testDb = async () => {
    setDbStatus({ loading: true, status: undefined, error: undefined });
    
    // Client-side safety timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 12000);

    try {
      const res = await fetch('/api/debug/db/test', { signal: controller.signal });
      const data = await res.json();
      clearTimeout(timeoutId);

      if (res.ok) {
        setDbStatus({ status: 'Connected Successfully!', loading: false });
        toast.success('Database is connected!');
      } else {
        setDbStatus({ error: data.error, loading: false });
        toast.error(data.error);
      }
    } catch (err: any) {
      clearTimeout(timeoutId);
      if (err.name === 'AbortError') {
        setDbStatus({ error: 'Connection test timed out. Check your DATABASE_URL password.', loading: false });
      } else {
        setDbStatus({ error: 'Could not reach server', loading: false });
      }
      console.error('Test DB Client Error:', err);
    }
  };

  const [isSigningUp, setIsSigningUp] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !storeName) return;

    setIsSigningUp(true);

    try {
      const response = await fetch('/api/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, storeName })
      });

      const data = await response.json().catch(() => ({ error: 'Invalid server response' }));
      setIsSigningUp(false);

      if (response.ok) {
        toast.success('Account created successfully');
        navigate('/login');
      } else {
        toast.error(data.error || 'Signup failed');
      }
    } catch (err: any) {
      setIsSigningUp(false);
      toast.error(err.message || 'Connection error');
      console.error('Signup error:', err);
    }
  };
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-[#E2E8F0] w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-[#1A202C]">Create your Store</h1>
          <p className="text-[#718096] text-sm mt-2">Start selling today</p>
        </div>
        <form onSubmit={handleSignup} className="space-y-4">
          <div className="space-y-2">
            <Label>Store Name</Label>
            <Input required value={storeName} onChange={e => setStoreName(e.target.value)} placeholder="My Super Store" />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@store.com" />
          </div>
          <div className="space-y-2">
            <Label>Password</Label>
            <Input required type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
          </div>
          <Button 
            type="submit" 
            disabled={isSigningUp} 
            className={`w-full rounded-lg h-12 font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
              isSigningUp 
                ? 'bg-indigo-400 cursor-not-allowed opacity-90' 
                : 'bg-[#4F46E5] hover:bg-indigo-700 text-white shadow-lg shadow-indigo-100 hover:shadow-indigo-200'
            }`}
          >
            {isSigningUp ? (
              <>
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                Creating account...
              </>
            ) : 'Sign Up'}
          </Button>
        </form>

        <div className="mt-8 pt-6 border-t border-[#E2E8F0]">
           <p className="text-xs text-[#718096] mb-3 uppercase tracking-wider font-semibold">Database Connection Check</p>
           {dbStatus.error ? (
             <div className="bg-red-50 text-red-600 p-3 rounded-lg text-xs mb-3 border border-red-100">
               <strong>Error:</strong> {dbStatus.error}
             </div>
           ) : dbStatus.status ? (
             <div className="bg-green-50 text-green-600 p-3 rounded-lg text-xs mb-3 border border-green-100">
               {dbStatus.status}
             </div>
           ) : null}
           <Button 
             variant={dbStatus.loading ? "default" : "outline"} 
             onClick={testDb} 
             disabled={dbStatus.loading}
             className={`w-full text-xs h-10 border-[#CBD5E0] transition-colors duration-300 disabled:opacity-100 ${
               dbStatus.loading 
                 ? 'bg-[#4F46E5] text-white border-[#4F46E5]' 
                 : 'bg-white text-[#4A5568] hover:bg-gray-50'
             }`}
           >
             {dbStatus.loading ? (
               <span className="flex items-center justify-center gap-2">
                 <span className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                 Checking Connection...
               </span>
             ) : 'Test Database Connection'}
           </Button>
           <p className="text-[10px] text-[#A0AEC0] mt-2 text-center">
             Required if Signup fails. Update DATABASE_URL in settings first.
           </p>
        </div>

        <p className="mt-6 text-center text-sm text-[#718096]">
          Already have an account? <a href="/login" className="text-[#4F46E5] font-semibold">Log in</a>
        </p>
      </div>
    </div>
  );
};
