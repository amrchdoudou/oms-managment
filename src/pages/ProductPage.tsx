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

  const images = [...(product.images || [])].sort((a, b) => b.startsWith('http') ? 1 : -1);
  if (images.length === 0) images.push('https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=600&auto=format&fit=crop');

  const renderCheckoutForm = () => (
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
                    <SelectTrigger className="bg-white"><SelectValue placeholder="Select Wilaya" /></SelectTrigger>
                    <SelectContent>
                      {ALGERIA_WILAYAS.map(w => <SelectItem key={w.id} value={w.name}>{w.id} - {w.name}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Commune</Label>
                  <Select value={commune} onValueChange={setCommune} disabled={!wilaya}>
                    <SelectTrigger className="bg-white"><SelectValue placeholder="Select Commune" /></SelectTrigger>
                    <SelectContent>
                      {communesForSelectedWilaya.map(c => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label>Exact Address</Label>
                <Input required={!stopDesk} value={address} onChange={e => setAddress(e.target.value)} className="bg-white" placeholder="Street, building..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <button type="button" onClick={() => setStopDesk(false)} className={`p-3 rounded-xl border text-left ${!stopDesk ? 'border-[#4F46E5] bg-[#4F46E5]/5' : 'border-[#E2E8F0]'}`}>
                  <div className="font-bold">Home Delivery</div>
                </button>
                <button type="button" onClick={() => setStopDesk(true)} className={`p-3 rounded-xl border text-left ${stopDesk ? 'border-[#4F46E5] bg-[#4F46E5]/5' : 'border-[#E2E8F0]'}`}>
                  <div className="font-bold">Stop Desk</div>
                </button>
              </div>
              <div className="pt-4 border-t space-y-2">
                <div className="flex justify-between text-sm"><span>Subtotal</span><span>{productPrice} DZD</span></div>
                <div className="flex justify-between text-sm"><span>Delivery</span><span>{deliveryFee} DZD</span></div>
                <div className="flex justify-between font-bold text-lg pt-2 border-t"><span>Total</span><span style={{ color: storeConfig?.primaryColor || '#4F46E5' }}>{totalPrice} DZD</span></div>
              </div>
              <Button disabled={isSubmitting || isOutOfStock} type="submit" size="lg" className="w-full mt-6 rounded-xl h-14 font-bold" style={{ backgroundColor: storeConfig?.primaryColor || '#4F46E5' }}>
                {isSubmitting ? 'Processing...' : 'Confirm Order'}
              </Button>
            </form>
          </>
        )}
    </Card>
  );

  const renderSections = () => {
    if (!product.content_config || !Array.isArray(product.content_config) || product.content_config.length === 0) {
      return (
        <div className="max-w-6xl mx-auto px-4 lg:px-8">
          <div className="bg-white border border-[#E2E8F0] rounded-[24px] p-6 lg:p-12 shadow-sm">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
              <div className="space-y-4">
                <div className="aspect-[4/5] bg-gray-100 rounded-2xl overflow-hidden relative border border-[#E2E8F0]">
                  <img src={images[activeImage]} alt="Product" className="w-full h-full object-contain" />
                </div>
                {images.length > 1 && (
                  <div className="flex gap-4 overflow-x-auto pb-2">
                    {images.map((img: string, idx: number) => (
                      <button key={idx} onClick={() => setActiveImage(idx)} className={`w-20 h-20 rounded-xl overflow-hidden shrink-0 border-2 transition-all ${idx === activeImage ? 'border-[#4F46E5]' : 'border-transparent opacity-70'}`}>
                        <img src={img} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
              </div>
              <div className="flex flex-col">
                <h1 className="text-3xl sm:text-4xl font-bold tracking-tight mb-2 text-[#1A202C]">{product.name}</h1>
                <p className="text-2xl font-black mb-6" style={{ color: storeConfig?.primaryColor || '#4F46E5' }}>{productPrice} DZD</p>
                <p className="text-[#718096] leading-relaxed mb-8">{product.description}</p>
                {product.variants?.map((v: any) => (
                   <div key={v.name} className="mb-6">
                     <h3 className="font-semibold mb-3 uppercase text-xs tracking-wider text-[#718096]">{v.name}</h3>
                     <div className="flex flex-wrap gap-2">
                       {v.options.map((opt: string) => (
                         <button key={opt} onClick={() => setSelectedVariants(prev => ({...prev, [v.name]: opt}))} className={`px-5 py-2.5 rounded-lg border text-sm font-semibold transition-colors ${selectedVariants[v.name] === opt ? 'bg-[#4F46E5]/10 text-[#4F46E5] border-[#4F46E5]' : 'bg-white text-[#718096] border-[#E2E8F0]'}`}>
                           {opt}
                         </button>
                       ))}
                     </div>
                   </div>
                ))}
                <div className="my-8 pt-8 border-t border-[#E2E8F0]">
                  <Button disabled={isOutOfStock} onClick={handleOpenForm} size="lg" className="w-full text-white text-lg h-14 rounded-full font-bold shadow-lg bg-[#1A202C]">
                    {isOutOfStock ? 'OUT OF STOCK' : `Order Now`}
                  </Button>
                </div>
                {renderCheckoutForm()}
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="space-y-0">
        {product.content_config.map((section: any) => (
          <div key={section.id} className="relative">
            {section.type === 'product_info' && (
              <div className="bg-white border-b border-gray-100 py-12 px-4 lg:px-8">
                <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12">
                   <div className="space-y-4">
                      <div className="aspect-[4/5] bg-gray-50 rounded-2xl overflow-hidden border border-gray-100">
                        <img src={images[activeImage]} className="w-full h-full object-contain" />
                      </div>
                      <div className="flex gap-2">
                        {images.map((img: string, idx: number) => (
                          <button key={idx} onClick={() => setActiveImage(idx)} className={`w-12 h-12 rounded-lg border-2 ${idx === activeImage ? 'border-indigo-500' : 'border-transparent'}`}><img src={img} className="w-full h-full object-cover" /></button>
                        ))}
                      </div>
                   </div>
                   <div>
                      <h1 className="text-3xl font-black mb-2">{product.name}</h1>
                      <p className="text-2xl font-bold text-indigo-600 mb-6">{product.price} DZD</p>
                      {product.variants?.map((v: any) => (
                         <div key={v.name} className="mb-4">
                           <Label className="text-[10px] font-bold uppercase text-gray-400 mb-2 block">{v.name}</Label>
                           <div className="flex gap-2">
                             {v.options.map((o: string) => (
                               <button key={o} onClick={() => setSelectedVariants({...selectedVariants, [v.name]: o})} className={`px-4 py-1.5 rounded-lg border text-sm ${selectedVariants[v.name] === o ? 'bg-indigo-50 border-indigo-500 text-indigo-600 font-bold' : 'bg-white border-gray-200'}`}>{o}</button>
                             ))}
                           </div>
                         </div>
                      ))}
                      <Button onClick={handleOpenForm} className="w-full h-12 rounded-xl bg-indigo-600 hover:bg-indigo-700 font-bold mt-8">{section.settings.buttonText || 'Order Now'}</Button>
                   </div>
                </div>
              </div>
            )}
            {section.type === 'rich_text' && (
              <div className="bg-gray-50 py-16 px-4">
                <div className={`max-w-3xl mx-auto text-${section.settings.align || 'center'} space-y-4`}>
                  <h2 className="text-3xl font-black">{section.settings.title}</h2>
                  <p className="text-gray-600 leading-relaxed">{section.settings.content}</p>
                </div>
              </div>
            )}
            {section.type === 'image_with_text' && (
              <div className="bg-white py-16 px-4">
                <div className={`max-w-6xl mx-auto flex flex-col ${section.settings.layout === 'right' ? 'lg:flex-row-reverse' : 'lg:flex-row'} items-center gap-12`}>
                   <div className="flex-1 w-full aspect-square bg-gray-100 rounded-3xl overflow-hidden shadow-2xl">
                     {section.settings.image && <img src={section.settings.image} className="w-full h-full object-cover" />}
                   </div>
                   <div className="flex-1 space-y-6">
                      <h2 className="text-4xl font-black tracking-tight">{section.settings.title}</h2>
                      <p className="text-lg text-gray-500 leading-relaxed">{section.settings.content}</p>
                   </div>
                </div>
              </div>
            )}
            {section.type === 'feature_list' && (
              <div className="bg-white py-16 px-4">
                <div className="max-w-4xl mx-auto text-center">
                   <h2 className="text-3xl font-black mb-12">{section.settings.title}</h2>
                   <div className="space-y-4">
                      {section.settings.items?.map((item: string, i: number) => (
                        <div key={i} className="bg-gray-50 p-6 rounded-2xl flex items-center gap-4 border border-gray-100">
                           <div className="w-8 h-8 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                             <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                           </div>
                           <p className="font-bold text-gray-700 text-left">{item}</p>
                        </div>
                      ))}
                   </div>
                </div>
              </div>
            )}
            {section.type === 'gallery' && (
              <div className="bg-white py-16">
                 <h2 className="text-3xl font-black mb-8 px-4 text-center">{section.settings.title || 'Gallery'}</h2>
                 <div className="flex gap-4 overflow-x-auto px-4 pb-4">
                   {section.settings.images?.map((img: string, i: number) => (
                     <div key={i} className="w-[80vw] h-[60vw] md:w-64 md:h-64 shrink-0 bg-gray-100 rounded-2xl overflow-hidden border border-gray-100">
                        <img src={img} className="w-full h-full object-cover" />
                     </div>
                   ))}
                 </div>
              </div>
            )}
            {section.type === 'image_only' && (
              <div className="bg-white py-8 px-4">
                 <div className="w-full aspect-video rounded-3xl overflow-hidden">
                    <img src={section.settings.image} className="w-full h-full object-cover" />
                 </div>
              </div>
            )}
            {section.type === 'recommended_products' && (
               <div className="bg-white py-16 px-4">
                 <div className="max-w-6xl mx-auto">
                    <h2 className="text-3xl font-black mb-12 text-center">{section.settings.title || 'You May Also Like'}</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                       {/* Mocking some related items or I could fetch all products and filter */}
                       <div className="bg-gray-50 aspect-[3/4] rounded-2xl animate-pulse" />
                       <div className="bg-gray-50 aspect-[3/4] rounded-2xl animate-pulse" />
                       <div className="bg-gray-50 aspect-[3/4] rounded-2xl animate-pulse" />
                       <div className="bg-gray-50 aspect-[3/4] rounded-2xl animate-pulse" />
                    </div>
                 </div>
               </div>
            )}
          </div>
        ))}
        <div className="max-w-xl mx-auto py-12 px-4">{renderCheckoutForm()}</div>
      </div>
    );
  };

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
      <header className="bg-white px-6 py-4 border-b border-[#E2E8F0] mb-8 flex justify-between items-center">
        <h1 className="text-xl font-black tracking-tighter cursor-pointer" style={{ color: storeConfig?.primaryColor || '#1A202C' }} onClick={() => navigate('/')}>
          {storeConfig?.brandName || 'Mstore'}
        </h1>
      </header>
      <div className="px-0 sm:px-4 lg:px-8">
         {renderSections()}
      </div>
    </div>
  );
};
