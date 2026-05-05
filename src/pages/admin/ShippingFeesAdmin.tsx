import React, { useState, useEffect } from 'react';
import { Save, AlertCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { ALGERIA_WILAYAS } from '../../lib/algeria_data';

export const ShippingFeesAdmin = () => {
  const [fees, setFees] = useState<Record<string, { door: number, desk: number }>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetch('/api/settings/shipping_fees')
      .then(r => r.json())
      .then(data => {
        if (data && !data.error && Object.keys(data).length > 0) {
          setFees(data);
        } else {
          // Initialize with defaults if empty
          const defaults: Record<string, { door: number, desk: number }> = {};
          ALGERIA_WILAYAS.forEach(w => {
            defaults[w.name] = { door: 600, desk: 400 };
          });
          setFees(defaults);
        }
      })
      .catch(() => toast.error('Failed to load shipping fees'))
      .finally(() => setIsLoading(false));
  }, []);

  const handleFeeChange = (wilayaName: string, type: 'door' | 'desk', value: string) => {
    const numValue = parseInt(value) || 0;
    setFees(prev => ({
      ...prev,
      [wilayaName]: {
        ...prev[wilayaName],
        [type]: numValue
      }
    }));
  };

  const applyToAll = (type: 'door' | 'desk', value: number) => {
    const newFees = { ...fees };
    ALGERIA_WILAYAS.forEach(w => {
      newFees[w.name] = {
        ...newFees[w.name],
        [type]: value
      };
    });
    setFees(newFees);
    toast.success(`Applied ${value} DZD to all ${type === 'door' ? 'Door' : 'Stop Desk'} deliveries`);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const res = await fetch('/api/settings/shipping_fees', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fees)
      });
      if (res.ok) {
        toast.success('Shipping fees saved successfully');
      } else {
        toast.error('Failed to save shipping fees');
      }
    } catch {
      toast.error('Network error while saving');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) return <div className="p-8 text-center">Loading fees...</div>;

  return (
    <div className="bg-[#F8FAFC] min-h-screen -m-6 lg:-m-8 p-6 lg:p-8">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl font-bold text-[#1A202C]">Manage Pricings</h2>
            <p className="text-[#718096] text-sm">Configure delivery fees for each province</p>
          </div>
          <button 
            onClick={handleSave} 
            disabled={isSaving}
            className="bg-[#4F46E5] hover:bg-indigo-700 text-white px-6 py-2.5 rounded-lg font-semibold flex items-center gap-2 transition-all shadow-lg shadow-indigo-500/20 disabled:opacity-50"
          >
            {isSaving ? <span className="animate-spin">...</span> : <Save size={18} />}
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-[#E2E8F0] overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#F8FAFC] border-b border-[#E2E8F0]">
                <th className="py-4 px-6 text-xs font-bold text-[#718096] uppercase tracking-wider">Province</th>
                <th className="py-4 px-6 text-xs font-bold text-[#718096] uppercase tracking-wider">Door Delivery Price</th>
                <th className="py-4 px-6 text-xs font-bold text-[#718096] uppercase tracking-wider">Stop Desk Price</th>
              </tr>
            </thead>
            <tbody>
              {ALGERIA_WILAYAS.map((w) => (
                <tr key={w.id} className="border-b border-[#F1F5F9] hover:bg-[#FDFDFF] transition-colors">
                  <td className="py-4 px-6">
                    <span className="font-semibold text-[#1A202C]">{w.name}</span>
                    <span className="ml-2 text-xs text-[#A0AEC0]">({w.id})</span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <div className="relative flex-1 max-w-[150px]">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">DZD</span>
                        <input 
                          type="number"
                          value={fees[w.name]?.door || 0}
                          onChange={(e) => handleFeeChange(w.name, 'door', e.target.value)}
                          className="w-full pl-12 pr-4 py-2 bg-white border border-[#CBD5E0] rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                        />
                      </div>
                      <button 
                        onClick={() => applyToAll('door', fees[w.name]?.door || 0)}
                        className="text-indigo-600 text-xs font-bold hover:underline"
                      >
                        Apply All
                      </button>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                  <div className="flex items-center gap-3">
                      <div className="relative flex-1 max-w-[150px]">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-bold">DZD</span>
                        <input 
                          type="number"
                          value={fees[w.name]?.desk || 0}
                          onChange={(e) => handleFeeChange(w.name, 'desk', e.target.value)}
                          className="w-full pl-12 pr-4 py-2 bg-white border border-[#CBD5E0] rounded-lg text-sm focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                        />
                      </div>
                      <button 
                         onClick={() => applyToAll('desk', fees[w.name]?.desk || 0)}
                         className="text-indigo-600 text-xs font-bold hover:underline"
                      >
                        Apply All
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
