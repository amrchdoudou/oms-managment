import React, { useEffect, useState } from 'react';
import { Truck, Check, X, Clock, MoreHorizontal, HelpCircle, Plus, RefreshCcw, Phone } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { ALGERIA_WILAYAS, WILAYA_COMMUNES } from '../../lib/algeria_data';

const STATUS_COLORS: Record<string, string> = {
  'Nouveau': 'text-blue-700 bg-blue-50 border-blue-200 hover:bg-blue-100',
  'Confirmé': 'text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100',
  'Annulé': 'text-red-700 bg-red-50 border-red-200 hover:bg-red-100',
  'Pas répondu': 'text-amber-700 bg-amber-50 border-amber-200 hover:bg-amber-100',
  'En attente': 'text-purple-700 bg-purple-50 border-purple-200 hover:bg-purple-100',
  'Expédié': 'text-cyan-700 bg-cyan-50 border-cyan-200 hover:bg-cyan-100',
  'en_livraison': 'text-indigo-700 bg-indigo-50 border-indigo-200 hover:bg-indigo-100',
  'livre_non_encaisse': 'text-emerald-700 bg-emerald-50 border-emerald-200 hover:bg-emerald-100',
  'encaisse_non_paye': 'text-emerald-800 bg-emerald-100 border-emerald-300 hover:bg-emerald-200',
  'annule': 'text-red-700 bg-red-50 border-red-200 hover:bg-red-100',
  'suspendu': 'text-amber-700 bg-amber-50 border-amber-200 hover:bg-amber-100',
};

const prettifyStatus = (status: string) => {
  if (!status) return 'Nouveau';
  if (status.includes('_')) {
    return status.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
  }
  return status;
}

