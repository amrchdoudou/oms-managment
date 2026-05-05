import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PenTool } from 'lucide-react';

export const ProductDesignerAdmin = () => {
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/products').then(r => r.json()).then(setProducts);
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl border border-[#E2E8F0] shadow-sm">
        <h2 className="text-2xl font-bold tracking-tight text-[#1A202C]">Product Designer</h2>
        <p className="text-gray-500 mt-2">Select a product to customize its landing page layout.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {products.map(p => (
          <Link key={p.id} to={`/admin/products/${p.id}/builder`} className="block group">
            <div className="bg-white border border-[#E2E8F0] shadow-sm rounded-xl overflow-hidden hover:border-indigo-500 transition-colors">
              <div className="aspect-video bg-gray-100 relative">
                <img src={p.images?.[0] || 'https://via.placeholder.com/300'} className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                    <PenTool className="text-white" size={32} />
                </div>
              </div>
              <div className="p-4">
                <h3 className="font-bold text-[#1A202C]">{p.name}</h3>
                <p className="text-sm text-gray-500">{p.price} DZD</p>
              </div>
            </div>
          </Link>
        ))}
        {products.length === 0 && <p className="text-gray-400 text-center col-span-full p-8 border border-dashed rounded-xl">No products found.</p>}
      </div>
    </div>
  );
};
