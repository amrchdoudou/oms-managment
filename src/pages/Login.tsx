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

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (email && password) {
      try {
        const res = await fetch('/api/orders', {
          headers: { 'x-api-key': password }
        });
        if (res.status === 401) {
          toast.error('Invalid Email or Password');
          return;
        }
        localStorage.setItem('saas_token', 'logged_in');
        localStorage.setItem('admin_api_key', password);
        toast.success('Logged in successfully');
        navigate('/admin');
      } catch (err) {
        toast.error('Login failed');
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
            <Input required type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
          </div>
          <Button type="submit" className="w-full bg-[#4F46E5] hover:bg-indigo-700 text-white rounded-lg h-12">Login</Button>
        </form>
        <p className="mt-6 text-center text-sm text-[#718096]">
          Don't have an account? <a href="/signup" className="text-[#4F46E5] font-semibold">Sign up</a>
        </p>
      </div>
    </div>
  );
};
