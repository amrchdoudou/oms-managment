import { useEffect, useState } from 'react';
import { useStore } from '../store';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { ShoppingBag, Sparkles } from 'lucide-react';
import { firePageView } from '../services/pixelService';

export const StoreFront = () => {
  const { products, fetchProducts } = useStore();
  const [config, setConfig] = useState<any>(null);

  useEffect(() => {
    fetchProducts();
    firePageView();
    fetch('/api/settings/store_config')
      .then(r => r.json())
      .then(data => {
        if (Object.keys(data).length > 0) setConfig(data);
      })
      .catch(() => {});
  }, []);

  if (!config) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white">
        <div className="w-12 h-12 border-4 border-[#4F46E5] border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white font-sans overflow-x-hidden">
      <nav className="h-16 px-6 lg:px-12 border-b border-[#F1F5F9] flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-md z-50">
         <div className="font-black text-2xl tracking-tighter" style={{ color: config.primaryColor }}>
           {config.logo ? <img src={config.logo} alt={config.brandName} className="h-8 w-auto" /> : (config.brandName || 'Mstore')}
         </div>
         <div className="hidden md:flex gap-8 text-sm font-bold text-gray-900 uppercase tracking-widest">
           <Link to="/" className="hover:opacity-60 transition-opacity">Accueil</Link>
           <Link to="/admin" className="hover:opacity-60 transition-opacity">Admin</Link>
         </div>
         <div className="flex gap-4">
           <ShoppingBag size={22} className="text-gray-900" />
         </div>
      </nav>

      <main>
        {config.sections?.map((section: any) => {
          if (!section.visible) return null;

          if (section.type === 'hero') {
            return (
              <section 
                key={section.id} 
                className="relative flex items-center px-8 lg:px-16 overflow-hidden"
                style={{ height: section.settings?.height || '600px' }}
              >
                <div className="absolute inset-0 z-0">
                    {section.settings?.bgImage ? (
                      <img src={section.settings.bgImage} className="w-full h-full object-cover" />
                    ) : (
                      <img src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=2670" className="w-full h-full object-cover" />
                    )}
                  <div className="absolute inset-0 bg-black" style={{ opacity: section.settings?.overlayOpacity || 0.4 }} />
                </div>
                <div className="relative z-10 max-w-2xl text-white space-y-6">
                   {section.blocks?.map((block: any) => {
                      const style = block.style || {};
                      if (block.type === 'heading') return <h2 key={block.id} className="leading-tight tracking-tighter animate-in fade-in slide-in-from-bottom-4 duration-700" style={{ fontSize: style.fontSize || '48px', fontWeight: style.fontWeight || '900', color: style.color || '#ffffff', textAlign: style.textAlign || 'left' }}>{block.content}</h2>;
                      if (block.type === 'text') return <p key={block.id} className="opacity-90 leading-relaxed max-w-lg" style={{ fontSize: style.fontSize || '18px', fontWeight: style.fontWeight || '400', color: style.color || '#ffffff', textAlign: style.textAlign || 'left' }}>{block.content}</p>;
                      if (block.type === 'image') return block.content ? <img key={block.id} src={block.content} className="max-w-full h-auto my-6" style={{ borderRadius: style.borderRadius || '0' }} /> : null;
                      if (block.type === 'button') return (
                        <button 
                          key={block.id} 
                          className="font-bold transition-all hover:scale-105 active:scale-95 shadow-xl" 
                          style={{ 
                            backgroundColor: style.bgColor || config.primaryColor, 
                            color: style.color || '#ffffff', 
                            borderRadius: style.borderRadius || '50px',
                            padding: style.padding || '12px 32px'
                          }}
                        >
                          {block.content}
                        </button>
                      );
                      return null;
                   })}
                </div>
              </section>
            );
          }

          if (section.type === 'image_text') {
            return (
              <section key={section.id} className="py-24 px-6 lg:px-12 bg-white max-w-7xl mx-auto overflow-hidden">
                <div className="grid md:grid-cols-2 gap-12 items-center">
                    <div className="aspect-square bg-gray-100 rounded-3xl overflow-hidden shadow-2xl">
                       {section.settings?.bgImage && <img src={section.settings.bgImage} className="w-full h-full object-cover" />}
                    </div>
                   <div className="space-y-6">
                      {section.blocks?.map((block: any) => {
                        const style = block.style || {};
                        if (block.type === 'heading') return <h2 key={block.id} className="leading-tight tracking-tighter" style={{ fontSize: style.fontSize || '32px', fontWeight: style.fontWeight || '900', color: style.color || '#1a202c', textAlign: style.textAlign || 'left' }}>{block.content}</h2>;
                        if (block.type === 'text') return <p key={block.id} style={{ fontSize: style.fontSize || '16px', fontWeight: style.fontWeight || '400', color: style.color || '#4a5568', textAlign: style.textAlign || 'left' }}>{block.content}</p>;
                        if (block.type === 'image') return block.content ? <img key={block.id} src={block.content} className="max-w-full h-auto my-6" style={{ borderRadius: style.borderRadius || '0' }} /> : null;
                        if (block.type === 'button') return (
                          <button 
                            key={block.id} 
                            className="font-black uppercase tracking-widest transition-all shadow-lg hover:shadow-xl" 
                            style={{ 
                              backgroundColor: style.bgColor || config.primaryColor, 
                              color: style.color || '#ffffff', 
                              borderRadius: style.borderRadius || '8px',
                              padding: style.padding || '16px 32px'
                            }}
                          >
                            {block.content}
                          </button>
                        );
                        return null;
                      })}
                   </div>
                </div>
              </section>
            );
          }

          if (section.type === 'marquee') {
            return (
              <section key={section.id} className="h-16 bg-[#1A1A1A] text-white flex overflow-hidden whitespace-nowrap items-center font-black italic tracking-tighter uppercase text-xl">
                 <div className="flex animate-marquee gap-8 items-center px-4">
                    {Array(20).fill(0).map((_, i) => (
                      <div key={i} className="flex items-center gap-8">
                        <span>{section.settings?.title || 'NEWSFLASH'}</span>
                        <Sparkles size={20} className="text-indigo-400" />
                      </div>
                    ))}
                 </div>
              </section>
            );
          }

          if (section.type === 'featured_collection') {
            return (
              <section key={section.id} className="py-24 px-6 lg:px-12 max-w-7xl mx-auto">
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
                  <div className="space-y-2">
                    <h3 className="text-3xl md:text-4xl font-black tracking-tight">{section.settings?.title || 'Featured'}</h3>
                    <div className="h-1.5 w-20 rounded-full" style={{ backgroundColor: config.primaryColor }} />
                  </div>
                  <button className="text-sm font-black uppercase tracking-widest border-b-2 border-transparent hover:border-black transition-all pb-1 w-fit">Browse Collective</button>
                </div>
                <div className="flex overflow-x-auto pb-6 gap-6 lg:grid lg:grid-cols-4 lg:gap-x-6 lg:gap-y-12 lg:overflow-visible">
                  {products.slice(0, 8).map(p => (
                    <div key={p.id} className="min-w-[160px] md:min-w-[200px]">
                      <ProductCard p={p} config={config} />
                    </div>
                  ))}
                </div>
              </section>
            );
          }

          return null;
        })}
      </main>

      <footer className="bg-gray-50 border-t border-gray-100 py-24 px-6 lg:px-12 text-center mt-20">
         <div className="max-w-xl mx-auto space-y-6">
            <div className="font-black text-3xl tracking-tighter" style={{ color: config.primaryColor }}>{config.brandName || 'Mstore'}</div>
            <p className="text-gray-500 text-sm leading-relaxed">&copy; 2026 {config.brandName || 'Mstore'}. Developed with high-end modular sections. Serving premium goods across 58 wilayas.</p>
            <div className="flex justify-center gap-8 pt-4">
               {['Instagram', 'Facebook', 'TikTok'].map(s => <span key={s} className="text-xs font-black uppercase tracking-widest text-gray-400 hover:text-black cursor-pointer transition-colors">{s}</span>)}
            </div>
         </div>
      </footer>
    </div>
  );
};

