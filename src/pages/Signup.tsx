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

  const handleSignup = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate signup for SaaS
    if (email && password && storeName) {
      localStorage.setItem('saas_token', 'logged_in');
      toast.success('Account created successfully');
      navigate('/admin');
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
          <Button type="submit" className="w-full bg-[#4F46E5] hover:bg-indigo-700 text-white rounded-lg h-12">Sign Up</Button>
        </form>
        <p className="mt-6 text-center text-sm text-[#718096]">
          Already have an account? <a href="/login" className="text-[#4F46E5] font-semibold">Log in</a>
        </p>
      </div>
    </div>
  );
};
