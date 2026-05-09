import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';

export const Login = () => {
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

  const [isLoggingIn, setIsLoggingIn] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (email && password) {
      setIsLoggingIn(true);
      try {
        const response = await fetch('/api/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        
        const data = await response.json().catch(() => ({ error: 'Invalid server response' }));
        setIsLoggingIn(false);
        
        if (response.ok) {
          localStorage.setItem('saas_token', data.token);
          localStorage.setItem('admin_api_key', data.apiKey);
          toast.success('Logged in successfully');
          navigate('/admin');
        } else {
          toast.error(data.error || 'Login failed');
        }
      } catch (err: any) {
        setIsLoggingIn(false);
        toast.error('Connection error: ' + err.message);
      }
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-[#E2E8F0] w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-[#1A202C]">Welcome Back</h1>
          <p className="text-[#718096] text-sm mt-2">Sign in to your dashboard</p>
        </div>
        <form onSubmit={handleLogin} className="space-y-4">
          <div className="space-y-2">
            <Label>Email</Label>
            <Input required type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@store.com" />
          </div>
          <div className="space-y-2">
            <Label>Password</Label>
            <Input required type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Use admin123" />
          </div>
          <Button 
            type="submit" 
            disabled={isLoggingIn} 
            className={`w-full rounded-lg h-12 font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
              isLoggingIn 
                ? 'bg-indigo-400 cursor-not-allowed opacity-90' 
                : 'bg-[#4F46E5] hover:bg-indigo-700 text-white shadow-lg shadow-indigo-100 hover:shadow-indigo-200'
            }`}
          >
            {isLoggingIn ? (
              <>
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                Logging in...
              </>
            ) : 'Login'}
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
        </div>

        <p className="mt-6 text-center text-sm text-[#718096]">
          Don't have an account? <a href="/signup" className="text-[#4F46E5] font-semibold">Sign up</a>
        </p>
      </div>
    </div>
  );
};