const ProductCard = ({ p, config }: { p: any; config?: any; key?: any }) => (
  <Link to={`/product/${p.id}`} className="block group">
    <div className="bg-white rounded-3xl overflow-hidden transition-all duration-500 hover:shadow-2xl hover:shadow-indigo-100 group-hover:-translate-y-2">
      <div className="aspect-[3/4] bg-[#F8FAFC] relative overflow-hidden">
        <img 
          src={p.images?.[0] || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=600&auto=format&fit=crop'} 
          alt={p.name}
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        {p.stock <= 5 && p.stock > 0 && (
          <div className="absolute top-4 left-4 bg-orange-500 text-white text-[10px] font-black uppercase px-2 py-1 rounded shadow-lg z-10">Stock Limité</div>
        )}
      </div>
      <div className="p-6">
        <div className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1.5">{p.brand || 'Premium Collection'}</div>
        <h3 className="font-bold text-[#1A202C] text-lg line-clamp-1 mb-2 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{p.name}</h3>
        <div className="flex items-center gap-3">
          <div className="text-lg font-black" style={{ color: config?.primaryColor || '#4F46E5' }}>{p.price} DZD</div>
          {p.oldPrice && (
            <div className="text-sm text-gray-400 line-through font-medium">{p.oldPrice} DZD</div>
          )}
        </div>
      </div>
    </div>
  </Link>
);
