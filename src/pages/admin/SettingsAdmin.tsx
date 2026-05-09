import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { useStore } from '../../store';
import { Trash2, Activity } from 'lucide-react';
import { toast } from 'sonner';
import { fireTestEvent } from '../../services/pixelService';

export const SettingsAdmin = () => {
  const { pixels, fetchPixels } = useStore();
  
  const [pixelPlatform, setPixelPlatform] = useState('meta');
  const [pixelId, setPixelId] = useState('');
  
  const [deliveryFees, setDeliveryFees] = useState({ home: 600, desk: 400 });
  const [apiKeys, setApiKeys] = useState<any>({ yalidine_id: '', yalidine_token: '', ecotrack_url: '', ecotrack_token: '' });

  const [isAddingPixel, setIsAddingPixel] = useState(false);
  const [isSavingFees, setIsSavingFees] = useState(false);
  const [isSavingApi, setIsSavingApi] = useState(false);

  useEffect(() => {
    fetchPixels();
    fetch('/api/settings/delivery_fees').then(r => r.json()).then(d => { if(!d.error) setDeliveryFees(d) });
    fetch('/api/settings/api_keys').then(r => r.json()).then(d => { if(!d.error) setApiKeys(d) });
  }, []);

  const handleAddPixel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pixelId) return;
    setIsAddingPixel(true);
    try {
      await fetch('/api/pixels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ platform: pixelPlatform, pixel_id: pixelId })
      });
      setPixelId('');
      fetchPixels();
      toast.success('Pixel added');
    } finally {
      setIsAddingPixel(false);
    }
  };

  const deletePixel = async (id: string) => {
    await fetch(`/api/pixels/${id}`, { method: 'DELETE' });
    fetchPixels();
    toast.success('Pixel removed');
  };

  const testPixel = (platform: string) => {
    const result = fireTestEvent({}, platform);
    toast('Pixel Test Fired', {
      description: (
        <pre className="mt-2 w-[340px] rounded-md bg-slate-950 p-4">
          <code className="text-white text-xs">{result}</code>
        </pre>
      ),
    });
  };

  const saveSettings = async (key: string, value: any, setLoading?: (v: boolean) => void) => {
    if (setLoading) setLoading(true);
    try {
      await fetch(`/api/settings/${key}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(value)
      });
      toast.success('Settings saved');
    } finally {
      if (setLoading) setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-xl border border-[#E2E8F0] shadow-sm">
        <h2 className="text-2xl font-bold tracking-tight text-[#1A202C]">Settings</h2>
      </div>

      <Tabs defaultValue="pixels" className="w-full">
        <TabsList>
          <TabsTrigger value="pixels">Tracking Pixels</TabsTrigger>
          <TabsTrigger value="delivery">Delivery Config</TabsTrigger>
        </TabsList>
        
        <TabsContent value="pixels" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white border border-[#E2E8F0] shadow-sm rounded-xl p-6">
              <h3 className="font-bold text-lg text-[#1A202C] mb-2">Add Pixel</h3>
              <p className="text-xs text-gray-500 mb-6 bg-gray-50 p-3 rounded-lg border border-gray-100">
                <strong>Important:</strong> When using Facebook's "Test Events" tool, use your actual deployed website URL (e.g. <code>{window.location.origin}</code>), <strong>not</strong> the AI Studio platform link. Otherwise, Test Events will not be detected! Ensure ad-blockers are disabled.
              </p>
              <form onSubmit={handleAddPixel} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Platform</Label>
                    <Select value={pixelPlatform} onValueChange={setPixelPlatform}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="meta">Meta (Facebook)</SelectItem>
                        <SelectItem value="tiktok">TikTok</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Pixel ID</Label>
                    <Input value={pixelId} onChange={e => setPixelId(e.target.value)} placeholder="e.g. 1234567890" />
                  </div>
                  <button 
                    disabled={isAddingPixel}
                    type="submit" 
                    className={`w-full text-white py-2.5 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center gap-2 mt-2 ${
                      isAddingPixel ? 'bg-indigo-400 cursor-wait' : 'bg-[#4F46E5] hover:bg-indigo-700'
                    }`}
                  >
                    {isAddingPixel ? (
                      <>
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                        Installing...
                      </>
                    ) : 'Install Pixel'}
                  </button>
                </form>
            </div>

            <div className="bg-white border border-[#E2E8F0] shadow-sm rounded-xl p-6">
              <h3 className="font-bold text-lg text-[#1A202C] mb-6">Active Pixels</h3>
              <div className="space-y-4">
                {(pixels || []).map(p => (
                  <div key={p.id} className="flex justify-between items-center p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-bold text-[0.85rem] text-[#1A202C] capitalize">{p.platform}</p>
                        <span className="bg-[#C6F6D5] text-[#22543D] text-[0.65rem] px-2 py-0.5 rounded-full font-bold">Active</span>
                      </div>
                      <p className="text-xs text-[#718096] font-mono">ID: {p.pixel_id}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => testPixel(p.platform)} className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-indigo-50 text-indigo-700 rounded hover:bg-indigo-100 transition-colors">
                        <Activity size={14} />
                        Test
                      </button>
                      <button onClick={() => deletePixel(p.id)} className="p-2 text-[#718096] hover:text-red-600 transition-colors bg-white rounded shadow-sm border border-gray-200">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
                {pixels.length === 0 && <p className="text-[#718096] text-sm">No pixels installed.</p>}
              </div>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="delivery" className="mt-6 space-y-6">
          <div className="bg-white border border-[#E2E8F0] shadow-sm rounded-xl p-6">
            <h3 className="font-bold text-lg text-[#1A202C] mb-6">Base Delivery Fees</h3>
               <div className="grid grid-cols-2 gap-4 max-w-md">
                 <div className="space-y-2">
                   <Label>Home Delivery (DZD)</Label>
                   <Input type="number" className="bg-[#F8FAFC]" value={deliveryFees.home} onChange={e => setDeliveryFees({...deliveryFees, home: parseInt(e.target.value)})} />
                 </div>
                 <div className="space-y-2">
                   <Label>Desk Delivery (DZD)</Label>
                   <Input type="number" className="bg-[#F8FAFC]" value={deliveryFees.desk} onChange={e => setDeliveryFees({...deliveryFees, desk: parseInt(e.target.value)})} />
                 </div>
                 <button 
                   disabled={isSavingFees}
                   onClick={() => saveSettings('delivery_fees', deliveryFees, setIsSavingFees)} 
                   className={`col-span-2 mt-4 text-white py-2.5 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
                     isSavingFees ? 'bg-indigo-400 cursor-wait' : 'bg-[#4F46E5] hover:bg-indigo-700'
                   }`}
                 >
                   {isSavingFees ? (
                     <>
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                        Saving...
                     </>
                   ) : 'Save Fees'}
                 </button>
               </div>
          </div>

          <div className="bg-white border border-[#E2E8F0] shadow-sm rounded-xl p-6 max-w-xl">
            <h3 className="font-bold text-lg text-[#1A202C] mb-6">API Integrations</h3>
            <div className="space-y-6">
               <div className="space-y-4 border-b pb-6">
                 <h3 className="font-semibold text-lg flex items-center gap-2">Yalidine Config</h3>
                 <div className="space-y-2">
                   <Label>X-API-ID</Label>
                   <Input value={apiKeys.yalidine_id} onChange={e => setApiKeys({...apiKeys, yalidine_id: e.target.value})} placeholder="API ID" />
                 </div>
                 <div className="space-y-2">
                   <Label>X-API-TOKEN</Label>
                   <Input value={apiKeys.yalidine_token} onChange={e => setApiKeys({...apiKeys, yalidine_token: e.target.value})} type="password" placeholder="API Token" />
                 </div>
               </div>

               <div className="space-y-4">
                 <h3 className="font-semibold text-lg flex items-center gap-2">Ecotrack Config</h3>
                 <div className="space-y-2">
                   <Label>API Base URL</Label>
                   <Input value={apiKeys.ecotrack_url || ''} onChange={e => setApiKeys({...apiKeys, ecotrack_url: e.target.value})} placeholder="e.g. https://dhd.ecotrack.dz" />
                   <p className="text-[10px] text-muted-foreground pt-1 italic">
                     For DHD: <strong>https://dhd.ecotrack.dz</strong> <br/>
                     Default: <strong>https://app.ecotrack.dz</strong>
                   </p>
                 </div>
                 <div className="space-y-2">
                   <Label>Bearer Token</Label>
                   <Input value={apiKeys.ecotrack_token || ''} onChange={e => setApiKeys({...apiKeys, ecotrack_token: e.target.value})} type="password" placeholder="Paste your token here" />
                   <p className="text-[10px] text-muted-foreground pt-1 italic">We'll automatically add "Bearer " prefix if missing.</p>
                 </div>
               </div>

               <button 
                 disabled={isSavingApi}
                 onClick={() => saveSettings('api_keys', apiKeys, setIsSavingApi)} 
                 className={`w-full mt-6 text-white py-2.5 rounded-lg font-semibold transition-all duration-300 flex items-center justify-center gap-2 ${
                   isSavingApi ? 'bg-indigo-400 cursor-wait' : 'bg-[#4F46E5] hover:bg-indigo-700'
                 }`}
               >
                 {isSavingApi ? (
                   <>
                     <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                     Saving Integration...
                   </>
                 ) : 'Save API Keys'}
               </button>
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};
