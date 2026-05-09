import React, { useState, useEffect, useRef, ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
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
  MousePointer2,
  Sparkles,
  Zap,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Bold,
  Italic,
  CaseSensitive,
  Box,
  Copy,
  Wand2
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

const SECTION_TYPES = [
  { type: 'hero', icon: <Layout size={16} />, label: 'Hero Banner' },
  { type: 'featured_collection', icon: <ShoppingBag size={16} />, label: 'Featured Collection' },
  { type: 'image_text', icon: <ImageIcon size={16} />, label: 'Image with Text' },
  { type: 'marquee', icon: <Type size={16} />, label: 'Scrolling Text' },
  { type: 'rich_text', icon: <Type size={16} />, label: 'Rich Text' },
];

const BLOCK_TYPES = [
  { type: 'heading', label: 'Heading', icon: <HeadingIcon size={14} /> },
  { type: 'text', label: 'Text', icon: <Type size={14} /> },
  { type: 'button', label: 'Button', icon: <MousePointer2 size={14} /> },
  { type: 'image', label: 'Image', icon: <ImageIcon size={14} /> },
];

function HeadingIcon({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 12h12" /><path d="M6 20V4" /><path d="M18 20V4" />
    </svg>
  );
}

const FileDropzone = ({ value, onChange, label }: { value: string, onChange: (val: string) => void, label: string }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        onChange(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="space-y-3">
      <Label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{label}</Label>
      <div 
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative aspect-video rounded-2xl border-2 border-dashed transition-all cursor-pointer flex flex-col items-center justify-center p-4 gap-2 overflow-hidden
          ${isDragging ? 'border-indigo-500 bg-indigo-50 shadow-inner' : 'border-[#E2E8F0] hover:border-indigo-400 hover:bg-gray-50'}`}
      >
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept="image/*"
          onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
        />
        {value ? (
          <>
            <img src={value} className="absolute inset-0 w-full h-full object-cover" alt="Preview" />
            <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2 backdrop-blur-[2px]">
              <div className="p-2 bg-white/20 rounded-full backdrop-blur-md">
                <Plus size={20} className="text-white" />
              </div>
              <span className="text-white text-[10px] font-black uppercase tracking-widest">Replace Image</span>
            </div>
          </>
        ) : (
          <>
            <div className="p-3 bg-white rounded-2xl shadow-sm border border-[#F1F5F9]">
              <ImageIcon size={24} className="text-indigo-500" />
            </div>
            <div className="text-center">
              <p className="text-[10px] font-black text-gray-900 uppercase tracking-tight">Drop image here</p>
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">or click to browse</p>
            </div>
          </>
        )}
      </div>
      <div className="relative group">
         <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none group-focus-within:text-indigo-500">
            <span className="text-[10px] font-black text-gray-400 group-focus-within:text-indigo-400">URL</span>
         </div>
         <Input 
           value={value && value.startsWith('data:') ? '' : value}
           onChange={e => onChange(e.target.value)}
           placeholder="Or paste image URL..."
           className="pl-12 h-10 text-[11px] rounded-xl border-[#E2E8F0] focus:ring-indigo-500"
         />
      </div>
    </div>
  );
};

const DEFAULT_CONFIG = {
  logo: '',
  brandName: 'My Store',
  primaryColor: '#4F46E5',
  templateId: null,
  sections: [
    { 
      id: 'h1', 
      type: 'hero', 
      visible: true,
      settings: {
        height: '600px',
        bgImage: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?auto=format&fit=crop&q=80&w=2670&ixlib=rb-4.0.3',
        overlayOpacity: 0.4,
      },
      blocks: [
        { id: 'b1', type: 'heading', content: 'Welcome to our store', style: { fontSize: '48px', color: '#ffffff', fontWeight: '900', textAlign: 'left' } },
        { id: 'b2', type: 'text', content: 'Premium products delivered to your door.', style: { fontSize: '18px', color: '#ffffff', fontWeight: '400', textAlign: 'left' } },
        { id: 'b3', type: 'button', content: 'Shop All', style: { bgColor: '#4F46E5', color: '#ffffff', borderRadius: '50px', padding: '12px 32px' } }
      ]
    },
    { 
      id: 'f1', 
      type: 'featured_collection', 
      visible: true,
      settings: {
        title: 'Trending Now'
      },
      blocks: []
    }
  ]
};

const FeaturedCollectionSection = ({ section, onClick, onOverlay: SectionOverlay }: { section: any, onClick: () => void, onOverlay: any }) => {
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    fetch('/api/products').then(r => r.json()).then(data => setProducts(Array.isArray(data) ? data : []));
  }, []);

  return (
    <div 
      className="relative group/preview py-16 px-6 lg:px-12 bg-white"
      onClick={onClick}
    >
        <SectionOverlay />
        <div className="flex justify-between items-end mb-8">
            <h3 className="text-2xl font-black tracking-tight">{section.settings?.title || 'Featured'}</h3>
            <button className="text-sm font-bold border-b-2 border-transparent hover:border-black transition-all">VOIR TOUT</button>
        </div>
        <div className="flex overflow-x-auto pb-6 gap-4 md:grid md:grid-cols-4 md:gap-8 md:overflow-visible">
          {products.map(p => (
            <a key={p.id} href={`/admin/products/${p.id}/builder`} className="group cursor-pointer min-w-[160px] md:min-w-0 block">
                <div className="aspect-[4/5] bg-gray-100 rounded-2xl mb-4 overflow-hidden relative">
                  <img src={p.images?.[0] || 'https://via.placeholder.com/150'} alt={p.name} className="w-full h-full object-cover" />
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-widest leading-none">Product</div>
                  <div className="font-bold text-gray-900 group-hover:text-indigo-600 transition-colors truncate">{p.name}</div>
                  <div className="flex items-center gap-3">
                      <span className="font-bold text-indigo-600">{p.price} DZD</span>
                  </div>
                </div>
            </a>
          ))}
          {products.length === 0 && <p className="text-gray-400">No products added.</p>}
        </div>
    </div>
  );
};

export const StoreBuilderAdmin = () => {
  const navigate = useNavigate();
  const [config, setConfig] = useState<any>(null);
  const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
  const [editingBlockId, setEditingBlockId] = useState<string | null>(null);
  const [previewMode, setPreviewMode] = useState<'mobile' | 'desktop'>('desktop');
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [aiPrompt, setAiPrompt] = useState('');
  const [showAiDialog, setShowAiDialog] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);

  const [isPublishing, setIsPublishing] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [configRes, templatesRes] = await Promise.all([
          fetch('/api/settings/store_config'),
          fetch('/api/templates?type=store')
        ]);
        
        const configData = await configRes.json();
        const templatesData = await templatesRes.json();
        
        if (Object.keys(configData).length === 0) setConfig(DEFAULT_CONFIG);
        else setConfig(configData);
        
        setTemplates(Array.isArray(templatesData) ? templatesData : []);
        setLoading(false);
      } catch (err) {
        setConfig(DEFAULT_CONFIG);
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const saveConfig = async () => {
    setIsPublishing(true);
    try {
      const res = await fetch('/api/settings/store_config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      if (!res.ok) throw new Error('Update failed');
      toast.success('Store configuration saved!');
    } catch {
      toast.error('Failed to save store configuration');
    } finally {
      setIsPublishing(false);
    }
  };

  const addSection = (type: string, index?: number) => {
    const newSection = {
      id: Math.random().toString(36).substr(2, 9),
      type,
      visible: true,
      settings: type === 'hero' ? {
        height: '400px',
        bgImage: '',
        overlayOpacity: 0.3
      } : {
        title: 'New Section'
      },
      blocks: type === 'hero' ? [
        { id: 'b' + Math.random().toString(36).substr(2, 5), type: 'heading', content: 'New Banner', style: { fontSize: '40px', color: '#ffffff', fontWeight: '900' } }
      ] : []
    };

    if (typeof index === 'number') {
      const newSections = [...config.sections];
      newSections.splice(index, 0, newSection);
      setConfig({ ...config, sections: newSections });
    } else {
      setConfig({ ...config, sections: [...config.sections, newSection] });
    }
    setEditingSectionId(newSection.id);
  };

  const addBlock = (sectionId: string, type: string, index?: number) => {
    const newBlock = {
      id: 'b' + Math.random().toString(36).substr(2, 5),
      type,
      content: type === 'button' ? 'Shop Now' : 
               type === 'image' ? 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=600&auto=format&fit=crop' :
               'Enter text here',
      style: type === 'heading' ? { fontSize: '32px', fontWeight: '700' } : 
             type === 'button' ? { bgColor: config.primaryColor, color: '#ffffff', padding: '10px 20px', borderRadius: '8px' } :
             type === 'image' ? { borderRadius: '12px', maxWidth: '100%' } :
             { fontSize: '16px' }
    };
    
    setConfig({
      ...config,
      sections: config.sections.map((s: any) => {
        if (s.id === sectionId) {
          const newBlocks = [...(s.blocks || [])];
          if (typeof index === 'number') {
            newBlocks.splice(index, 0, newBlock);
          } else {
            newBlocks.push(newBlock);
          }
          return { ...s, blocks: newBlocks };
        }
        return s;
      })
    });
    setEditingBlockId(newBlock.id);
  };

  const updateSection = (id: string, updates: any) => {
    setConfig({
      ...config,
      sections: config.sections.map((s: any) => s.id === id ? { ...s, ...updates } : s)
    });
  };

  const updateBlock = (sectionId: string, blockId: string, updates: any) => {
    setConfig({
      ...config,
      sections: config.sections.map((s: any) => 
        s.id === sectionId ? {
          ...s,
          blocks: s.blocks.map((b: any) => b.id === blockId ? { ...b, ...updates } : b)
        } : s
      )
    });
  };

  const removeSection = (id: string) => {
    setConfig({
      ...config,
      sections: config.sections.filter((s: any) => s.id !== id)
    });
    if (editingSectionId === id) setEditingSectionId(null);
  };

  const removeBlock = (sectionId: string, blockId: string) => {
    setConfig({
      ...config,
      sections: config.sections.map((s: any) => 
        s.id === sectionId ? {
          ...s,
          blocks: s.blocks.filter((b: any) => b.id !== blockId)
        } : s
      )
    });
    if (editingBlockId === blockId) setEditingBlockId(null);
  };

  const generateWithAi = async () => {
    if (!aiPrompt) return;
    setGenerating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-latest",
        contents: `You are an expert e-commerce designer. Generate a JSON configuration for a landing page section based on this prompt: "${aiPrompt}".
        The output must be a single JSON object with this structure:
        {
          "type": "hero" | "image_text" | "marquee" | "rich_text",
          "settings": { ... },
          "blocks": [ { "type": "heading" | "text" | "button" | "image", "content": "...", "style": { ... } } ]
        }
        Do not include any other text, only the JSON. Use modern colors and typography.`,
      });
      
      const text = response.text || '';
      const jsonStr = text.replace(/```json/g, '').replace(/```/g, '').trim();
      const generatedSection = JSON.parse(jsonStr);
      
      const newSection = {
        ...generatedSection,
        id: 'ai' + Math.random().toString(36).substr(2, 9),
        visible: true
      };
      
      setConfig({ ...config, sections: [...config.sections, newSection] });
      setEditingSectionId(newSection.id);
      setShowAiDialog(false);
      setAiPrompt('');
      toast.success('Section generated successfully!');
    } catch (err) {
      console.error(err);
      toast.error('Failed to generate section with AI');
    } finally {
      setGenerating(false);
    }
  };

  const moveSection = (idx: number, dir: number) => {
    const newSections = [...config.sections];
    const targetIdx = idx + dir;
    if (targetIdx < 0 || targetIdx >= config.sections.length) return;
    [newSections[idx], newSections[targetIdx]] = [newSections[targetIdx], newSections[idx]];
    setConfig({ ...config, sections: newSections });
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen bg-white">
      <div className="w-12 h-12 border-4 border-[#4F46E5] border-t-transparent rounded-full animate-spin"></div>
    </div>
  );

  return (
    <div className="flex flex-col h-screen bg-[#F8FAFC] -m-6 lg:-m-8">
      {/* Header */}
      <header className="h-16 bg-white border-b border-[#E2E8F0] flex items-center justify-between px-6 shrink-0 z-50 shadow-sm">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/admin')} className="p-2 hover:bg-[#F1F5F9] rounded-lg text-gray-400 hover:text-gray-600 transition-colors">
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-3">
            <img src={DHD_LOGO} alt="Mstore" className="h-8 w-auto" />
            <div className="h-4 w-px bg-[#E2E8F0]" />
            <div>
              <h1 className="text-sm font-black text-[#1A202C] uppercase tracking-[1px]">Store Designer</h1>
              <p className="text-[10px] text-[#4F46E5] font-bold uppercase tracking-widest leading-none">Home Page Canvas</p>
            </div>
          </div>
        </div>

        <div className="flex items-center bg-[#F1F5F9] p-1 rounded-xl">
           <button 
             onClick={() => setPreviewMode('mobile')}
             className={`p-2 rounded-lg transition-all ${previewMode === 'mobile' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
           >
             <Smartphone size={18} />
           </button>
           <button 
             onClick={() => setPreviewMode('desktop')}
             className={`p-2 rounded-lg transition-all ${previewMode === 'desktop' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
           >
             <Monitor size={18} />
           </button>
        </div>

        <div className="flex items-center gap-3">
          <Select 
            value={config.templateId || 'default'} 
            onValueChange={async (v) => {
              if (v === 'new') {
                const name = prompt('New template name:');
                if (!name) return;
                const res = await fetch('/api/templates', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ name, type: 'store', config })
                });
                const data = await res.json();
                setTemplates([...templates, data]);
                setConfig({ ...config, templateId: data.id });
              } else {
                const template = templates.find((t: any) => t.id === v);
                if (template) {
                  setConfig({ ...template.config, templateId: v });
                }
              }
            }}
          >
            <SelectTrigger className="w-[180px] h-9 bg-[#F1F5F9] border-none text-[10px] font-black uppercase tracking-widest shrink-0">
               <SelectValue placeholder="Select Template" />
            </SelectTrigger>
            <SelectContent>
               <SelectItem value="default" className="text-[10px] font-bold">Default Store</SelectItem>
               {templates.map((t: any) => (
                 <SelectItem key={t.id} value={t.id} className="text-[10px] font-bold">{t.name}</SelectItem>
               ))}
               <div className="h-px bg-gray-100 my-1" />
               <SelectItem value="new" className="text-[10px] font-black text-indigo-600">+ Create New</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm" onClick={() => window.open('/', '_blank')}>
            <Eye size={16} className="mr-2" /> View Site
          </Button>
          <Button disabled={isPublishing} size="sm" onClick={saveConfig} className={`shadow-lg transition-all duration-300 font-bold min-w-[140px] flex items-center justify-center gap-2 ${
            isPublishing ? 'bg-indigo-400 cursor-wait' : 'bg-[#4F46E5] hover:bg-indigo-700 shadow-indigo-200'
          }`}>
            {isPublishing ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                Publishing...
              </>
            ) : (
              <>
                <Save size={16} />
                Publish Store
              </>
            )}
          </Button>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Left Sidebar: Structure */}
        <div className="w-[340px] bg-white border-r border-[#E2E8F0] flex flex-col shrink-0 shadow-sm z-40">
          <div className="p-5 border-b border-[#F1F5F9] bg-[#F8FAFC]">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-[2px] mb-4 flex items-center justify-between">
              Sections
              <button 
                onClick={() => setShowAiDialog(true)}
                className="flex items-center gap-1.5 px-2 py-1 bg-indigo-50 text-indigo-600 rounded-md hover:bg-indigo-100 transition-colors text-[10px] font-black"
              >
                <Sparkles size={12} />
                AI MAGIC
              </button>
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {SECTION_TYPES.map(st => (
                <button 
                  key={st.type}
                  onClick={() => addSection(st.type)}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl border border-[#E2E8F0] hover:border-indigo-200 hover:bg-indigo-50 transition-all text-gray-600 hover:text-indigo-600"
                >
                  <div className="p-2 bg-white rounded-lg shadow-sm border border-[#F1F5F9]">{st.icon}</div>
                  <span className="text-[10px] font-bold uppercase tracking-tight">{st.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
             <div 
               className="border border-[#E2E8F0] p-4 rounded-xl flex items-center justify-between group hover:border-indigo-200 cursor-pointer transition-all"
               onClick={() => setEditingSectionId('branding')}
             >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><Palette size={16} /></div>
                  <span className="font-bold text-sm">Header & Branding</span>
                </div>
                <ChevronRight size={16} className="text-gray-300 group-hover:text-indigo-400" />
             </div>

             <div className="h-px bg-[#F1F5F9] my-4" />

             {(config?.sections || []).map((section: any, idx: number) => (
               <div 
                 key={section.id} 
                 className={`group border ${editingSectionId === section.id ? 'border-indigo-500 ring-2 ring-indigo-50/10 shadow-lg' : 'border-[#E2E8F0]'} rounded-xl overflow-hidden bg-white transition-all`}
               >
                 <div className="p-3 bg-white flex items-center justify-between border-b border-[#F1F5F9] group-hover:bg-[#F8FAFC]">
                    <div className="flex items-center gap-3">
                      <div className="cursor-grab text-gray-300 hover:text-gray-500">
                        <GripVertical size={16} />
                      </div>
                      <span className="text-[11px] font-black text-gray-600 uppercase tracking-tighter">{section.type.replace('_', ' ')}</span>
                    </div>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => setEditingSectionId(editingSectionId === section.id ? null : section.id)} className={`p-1.5 rounded-lg transition-colors ${editingSectionId === section.id ? 'text-indigo-600 bg-indigo-50' : 'text-gray-400 hover:bg-[#F1F5F9]'}`}>
                        <Settings2 size={16} />
                      </button>
                      <button onClick={() => removeSection(section.id)} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                 </div>
                 <div className="p-3">
                    <div className="text-xs font-medium text-gray-500 truncate">{section.settings?.title || section.blocks?.[0]?.content || 'Untitled Section'}</div>
                    {editingSectionId === section.id && (
                      <div className="mt-3 space-y-1 bg-[#F8FAFC] p-2 rounded-lg border border-[#F1F5F9]">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Blocks</span>
                          <button onClick={() => setEditingBlockId(editingBlockId === 'add' ? null : 'add')} className="p-1 hover:bg-white rounded text-indigo-600 border border-transparent hover:border-indigo-100"><Plus size={12} /></button>
                        </div>
                        {(section.blocks || []).map((block: any) => (
                          <div 
                            key={block.id}
                            onClick={() => setEditingBlockId(block.id)}
                            className={`flex items-center justify-between p-2 rounded-md border text-[10px] cursor-pointer transition-all ${editingBlockId === block.id ? 'bg-white border-indigo-200 shadow-sm font-bold text-indigo-600' : 'bg-transparent border-transparent hover:bg-white hover:border-[#F1F5F9] text-gray-500'}`}
                          >
                            <div className="flex items-center gap-2 truncate">
                              <Box size={10} />
                              <span className="truncate">{block.type}: {block.content}</span>
                            </div>
                            <button onClick={(e) => { e.stopPropagation(); removeBlock(section.id, block.id); }} className="text-gray-300 hover:text-red-500"><Trash2 size={10} /></button>
                          </div>
                        ))}
                        {editingBlockId === 'add' && (
                          <div className="grid grid-cols-2 gap-1 pt-2 border-t border-[#F1F5F9] mt-2">
                            {BLOCK_TYPES.map(bt => (
                              <button 
                                key={bt.type}
                                onClick={() => addBlock(section.id, bt.type)}
                                className="flex items-center gap-1.5 p-1.5 rounded bg-white border border-[#E2E8F0] hover:border-indigo-200 text-[9px] font-bold text-gray-600"
                              >
                                {bt.icon} {bt.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                 </div>
               </div>
             ))}
          </div>
        </div>

        {/* Center: Live Preview */}
        <div className="flex-1 bg-[#EEF2F6] overflow-hidden flex justify-center items-center py-10">
           <div className={`transition-all duration-500 shadow-[0_32px_128px_-16px_rgba(0,0,0,0.15)] bg-white overflow-hidden flex flex-col ${previewMode === 'mobile' ? 'w-[375px] h-[750px] rounded-[40px] border-[8px] border-[#1A1A1A] relative' : 'w-full h-full max-w-[1280px] rounded-2xl border-t border-x border-[#E2E8F0]'}`}>
              {/* Fake Browser Toolbar if Desktop */}
              {previewMode === 'desktop' && (
                <div className="h-10 bg-[#F1F5F9] border-b border-[#E2E8F0] flex items-center px-4 gap-2 shrink-0">
                  <div className="flex gap-1.5">
                    <div className="w-2.5 h-2.5 rounded-full bg-[#FF5F56]" />
                    <div className="w-2.5 h-2.5 rounded-full bg-[#FFBD2E]" />
                    <div className="w-2.5 h-2.5 rounded-full bg-[#27C93F]" />
                  </div>
                  <div className="flex-1 bg-white h-6 rounded px-2 text-[10px] flex items-center text-gray-400 border border-[#E2E8F0]">
                    {(config?.brandName || '').toLowerCase().replace(' ', '')}.com
                  </div>
                </div>
              )}

              {/* Preview Content */}
              <div className="flex-1 overflow-y-auto no-scrollbar">
                 {/* Navigation */}
                 <nav className="h-16 px-6 border-b border-[#F1F5F9] flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-md z-10">
                   <div className="font-black text-xl tracking-tighter" style={{ color: config.primaryColor }}>
                     {config.logo ? <img src={config.logo} alt={config.brandName} className="h-8 w-auto" /> : config.brandName}
                   </div>
                   <div className="hidden md:flex gap-6 text-sm font-medium text-gray-600">
                     <span>Accueil</span>
                     <span>Catalogue</span>
                     <span>Contact</span>
                   </div>
                   <div className="flex gap-4">
                     <ShoppingBag size={20} className="text-gray-400" />
                   </div>
                 </nav>

                  {/* Dynamic Sections */}
                  <div className="space-y-0">
                    {(config?.sections || []).map((section: any, sectionIdx: number) => {
                      if (!section.visible) return null;
                      
                      const isEditingSection = editingSectionId === section.id;
                      
                      const SectionOverlay = () => (
                        <>
                          {/* Main Selection Border */}
                          <div className={`absolute -inset-px border-2 border-indigo-500 opacity-0 group-hover/preview:opacity-40 transition-opacity z-[40] pointer-events-none rounded-sm ${isEditingSection ? 'opacity-100' : ''}`} />
                          
                          {/* Top Plus Button */}
                          <div className={`absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[100] opacity-0 group-hover/preview:opacity-100 transition-opacity ${isEditingSection ? 'opacity-100' : ''}`}>
                             <button 
                               onClick={(e) => { e.stopPropagation(); addSection('hero', sectionIdx); }}
                               className="w-7 h-7 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all border-2 border-white"
                             >
                               <Plus size={16} strokeWidth={3} />
                             </button>
                          </div>

                          {/* Bottom Plus Button */}
                          <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 z-[100] opacity-0 group-hover/preview:opacity-100 transition-opacity ${isEditingSection ? 'opacity-100' : ''}`}>
                             <button 
                               onClick={(e) => { e.stopPropagation(); addSection('hero', sectionIdx + 1); }}
                               className="w-7 h-7 bg-indigo-600 text-white rounded-full flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all border-2 border-white"
                             >
                               <Plus size={16} strokeWidth={3} />
                             </button>
                          </div>

                          {/* Section Label */}
                          {isEditingSection && (
                            <div className="absolute top-0 left-0 bg-indigo-600 text-white text-[10px] font-black px-2 py-0.5 rounded-br-md z-[51] uppercase tracking-widest shadow-sm">
                              {section.type.replace('_', ' ')}
                            </div>
                          )}
                        </>
                      );

                      const BlockWrapper = ({ block, children, index }: { block: any, children: React.ReactNode, index: number, key?: string }) => {
                        const isEditingBlock = editingBlockId === block.id;
                        return (
                          <div 
                            className={`relative group/block cursor-pointer transition-all ${isEditingBlock ? 'ring-2 ring-indigo-500 ring-offset-2 z-[45]' : ''}`}
                            onClick={(e) => { e.stopPropagation(); setEditingBlockId(block.id); setEditingSectionId(section.id); }}
                          >
                             {/* Block Border Overlay */}
                             <div className={`absolute -inset-1 border border-indigo-400 border-dashed opacity-0 group-hover/block:opacity-100 pointer-events-none rounded transition-opacity z-[46] ${isEditingBlock ? 'opacity-0' : ''}`} />
                             
                             {/* Block Label */}
                             {isEditingBlock && (
                               <div className="absolute top-0 left-0 -translate-y-full bg-indigo-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-t-sm z-[51] uppercase tracking-widest shadow-sm">
                                 {block.type}
                               </div>
                             )}

                             {/* Block Top Plus */}
                             <div className={`absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[100] scale-75 opacity-0 group-hover/block:opacity-100 transition-opacity`}>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); addBlock(section.id, 'text', index); }}
                                  className="w-6 h-6 bg-white border border-indigo-200 text-indigo-600 rounded-full flex items-center justify-center shadow-md hover:bg-indigo-50"
                                >
                                  <Plus size={14} strokeWidth={3} />
                                </button>
                             </div>

                             {/* Block Bottom Plus */}
                             <div className={`absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2 z-[100] scale-75 opacity-0 group-hover/block:opacity-100 transition-opacity`}>
                                <button 
                                  onClick={(e) => { e.stopPropagation(); addBlock(section.id, 'text', index + 1); }}
                                  className="w-6 h-6 bg-white border border-indigo-200 text-indigo-600 rounded-full flex items-center justify-center shadow-md hover:bg-indigo-50"
                                >
                                  <Plus size={14} strokeWidth={3} />
                                </button>
                             </div>

                             {children}
                          </div>
                        );
                      };

                      if (section.type === 'hero') {
                        return (
                          <div 
                            key={section.id}
                            className="relative group/preview"
                            onClick={() => setEditingSectionId(section.id)}
                          >
                            <SectionOverlay />
                            <div 
                              className="relative overflow-hidden flex items-center px-8 lg:px-16"
                              style={{ height: section.settings?.height || '400px' }}
                            >
                                <div className="absolute inset-0 z-0 text-center">
                                   {section.settings?.bgImage && <img src={section.settings.bgImage} className="w-full h-full object-cover" />}
                                   <div className="absolute inset-0 bg-black" style={{ opacity: section.settings?.overlayOpacity || 0.4 }} />
                                </div>
                                <div className="relative z-10 max-w-xl text-white space-y-6">
                                   {(section.blocks || []).map((block: any, bIdx: number) => {
                                      const style = block.style || {};
                                      const content = (
                                        <>
                                          {block.type === 'heading' && <h2 className="leading-tight tracking-tighter" style={{ fontSize: style.fontSize || '48px', fontWeight: style.fontWeight || '900', color: style.color || '#ffffff', textAlign: style.textAlign || 'left' }}>{block.content}</h2>}
                                          {block.type === 'text' && <p className="opacity-90" style={{ fontSize: style.fontSize || '18px', fontWeight: style.fontWeight || '400', color: style.color || '#ffffff', textAlign: style.textAlign || 'left' }}>{block.content}</p>}
                                          {block.type === 'image' && block.content && <img src={block.content} className="max-w-full h-auto" style={{ borderRadius: style.borderRadius || '0' }} />}
                                          {block.type === 'button' && (
                                            <button 
                                              className="font-bold transition-all hover:scale-105 active:scale-95" 
                                              style={{ 
                                                backgroundColor: style.bgColor || config.primaryColor, 
                                                color: style.color || '#ffffff', 
                                                borderRadius: style.borderRadius || '50px',
                                                padding: style.padding || '12px 32px'
                                              }}
                                            >
                                              {block.content}
                                            </button>
                                          )}
                                        </>
                                      );
                                      return <BlockWrapper key={block.id} block={block} index={bIdx}>{content}</BlockWrapper>;
                                   })}
                                </div>
                            </div>
                          </div>
                        );
                      }

                      if (section.type === 'image_text') {
                         return (
                           <div 
                             key={section.id}
                             className="relative group/preview py-16 px-6 lg:px-12 bg-white"
                             onClick={() => setEditingSectionId(section.id)}
                           >
                             <SectionOverlay />
                             <div className="grid md:grid-cols-2 gap-12 items-center">
                                <div className="aspect-square bg-gray-100 rounded-2xl overflow-hidden shadow-xl border border-gray-100">
                                   {section.settings?.bgImage && <img src={section.settings.bgImage} className="w-full h-full object-cover" />}
                                </div>
                                <div className="space-y-6">
                                   {(section.blocks || []).map((block: any, bIdx: number) => {
                                      const style = block.style || {};
                                      const content = (
                                        <>
                                          {block.type === 'heading' && <h2 className="leading-tight tracking-tighter" style={{ fontSize: style.fontSize || '32px', fontWeight: style.fontWeight || '700', color: style.color || '#1a202c', textAlign: style.textAlign || 'left' }}>{block.content}</h2>}
                                          {block.type === 'text' && <p style={{ fontSize: style.fontSize || '16px', fontWeight: style.fontWeight || '400', color: style.color || '#4a5568', textAlign: style.textAlign || 'left' }}>{block.content}</p>}
                                          {block.type === 'image' && block.content && <img src={block.content} className="max-w-full h-auto my-4" style={{ borderRadius: style.borderRadius || '0' }} />}
                                          {block.type === 'button' && (
                                            <button 
                                              className="font-bold transition-all px-6 py-3" 
                                              style={{ 
                                                backgroundColor: style.bgColor || config.primaryColor, 
                                                color: style.color || '#ffffff', 
                                                borderRadius: style.borderRadius || '8px' 
                                              }}
                                            >
                                              {block.content}
                                            </button>
                                          )}
                                        </>
                                      );
                                      return <BlockWrapper key={block.id} block={block} index={bIdx}>{content}</BlockWrapper>;
                                   })}
                                </div>
                             </div>
                           </div>
                         );
                      }

                      if (section.type === 'marquee') {
                         return (
                           <div 
                             key={section.id}
                             className="relative group/preview py-4 bg-[#1A1A1A] text-white flex overflow-hidden whitespace-nowrap"
                             onClick={() => setEditingSectionId(section.id)}
                           >
                              <SectionOverlay />
                              <div className="flex animate-marquee gap-8 items-center px-4">
                                 {Array(10).fill(0).map((_, i) => (
                                   <div key={i} className="flex items-center gap-8">
                                     <span className="text-xl font-black italic tracking-tighter uppercase">{section.settings?.title || 'NEWSFLASH'}</span>
                                     <Sparkles size={16} className="text-indigo-400" />
                                   </div>
                                 ))}
                              </div>
                           </div>
                         );
                      }

                      if (section.type === 'featured_collection') {
                         return (
                           <FeaturedCollectionSection 
                             key={section.id} 
                             section={section} 
                             onClick={() => setEditingSectionId(section.id)}
                             onOverlay={SectionOverlay}
                           />
                         );
                      }

                      return <div key={section.id} className="relative group/preview h-20 bg-gray-50 border-y border-dashed border-gray-200 flex items-center justify-center text-xs text-gray-400 uppercase font-bold tracking-widest" onClick={() => setEditingSectionId(section.id)}>
                        <SectionOverlay />
                        {section.type} Section Coming Soon
                      </div>;
                    })}
                  </div>
              </div>
           </div>
        </div>

        {/* Right Sidebar: Settings */}
        <div className={`w-[340px] bg-white border-l border-[#E2E8F0] shadow-sm flex flex-col shrink-0 z-40 transition-transform ${editingSectionId ? 'translate-x-0' : 'translate-x-[340px] absolute right-0 bottom-0 top-16'}`}>
           {editingSectionId ? (
             <>
               <div className="p-5 border-b border-[#F1F5F9] flex items-center justify-between bg-[#F8FAFC]">
                  <div className="flex items-center gap-2">
                    {editingBlockId ? <Box size={16} className="text-indigo-600" /> : <Settings2 size={16} className="text-indigo-600" />}
                    <h3 className="text-xs font-black text-gray-800 uppercase tracking-[2px]">
                      {editingBlockId ? 'Block Settings' : 'Section Settings'}
                    </h3>
                  </div>
                  <button onClick={() => { setEditingBlockId(null); if (!editingBlockId) setEditingSectionId(null); }} className="p-2 hover:bg-gray-100 rounded-lg text-gray-400">
                    <ChevronRight size={20} />
                  </button>
               </div>
               <div className="flex-1 overflow-y-auto p-5 space-y-6">
                 {(() => {
                   if (editingSectionId === 'branding') {
                     return (
                       <div className="space-y-6">
                         <div className="space-y-2">
                           <Label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Brand Name</Label>
                           <Input 
                             value={config.brandName}
                             onChange={e => setConfig({ ...config, brandName: e.target.value })}
                             placeholder="My Store"
                           />
                         </div>
                         <div className="space-y-2">
                           <FileDropzone 
                             label="Logo"
                             value={config.logo}
                             onChange={val => setConfig({ ...config, logo: val })}
                           />
                         </div>
                       </div>
                     );
                   }

                   const section = config.sections.find((s: any) => s.id === editingSectionId);
                   if (!section) return null;

                   if (editingBlockId && editingBlockId !== 'add') {
                     const block = section.blocks?.find((b: any) => b.id === editingBlockId);
                     if (!block) return null;

                     return (
                       <div className="space-y-6">
                         <div className="space-y-2">
                           {block.type === 'image' ? (
                             <FileDropzone 
                               label="Block Image"
                               value={block.content}
                               onChange={val => updateBlock(section.id, block.id, { content: val })}
                             />
                           ) : (
                             <>
                               <Label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Content</Label>
                               <textarea 
                                 value={block.content}
                                 onChange={e => updateBlock(section.id, block.id, { content: e.target.value })}
                                 className="w-full p-4 rounded-xl shadow-sm border border-[#E2E8F0] text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                                 rows={4}
                               />
                             </>
                           )}
                         </div>
                         
                         <div className="h-px bg-[#F1F5F9]" />
                         
                         <div className="grid grid-cols-2 gap-4">
                           <div className="space-y-2">
                             <Label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Font Size</Label>
                             <Input 
                               value={block.style?.fontSize || ''} 
                               onChange={e => updateBlock(section.id, block.id, { style: { ...block.style, fontSize: e.target.value } })}
                               placeholder="16px"
                             />
                           </div>
                           <div className="space-y-2">
                             <Label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Text Color</Label>
                             <div className="flex gap-2">
                               <Input 
                                 type="color" 
                                 className="w-12 h-10 p-1"
                                 value={block.style?.color || '#000000'}
                                 onChange={e => updateBlock(section.id, block.id, { style: { ...block.style, color: e.target.value } })}
                               />
                               <Input 
                                 value={block.style?.color || ''}
                                 onChange={e => updateBlock(section.id, block.id, { style: { ...block.style, color: e.target.value } })}
                                 placeholder="#000000"
                               />
                             </div>
                           </div>
                         </div>

                         {block.type === 'button' && (
                           <div className="space-y-4">
                              <div className="space-y-2">
                                <Label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Button Background</Label>
                                <Input 
                                  type="color" 
                                  className="h-10 p-1"
                                  value={block.style?.bgColor || config.primaryColor}
                                  onChange={e => updateBlock(section.id, block.id, { style: { ...block.style, bgColor: e.target.value } })}
                                />
                              </div>
                              <div className="space-y-2">
                                <Label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Corner Radius</Label>
                                <Input 
                                  value={block.style?.borderRadius || ''}
                                  onChange={e => updateBlock(section.id, block.id, { style: { ...block.style, borderRadius: e.target.value } })}
                                  placeholder="8px"
                                />
                              </div>
                           </div>
                         )}

                         <div className="space-y-2">
                           <Label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Alignment</Label>
                           <div className="flex bg-[#F1F5F9] p-1 rounded-lg">
                             <button 
                               onClick={() => updateBlock(section.id, block.id, { style: { ...block.style, textAlign: 'left' } })}
                               className={`flex-1 p-2 rounded-md flex justify-center ${block.style?.textAlign === 'left' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-400'}`}
                             >
                               <AlignLeft size={16} />
                             </button>
                             <button 
                               onClick={() => updateBlock(section.id, block.id, { style: { ...block.style, textAlign: 'center' } })}
                               className={`flex-1 p-2 rounded-md flex justify-center ${block.style?.textAlign === 'center' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-400'}`}
                             >
                               <AlignCenter size={16} />
                             </button>
                             <button 
                               onClick={() => updateBlock(section.id, block.id, { style: { ...block.style, textAlign: 'right' } })}
                               className={`flex-1 p-2 rounded-md flex justify-center ${block.style?.textAlign === 'right' ? 'bg-white shadow-sm text-indigo-600' : 'text-gray-400'}`}
                             >
                               <AlignRight size={16} />
                             </button>
                           </div>
                         </div>
                       </div>
                     );
                   }

                   return (
                     <div className="space-y-6">
                        <div className="space-y-2">
                           <Label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Section Settings</Label>
                           <div className="p-4 bg-indigo-50 border border-indigo-100 rounded-xl">
                             <p className="text-[10px] text-indigo-600 font-bold uppercase tracking-widest mb-1">PRO TIP</p>
                             <p className="text-[11px] text-indigo-800 leading-relaxed">Customize global section properties like background images, height, and overlays.</p>
                           </div>
                        </div>

                        {section.type === 'hero' || section.type === 'image_text' ? (
                          <>
                            <div className="space-y-2">
                              <FileDropzone 
                                label="Background Image"
                                value={section.settings?.bgImage || ''}
                                onChange={val => updateSection(section.id, { settings: { ...section.settings, bgImage: val } })}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Overlay Opacity ({Math.round((section.settings?.overlayOpacity || 0) * 100)}%)</Label>
                              <Input 
                                type="range" min="0" max="1" step="0.1"
                                value={section.settings?.overlayOpacity || 0}
                                onChange={e => updateSection(section.id, { settings: { ...section.settings, overlayOpacity: parseFloat(e.target.value) } })}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Height</Label>
                              <Select value={section.settings?.height || '400px'} onValueChange={v => updateSection(section.id, { settings: { ...section.settings, height: v } })}>
                                <SelectTrigger className="rounded-xl"><SelectValue /></SelectTrigger>
                                <SelectContent>
                                  <SelectItem value="200px">Small (200px)</SelectItem>
                                  <SelectItem value="400px">Medium (400px)</SelectItem>
                                  <SelectItem value="600px">Large (600px)</SelectItem>
                                  <SelectItem value="100vh">Full Height</SelectItem>
                                </SelectContent>
                              </Select>
                            </div>
                          </>
                        ) : (
                          <div className="space-y-2">
                            <Label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Section Title</Label>
                            <Input 
                              value={section.settings?.title || ''}
                              onChange={e => updateSection(section.id, { settings: { ...section.settings, title: e.target.value } })}
                            />
                          </div>
                        )}
                     </div>
                   );
                 })()}
               </div>
             </>
           ) : (
             <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-gray-400">
                <div className="w-16 h-16 bg-[#F8FAFC] rounded-full flex items-center justify-center mb-4 border-2 border-dashed border-[#E2E8F0]"><MousePointer2 size={32} /></div>
                <h4 className="font-bold text-gray-600 mb-2">Editor Panel Ready</h4>
                <p className="text-xs">Select a section on the left or in the structure list to start customizing your store.</p>
             </div>
           )}
        </div>
      </div>

      {/* AI Dialog */}
      {showAiDialog && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
           <div className="bg-white w-full max-w-lg rounded-3xl overflow-hidden shadow-[0_32px_128px_-16px_rgba(0,0,0,0.2)]">
              <div className="p-8 space-y-6">
                <div className="flex items-center gap-4">
                   <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600 animate-pulse">
                     <Sparkles size={24} />
                   </div>
                   <div>
                     <h3 className="text-xl font-black text-gray-900 tracking-tight">AI Section Generator</h3>
                     <p className="text-sm text-gray-500">Describe what you want to build and Gemini will create it.</p>
                   </div>
                </div>
                
                <div className="space-y-3">
                  <Label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Your Prompt</Label>
                  <textarea 
                    autoFocus
                    placeholder="e.g., A dark hero section with a bold white heading and an orange call-to-action button, featuring a futuristic cityscape background image."
                    value={aiPrompt}
                    onChange={e => setAiPrompt(e.target.value)}
                    className="w-full p-4 rounded-2xl bg-gray-50 border border-gray-100 min-h-[120px] focus:ring-4 focus:ring-indigo-100 focus:bg-white focus:outline-none transition-all text-sm"
                  />
                  <div className="flex gap-2 flex-wrap">
                    {['Summer Sale', 'Dark Modern', 'Tech Hero'].map(t => (
                      <button key={t} onClick={() => setAiPrompt(v => v + " " + t)} className="px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-black uppercase hover:bg-indigo-100 transition-colors tracking-tight">{t}</button>
                    ))}
                  </div>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button variant="ghost" className="flex-1 rounded-xl h-12 font-bold" onClick={() => setShowAiDialog(false)} disabled={generating}>
                    Cancel
                  </Button>
                  <Button 
                    className="flex-1 bg-[#1A1A1A] hover:bg-black text-white rounded-xl h-12 font-black shadow-xl shadow-gray-200" 
                    onClick={generateWithAi} 
                    disabled={generating || !aiPrompt}
                  >
                    {generating ? (
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Generating...</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Zap size={18} fill="white" />
                        <span>CREATE MAGICAL SECTION</span>
                      </div>
                    )}
                  </Button>
                </div>
              </div>
              <div className="bg-[#1A1A1A] p-4 text-center">
                <p className="text-[10px] text-white/40 font-bold uppercase tracking-[2px]">Powered by Gemini AI Engine</p>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};
