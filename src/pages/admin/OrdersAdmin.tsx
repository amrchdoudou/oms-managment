import React, { useEffect, useState } from 'react';
import { Truck, Check, X, Clock, MoreHorizontal, HelpCircle, Plus, RefreshCcw } from 'lucide-react';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../components/ui/dialog';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { ALGERIA_WILAYAS, WILAYA_COMMUNES } from '../../lib/algeria_data';

const STATUS_COLORS: Record<string, string> = {
  'Nouveau': 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  'Confirmé': 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  'Annulé': 'text-red-400 bg-red-500/10 border-red-500/20',
  'Pas répondu': 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  'En attente': 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  'Expédié': 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
  'en_livraison': 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20',
  'livre_non_encaisse': 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
  'encaisse_non_paye': 'text-emerald-500 bg-emerald-600/10 border-emerald-600/20',
  'annule': 'text-red-400 bg-red-500/10 border-red-500/20',
  'suspendu': 'text-amber-400 bg-amber-500/10 border-amber-500/20',
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
    fetch('/api/orders').then(r => r.json()).then(data => {
      const formatted = data.map((o: any) => ({ ...o, status: o.status === 'pending' ? 'Nouveau' : o.status }));
      setOrders(formatted);
    });
  };

  useEffect(() => {
    fetchOrders();
    fetch('/api/products').then(r => r.json()).then(setProducts);
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
    if (company === 'Ecotrack') {
       try {
         const res = await fetch('/api/orders/delivery/ecotrack', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({ orderIds: selected })
         });
         const data = await res.json();
         if (res.ok) {
           toast.success(`Sent to Ecotrack successfully!`);
           fetchOrders();
           setSelected([]);
           setShowStatusDropdown(false);
         } else {
           toast.error(data.error || 'Failed to send to Ecotrack');
         }
       } catch (err) {
         toast.error('Error sending orders to Ecotrack');
       }
    } else {
       toast.success(`Simulation: ${selected.length} orders sent to ${company}`);
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
    <div className="bg-[#1A1A1A] min-h-screen -m-6 lg:-m-8 p-6 lg:p-8 text-gray-200">
      <div className="flex justify-between items-center mb-8">
        <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
          <Truck className="text-indigo-500" />
          Commandes
        </h2>
        <div className="flex gap-3">
           <button 
             onClick={syncWithEcotrack} 
             disabled={isSyncing}
             className="bg-[#2D2D2D] hover:bg-[#3D3D3D] text-gray-200 px-4 py-2 rounded-lg text-sm font-semibold transition-all border border-[#444] shadow-sm flex items-center gap-2 disabled:opacity-50"
           >
             <RefreshCcw size={16} className={isSyncing ? 'animate-spin' : ''} />
             {isSyncing ? 'Syncing...' : 'Sync Ecotrack'}
           </button>
           <button onClick={() => setIsAddModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-semibold transition-colors border border-indigo-500 shadow-lg shadow-indigo-500/20 flex items-center gap-2">
             <Plus size={16} /> New Order
           </button>
        </div>
      </div>

      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <DialogContent className="bg-[#1A1A1A] border-[#333] text-gray-200 sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Ajouter une commande manuellement</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleAddOrder} className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                 <Label>Nom Complet</Label>
                 <Input required className="bg-[#222] border-[#333]" value={newOrder.name} onChange={e => setNewOrder({...newOrder, name: e.target.value})} />
               </div>
               <div className="space-y-2">
                 <Label>Téléphone</Label>
                 <Input required className="bg-[#222] border-[#333]" value={newOrder.phone} onChange={e => setNewOrder({...newOrder, phone: e.target.value})} />
               </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                 <Label>Wilaya</Label>
                 <Select value={newOrder.wilaya} onValueChange={v => setNewOrder({...newOrder, wilaya: v, commune: ''})}>
                    <SelectTrigger className="bg-[#222] border-[#333]"><SelectValue placeholder="Wilaya" /></SelectTrigger>
                    <SelectContent className="bg-[#222] border-[#333] text-gray-200">
                      {ALGERIA_WILAYAS.map(w => <SelectItem key={w.id} value={w.name}>{w.id} - {w.name}</SelectItem>)}
                    </SelectContent>
                 </Select>
               </div>
               <div className="space-y-2">
                 <Label>Commune</Label>
                 <Select value={newOrder.commune} onValueChange={v => setNewOrder({...newOrder, commune: v})} disabled={!newOrder.wilaya}>
                    <SelectTrigger className="bg-[#222] border-[#333]"><SelectValue placeholder="Commune" /></SelectTrigger>
                    <SelectContent className="bg-[#222] border-[#333] text-gray-200">
                      {(WILAYA_COMMUNES[ALGERIA_WILAYAS.find(w => w.name === newOrder.wilaya)?.id || ''] || []).map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                 </Select>
               </div>
            </div>
            <div className="space-y-2">
              <Label>Adresse</Label>
              <Input required className="bg-[#222] border-[#333]" value={newOrder.address} onChange={e => setNewOrder({...newOrder, address: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                 <Label>Produit</Label>
                 <Select value={newOrder.product_id} onValueChange={v => setNewOrder({...newOrder, product_id: v})}>
                    <SelectTrigger className="bg-[#222] border-[#333]"><SelectValue placeholder="Produit" /></SelectTrigger>
                    <SelectContent className="bg-[#222] border-[#333] text-gray-200">
                      {products.map(p => <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>)}
                    </SelectContent>
                 </Select>
               </div>
               <div className="space-y-2">
                 <Label>Prix Total (DZD)</Label>
                 <Input required type="number" className="bg-[#222] border-[#333]" value={newOrder.total_price} onChange={e => setNewOrder({...newOrder, total_price: e.target.value})} />
               </div>
            </div>
            <div className="flex items-center space-x-2 py-2">
              <input 
                type="checkbox" 
                id="stopDesk"
                checked={newOrder.stop_desk}
                onChange={e => setNewOrder({...newOrder, stop_desk: e.target.checked})}
                className="w-4 h-4 rounded bg-[#1A1A1A] border-[#444] text-indigo-500 focus:ring-indigo-500"
              />
              <Label htmlFor="stopDesk" className="cursor-pointer">Livraison Point Relais (Stop Desk)</Label>
            </div>
            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setIsAddModalOpen(false)} className="border-[#333] hover:bg-[#222]">Annuler</Button>
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700">Créer la commande</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-[#212121] border border-[#333] rounded-xl p-5">
          <div className="text-[0.65rem] text-gray-400 uppercase font-semibold mb-2 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-500"></div> TOTAL COMMANDES</div>
          <div className="text-2xl font-bold text-white">{orders.length}</div>
        </div>
        <div className="bg-[#212121] border border-[#333] rounded-xl p-5">
          <div className="text-[0.65rem] text-gray-400 uppercase font-semibold mb-2 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> CONFIRMÉES</div>
          <div className="text-2xl font-bold text-white">{orders.filter(o => o.status === 'Confirmé').length}</div>
        </div>
        <div className="bg-[#212121] border border-[#333] rounded-xl p-5">
          <div className="text-[0.65rem] text-gray-400 uppercase font-semibold mb-2 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-red-500"></div> ANNULÉES</div>
          <div className="text-2xl font-bold text-white">{orders.filter(o => o.status === 'Annulé').length}</div>
        </div>
        <div className="bg-[#212121] border border-[#333] rounded-xl p-5">
          <div className="text-[0.65rem] text-gray-400 uppercase font-semibold mb-2 flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-amber-500"></div> PAS RÉPONDU</div>
          <div className="text-2xl font-bold text-white">{orders.filter(o => o.status === 'Pas répondu').length}</div>
        </div>
      </div>

      {/* Action Bar */}
      <div className="bg-[#212121] border border-[#333] rounded-t-xl p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-400">{selected.length} sélectionné(s)</span>
          {selected.length > 0 && (
            <div className="relative">
              <button 
                onClick={() => setShowStatusDropdown(!showStatusDropdown)}
                className="bg-[#2D2D2D] hover:bg-[#3D3D3D] text-white px-3 py-1.5 rounded-lg text-sm font-medium border border-[#444] flex items-center gap-2"
              >
                <MoreHorizontal size={14} /> Actions
              </button>
              {showStatusDropdown && (
                <div className="absolute top-full left-0 mt-2 w-48 bg-[#2D2D2D] border border-[#444] rounded-lg shadow-xl z-50 overflow-hidden py-1">
                  <button onClick={() => sendToDelivery('Yalidine')} className="w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-[#3D3D3D]">Créer un colis (Yalidine)</button>
                  <button onClick={() => sendToDelivery('Ecotrack')} className="w-full text-left px-4 py-2 text-sm text-gray-200 hover:bg-[#3D3D3D]">Créer un colis (Ecotrack)</button>
                  <div className="h-px bg-[#444] my-1"></div>
                  <div className="px-4 py-1 text-xs text-gray-500 uppercase font-bold">Statut</div>
                  <button onClick={() => updateStatus('Confirmé')} className="w-full text-left px-4 py-2 text-sm text-emerald-400 hover:bg-[#3D3D3D] flex items-center gap-2"><Check size={14}/> Confirmé</button>
                  <button onClick={() => updateStatus('Annulé')} className="w-full text-left px-4 py-2 text-sm text-red-400 hover:bg-[#3D3D3D] flex items-center gap-2"><X size={14}/> Annulé</button>
                  <button onClick={() => updateStatus('Pas répondu')} className="w-full text-left px-4 py-2 text-sm text-amber-400 hover:bg-[#3D3D3D] flex items-center gap-2"><HelpCircle size={14}/> Pas répondu</button>
                  <button onClick={() => updateStatus('En attente')} className="w-full text-left px-4 py-2 text-sm text-purple-400 hover:bg-[#3D3D3D] flex items-center gap-2"><Clock size={14}/> En attente</button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="bg-[#212121] border-x border-b border-[#333] rounded-b-xl text-sm overflow-hidden overflow-x-auto">
        <table className="w-full text-left border-collapse whitespace-nowrap">
          <thead>
            <tr className="border-b border-[#333] text-gray-400">
              <th className="py-3 px-4 font-semibold text-[0.7rem] uppercase tracking-wider w-10">
                <input type="checkbox" onChange={handleSelectAll} checked={selected.length === orders.length && orders.length > 0} className="w-4 h-4 rounded bg-[#1A1A1A] border-[#444] text-indigo-500 focus:ring-indigo-500" />
              </th>
              <th className="py-3 px-4 font-semibold text-[0.7rem] uppercase tracking-wider">Commande</th>
              <th className="py-3 px-4 font-semibold text-[0.7rem] uppercase tracking-wider">Client</th>
              <th className="py-3 px-4 font-semibold text-[0.7rem] uppercase tracking-wider">Ville</th>
              <th className="py-3 px-4 font-semibold text-[0.7rem] uppercase tracking-wider">Statut</th>
              <th className="py-3 px-4 font-semibold text-[0.7rem] uppercase tracking-wider">Total</th>
              <th className="py-3 px-4 font-semibold text-[0.7rem] uppercase tracking-wider">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#333]">
            {orders.map(o => (
              <tr key={o.id} className={`hover:bg-[#2A2A2A] transition-colors ${selected.includes(o.id) ? 'bg-[#2A2A35]' : ''}`}>
                <td className="py-3 px-4">
                  <input type="checkbox" checked={selected.includes(o.id)} onChange={() => handleSelect(o.id)} className="w-4 h-4 rounded bg-[#1A1A1A] border-[#444] text-indigo-500 focus:ring-indigo-500" />
                </td>
                <td className="py-3 px-4 font-medium">
                  <div className="flex flex-col">
                    {o.tracking_number ? (
                      <span className="text-indigo-400 font-mono tracking-tight">{o.tracking_number}</span>
                    ) : (
                      <span className="text-indigo-400">#{1000 + o.id}</span>
                    )}
                    <div className="flex items-center gap-1.5 mt-1">
                       <span className="text-[10px] text-gray-500 px-1 py-0 bg-[#333] rounded">S</span>
                       {o.tracking_number && <span className="text-[10px] text-gray-600">ID: {1000 + o.id}</span>}
                    </div>
                  </div>
                </td>
                <td className="py-3 px-4">
                  <div className="flex items-center gap-2">
                    <div className="text-gray-200 font-medium">{o.name}</div>
                    {o.stop_desk === 1 && (
                      <span className="text-[9px] px-1 bg-amber-500/20 text-amber-500 border border-amber-500/30 rounded uppercase font-bold">Bureau</span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 mt-0.5">{o.phone}</div>
                </td>
                <td className="py-3 px-4">
                  <div className="text-gray-300">{o.wilaya}</div>
                  <div className="text-[10px] text-gray-500 mt-0.5">{o.commune}</div>
                </td>
                <td className="py-3 px-4">
                  <span className={`inline-flex px-2 py-0.5 rounded-md text-xs font-medium border ${STATUS_COLORS[o.status] || STATUS_COLORS['Nouveau']}`}>
                    {prettifyStatus(o.status)}
                  </span>
                </td>
                <td className="py-3 px-4 font-medium text-gray-200">{o.total_price} DZD</td>
                <td className="py-3 px-4 text-xs text-gray-400">{new Date(o.created_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'})}</td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan={7} className="text-center py-12 text-gray-500">No orders found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

