import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export const ProductsAdmin = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [price, setPrice] = useState('');
  const [images, setImages] = useState<FileList | null>(null);
  
  const [variants, setVariants] = useState<{name: string, options: string}[]>([
    { name: 'Size', options: 'S, M, L' }
  ]);
  const [inventory, setInventory] = useState<Record<string, number>>({});

  const loadProducts = () => {
    fetch('/api/products')
      .then(r => r.ok ? r.json() : [])
      .then(data => setProducts(Array.isArray(data) ? data : []));
  };

  useEffect(() => { loadProducts(); }, []);

  const handleEdit = (p: any) => {
    setEditingProduct(p);
    setName(p.name);
    setDesc(p.description);
    setPrice(p.price.toString());
    setVariants((p.variants || []).map((v: any) => ({
      name: v.name,
      options: (v.options || []).join(', ')
    })));
    setInventory(p.inventory || {});
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingProduct(null);
    setName(''); setDesc(''); setPrice('');
    setVariants([{ name: 'Size', options: 'S, M, L' }]);
    setInventory({});
  };

  // Helper to generate combinations
  const getCombinations = (vars: {name: string, options: string[]}[]) => {
    if (vars.length === 0) return [];
    
    let combinations: Record<string, string>[] = [{}];
    
    vars.forEach(v => {
      const newCombinations: Record<string, string>[] = [];
      combinations.forEach(combo => {
        v.options.forEach(option => {
          newCombinations.push({ ...combo, [v.name]: option });
        });
      });
      combinations = newCombinations;
    });
    
    return combinations;
  };

  const currentParsedVariants = variants
    .filter(v => v.name.trim() && v.options.trim())
    .map(v => ({
      name: v.name,
      options: v.options.split(',').map(o => o.trim()).filter(o => o)
    }));
  
  const combinations = getCombinations(currentParsedVariants);

  // Auto-fill inventory for new combinations
  useEffect(() => {
    const newInventory = { ...inventory };
    let changed = false;
    combinations.forEach(combo => {
      const keys = Object.keys(combo).sort();
      const key = keys.map(k => `${k}:${combo[k]}`).join('_');
      if (newInventory[key] === undefined) {
        newInventory[key] = 10; // Default stock
        changed = true;
      }
    });
    if (changed) setInventory(newInventory);
  }, [combinations]);

  const addVariantField = () => {
    setVariants([...variants, { name: '', options: '' }]);
  };

  const updateVariant = (index: number, key: 'name'|'options', value: string) => {
    const newV = [...variants];
    newV[index][key] = value;
    setVariants(newV);
  };

  const removeVariant = (index: number) => {
    setVariants(variants.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('name', name);
    formData.append('description', desc);
    formData.append('price', price);

    const parsedVariants = variants
      .filter(v => v.name.trim() && v.options.trim())
      .map(v => ({
        name: v.name,
        options: v.options.split(',').map(o => o.trim()).filter(o => o)
      }));

    formData.append('variants', JSON.stringify(currentParsedVariants));
    formData.append('inventory', JSON.stringify(inventory));
    
    if (images) {
      Array.from(images as any).forEach((i) => {
        formData.append('images', i as Blob);
      });
    }

    const res = await fetch(editingProduct ? `/api/products/${editingProduct.id}` : '/api/products', {
      method: editingProduct ? 'PUT' : 'POST',
      body: formData
    });

    if (res.ok) {
      toast.success(editingProduct ? 'Product updated!' : 'Product added!');
      cancelEdit();
      loadProducts();
    } else {
      const err = await res.json().catch(() => ({}));
      toast.error(`Failed to ${editingProduct ? 'update' : 'add'} product: ` + (err.error || 'Unknown error'));
    }
  };

  const deleteProduct = async (id: string) => {
    if(!confirm('Are you sure?')) return;
    await fetch(`/api/products/${id}`, { method: 'DELETE' });
    loadProducts();
    toast.success('Deleted');
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-xl border border-[#E2E8F0] shadow-sm">
        <h2 className="text-2xl font-bold tracking-tight text-[#1A202C]">Form Builder</h2>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          {products.map(p => (
            <div key={p.id} className="bg-white border border-[#E2E8F0] shadow-sm rounded-xl overflow-hidden">
              <div className="flex items-center p-4 gap-4">
                <div className="w-16 h-16 bg-gray-100 rounded overflow-hidden">
                   <img src={p.images?.[0] || 'https://via.placeholder.com/150'} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-[#1A202C]">{p.name}</h3>
                  <p className="text-sm font-semibold text-[#4F46E5]">{p.price} DZD</p>
                  <div className="text-xs text-[#718096] mt-2 flex flex-wrap gap-2">
                    {p.variants?.map((v:any) => (
                      <span key={v.name} className="px-3 py-1 bg-[#F1F5F9] border border-[#CBD5E0] rounded-full text-[#1A202C] font-medium">{v.name}: {v.options.join(',')}</span>
                    ))}
                  </div>
                  {p.inventory && Object.keys(p.inventory).length > 0 && (
                    <div className="mt-3 bg-[#F8FAFC] p-2 rounded-lg border border-[#E2E8F0]">
                      <h4 className="text-[10px] font-bold uppercase text-[#718096] mb-1">Stock Status</h4>
                      <div className="flex flex-wrap gap-x-4 gap-y-1">
                        {Object.entries(p.inventory).map(([key, stock]: [string, any]) => (
                          <div key={key} className="flex items-center gap-1.5">
                            <span className="text-[10px] font-mono text-[#4A5568]">{key.replace(/[^:]+:/g, '').replace(/_/g, ' / ')}:</span>
                            <span className={`text-[10px] font-bold ${stock <= 0 ? 'text-red-500' : stock <= 5 ? 'text-amber-500' : 'text-emerald-500'}`}>{stock}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <button onClick={() => handleEdit(p)} className="p-2 text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors" title="Edit Product Info">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z"/></svg>
                  </button>
                  <Link to={`/admin/products/${p.id}/builder`} className="p-2 text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors" title="Form & Landing Builder">
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15.5 2h5v5"/><path d="m21 2-9 9"/><path d="M12 2h-1a10 10 0 1 0 0 20h11a2 2 0 0 0 2-2v-5"/></svg>
                  </Link>
                  <button onClick={() => deleteProduct(p.id)} className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors">
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            </div>
          ))}
          {products.length === 0 && <p className="text-[#718096] text-center p-8 bg-white rounded-xl border border-[#E2E8F0] border-dashed">No products found.</p>}
        </div>
 
        <div>
          <div className="bg-white border border-[#E2E8F0] shadow-sm rounded-xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-lg text-[#1A202C]">{editingProduct ? 'Edit Product' : 'Add Product'}</h3>
              {editingProduct && (
                <button onClick={cancelEdit} className="text-xs text-gray-500 hover:text-black">Cancel</button>
              )}
            </div>
            <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input required value={name} onChange={e => setName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input required value={desc} onChange={e => setDesc(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Price (DZD)</Label>
                  <Input required type="number" value={price} onChange={e => setPrice(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label>Images (Multiple)</Label>
                  <Input type="file" multiple accept="image/*" onChange={e => setImages(e.target.files)} />
                </div>

                <div className="space-y-3 pt-6 border-t border-[#E2E8F0]">
                  <Label className="flex justify-between items-center text-[#718096]">
                    <span className="font-semibold uppercase text-xs">Variants</span>
                    <button type="button" onClick={addVariantField} className="text-[#4F46E5] font-semibold text-xs py-1 px-2 hover:bg-[#F1F5F9] rounded">
                      + Add Variant
                    </button>
                  </Label>
                  {variants.map((v, i) => (
                    <div key={i} className="flex gap-2 items-start p-3 bg-[#F8FAFC] border border-[#E2E8F0] rounded-lg">
                       <div className="flex-1 space-y-3">
                         <Input placeholder="Name (e.g. Size)" value={v.name} onChange={e => updateVariant(i, 'name', e.target.value)} className="bg-white" />
                         <Input placeholder="Options (comma separated)" value={v.options} onChange={e => updateVariant(i, 'options', e.target.value)} className="bg-white" />
                       </div>
                       <button type="button" onClick={() => removeVariant(i)} className="text-[#718096] hover:text-red-500 p-2">
                         <Trash2 size={16} />
                       </button>
                    </div>
                  ))}
                </div>

                {combinations.length > 0 && (
                  <div className="space-y-3 pt-6 border-t border-[#E2E8F0]">
                    <Label className="block text-[#718096] font-semibold uppercase text-xs">Inventory (Stock per Variant)</Label>
                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-2">
                      {combinations.map((combo, idx) => {
                        const keys = Object.keys(combo).sort();
                        const key = keys.map(k => `${k}:${combo[k]}`).join('_');
                        const label = keys.map(k => combo[k]).join(' / ');
                        return (
                          <div key={idx} className="flex justify-between items-center bg-[#F8FAFC] p-2 rounded-lg border border-[#E2E8F0] gap-3">
                            <span className="text-sm font-medium text-[#1A202C] truncate flex-1">{label}</span>
                            <div className="w-24">
                              <Input 
                                type="number" 
                                className="h-8 text-sm" 
                                value={inventory[key] || 0} 
                                onChange={e => setInventory({...inventory, [key]: parseInt(e.target.value) || 0})} 
                                placeholder="Stock"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                <button type="submit" className="w-full bg-[#4F46E5] text-white py-2.5 rounded-lg font-semibold hover:bg-indigo-700 transition-colors mt-6">
                  {editingProduct ? 'Update Product' : 'Create Product'}
                </button>
              </form>
          </div>
        </div>
      </div>
    </div>
  );
};
