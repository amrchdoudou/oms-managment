import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Save, 
  Plus, 
  GripVertical, 
  Settings2, 
  Trash2, 
  Eye, 
  Layout, 
  Smartphone, 
  Monitor, 
  Palette,
  Image as ImageIcon,
  Type,
  ShoppingBag,
  Layers,
  ChevronRight,
  Sparkles,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  Box,
  Wand2,
  Package,
  Info,
  List,
  Grid
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '../../components/ui/select';
import { DHD_LOGO } from '../../lib/assets';
import { GoogleGenAI } from '@google/genai';

const SECTION_OPTIONS = [
  { type: 'product_info', icon: <Package size={16} />, label: 'Product Main Info' },
  { type: 'rich_text', icon: <Type size={16} />, label: 'Rich Text' },
  { type: 'image_with_text', icon: <ImageIcon size={16} />, label: 'Image with Text' },
  { type: 'image_only', icon: <ImageIcon size={16} />, label: 'Image Only' },
  { type: 'gallery', icon: <Grid size={16} />, label: 'Image Gallery' },
  { type: 'recommended_products', icon: <ShoppingBag size={16} />, label: 'Recommended Products' },
  { type: 'feature_list', icon: <List size={16} />, label: 'Feature List' },
];

const DEFAULT_SECTIONS = [
  { 
    id: 's1', 
    type: 'product_info', 
    visible: true,
    settings: {
      showPrice: true,
      showVariants: true,
      buttonText: 'Order Now'
    }
  },
  {
    id: 's2',
    type: 'rich_text',
    visible: true,
    settings: {
      title: 'Product Overview',
      content: 'This is a premium product designed for quality and style.',
      align: 'center'
    }
  }
];

