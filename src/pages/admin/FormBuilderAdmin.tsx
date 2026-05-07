import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Save, Plus, GripVertical, Settings2, Trash2, Truck, Type, Layout, User, Phone, CreditCard, Eye, Bold, Italic, MoveUp, MoveDown } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '../../components/ui/dialog';
import { DHD_LOGO } from '../../lib/assets';

const BLOCK_TYPES = [
  { type: 'header', icon: <Type size={16} />, label: 'Header Block' },
  { type: 'summary', icon: <Layout size={16} />, label: 'Order Summary' },
  { type: 'input', icon: <User size={16} />, label: 'Input Field' },
  { type: 'wilaya', icon: <Truck size={16} />, label: 'Wilaya Select' },
  { type: 'commune', icon: <Truck size={16} />, label: 'Commune Select' },
  { type: 'address', icon: <User size={16} />, label: 'Address Input' },
  { type: 'delivery', icon: <Truck size={16} />, label: 'Delivery Options' },
  { type: 'button', icon: <CreditCard size={16} />, label: 'Submit Button' },
];

const GRADIENTS = [
  { name: 'Red Flush', value: 'linear-gradient(86deg, #ff3000, #ff7931)' },
  { name: 'Indigo Night', value: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)' },
  { name: 'Ocean Blue', value: 'linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%)' },
  { name: 'Forest Green', value: 'linear-gradient(135deg, #22c55e 0%, #15803d 100%)' },
  { name: 'Sunset', value: 'linear-gradient(135deg, #f97316 0%, #ef4444 100%)' },
];

const ANIMATIONS = ['None', 'Bounce', 'Pulse', 'Shake', 'FadeIn'];

