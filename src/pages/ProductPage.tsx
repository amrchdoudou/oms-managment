import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Card } from '../components/ui/card';
import { Label } from '../components/ui/label';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { ALGERIA_WILAYAS, WILAYA_COMMUNES } from '../lib/algeria_data';
import { toast } from 'sonner';
import { firePageView, fireViewContent, fireInitiateCheckout, firePurchase } from '../services/pixelService';
import { useStore } from '../store';

export const ProductPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<any>(null);
  const [activeImage, setActiveImage] = useState(0);
  const { settings, fetchSettings } = useStore();

  // Form State
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [wilaya, setWilaya] = useState('');
  const [commune, setCommune] = useState('');
  const [address, setAddress] = useState('');
  const [stopDesk, setStopDesk] = useState(false);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [shippingFeesData, setShippingFeesData] = useState<any>(null);
  const [storeConfig, setStoreConfig] = useState<any>(null);

  useEffect(() => {
    fetch('/api/settings/shipping_fees')
      .then(r => r.json())
      .then(data => {
        if (data && !data.error) setShippingFeesData(data);
      });
      
    fetch('/api/settings/store_config')
      .then(r => r.json())
      .then(data => {
        if (Object.keys(data).length > 0) setStoreConfig(data);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetchSettings();
    firePageView();
    
    fetch(`/api/products/${id}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) navigate('/');
        else {
          setProduct(data);
          fireViewContent(data);
          // Auto select first options
          const initialVariants: Record<string,string> = {};
          data.variants?.forEach((v:any) => {
            if (v.options?.length) initialVariants[v.name] = v.options[0];
          });
          setSelectedVariants(initialVariants);
        }
      });
  }, [id]);

  const communesForSelectedWilaya = wilaya ? (WILAYA_COMMUNES[ALGERIA_WILAYAS.find(w => w.name === wilaya)?.id || ''] || []) : [];
  
  const getDeliveryFee = () => {
    if (wilaya && shippingFeesData) {
      const provinceFees = shippingFeesData[wilaya];
      if (provinceFees) {
        return stopDesk ? provinceFees.desk : provinceFees.door;
      }
    }
    return (stopDesk ? settings?.delivery_fees?.desk : settings?.delivery_fees?.home) || (stopDesk ? 400 : 600);
  };

  const deliveryFee = getDeliveryFee();
  const productPrice = product?.price || 0;
  const totalPrice = productPrice + deliveryFee;

  // Stock check
  const inventory = product?.inventory || {};
  const vKeys = Object.keys(selectedVariants).sort();
  const currentInventoryKey = vKeys.length > 0 ? vKeys.map(k => `${k}:${selectedVariants[k]}`).join('_') : null;
  const currentStock = currentInventoryKey ? inventory[currentInventoryKey] : null;
  const isOutOfStock = currentStock !== null && currentStock <= 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isOutOfStock) {
      toast.error('This variant is out of stock');
      return;
    }
    if (!name || !phone || !wilaya || !commune) {
      toast.error('Please fill all required fields');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name, phone, wilaya, commune, address: address || commune,
          product_id: product.id,
          variant_selected: selectedVariants,
          total_price: totalPrice,
          delivery_fee: deliveryFee,
          source: 'store',
          stop_desk: stopDesk
        })
      });
      
      if (res.ok) {
        firePurchase(product, totalPrice);
        toast.success('Order placed successfully!');
        setName(''); setPhone(''); setAddress('');
        // Refresh product to get updated stock
        fetch(`/api/products/${id}`).then(r => r.json()).then(setProduct);
      } else {
        const data = await res.json().catch(() => ({}));
        toast.error(data.error || 'Failed to place order');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenForm = () => {
    fireInitiateCheckout(product);
    document.getElementById('cod-form')?.scrollIntoView({ behavior: 'smooth' });
  };

  if (!product) return <div className="p-12 text-center">Loading...</div>;

  const images = product.images?.length ? product.images : ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=600&auto=format&fit=crop'];

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans pb-16">
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes bounce-slow { 0%, 100% { transform: translateY(-5%); } 50% { transform: translateY(0); } }
        @keyframes pulse-custom { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: .8; transform: scale(0.98); } }
        @keyframes shake-custom { 0%, 100% { transform: translateX(0); } 25% { transform: translateX(-5px); } 75% { transform: translateX(5px); } }
        @keyframes fade-in-custom { 0% { opacity: 0; transform: translateY(10px); } 100% { opacity: 1; transform: translateY(0); } }
        .animate-Bounce { animation: bounce-slow 2s infinite; }
        .animate-Pulse { animation: pulse-custom 2s infinite; }
        .animate-Shake { animation: shake-custom 0.5s ease-in-out infinite; }
        .animate-FadeIn { animation: fade-in-custom 0.8s ease-out forwards; }
      `}} />
      <header className="bg-white px-6 py-4 border-b border-[#E2E8F0] mb-8">
        <h1 className="text-xl font-black tracking-tighter cursor-pointer" style={{ color: storeConfig?.primaryColor || '#1A202C' }} onClick={() => navigate('/')}>
          {storeConfig?.brandName || 'Mstore'}
        </h1>
      </header>
      <div className="max-w-6xl mx-auto px-4 lg:px-8">
        <div className="bg-white border border-[#E2E8F0] rounded-[24px] p-6 lg:p-12 shadow-sm">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          
          {/* Images */}
          <div className="space-y-4">
            <div className="aspect-[4/5] bg-gray-100 rounded-2xl overflow-hidden relative border border-[#E2E8F0]">
              <img src={images[activeImage]} alt="Product" className="w-full h-full object-contain" />
            </div>
            {images.length > 1 && (
              <div className="flex gap-4 overflow-x-auto pb-2">
                {images.map((img: string, idx: number) => (
                  <button 
                    key={idx} 
                    onClick={() => setActiveImage(idx)}
                    className={`w-20 h-20 rounded-xl overflow-hidden shrink-0 border-2 transition-all ${idx === activeImage ? 'border-[#4F46E5]' : 'border-transparent opacity-70'}`}
                  >
                    <img src={img} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details & Form */}
          <div className="flex flex-col">
            <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-2 text-[#1A202C]">{product.name}</h1>
            <p className="text-2xl font-black mb-6" style={{ color: storeConfig?.primaryColor || '#4F46E5' }}>{productPrice} DZD</p>
            <p className="text-[#718096] leading-relaxed mb-8">{product.description}</p>

            {/* Variants */}
            {product.variants?.map((v: any) => (
               <div key={v.name} className="mb-6">
                 <h3 className="font-semibold mb-3 uppercase text-xs tracking-wider text-[#718096]">{v.name}</h3>
                 <div className="flex flex-wrap gap-2">
                   {v.options.map((opt: string) => (
                     <button
                       key={opt}
                       onClick={() => setSelectedVariants(prev => ({...prev, [v.name]: opt}))}
                       className={`px-5 py-2.5 rounded-lg border text-sm font-semibold transition-colors ${
                         selectedVariants[v.name] === opt 
                          ? 'bg-[#4F46E5]/10 text-[#4F46E5] border-[#4F46E5]' 
                          : 'bg-white text-[#718096] border-[#E2E8F0] hover:bg-[#F8FAFC]'
                       }`}
                     >
                       {opt}
                     </button>
                   ))}
                 </div>
               </div>
            ))}

            <div className="my-8 pt-8 border-t border-[#E2E8F0]">
              <Button 
                disabled={isOutOfStock}
                onClick={handleOpenForm} 
                size="lg" 
                className={`w-full text-white text-lg h-14 rounded-full font-bold shadow-lg transition-all ${isOutOfStock ? 'bg-gray-400 cursor-not-allowed shadow-none' : 'bg-[#1A202C] hover:bg-[#334155] shadow-black/10'}`}
              >
                {isOutOfStock ? 'OUT OF STOCK' : `Order Now - ${totalPrice} DZD`}
              </Button>
            </div>

            {/* COD FORM */}
            <Card id="cod-form" className="p-6 sm:p-8 bg-[#F8FAFC] border border-[#E2E8F0] rounded-2xl mt-8">
            {product.landing_page_config && Array.isArray(product.landing_page_config) && product.landing_page_config.length > 0 ? (
                <form onSubmit={handleSubmit} className="space-y-4">
                  {product.landing_page_config.map((block: any) => (
                    <div key={block.id} className={`${block.animation && block.animation !== 'None' ? `animate-${block.animation}` : ''}`} style={{ 
                      borderRadius: block.borderRadius ? `${block.borderRadius}px` : undefined,
                      boxShadow: block.shadow ? `0 ${block.shadow}px ${block.shadow * 3}px rgba(0,0,0,0.1)` : undefined
                    }}>
                      {block.type === 'image' && (
                        <div className="w-full bg-gray-100 rounded-lg overflow-hidden border mb-4">
                           <img src={block.url} alt="Custom config" className="w-full h-auto" />
                        </div>
                      )}
                      {block.type === 'header' && (
                        <div className="text-center py-2">
                           <h2 className="line-clamp-2" style={{ 
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
                        <div className="bg-white p-4 rounded-xl border text-sm space-y-2 mb-6 shadow-sm">
                          <div className="flex justify-between"><span>Sous-total</span><span>{productPrice} DZD</span></div>
                          <div className="flex justify-between text-[#e53e3e] font-bold"><span>Livraison</span><span>{deliveryFee === 0 ? 'Gratuit' : `${deliveryFee} DZD`}</span></div>
                          <div className="border-t pt-2 mt-2 flex justify-between font-bold text-lg"><span>Total</span><span>{totalPrice} DZD</span></div>
                        </div>
                      )}
                      {block.type === 'input' && (
                        <div className="space-y-1.5">
                          <Label className="mb-0 text-[11px] font-bold text-gray-500 uppercase tracking-wider">{block.label}</Label>
                          <Input required={block.required} placeholder={block.placeholder} className="bg-white h-11 rounded-xl" 
                            value={block.internalName === 'name' ? name : (block.internalName === 'phone' ? phone : undefined)} 
                            onChange={(e) => {
                              if (block.internalName === 'name') setName(e.target.value);
                              else if (block.internalName === 'phone') setPhone(e.target.value);
                              else if (block.internalName === 'address') setAddress(e.target.value);
                            }} />
                        </div>
                      )}
                      {block.type === 'wilaya' && (
                        <div className="space-y-1.5">
                           <Label className="mb-0 text-[11px] font-bold text-gray-500 uppercase tracking-wider">{block.label}</Label>
                           <Select value={wilaya} onValueChange={(v) => { setWilaya(v); setCommune(''); }}>
                             <SelectTrigger className="bg-white h-11 rounded-xl"><SelectValue placeholder="Saisissez votre wilaya" /></SelectTrigger>
                             <SelectContent>
                               {ALGERIA_WILAYAS.map(w => <SelectItem key={w.id} value={w.name}>{w.id} - {w.name}</SelectItem>)}
                             </SelectContent>
                           </Select>
                        </div>
                      )}
                      {block.type === 'commune' && (
                        <div className="space-y-1.5">
                           <Label className="mb-0 text-[11px] font-bold text-gray-500 uppercase tracking-wider">{block.label}</Label>
                           <Select value={commune} onValueChange={setCommune} disabled={!wilaya}>
                             <SelectTrigger className="bg-white h-11 rounded-xl"><SelectValue placeholder="Saisissez votre commune" /></SelectTrigger>
                             <SelectContent>
                               {communesForSelectedWilaya.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                             </SelectContent>
                           </Select>
                        </div>
                      )}
                      {block.type === 'address' && (
                        <div className="space-y-1.5">
                           <Label className="mb-0 text-[11px] font-bold text-gray-500 uppercase tracking-wider">{block.label || 'Adresse Exacte'}</Label>
                           <Input required={block.required} placeholder={block.placeholder || 'Nom de la rue, quartier...'} className="bg-white h-11 rounded-xl" 
                             value={address} 
                             onChange={(e) => setAddress(e.target.value)} />
                        </div>
                      )}
                      {block.type === 'delivery' && (
                        <div className="space-y-3 mt-4">
                          <Label className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{block.label || 'Options de livraison'}</Label>
                          <div className="grid grid-cols-2 gap-3">
                            <button
                              type="button"
                              onClick={() => setStopDesk(false)}
                              className={`p-4 rounded-2xl border text-left transition-all ${!stopDesk ? 'border-[#4F46E5] bg-[#4F46E5]/5 ring-2 ring-[#4F46E5]/10' : 'border-[#E2E8F0] bg-white text-gray-500'}`}
                            >
                              <div className={`text-sm font-bold ${!stopDesk ? 'text-[#4F46E5]' : 'text-[#1A202C]'}`}>À Domicile</div>
                              <div className="text-[10px] opacity-70">Livraison Yalidine</div>
                            </button>
                            <button
                              type="button"
                              onClick={() => setStopDesk(true)}
                              className={`p-4 rounded-2xl border text-left transition-all ${stopDesk ? 'border-[#4F46E5] bg-[#4F46E5]/5 ring-2 ring-[#4F46E5]/10' : 'border-[#E2E8F0] bg-white text-gray-500'}`}
                            >
                              <div className={`text-sm font-bold ${stopDesk ? 'text-[#4F46E5]' : 'text-[#1A202C]'}`}>Stop Desk</div>
                              <div className="text-[10px] opacity-70">Bureau Yalidine</div>
                            </button>
                          </div>
                        </div>
                      )}
                      {block.type === 'button' && (
                        <Button 
                          disabled={isSubmitting || isOutOfStock} 
                          type="submit" 
                          size="lg" 
                          className="w-full mt-4 h-15 font-black transition-all transform active:scale-95" 
                          style={{ 
                            background: block.bgColor || '#ff4d4f',
                            color: block.textColor || '#ffffff',
                            borderRadius: block.borderRadius ? `${block.borderRadius}px` : '16px',
                            fontSize: `${block.fontSize || 20}px`,
                            fontWeight: block.fontWeight || 'bold',
                            fontStyle: block.fontStyle || 'normal',
                            boxShadow: block.shadow ? `0 ${block.shadow}px ${block.shadow * 4}px rgba(0,0,0,0.2)` : '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                          }}
                        >
                          {isSubmitting ? '...' : (isOutOfStock ? 'OUT OF STOCK' : block.text)}
                        </Button>
                      )}
                    </div>
                  ))}
                  {/* Address Fallback if not configured in builder */}
                  {!product.landing_page_config.some((b:any) => b.internalName === 'address' || b.type === 'commune') && (
                    <Input required value={address} onChange={e => setAddress(e.target.value)} className="bg-white mt-4" placeholder="Street name, building..." />
                  )}
                </form>
              ) : (
                <>
                  <h2 className="text-xl font-bold mb-6 flex items-center gap-2 text-[#1A202C]">
                    <span className="w-6 h-6 rounded flex items-center justify-center text-sm bg-[#4F46E5] text-white">1</span>
                    Delivery Details
                  </h2>
                  <form onSubmit={handleSubmit} className="space-y-5">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Full Name</Label>
                        <Input required value={name} onChange={e => setName(e.target.value)} className="bg-white" placeholder="John Doe" />
                      </div>
                      <div className="space-y-2">
                        <Label>Phone Number</Label>
                        <Input required value={phone} onChange={e => setPhone(e.target.value)} className="bg-white" placeholder="05XX XX XX XX" />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Wilaya</Label>
                        <Select value={wilaya} onValueChange={(v) => { setWilaya(v); setCommune(''); }}>
                          <SelectTrigger className="bg-white">
                            <SelectValue placeholder="Select Wilaya" />
                          </SelectTrigger>
                          <SelectContent>
                            {ALGERIA_WILAYAS.map(w => (
                              <SelectItem key={w.id} value={w.name}>{w.id} - {w.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label>Commune</Label>
                        <Select value={commune} onValueChange={setCommune} disabled={!wilaya}>
                          <SelectTrigger className="bg-white">
                            <SelectValue placeholder="Select Commune" />
                          </SelectTrigger>
                          <SelectContent>
                            {communesForSelectedWilaya.map(c => (
                              <SelectItem key={c} value={c}>{c}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Exact Address</Label>
                      <Input required={!stopDesk} value={address} onChange={e => setAddress(e.target.value)} className="bg-white" placeholder="Street name, building, apartment..." />
                    </div>

                    <div className="space-y-3">
                      <Label>Delivery Method</Label>
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          type="button"
                          onClick={() => setStopDesk(false)}
                          className={`p-3 rounded-xl border text-left transition-all ${!stopDesk ? 'border-[#4F46E5] bg-[#4F46E5]/5' : 'border-[#E2E8F0] bg-white'}`}
                        >
                          <div className={`font-bold ${!stopDesk ? 'text-[#4F46E5]' : 'text-[#1A202C]'}`}>Home Delivery</div>
                          <div className="text-xs text-[#718096]">Deliver to your door</div>
                        </button>
                        <button
                          type="button"
                          onClick={() => setStopDesk(true)}
                          className={`p-3 rounded-xl border text-left transition-all ${stopDesk ? 'border-[#4F46E5] bg-[#4F46E5]/5' : 'border-[#E2E8F0] bg-white'}`}
                        >
                          <div className={`font-bold ${stopDesk ? 'text-[#4F46E5]' : 'text-[#1A202C]'}`}>Stop Desk</div>
                          <div className="text-xs text-[#718096]">Pick from office</div>
                        </button>
                      </div>
                    </div>

                    <div className="pt-4 mt-6 border-t border-[#E2E8F0] space-y-3">
                      <div className="flex justify-between text-sm text-[#718096]">
                        <span>Subtotal</span>
                        <span>{productPrice} DZD</span>
                      </div>
                      <div className="flex justify-between text-sm text-[#718096]">
                        <span>Delivery Fee ({stopDesk ? 'Stop Desk' : 'Home'})</span>
                        <span>{deliveryFee} DZD</span>
                      </div>
                      <div className="flex justify-between font-bold text-lg pt-3 border-t border-[#E2E8F0] text-[#1A202C]">
                        <span>Total to pay</span>
                        <span style={{ color: storeConfig?.primaryColor || '#4F46E5' }}>{totalPrice} DZD</span>
                      </div>
                    </div>

                    <Button disabled={isSubmitting || isOutOfStock} type="submit" size="lg" className={`w-full mt-6 text-white rounded-xl h-14 font-bold transition-all ${isOutOfStock ? 'bg-gray-400' : 'hover:opacity-90'}`} style={{ backgroundColor: isOutOfStock ? undefined : (storeConfig?.primaryColor || '#4F46E5') }}>
                      {isSubmitting ? 'Processing...' : (isOutOfStock ? 'OUT OF STOCK' : 'Confirm Order')}
                    </Button>
                  </form>
                </>
              )}
            </Card>

          </div>
        </div>
      </div>
    </div>
  </div>
  );
};