export const ProductContentBuilder = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<any>(null);
  const [sections, setSections] = useState<any[]>([]);
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<'mobile' | 'desktop'>('mobile');
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetch(`/api/products/${id}`)
      .then(r => r.json())
      .then(data => {
        setProduct(data);
        if (data.content_config && Array.isArray(data.content_config)) {
          setSections(data.content_config);
        } else {
          setSections(DEFAULT_SECTIONS);
        }
        setLoading(false);
      })
      .catch(err => {
        toast.error('Failed to load product');
        setLoading(false);
      });
  }, [id]);

  const saveConfig = async () => {
    setIsSaving(true);
    try {
      const res = await fetch(`/api/products/${id}/content-config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ config: sections })
      });
      if (!res.ok) throw new Error('Failed to save');
      toast.success('Product design saved!');
    } catch (err) {
      toast.error('Failed to save design');
    } finally {
      setIsSaving(false);
    }
  };

  const addSection = (type: string) => {
    const newSection = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      visible: true,
      settings: type === 'rich_text' ? { title: 'New Section', content: 'Add your description here', align: 'left' } :
               type === 'image_with_text' ? { title: 'Focus Feature', content: 'Explain why this matters.', image: '', layout: 'left' } :
               type === 'image_only' ? { image: '' } :
               type === 'gallery' ? { title: 'Gallery', images: [] } :
               type === 'feature_list' ? { title: 'Why Choose Us', items: ['Feature 1', 'Feature 2', 'Feature 3'] } :
               {}
    };
    setSections([...sections, newSection]);
    setEditingSectionId(newSection.id);
  };

  const updateSection = (sid: string, updates: any) => {
    setSections(sections.map(s => s.id === sid ? { ...s, settings: { ...s.settings, ...updates } } : s));
  };

  const removeSection = (sid: string) => {
    setSections(sections.filter(s => s.id !== sid));
    if (editingSectionId === sid) setEditingSectionId(null);
  };

  if (loading) return <div className="flex items-center justify-center h-screen bg-white">Loading...</div>;

  return (
    <div className="flex flex-col h-screen bg-[#F1F5F9] -m-6 lg:-m-8">
      {/* Top Bar */}
      <header className="h-14 bg-white border-b border-[#E2E8F0] flex items-center justify-between px-4 shrink-0 z-50">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/admin/products')} className="p-2 hover:bg-gray-100 rounded-lg text-gray-500 transition-colors">
            <ArrowLeft size={18} />
          </button>
          <div className="h-4 w-px bg-gray-200" />
          <div className="flex flex-col">
            <span className="text-xs font-bold text-gray-900 truncate max-w-[200px]">{product?.name}</span>
            <span className="text-[9px] text-indigo-600 font-bold uppercase tracking-widest">Product Designer</span>
          </div>
        </div>

        <div className="flex items-center bg-[#F1F5F9] p-1 rounded-lg scale-90">
           <button onClick={() => setPreviewMode('mobile')} className={`p-1.5 rounded-md ${previewMode === 'mobile' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-400'}`}><Smartphone size={16} /></button>
           <button onClick={() => setPreviewMode('desktop')} className={`p-1.5 rounded-md ${previewMode === 'desktop' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-400'}`}><Monitor size={16} /></button>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="h-8 text-xs" onClick={() => window.open(`/product/${id}`, '_blank')}>
            <Eye size={14} className="mr-1" /> Preview
          </Button>
          <Button size="sm" className="h-8 text-xs bg-indigo-600 hover:bg-indigo-700" onClick={saveConfig} disabled={isSaving}>
            <Save size={14} className="mr-1" /> {isSaving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar: Structure */}
        <div className="w-[300px] bg-white border-r border-[#E2E8F0] flex flex-col shrink-0 overflow-y-auto">
          <div className="p-4 border-b border-gray-100">
            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Add Sections</h3>
            <div className="grid grid-cols-2 gap-2">
              {SECTION_OPTIONS.map(opt => (
                <button 
                  key={opt.type} 
                  onClick={() => addSection(opt.type)}
                  className="flex flex-col items-center gap-1.5 p-2 rounded-lg border-t border-l border-r-2 border-b-4 border-gray-200 hover:border-[#4F46E5] hover:bg-indigo-50 hover:shadow-3d-card transition-all"
                >
                  <div className="text-indigo-500">{opt.icon}</div>
                  <span className="text-[9px] font-bold text-gray-700">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 p-4 space-y-2">
            <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-4">Template Sections</h3>
            {sections.map((section, idx) => (
              <div 
                key={section.id}
                onClick={() => setEditingSectionId(section.id)}
                className={`group p-3 rounded-xl border-t border-l border-r-2 border-b-4 transition-all cursor-pointer flex items-center justify-between ${editingSectionId === section.id ? 'border-[#4F46E5] bg-indigo-50 shadow-3d-card' : 'border-gray-200 hover:bg-gray-50'}`}
              >
                <div className="flex items-center gap-2">
                  <GripVertical size={14} className="text-gray-300" />
                  <span className="text-xs font-semibold text-gray-700 capitalize">{section.type.replace('_', ' ')}</span>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={(e) => { e.stopPropagation(); removeSection(section.id); }} className="p-1 hover:bg-red-100 text-red-500 rounded"><Trash2 size={14} /></button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Center: Canvas */}
        <div className="flex-1 bg-[#F8FAFC] overflow-y-auto flex justify-center py-10 px-4">
           <div className={`transition-all duration-500 shadow-2xl bg-white flex flex-col overflow-y-auto no-scrollbar ${previewMode === 'mobile' ? 'w-[375px] h-[750px] rounded-[30px] border-[8px] border-gray-900 border-t-[40px] border-b-[20px]' : 'w-full max-w-[1000px] h-full rounded-xl border border-gray-200'}`}>
              <div className="flex-1">
                {sections.map((section, idx) => (
                  <div key={section.id} className={`group/preview relative border-t-2 border-l-2 border-r-[3px] border-b-[4px] ${editingSectionId === section.id ? 'border-[#4F46E5]' : 'border-transparent hover:border-indigo-200'} transition-all`}>
                    
                    {/* Top + */}
                    <div className="absolute -top-3 left-0 right-0 flex justify-center z-10 opacity-0 group-hover/preview:opacity-100">
                      <button className="bg-indigo-600 rounded-full p-0.5 shadow-sm"><Plus size={12} color="white"/></button>
                    </div>

                    {/* Visual Preview of Sections */}
                    {section.type === 'product_info' && (
                      <div className="p-6 space-y-4">
                        <div className="aspect-square bg-gray-100 rounded-2xl flex items-center justify-center text-gray-400">
                          Product Image Area
                        </div>
                        <div className="space-y-2 text-center">
                          <h1 className="text-2xl font-black">{product?.name}</h1>
                          <p className="text-xl font-bold text-indigo-600">{product?.price} DZD</p>
                          <div className="h-10 w-full bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold">
                            {section.settings.buttonText || 'Order Now'}
                          </div>
                        </div>
                      </div>
                    )}
                    {section.type === 'rich_text' && (
                      <div className={`p-8 text-${section.settings.align || 'left'} space-y-2`}>
                        <h2 className="text-xl font-bold">{section.settings.title}</h2>
                        <p className="text-sm text-gray-600">{section.settings.content}</p>
                      </div>
                    )}
                    {section.type === 'image_with_text' && (
                      <div className={`p-6 flex ${section.settings.layout === 'right' ? 'flex-row-reverse' : 'flex-row'} items-center gap-6`}>
                        <div className="flex-1 aspect-square bg-gray-100 rounded-xl" />
                        <div className="flex-1 space-y-2">
                           <h3 className="font-bold">{section.settings.title}</h3>
                           <p className="text-xs text-gray-500">{section.settings.content}</p>
                        </div>
                      </div>
                    )}
                    {section.type === 'feature_list' && (
                      <div className="p-6 bg-gray-50">
                        <h3 className="font-bold mb-3 text-center">{section.settings.title}</h3>
                        <div className="space-y-2">
                          {section.settings.items?.map((item: string, i: number) => (
                            <div key={i} className="flex items-center gap-2 text-[10px] bg-white p-2 rounded-lg border border-gray-100 italic">
                              <ChevronRight size={10} className="text-indigo-500" /> {item}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {section.type === 'gallery' && (
                      <div className="p-4 grid grid-cols-3 gap-2">
                         {section.settings.images?.map((img: string, i: number) => (
                           <img key={i} src={img} className="aspect-square bg-gray-100 rounded-lg object-cover" />
                         ))}
                      </div>
                    )}
                    {section.type === 'image_only' && (
                      <div className="p-4">
                         <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center text-[8px] text-gray-400">Image</div>
                      </div>
                    )}

                    {/* Bottom + */}
                    <div className="absolute -bottom-3 left-0 right-0 flex justify-center z-10 opacity-0 group-hover/preview:opacity-100">
                      <button className="bg-indigo-600 rounded-full p-0.5 shadow-sm"><Plus size={12} color="white"/></button>
                    </div>
                  </div>
                ))}
              </div>
           </div>
        </div>

        {/* Right Sidebar: Properties */}
        <div className="w-[300px] bg-white border-l border-[#E2E8F0] overflow-y-auto p-4 flex flex-col shrink-0">
          <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-6">Section Properties</h3>
          
          {editingSectionId ? (
            <div className="space-y-6">
              {sections.find(s => s.id === editingSectionId)?.type === 'rich_text' && (
                <>
                  <div className="space-y-2">
                    <Label className="text-xs">Title</Label>
                    <Input 
                      value={sections.find(s => s.id === editingSectionId)?.settings.title}
                      onChange={e => updateSection(editingSectionId, { title: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Content</Label>
                    <textarea 
                      className="w-full h-32 p-3 text-sm border rounded-xl"
                      value={sections.find(s => s.id === editingSectionId)?.settings.content}
                      onChange={e => updateSection(editingSectionId, { content: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Alignment</Label>
                    <div className="flex gap-1">
                      <Button variant="outline" size="sm" onClick={() => updateSection(editingSectionId, { align: 'left' })}><AlignLeft size={14} /></Button>
                      <Button variant="outline" size="sm" onClick={() => updateSection(editingSectionId, { align: 'center' })}><AlignCenter size={14} /></Button>
                      <Button variant="outline" size="sm" onClick={() => updateSection(editingSectionId, { align: 'right' })}><AlignRight size={14} /></Button>
                    </div>
                  </div>
                </>
              )}
              {sections.find(s => s.id === editingSectionId)?.type === 'product_info' && (
                <>
                  <div className="space-y-2">
                    <Label className="text-xs">Button Text</Label>
                    <Input 
                      value={sections.find(s => s.id === editingSectionId)?.settings.buttonText}
                      onChange={e => updateSection(editingSectionId, { buttonText: e.target.value })}
                    />
                  </div>
                </>
              )}
              {sections.find(s => s.id === editingSectionId)?.type === 'image_with_text' && (
                <>
                  <div className="space-y-2">
                    <Label className="text-xs">Title</Label>
                    <Input 
                      value={sections.find(s => s.id === editingSectionId)?.settings.title}
                      onChange={e => updateSection(editingSectionId, { title: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Content</Label>
                    <textarea 
                      className="w-full h-32 p-3 text-sm border rounded-xl"
                      value={sections.find(s => s.id === editingSectionId)?.settings.content}
                      onChange={e => updateSection(editingSectionId, { content: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                     <Label className="text-xs">Image URL</Label>
                     <Input 
                       value={sections.find(s => s.id === editingSectionId)?.settings.image}
                       onChange={e => updateSection(editingSectionId, { image: e.target.value })}
                     />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs">Layout</Label>
                    <Select 
                      value={sections.find(s => s.id === editingSectionId)?.settings.layout}
                      onValueChange={v => updateSection(editingSectionId, { layout: v })}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="left">Image Left</SelectItem>
                        <SelectItem value="right">Image Right</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}
              {sections.find(s => s.id === editingSectionId)?.type === 'image_only' && (
                <>
                  <div className="space-y-2">
                     <Label className="text-xs">Image URL</Label>
                     <Input 
                       value={sections.find(s => s.id === editingSectionId)?.settings.image}
                       onChange={e => updateSection(editingSectionId, { image: e.target.value })}
                     />
                  </div>
                </>
              )}
              {sections.find(s => s.id === editingSectionId)?.type === 'feature_list' && (
                <>
                   <div className="space-y-2">
                    <Label className="text-xs">Title</Label>
                    <Input 
                      value={sections.find(s => s.id === editingSectionId)?.settings.title}
                      onChange={e => updateSection(editingSectionId, { title: e.target.value })}
                    />
                  </div>
                  <div className="space-y-3">
                     <Label className="text-xs">Features</Label>
                     {sections.find(s => s.id === editingSectionId)?.settings.items.map((item: string, idx: number) => (
                       <div key={idx} className="flex gap-2">
                         <Input 
                           value={item}
                           onChange={e => {
                             const newItems = [...sections.find(s => s.id === editingSectionId)?.settings.items];
                             newItems[idx] = e.target.value;
                             updateSection(editingSectionId, { items: newItems });
                           }}
                         />
                         <Button variant="outline" size="icon" className="shrink-0" onClick={() => {
                            const newItems = sections.find(s => s.id === editingSectionId)?.settings.items.filter((_: any, i: number) => i !== idx);
                            updateSection(editingSectionId, { items: newItems });
                         }}><Trash2 size={14}/></Button>
                       </div>
                     ))}
                     <Button variant="outline" size="sm" className="w-full text-[10px]" onClick={() => {
                        const newItems = [...sections.find(s => s.id === editingSectionId)?.settings.items, 'New Feature'];
                        updateSection(editingSectionId, { items: newItems });
                     }}>+ Add Feature</Button>
                  </div>
                </>
              )}
              {sections.find(s => s.id === editingSectionId)?.type === 'gallery' && (
                <>
                  <div className="space-y-2">
                     <Label className="text-xs">Title</Label>
                     <Input 
                       value={sections.find(s => s.id === editingSectionId)?.settings.title}
                       onChange={e => updateSection(editingSectionId, { title: e.target.value })}
                     />
                  </div>
                  <div className="space-y-3">
                     <Label className="text-xs">Image URLs (comma separated)</Label>
                     <textarea 
                       className="w-full h-20 text-xs p-2 border rounded"
                       value={sections.find(s => s.id === editingSectionId)?.settings.images?.join(', ') || ''}
                       onChange={e => updateSection(editingSectionId, { images: e.target.value.split(',').map(s => s.trim()) })}
                     />
                  </div>
                </>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center opacity-40">
              <Info className="mb-2" />
              <p className="text-xs font-medium">Select a section to edit properties</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