export const FormBuilderAdmin = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [blocks, setBlocks] = useState<any[]>([]);
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    console.log('Fetching product with ID:', id);
    fetch(`/api/products/${id}`)
      .then(async r => {
        console.log('Response status:', r.status);
        if (!r.ok) {
           const data = await r.json().catch(() => ({}));
           console.error('Error response:', data);
           throw new Error(data.error || `HTTP error! status: ${r.status}`);
        }
        return r.json();
      })
      .then(data => {
        console.log('Product data:', data);
        if (!data || data.error) throw new Error(data?.error || 'Product not found');
        setProduct(data);
        const config = data.landing_page_config;
        if (config && Array.isArray(config) && config.length > 0) {
          setBlocks(config);
        } else {
          setDefaultBlocks();
        }
      })
      .catch(err => {
        console.error('Fetch error:', err);
        setError(err.message);
        toast.error('Failed to load product data');
      });
  }, [id]);

  const setDefaultBlocks = () => {
    setBlocks([
      { id: '1', type: 'header', text: 'Paiement à la livraison', visible: true, fontSize: 24, fontWeight: 'bold', textColor: '#e53e3e' },
      { id: '2', type: 'summary', text: 'Summary', visible: true },
      { id: '3', type: 'input', label: 'Nom Complet *', placeholder: 'Ex: Ahmed Benali', required: true, internalName: 'name', visible: true },
      { id: '4', type: 'input', label: 'Numéro de Téléphone *', placeholder: '05xx xx xx xx', required: true, internalName: 'phone', visible: true },
      { id: '5', type: 'wilaya', label: 'Wilaya *', visible: true },
      { id: '6', type: 'commune', label: 'Commune *', visible: true },
      { id: '10', type: 'address', label: 'Adresse Exacte *', placeholder: 'Quartier, N° Maison...', visible: true },
      { id: '7', type: 'delivery', label: 'Options de livraison', visible: true },
      { id: '8', type: 'button', text: 'Confirmer la commande', bgColor: 'linear-gradient(86deg, #ff3000, #ff7931)', textColor: '#ffffff', borderRadius: 12, fontSize: 18, fontWeight: 'bold', visible: true, animation: 'Bounce' }
    ]);
  };

  const saveConfig = async () => {
    try {
      const res = await fetch(`/api/products/${id}/builder`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: blocks })
      });
      if (!res.ok) throw new Error('Update failed');
      toast.success('Configuration saved!');
    } catch {
      toast.error('Failed to save');
    }
  };

  const addBlock = (type: string) => {
    const newBlock = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      label: type === 'input' ? 'New Field' : '',
      text: type === 'header' ? 'New Header' : type === 'button' ? 'Submit' : '',
      visible: true,
      textColor: '#000000',
      bgColor: type === 'button' ? '#4F46E5' : 'transparent',
      fontSize: type === 'header' ? 24 : 16,
      borderRadius: 8,
      shadow: 0,
      animation: 'None'
    };
    setBlocks([...blocks, newBlock]);
  };

  const updateBlock = (blockId: string, updates: any) => {
    setBlocks(blocks.map(b => b.id === blockId ? { ...b, ...updates } : b));
  };

  const removeBlock = (blockId: string) => {
    setBlocks(blocks.filter(b => b.id !== blockId));
  };

  const moveBlock = (idx: number, dir: number) => {
    const newBlocks = [...blocks];
    const targetIdx = idx + dir;
    if (targetIdx < 0 || targetIdx >= blocks.length) return;
    [newBlocks[idx], newBlocks[targetIdx]] = [newBlocks[targetIdx], newBlocks[idx]];
    setBlocks(newBlocks);
  };

  if (error) return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-4 p-4">
      <div className="text-red-500 font-bold">Error: {error}</div>
      <Button onClick={() => navigate('/admin/products')}>Back to Products</Button>
    </div>
  );

  if (!product) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-8 h-8 border-4 border-[#4F46E5] border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="flex flex-col h-screen bg-[#F8FAFC] -m-6 lg:-m-8">
      <style>{`
        @keyframes bounce-slow { 0%, 100% { transform: translateY(-5%); } 50% { transform: translateY(0); } }
        @keyframes pulse-custom { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: .8; transform: scale(0.98); } }
        @keyframes shake-custom { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-5px); } 75% { transform: translateX(5px); } }
        @keyframes fade-in-custom { 0% { opacity: 0; transform: translateY(10px); } 100% { opacity: 1; transform: translateY(0); } }
        .animate-Bounce { animation: bounce-slow 2s infinite; }
        .animate-Pulse { animation: pulse-custom 2s infinite; }
        .animate-Shake { animation: shake-custom 0.5s ease-in-out infinite; }
        .animate-FadeIn { animation: fade-in-custom 0.8s ease-out forwards; }
      `}</style>

      {/* Header */}
      <header className="h-16 bg-white border-b border-[#E2E8F0] flex items-center justify-between px-6 shrink-0 z-10">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/admin/products')} className="p-2 hover:bg-[#F1F5F9] rounded-lg text-gray-400 hover:text-gray-600 transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div className="h-8 w-px bg-[#E2E8F0]" />
          <div className="flex items-center gap-3">
            <img src={DHD_LOGO} alt="DHD" className="h-8 w-auto" />
            <div className="h-4 w-px bg-[#E2E8F0]" />
            <div>
              <h1 className="text-sm font-bold text-[#1A202C] truncate max-w-[150px]">{product.name}</h1>
              <p className="text-[10px] text-indigo-500 uppercase font-black tracking-widest leading-none">Form Builder Pro</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => window.open(`/product/${id}`, '_blank')}>
            <Eye size={16} className="mr-2" /> Live Preview
          </Button>
          <Button size="sm" onClick={saveConfig} className="bg-[#4F46E5] hover:bg-indigo-700">
            <Save size={16} className="mr-2" /> Save Form
          </Button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Editor Sidebar */}
        <div className="w-[380px] bg-white border-r border-[#E2E8F0] overflow-y-auto p-4 flex flex-col gap-6 shrink-0 shadow-xl z-[5]">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-[11px] font-bold text-gray-400 uppercase tracking-[2px]">Form Elements</h3>
              <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogTrigger>
                  <Button size="sm" variant="outline" className="text-xs h-8">
                    <Plus size={14} className="mr-1" /> Add Block
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Add Block</DialogTitle>
                  </DialogHeader>
                  <div className="grid grid-cols-2 gap-2 mt-4">
                    {BLOCK_TYPES.map(bt => (
                      <Button 
                        key={bt.type} 
                        variant="ghost" 
                        className="justify-start gap-2 h-auto py-3 px-3"
                        onClick={() => {
                          addBlock(bt.type);
                          setIsModalOpen(false);
                        }}
                      >
                        {bt.icon} {bt.label}
                      </Button>
                    ))}
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            <div className="space-y-3">
              {blocks.map((block, idx) => (
                <div key={block.id} className={`border ${editingBlockId === block.id ? 'border-indigo-500 ring-2 ring-indigo-500/10' : 'border-[#E2E8F0]'} rounded-xl overflow-hidden bg-white shadow-sm transition-all`}>
                  <div className="p-3 bg-gray-50/50 flex items-center gap-3 border-b border-[#F1F5F9]">
                     <div className="cursor-grab active:cursor-grabbing text-gray-300">
                       <GripVertical size={16} />
                     </div>
                     <span className="text-[10px] bg-white border border-[#E2E8F0] px-2 py-0.5 rounded-full font-bold text-gray-500 uppercase tracking-tighter shadow-sm">{block.type}</span>
                     <div className="flex-1"></div>
                     <div className="flex items-center gap-1">
                        <button onClick={() => setEditingBlockId(editingBlockId === block.id ? null : block.id)} className={`p-1 rounded transition-colors ${editingBlockId === block.id ? 'text-indigo-600 bg-indigo-50' : 'text-gray-400 hover:bg-gray-100'}`}>
                           <Settings2 size={16} />
                        </button>
                        <button onClick={() => updateBlock(block.id, { visible: !block.visible })} className={`p-1 rounded transition-colors ${block.visible ? 'text-indigo-500 bg-indigo-50' : 'text-gray-400 hover:bg-gray-100'}`}>
                           <Eye size={16} />
                        </button>
                        <div className="flex flex-col gap-0.5 ml-1">
                           <button onClick={() => moveBlock(idx, -1)} className="p-0.5 hover:bg-gray-200 rounded text-gray-400 disabled:opacity-30" disabled={idx === 0}><MoveUp size={12} /></button>
                           <button onClick={() => moveBlock(idx, 1)} className="p-0.5 hover:bg-gray-200 rounded text-gray-400 disabled:opacity-30" disabled={idx === blocks.length - 1}><MoveDown size={12} /></button>
                        </div>
                        <button onClick={() => removeBlock(block.id)} className="p-1 hover:bg-red-50 text-red-400 rounded transition-colors ml-1">
                           <Trash2 size={16} />
                        </button>
                     </div>
                  </div>
                  
                  {editingBlockId === block.id ? (
                    <div className="p-4 space-y-4 bg-indigo-50/10">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-3">
                          {block.text !== undefined && (
                            <div className="space-y-1">
                              <Label className="text-[10px] uppercase font-bold text-gray-500">Content</Label>
                              <Input value={block.text} onChange={e => updateBlock(block.id, { text: e.target.value })} className="h-8 text-xs" />
                            </div>
                          )}
                          {block.label !== undefined && (
                            <div className="space-y-1">
                              <Label className="text-[10px] uppercase font-bold text-gray-500">Label</Label>
                              <Input value={block.label} onChange={e => updateBlock(block.id, { label: e.target.value })} className="h-8 text-xs" />
                            </div>
                          )}
                          <div className="space-y-1">
                            <Label className="text-[10px] uppercase font-bold text-gray-500">Text Color</Label>
                            <div className="flex gap-2">
                              <input type="color" value={block.textColor || '#000000'} onChange={e => updateBlock(block.id, { textColor: e.target.value })} className="w-8 h-8 rounded border p-0.5 cursor-pointer" />
                              <Input value={block.textColor || ''} onChange={e => updateBlock(block.id, { textColor: e.target.value })} className="h-8 text-xs flex-1" />
                            </div>
                          </div>
                          {(block.type === 'button' || block.type === 'header') && (
                            <div className="space-y-1">
                              <Label className="text-[10px] uppercase font-bold text-gray-500">Background/Color</Label>
                              <div className="flex flex-wrap gap-1 mb-2">
                                {GRADIENTS.map(g => (
                                  <button key={g.name} onClick={() => updateBlock(block.id, { bgColor: g.value })} className="w-6 h-6 rounded-full border border-white" style={{ background: g.value }} />
                                ))}
                              </div>
                              <div className="flex gap-2">
                                <input type="color" value={block.bgColor?.startsWith('#') ? block.bgColor : '#4F46E5'} onChange={e => updateBlock(block.id, { bgColor: e.target.value })} className="w-8 h-8 rounded border p-0.5 cursor-pointer" />
                                <Input value={block.bgColor || ''} onChange={e => updateBlock(block.id, { bgColor: e.target.value })} className="h-8 text-xs flex-1" />
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="space-y-3">
                          <div className="flex gap-2">
                            <div className="flex-1 space-y-1">
                              <Label className="text-[10px] uppercase font-bold text-gray-500">Size (px)</Label>
                              <Input type="number" value={block.fontSize || 16} onChange={e => updateBlock(block.id, { fontSize: parseInt(e.target.value) })} className="h-8 text-xs" />
                            </div>
                            <div className="flex gap-1 items-end">
                              <Button variant={block.fontWeight === 'bold' ? 'secondary' : 'outline'} size="sm" className="h-8 w-8 p-0" onClick={() => updateBlock(block.id, { fontWeight: block.fontWeight === 'bold' ? 'normal' : 'bold' })}><Bold size={14} /></Button>
                              <Button variant={block.fontStyle === 'italic' ? 'secondary' : 'outline'} size="sm" className="h-8 w-8 p-0" onClick={() => updateBlock(block.id, { fontStyle: block.fontStyle === 'italic' ? 'normal' : 'italic' })}><Italic size={14} /></Button>
                            </div>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[10px] uppercase font-bold text-gray-500">Animation</Label>
                            <Select value={block.animation || 'None'} onValueChange={(v) => updateBlock(block.id, { animation: v })}>
                               <SelectTrigger className="h-8 text-xs bg-white"><SelectValue /></SelectTrigger>
                               <SelectContent>
                                  {ANIMATIONS.map(a => <SelectItem key={a} value={a}>{a}</SelectItem>)}
                               </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[10px] uppercase font-bold text-gray-500">Border Radius (px)</Label>
                            <Input type="number" value={block.borderRadius || 0} onChange={e => updateBlock(block.id, { borderRadius: parseInt(e.target.value) })} className="h-8 text-xs" />
                          </div>
                          <div className="space-y-1">
                            <Label className="text-[10px] uppercase font-bold text-gray-500">Shadow</Label>
                            <Input type="number" value={block.shadow || 0} onChange={e => updateBlock(block.id, { shadow: parseInt(e.target.value) })} className="h-8 text-xs" />
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-4 cursor-pointer hover:bg-gray-50" onClick={() => setEditingBlockId(block.id)}>
                      <div className="flex items-center justify-between">
                         <span className="text-xs text-gray-700 truncate">{block.text || block.label || block.type}</span>
                         <Settings2 size={12} className="text-gray-300" />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Live Mobile Preview */}
        <div className="flex-1 bg-[#EEF2F6] overflow-y-auto flex justify-center py-12 px-4">
           <div className="w-full max-w-[400px] h-fit bg-white rounded-[40px] shadow-2xl border-[12px] border-[#1A1A1A] overflow-hidden relative">
              <div className="p-6 pt-10 space-y-6">
                 {blocks.filter(b => b.visible).map((block) => (
                    <div key={block.id} className={`${block.animation !== 'None' ? `animate-${block.animation}` : ''}`} style={{ 
                      borderRadius: block.borderRadius ? `${block.borderRadius}px` : undefined,
                      boxShadow: block.shadow ? `0 ${block.shadow}px ${block.shadow * 2}px rgba(0,0,0,0.1)` : undefined
                    }}>
                       {block.type === 'header' && (
                         <div className="text-center py-2">
                            <h2 style={{ 
                              color: block.textColor || '#e53e3e',
                              fontSize: `${block.fontSize || 24}px`,
                              fontWeight: block.fontWeight || 'bold',
                              fontStyle: block.fontStyle || 'normal',
                              background: block.bgColor?.includes('gradient') ? block.bgColor : undefined,
                              WebkitBackgroundClip: block.bgColor?.includes('gradient') ? 'text' : undefined,
                              WebkitTextFillColor: block.bgColor?.includes('gradient') ? 'transparent' : undefined
                            }}>
                              {block.text}
                            </h2>
                            <p className="text-[10px] text-gray-500 mt-1">يرجى إدخال معلوماتك الخاصة بك</p>
                         </div>
                       )}
                       {block.type === 'summary' && (
                         <div className="bg-[#F8FAFC] p-4 rounded-2xl border border-[#E2E8F0] shadow-sm space-y-2">
                            <div className="flex justify-between text-xs text-gray-500"><span>Sous-total</span><span>0.00 DZD</span></div>
                            <div className="flex justify-between text-xs text-red-500 font-bold"><span>Livraison</span><span>Gratuit</span></div>
                            <div className="border-t pt-2 flex justify-between font-bold"><span>Total</span><span>0.00 DZD</span></div>
                         </div>
                       )}
                       {block.type === 'input' && (
                         <div className="space-y-1">
                            <Label className="text-[10px] font-bold text-gray-400 uppercase">{block.label}</Label>
                            <Input disabled placeholder={block.placeholder} className="bg-[#F8FAFC] rounded-xl h-10" />
                         </div>
                       )}
                       {block.type === 'button' && (
                         <Button className="w-full h-12 font-bold" style={{ 
                           background: block.bgColor || '#ff4d4f',
                           color: block.textColor || '#ffffff',
                           borderRadius: block.borderRadius ? `${block.borderRadius}px` : '12px',
                           fontSize: `${block.fontSize || 18}px`,
                           fontWeight: block.fontWeight || 'bold',
                           fontStyle: block.fontStyle || 'normal',
                           boxShadow: block.shadow ? `0 ${block.shadow}px ${block.shadow * 3}px rgba(0,0,0,0.15)` : undefined
                         }}>
                            {block.text}
                         </Button>
                       )}
                       {(block.type === 'wilaya' || block.type === 'commune' || block.type === 'address' || block.type === 'delivery') && (
                         <div className="space-y-1">
                            <Label className="text-[10px] font-bold text-gray-400 uppercase">{block.label}</Label>
                            <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl h-10 flex items-center px-3 text-gray-400 text-xs italic">Select option...</div>
                         </div>
                       )}
                    </div>
                  ))}
               </div>
           </div>
        </div>
      </div>
    </div>
  );
};