export const OrdersAdmin = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [products, setProducts] = useState<any[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  
  // New Order Form State
  const [newOrder, setNewOrder] = useState({
    name: '', phone: '', wilaya: '', commune: '', address: '', product_id: '', total_price: '', stop_desk: false
  });

  const fetchOrders = () => {
    fetch('/api/orders')
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        const formatted = (Array.isArray(data) ? data : []).filter(o => o).map((o: any) => ({ ...o, status: o.status === 'pending' ? 'Nouveau' : o.status }));
        setOrders(formatted);
      });
  };

  useEffect(() => {
    fetchOrders();
    fetch('/api/products')
      .then(r => r.ok ? r.json() : [])
      .then(data => setProducts(Array.isArray(data) ? data : []));
  }, []);

  const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.checked) setSelected(orders.map(o => o.id));
    else setSelected([]);
  };

  const handleSelect = (id: number) => {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const handleAddOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...newOrder,
          delivery_fee: 0,
          source: 'admin'
        })
      });
      if (res.ok) {
        toast.success('Order added successfully');
        setIsAddModalOpen(false);
        fetchOrders();
        setNewOrder({ name: '', phone: '', wilaya: '', commune: '', address: '', product_id: '', total_price: '', stop_desk: false });
      }
    } catch {
      toast.error('Failed to add order');
    }
  };

  const updateSingleStatus = async (id: number, status: string) => {
    try {
      await fetch(`/api/orders/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      setOrders(orders.map(o => o.id === id ? { ...o, status } : o));
      toast.success(`Status updated to ${status}`);
    } catch {
      toast.error('Failed to update status');
    }
  };

  const updateStatus = async (status: string) => {
    if (!selected.length) return;
    try {
      await Promise.all(selected.map(id => fetch(`/api/orders/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      })));
      setOrders(orders.map(o => selected.includes(o.id) ? { ...o, status } : o));
      setSelected([]);
      setShowStatusDropdown(false);
      toast.success(`Status updated to ${status}`);
    } catch {
      toast.error('Failed to update status');
    }
  };

  const sendToDelivery = async (company: string) => {
    if (!selected.length) return;
    
    const endpoint = company === 'Ecotrack' ? '/api/orders/delivery/ecotrack' : '/api/orders/delivery/yalidine';
    
    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderIds: selected })
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(`Sent to ${company} successfully!`);
        fetchOrders();
        setSelected([]);
        setShowStatusDropdown(false);
      } else {
        toast.error(data.error || `Failed to send to ${company}`);
      }
    } catch (err) {
      toast.error(`Error sending orders to ${company}`);
    }
  };

  const syncWithEcotrack = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch('/api/orders/sync/ecotrack', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || 'Sync complete');
        fetchOrders();
      } else {
        toast.error(data.error || 'Sync failed');
      }
    } catch {
      toast.error('Failed to connect to server for sync');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100/80 mb-6">
        <h2 className="text-2xl font-black tracking-tight text-[#1A202C] flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
            <Truck size={24} />
          </div>
          Commandes
        </h2>
        <div className="flex gap-3">
           <button 
             onClick={syncWithEcotrack} 
             disabled={isSyncing}
             className="bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 text-sm font-bold transition-all border border-gray-200 shadow-sm rounded-xl flex items-center gap-2 disabled:opacity-50 hover:shadow hover:-translate-y-px"
           >
             <RefreshCcw size={16} className={isSyncing ? 'animate-spin' : ''} />
             {isSyncing ? 'Syncing...' : 'Sync Ecotrack'}
           </button>
           <button onClick={() => setIsAddModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2 rounded-xl text-sm font-bold transition-all shadow-[0_4px_14px_0_rgb(79,70,229,0.39)] hover:shadow-[0_6px_20px_rgba(79,70,229,0.23)] hover:-translate-y-px flex items-center gap-2">
             <Plus size={16} strokeWidth={3} /> Nouvelle Commande
           </button>
        </div>
      </div>

      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="bg-white border-gray-200 text-[#1A202C] sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Ajouter une commande manuellement</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddOrder} className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                 <Label>Nom Complet</Label>
                 <Input required className="bg-white border-gray-200" value={newOrder.name} onChange={e => setNewOrder({...newOrder, name: e.target.value})} />
               </div>
               <div className="space-y-2">
                 <Label>Téléphone</Label>
                 <Input required className="bg-white border-gray-200" value={newOrder.phone} onChange={e => setNewOrder({...newOrder, phone: e.target.value})} />
               </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                 <Label>Wilaya</Label>
                 <Select value={newOrder.wilaya} onValueChange={v => setNewOrder({...newOrder, wilaya: v, commune: ''})}>
                    <SelectTrigger className="bg-white border-gray-200"><SelectValue placeholder="Wilaya" /></SelectTrigger>
                    <SelectContent className="bg-white border-gray-200 text-[#1A202C]">
                      {ALGERIA_WILAYAS.map(w => <SelectItem key={w.id} value={w.name}>{w.id} - {w.name}</SelectItem>)}
                    </SelectContent>
                 </Select>
               </div>
               <div className="space-y-2">
                 <Label>Commune</Label>
                 <Select value={newOrder.commune} onValueChange={v => setNewOrder({...newOrder, commune: v})} disabled={!newOrder.wilaya}>
                    <SelectTrigger className="bg-white border-gray-200"><SelectValue placeholder="Commune" /></SelectTrigger>
                    <SelectContent className="bg-white border-gray-200 text-[#1A202C]">
                      {(WILAYA_COMMUNES[ALGERIA_WILAYAS.find(w => w.name === newOrder.wilaya)?.id || ''] || []).map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                 </Select>
               </div>
            </div>
            <div className="space-y-2">
              <Label>Adresse</Label>
              <Input required className="bg-white border-gray-200" value={newOrder.address} onChange={e => setNewOrder({...newOrder, address: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                 <Label>Produit</Label>
                 <Select value={newOrder.product_id} onValueChange={v => setNewOrder({...newOrder, product_id: v})}>
                    <SelectTrigger className="bg-white border-gray-200"><SelectValue placeholder="Produit" /></SelectTrigger>
                    <SelectContent className="bg-white border-gray-200 text-[#1A202C]">
                      {products.map(p => <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>)}
                    </SelectContent>
                 </Select>
               </div>
               <div className="space-y-2">
                 <Label>Prix Total (DZD)</Label>
                 <Input required type="number" className="bg-white border-gray-200" value={newOrder.total_price} onChange={e => setNewOrder({...newOrder, total_price: e.target.value})} />
               </div>
            </div>
            <div className="flex items-center space-x-2 py-2">
              <input 
                type="checkbox" 
                id="stopDesk"
                checked={newOrder.stop_desk}
                onChange={e => setNewOrder({...newOrder, stop_desk: e.target.checked})}
                className="w-4 h-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
              />
              <Label htmlFor="stopDesk" className="cursor-pointer text-gray-700">Livraison Point Relais (Stop Desk)</Label>
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)} className="border-gray-200 hover:bg-gray-50 text-gray-700 font-bold rounded-xl px-4 py-2">Annuler</Button>
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl px-5 py-2 shadow-[0_4px_14px_0_rgb(79,70,229,0.39)] hover:-translate-y-px transition-all">Créer la commande</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-2xl p-5 shadow-[0_2px_10px_-3px_rgba(6,81,237,0.1)] border border-blue-50/50 hover:shadow-lg transition-all relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-4 -mt-4 w-16 h-16 rounded-full bg-blue-50"></div>
          <div className="text-[0.65rem] text-[#718096] uppercase font-semibold mb-2 flex items-center gap-2 relative z-10"><div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]"></div> TOTAL COMMANDES</div>
          <div className="text-3xl font-black tracking-tight text-[#1A202C] relative z-10">{orders.length}</div>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-[0_2px_10px_-3px_rgba(16,185,129,0.1)] border border-emerald-50/50 hover:shadow-lg transition-all relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-4 -mt-4 w-16 h-16 rounded-full bg-emerald-50"></div>
          <div className="text-[0.65rem] text-[#718096] uppercase font-semibold mb-2 flex items-center gap-2 relative z-10"><div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]"></div> CONFIRMÉES</div>
          <div className="text-3xl font-black tracking-tight text-[#1A202C] relative z-10">{orders.filter(o => o.status === 'Confirmé').length}</div>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-[0_2px_10px_-3px_rgba(239,68,68,0.1)] border border-red-50/50 hover:shadow-lg transition-all relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-4 -mt-4 w-16 h-16 rounded-full bg-red-50"></div>
          <div className="text-[0.65rem] text-[#718096] uppercase font-semibold mb-2 flex items-center gap-2 relative z-10"><div className="w-2 h-2 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.6)]"></div> ANNULÉES</div>
          <div className="text-3xl font-black tracking-tight text-[#1A202C] relative z-10">{orders.filter(o => o.status === 'Annulé').length}</div>
        </div>
        <div className="bg-white rounded-2xl p-5 shadow-[0_2px_10px_-3px_rgba(245,158,11,0.1)] border border-amber-50/50 hover:shadow-lg transition-all relative overflow-hidden">
          <div className="absolute top-0 right-0 -mr-4 -mt-4 w-16 h-16 rounded-full bg-amber-50"></div>
          <div className="text-[0.65rem] text-[#718096] uppercase font-semibold mb-2 flex items-center gap-2 relative z-10"><div className="w-2 h-2 rounded-full bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.6)]"></div> PAS RÉPONDU</div>
          <div className="text-3xl font-black tracking-tight text-[#1A202C] relative z-10">{orders.filter(o => o.status === 'Pas répondu').length}</div>
        </div>
      </div>

      <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100/80 text-sm flex flex-col overflow-hidden">
        {/* Action Bar */}
        <div className="bg-white border-b border-gray-100 p-4 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium text-gray-500">{selected.length} sélectionné(s)</span>
            {selected.length > 0 && (
              <div className="relative">
                <button 
                  onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                  className="bg-white hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-xl text-sm font-bold border border-gray-200 shadow-sm flex items-center gap-2 transition-all"
                >
                  <MoreHorizontal size={16} /> Actions Groupées
                </button>
                {showStatusDropdown && (
                  <div className="absolute top-full left-0 mt-2 w-56 bg-white border border-gray-100 rounded-xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)] z-50 py-2">
                    <button onClick={() => sendToDelivery('Yalidine')} className="w-full text-left px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50/80 transition-colors">📦 Créer colis (Yalidine)</button>
                    <button onClick={() => sendToDelivery('Ecotrack')} className="w-full text-left px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50/80 transition-colors">📦 Créer colis (Ecotrack)</button>
                    <div className="h-px bg-gray-100 my-2"></div>
                    <div className="px-4 py-1.5 text-[0.65rem] text-gray-400 uppercase tracking-widest font-black">Statut</div>
                    <button onClick={() => updateStatus('Confirmé')} className="w-full text-left px-4 py-2.5 text-sm font-bold text-emerald-600 hover:bg-emerald-50/50 flex items-center gap-2"><Check size={16}/> Confirmé</button>
                    <button onClick={() => updateStatus('Annulé')} className="w-full text-left px-4 py-2.5 text-sm font-bold text-red-600 hover:bg-red-50/50 flex items-center gap-2"><X size={16}/> Annulé</button>
                    <button onClick={() => updateStatus('Pas répondu')} className="w-full text-left px-4 py-2.5 text-sm font-bold text-amber-600 hover:bg-amber-50/50 flex items-center gap-2"><HelpCircle size={16}/> Pas répondu</button>
                    <button onClick={() => updateStatus('En attente')} className="w-full text-left px-4 py-2.5 text-sm font-bold text-purple-600 hover:bg-purple-50/50 flex items-center gap-2"><Clock size={16}/> En attente</button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="border-b border-gray-100 text-gray-400 bg-gray-50/50 backdrop-blur-sm">
                <th className="py-4 px-6 font-bold text-[0.65rem] uppercase tracking-wider w-10">
                  <input type="checkbox" onChange={handleSelectAll} checked={selected.length === orders.length && orders.length > 0} className="w-4 h-4 rounded-md border-gray-300 text-indigo-600 focus:ring-indigo-600 focus:ring-offset-0 transition-all" />
                </th>
                <th className="py-4 px-6 font-bold text-[0.65rem] uppercase tracking-wider">Commande</th>
                <th className="py-4 px-6 font-bold text-[0.65rem] uppercase tracking-wider">Client</th>
                <th className="py-4 px-6 font-bold text-[0.65rem] uppercase tracking-wider">Ville</th>
                <th className="py-4 px-6 font-bold text-[0.65rem] uppercase tracking-wider">Statut</th>
                <th className="py-4 px-6 font-bold text-[0.65rem] uppercase tracking-wider">Total</th>
                <th className="py-4 px-6 font-bold text-[0.65rem] uppercase tracking-wider">Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {orders.map(o => (
                <tr key={o.id} className={`group transition-all duration-200 ${selected.includes(o.id) ? 'bg-indigo-50/30' : 'hover:bg-gray-50/80 bg-white'}`}>
                  <td className="py-4 px-6 relative">
                    <input type="checkbox" checked={selected.includes(o.id)} onChange={() => handleSelect(o.id)} className="w-4 h-4 rounded-md border-gray-300 text-indigo-600 focus:ring-indigo-600 focus:ring-offset-0 transition-all" />
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex flex-col">
                      {o.tracking_number ? (
                        <span className="text-indigo-600 font-mono font-semibold tracking-tight">{o.tracking_number}</span>
                      ) : (
                        <span className="text-gray-900 font-bold">#{1000 + o.id}</span>
                      )}
                      <div className="flex items-center gap-1.5 mt-1">
                         <span className="text-[9px] font-bold text-gray-500 px-1.5 py-0.5 bg-gray-100 rounded-md">S</span>
                         {o.tracking_number && <span className="text-[10px] text-gray-400 font-medium">ID: {1000 + o.id}</span>}
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="text-gray-900 font-bold">{o.name}</div>
                      {o.stop_desk === 1 && (
                        <span className="text-[9px] px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded-md uppercase font-black tracking-wider">Bureau</span>
                      )}
                    </div>
                    <a href={`tel:${o.phone}`} className="inline-flex items-center gap-1.5 bg-white hover:bg-gray-50 text-gray-600 font-semibold text-[11px] px-2.5 py-1 rounded-lg border border-gray-200 shadow-sm transition-all hover:shadow hover:-translate-y-px" title="Appeler le client">
                      <Phone size={12} className="text-indigo-500" />
                      {o.phone}
                    </a>
                  </td>
                  <td className="py-4 px-6">
                    <div className="text-gray-900 font-medium flex items-center gap-2">
                       <div className="w-1.5 h-1.5 rounded-full bg-indigo-400"></div>
                       {o.wilaya}
                    </div>
                    <div className="text-[11px] text-gray-400 mt-1 pl-3.5 font-medium">{o.commune}</div>
                  </td>
                  <td className="py-4 px-6">
                    <Select value={o.status} onValueChange={(val) => updateSingleStatus(o.id, val)}>
                      <SelectTrigger className={`h-8 px-3 text-[11px] font-bold rounded-lg border shadow-sm ${STATUS_COLORS[o.status] || STATUS_COLORS['Nouveau']} focus:ring-0 focus:ring-offset-0 transition-all w-[140px]`}>
                         <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-xl border-gray-100 shadow-[0_10px_40px_-10px_rgba(0,0,0,0.1)]">
                        {Object.keys(STATUS_COLORS).map(statusKey => (
                           <SelectItem key={statusKey} value={statusKey} className="text-xs font-semibold rounded-lg m-1">{prettifyStatus(statusKey)}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </td>
                  <td className="py-4 px-6">
                    <div className="font-black text-gray-900 text-[15px]">{o.total_price} <span className="text-[10px] text-gray-400 font-bold ml-0.5">DZD</span></div>
                  </td>
                  <td className="py-4 px-6 text-[11px] text-gray-400 font-medium">
                     <div className="flex flex-col gap-0.5">
                       <span className="text-gray-600">{new Date(o.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric'})}</span>
                       <span>{new Date(o.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit'})}</span>
                     </div>
                  </td>
                </tr>
              ))}
              {orders.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-gray-400 font-medium bg-white">Aucune commande trouvée.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

